import os
import time
import logging
from enum import Enum
from typing import List, Dict, Any, Optional
import json
import httpx
import boto3
from botocore.exceptions import ClientError
import contextvars

logger = logging.getLogger("ADA.LLMService")

# Thread/async-safe context variable to propagate the active provider from request context
active_provider_var = contextvars.ContextVar("active_provider", default=None)
omniroute_url_var = contextvars.ContextVar("omniroute_url", default=None)
omniroute_model_var = contextvars.ContextVar("omniroute_model", default=None)
omniroute_key_var = contextvars.ContextVar("omniroute_key", default=None)
openai_key_var = contextvars.ContextVar("openai_key", default=None)
gemini_key_var = contextvars.ContextVar("gemini_key", default=None)
last_llm_error_var = contextvars.ContextVar("last_llm_error", default=None)

class ErrorCategory(Enum):
    RATE_LIMIT = "429_RATE_LIMIT"
    AUTH_BILLING = "401_402_AUTH_BILLING"
    SERVER_FAULT = "503_COMBO_LIMIT"
    EMPTY_RESPONSE = "EMPTY_PAYLOAD"
    UNKNOWN = "UNCLASSIFIED_FAULT"

class LLMService:
    def __init__(
        self,
        api_url: Optional[str] = None,
        api_key: Optional[str] = None,
        openai_key: Optional[str] = None,
        gemini_key: Optional[str] = None,
        active_provider: Optional[str] = None
    ):
        custom_url = api_url or omniroute_url_var.get()
        if custom_url:
            clean_url = custom_url.rstrip("/")
            if not clean_url.endswith("/chat/completions"):
                self.api_url = f"{clean_url}/chat/completions"
            else:
                self.api_url = clean_url
        else:
            self.api_url = os.getenv("ADA_OMNIROUTE_URL", "https://api.omniroute.ai/v1/chat/completions")
            
        self.api_key = api_key or omniroute_key_var.get() or os.getenv("ADA_OMNIROUTE_KEY", "")
        self.openai_key = openai_key or openai_key_var.get() or os.getenv("ADA_OPENAI_KEY", os.getenv("OPENAI_API_KEY", ""))
        self.gemini_key = gemini_key or gemini_key_var.get() or os.getenv("ADA_GEMINI_KEY", os.getenv("GEMINI_API_KEY", ""))
        
        # Get active provider from contextvar if not explicitly passed
        provider = active_provider or active_provider_var.get()

        # Build ordered priority model list:
        # 1. Active provider first (explicit user choice)
        # 2. OmniRoute (always available via built-in defaults)
        # 3. Gemini / OpenAI (if user configured those keys)
        # 4. AWS Bedrock (final fallback, only on ECS where IAM role grants access)
        self.models: List[str] = []

        # ─ TIER 1: User-selected provider ──────────────────────────────
        if provider == "bedrock":
            custom_model = omniroute_model_var.get()
            if custom_model:
                full_model = f"bedrock/{custom_model}" if not custom_model.startswith("bedrock/") else custom_model
                self.models.append(full_model)
            for m in ["bedrock/anthropic.claude-3-5-sonnet-20241022-v2:0",
                       "bedrock/anthropic.claude-3-5-sonnet-20240620-v1:0",
                       "bedrock/anthropic.claude-3-haiku-20240307-v1:0"]:
                if m not in self.models:
                    self.models.append(m)
        elif provider == "gemini" and self.gemini_key:
            self.models.extend(["gemini-2.0-flash", "gemini-1.5-flash"])
        elif provider == "openai" and self.openai_key:
            self.models.extend(["gpt-4o-mini", "gpt-4o"])
        # For omniroute / no provider / custom endpoint: fall through to TIER 2 below

        # ─ TIER 2: OmniRoute (always available — built-in platform defaults) ───
        if self.api_key and not any(m.startswith("bedrock/") for m in self.models):
            custom_model = omniroute_model_var.get() or os.getenv("ADA_PRIMARY_MODEL", "auto/best-free")
            for m in [custom_model, "auto/best-free", "openai/best-free",
                       "if/qwen3-coder-plus", "if/deepseek-r1", "glmt/glm-4.7"]:
                if m and m not in self.models:
                    self.models.append(m)

        # ─ TIER 3: Gemini & OpenAI fallbacks (if keys available) ────────────
        if self.gemini_key:
            for m in ["gemini-2.0-flash", "gemini-1.5-flash"]:
                if m not in self.models:
                    self.models.append(m)
        if self.openai_key:
            for m in ["gpt-4o-mini", "gpt-4o"]:
                if m not in self.models:
                    self.models.append(m)

        # ─ TIER 4: AWS Bedrock (final fallback, works via IAM role on ECS) ──
        use_bedrock = os.getenv("ADA_USE_BEDROCK", "false").lower() == "true"
        if use_bedrock or provider == "bedrock":
            for m in ["bedrock/anthropic.claude-3-5-sonnet-20241022-v2:0",
                       "bedrock/anthropic.claude-3-haiku-20240307-v1:0"]:
                if m not in self.models:
                    self.models.append(m)

        # ─ Safety net: if somehow models is still empty, add OmniRoute defaults ─
        if not self.models:
            logger.warning("No models resolved. Inserting OmniRoute safety defaults.")
            self.models = ["auto/best-free", "openai/best-free", "if/qwen3-coder-plus"]

        
        self.dead_models: Dict[str, str] = {}
        self.combo_503_count: int = 0

    def clean_and_parse_json(self, raw: str) -> Dict[str, Any]:
        """Extract and parse JSON safely from LLM output, handling markdown blocks and pre/post text."""
        if not raw:
            return {}
        
        clean_raw = raw.strip()
        if "```json" in clean_raw:
            clean_raw = clean_raw.split("```json")[1].split("```")[0].strip()
        elif "```" in clean_raw:
            clean_raw = clean_raw.split("```")[1].split("```")[0].strip()
            
        try:
            return json.loads(clean_raw)
        except Exception:
            pass
            
        start = clean_raw.find('{')
        end = clean_raw.rfind('}')
        if start != -1 and end != -1:
            try:
                return json.loads(clean_raw[start:end+1])
            except Exception:
                pass
                
        start_list = clean_raw.find('[')
        end_list = clean_raw.rfind(']')
        if start_list != -1 and end_list != -1:
            try:
                return json.loads(clean_raw[start_list:end_list+1])
            except Exception:
                pass
                
        raise ValueError(f"Could not extract valid JSON from LLM output: {raw[:200]}...")

    @staticmethod
    def _classify_error(status_code: int, response_text: str) -> ErrorCategory:
        if status_code == 429:
            return ErrorCategory.RATE_LIMIT
        elif status_code in (401, 402):
            return ErrorCategory.AUTH_BILLING
        elif status_code in (502, 503, 504):
            return ErrorCategory.SERVER_FAULT
        elif not response_text or len(response_text.strip()) == 0:
            return ErrorCategory.EMPTY_RESPONSE
        return ErrorCategory.UNKNOWN

    def _rate_limit_wait(self, attempt: int, category: ErrorCategory) -> float:
        if category == ErrorCategory.SERVER_FAULT:
            wait_time = float(os.getenv("ADA_COOLDOWN_503", "4.0"))
            logger.warning(f"COMBO COOLDOWN: waiting {wait_time}s after 503 combo limit")
            return wait_time
        return float(2 ** attempt)

    def mark_model_dead(self, model: str, reason: str) -> None:
        self.dead_models[model] = reason
        logger.error(f"MODEL DEAD: {model} - {reason}")

    def analyze(self, system_prompt: str, user_prompt: str, response_schema: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        start_time = time.time()
        active_models = [m for m in self.models if m not in self.dead_models]
        
        if not active_models:
            execution_time = time.time() - start_time
            logger.critical(f"FALLING THROUGH: all {len(self.models)} models exhausted in {execution_time:.2f}s")
            raise RuntimeError("All configured application discovery models have experienced catastrophic failure states.")

        # Detect if a custom endpoint was explicitly configured by the user via Settings UI
        _default_omni_url = os.getenv("ADA_OMNIROUTE_URL", "https://api.omniroute.ai/v1/chat/completions")
        _has_custom_endpoint = bool(
            omniroute_url_var.get() and 
            omniroute_url_var.get().rstrip("/").rstrip("/chat/completions").strip() != 
            _default_omni_url.rstrip("/").rstrip("/chat/completions").strip()
        )

        for model in active_models:
            max_retries = 3 if ("auto" in model or "best-free" in model or "gemini" in model or "gpt-4o-mini" in model) else 2
            
            # Setup dynamic routing details
            current_url = self.api_url
            current_key = self.api_key
            request_model = model
            
            # CRITICAL: If user configured a custom endpoint (e.g. Databricks, OpenRouter, etc.),
            # ALWAYS use that custom URL + its API key, regardless of model name.
            # Only route to provider-specific hard-coded URLs when NO custom endpoint is set.
            if _has_custom_endpoint:
                # Use the user's custom endpoint and its API key for every model
                current_url = self.api_url
                current_key = self.api_key
                # Use the user's custom model ID if set, otherwise use the model from the list
                custom_model = omniroute_model_var.get()
                request_model = custom_model if custom_model else model
                logger.info(f"Routing '{model}' → custom endpoint '{current_url}' as model '{request_model}'")
            elif ("gemini" in model.lower()) and self.gemini_key:
                current_url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
                current_key = self.gemini_key
                request_model = model.split("/")[-1] if "/" in model else model
                logger.info(f"Routing model '{model}' directly to Gemini OpenAI-compatible API as '{request_model}'")
            elif ("gpt-" in model.lower() or "openai" in model.lower()) and self.openai_key and "best-free" not in model:
                current_url = "https://api.openai.com/v1/chat/completions"
                current_key = self.openai_key
                request_model = model.split("/")[-1] if "/" in model else model
                logger.info(f"Routing model '{model}' directly to OpenAI API as '{request_model}'")
            elif model.startswith("bedrock/"):
                request_model = model.replace("bedrock/", "")
                logger.info(f"Routing model '{model}' to AWS Bedrock Native Client")
            else:
                logger.info(f"Routing model '{model}' to Omniroute API Gateway")

            headers = {
                "Authorization": f"Bearer {current_key}",
                "Content-Type": "application/json"
            }
            if "omniroute" in current_url:
                headers["X-OmniRoute-Compression"] = "Caveman-RTK"
            
            for attempt in range(1, max_retries + 1):
                if model.startswith("bedrock/"):
                    try:
                        custom_region = omniroute_url_var.get()
                        resolved_region = os.getenv("AWS_REGION", "us-east-1")
                        if custom_region and not custom_region.startswith("http") and "/" not in custom_region:
                            clean_custom = custom_region.strip()
                            if clean_custom and clean_custom != "bedrock-runtime":
                                resolved_region = clean_custom
                        
                        logger.info(f"Initializing Amazon Bedrock client in region: {resolved_region}")
                        bedrock = boto3.client('bedrock-runtime', region_name=resolved_region)
                        
                        system_text = system_prompt
                        if response_schema:
                            system_text += f"\n\nCRITICAL: You must return ONLY valid JSON matching this schema: {json.dumps(response_schema)}"
                            
                        bedrock_payload = {
                            "anthropic_version": "bedrock-2023-05-31",
                            "max_tokens": 4096,
                            "system": system_text,
                            "messages": [
                                {"role": "user", "content": user_prompt}
                            ],
                            "temperature": 0.0
                        }
                        
                        # Strip "bedrock/" prefix for the native Bedrock runtime API
                        model_id = request_model.replace("bedrock/", "", 1)
                        response = bedrock.invoke_model(
                            modelId=model_id,
                            body=json.dumps(bedrock_payload),
                            contentType="application/json",
                            accept="application/json"
                        )
                        
                        response_body = json.loads(response.get('body').read())
                        content = response_body.get('content', [{}])[0].get('text', '')
                        
                        if not content:
                            raise ValueError("Empty response from Bedrock")
                            
                        self.combo_503_count = 0
                        return {"model_used": model, "raw_output": content}
                        
                    except Exception as exc:
                        if isinstance(exc, ClientError):
                            status = exc.response.get('ResponseMetadata', {}).get('HTTPStatusCode', 500)
                            text = str(exc)
                        else:
                            status = 500
                            text = str(exc)
                        last_llm_error_var.set(text)
                        category = self._classify_error(status, text)
                        if attempt == max_retries:
                            self.mark_model_dead(model, f"AWS Bedrock fault limit reached: {text}")
                            break
                        wait_sec = self._rate_limit_wait(attempt, category)
                        logger.info(f"RETAIN {model} - attempt {attempt}/{max_retries}")
                        time.sleep(wait_sec)
                        continue
                        
                else:
                    payload: Dict[str, Any] = {
                        "model": request_model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.0,
                        "stream": False  # Force standard non-streaming static block responses
                    }
                    
                    if response_schema:
                        payload["response_format"] = {
                            "type": "json_schema",
                            "json_schema": {
                                "name": "analysis_response",
                                "schema": response_schema
                            }
                        }

                    try:
                        with httpx.Client(timeout=90.0) as client:
                            response = client.post(current_url, headers=headers, json=payload)
                            
                            if response.status_code == 400 and ("response_format" in response.text or "json_schema" in response.text or "schema" in response.text):
                                logger.warning(f"Model {request_model} failed with json_schema. Retrying with json_object format.")
                                payload["response_format"] = {"type": "json_object"}
                                response = client.post(current_url, headers=headers, json=payload)
                            
                        if response.status_code == 200:
                            try:
                                data = response.json()
                            except Exception as json_err:
                                logger.error(f"Endpoint status 200 but failed to parse JSON object: {str(json_err)}. Content raw snippet: {response.text[:150]}")
                                if attempt == max_retries:
                                    self.mark_model_dead(model, f"Malformed non-JSON snippet streaming returned on 200 OK.")
                                    break
                                time.sleep(self._rate_limit_wait(attempt, ErrorCategory.EMPTY_RESPONSE))
                                continue
                                
                            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                            
                            if not content or len(content.strip()) == 0:
                                if attempt == max_retries:
                                    self.mark_model_dead(model, "Empty content payload fields.")
                                    break
                                time.sleep(self._rate_limit_wait(attempt, ErrorCategory.EMPTY_RESPONSE))
                                continue
                                
                            self.combo_503_count = 0
                            return {"model_used": model, "raw_output": content}
                            
                        last_llm_error_var.set(f"HTTP {response.status_code}: {response.text}")
                        category = self._classify_error(response.status_code, response.text)
                        
                        if category in (ErrorCategory.AUTH_BILLING, ErrorCategory.UNKNOWN):
                            self.mark_model_dead(model, f"Permanent error {response.status_code}: {response.text}")
                            break
                            
                        if attempt == max_retries:
                            self.mark_model_dead(model, f"Exhausted total retries. Last status code: {response.status_code}")
                            break
                            
                        wait_sec = self._rate_limit_wait(attempt, category)
                        logger.info(f"RETAIN {model} - attempt {attempt}/{max_retries} after {category.value}")
                        time.sleep(wait_sec)

                    except (httpx.RequestError, httpx.HTTPStatusError) as exc:
                        status = getattr(getattr(exc, 'response', None), 'status_code', 500)
                        text = getattr(getattr(exc, 'response', None), 'text', str(exc))
                        last_llm_error_var.set(text)
                        category = self._classify_error(status, text)
                        
                        if attempt == max_retries:
                            self.mark_model_dead(model, f"Network exception limit reached: {str(exc)}")
                            break
                            
                        wait_sec = self._rate_limit_wait(attempt, category)
                        logger.info(f"RETAIN {model} - attempt {attempt}/{max_retries} after network tracking fault")
                        time.sleep(wait_sec)

        execution_time = time.time() - start_time
        logger.critical(f"FALLING THROUGH: all {len(active_models)} models exhausted in {execution_time:.2f}s")
        err_msg = last_llm_error_var.get()
        err_suffix = f" Last error details: {err_msg}" if err_msg else ""
        raise RuntimeError(f"Omniroute architecture processing failed to complete safely across the complete routing chain.{err_suffix}")
