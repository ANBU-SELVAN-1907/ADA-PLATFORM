# 🧠 ADA — Deep Schematic Discovery Engine: Complete Flow Maps

## 📊 Master Architecture Overview

```mermaid
graph TB
    subgraph EXTERNAL["🌍 External Layer"]
        USER["👤 User / Client"]
        GITHUB["🐙 GitHub API"]
        OMNIROUTE["🤖 Omniroute LLM Gateway"]
    end

    subgraph FRONTEND["🖥️ Frontend Layer"]
        subgraph VITE["Vite Dev Server (Port 5173)"]
            REACT["⚛️ React + TypeScript App"]
            DASH["📊 Dashboard UI"]
            TABS["📑 Result Tabs"]
            STORE["🗄️ Zustand State Store"]
            API_CLIENT["🔌 API Client (client.ts)"]
        end
        subgraph HTML["Legacy Dashboard"]
            DASH_HTML["📄 dashboard.html (1061 lines)"]
        end
    end

    subgraph BACKEND["⚙️ Backend Layer — FastAPI (Port 8000)"]
        MAIN["🚀 main.py — FastAPI App"]
        CONFIG["⚙️ config.py — Settings & .env Loader"]

        subgraph SERVICES["🔧 Service Layer"]
            GH_SVC["🐙 GitHubService<br/>(github_service.py)"]
            LLM_SVC["🧠 LLMService<br/>(llm_service.py)"]
            RPT_SVC["📄 ReportService<br/>(report_service.py)"]
        end

        subgraph AGENTS["🤖 10-Agent LangGraph Pipeline"]
            ORCH["🎵 orchestration.py<br/>(LangGraph StateGraph)"]
            STATE["📦 state.py<br/>(DiscoveryState TypedDict)"]

            A1["1️⃣ Repo Agent"]
            A2["2️⃣ Tech Agent"]
            A3["3️⃣ Dependency Agent"]
            A4["4️⃣ Infra Agent"]
            A5["5️⃣ Security Agent"]
            A6["6️⃣ Doc Agent"]
            A7["7️⃣ Architecture Agent"]
            A8["8️⃣ Telemetry Agent"]
            A9["9️⃣ Schematic Agent"]
            A10["🔟 Report Agent"]
        end

        subgraph REPORTING["📑 Report Generation"]
            RPT_TMPL["🎨 report_template.py<br/>(Deloitte Design System)"]
            RPT_JSON["📁 corporate_theme.json"]
        end
    end

    subgraph OUTPUT["📂 Output Layer"]
        DOCX["📄 DOCX Report"]
        PDF["📕 PDF Report"]
        OUT_DIR["📁 output/"]
    end

    USER -->|"POST /api/v1/discover"| MAIN
    MAIN --> CONFIG
    MAIN --> ORCH
    ORCH --> STATE

    ORCH --> A1 --> A2 --> A3 --> A4 --> A5 --> A6 --> A7 --> A8 --> A9 --> A10

    A1 --> GH_SVC
    GH_SVC -->|"Fetch tree + file content"| GITHUB
    A2 & A3 & A4 & A5 & A6 & A7 & A8 & A9 --> LLM_SVC
    LLM_SVC -->|"Chat Completions API"| OMNIROUTE

    A10 --> RPT_SVC
    RPT_SVC --> RPT_TMPL
    RPT_SVC --> DOCX
    RPT_SVC --> PDF
    DOCX --> OUT_DIR
    PDF --> OUT_DIR

    REACT --> API_CLIENT
    API_CLIENT -->|"POST /api/v1/discover"| MAIN
    API_CLIENT -->|"GET /api/v1/health"| MAIN
    DASH_HTML -.->|"Legacy /template"| MAIN

    style EXTERNAL fill:#1a1a2e,stroke:#86BC24,color:#fff
    style FRONTEND fill:#16213e,stroke:#86BC24,color:#fff
    style BACKEND fill:#0f3460,stroke:#86BC24,color:#fff
    style OUTPUT fill:#1a1a2e,stroke:#86BC24,color:#fff
    style AGENTS fill:#533483,stroke:#86BC24,color:#fff
    style SERVICES fill:#2b2d42,stroke:#86BC24,color:#fff
```

---

## 🔄 Complete Request Lifecycle Flow

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 User
    participant F as 🖥️ React Frontend
    participant A as 🚀 FastAPI (main.py)
    participant C as ⚙️ config.py
    participant G as 🔗 LangGraph Pipeline
    participant R1 as 1️⃣ Repo Agent
    participant GH as 🐙 GitHubService
    participant GHAPI as 🌐 GitHub API
    participant R2 as 2️⃣ Tech Agent
    participant R3 as 3️⃣ Dependency Agent
    participant R4 as 4️⃣ Infra Agent
    participant R5 as 5️⃣ Security Agent
    participant R6 as 6️⃣ Doc Agent
    participant R7 as 7️⃣ Architecture Agent
    participant R8 as 8️⃣ Telemetry Agent
    participant R9 as 9️⃣ Schematic Agent
    participant R10 as 🔟 Report Agent
    participant LLM as 🧠 LLMService
    participant OMNI as 🤖 Omniroute API
    participant RS as 📄 ReportService

    U->>F: Enter GitHub repo URL + API keys
    F->>A: POST /api/v1/discover
    A->>C: Load .env + Settings
    C-->>A: Config ready (API keys, paths)
    A->>A: Build initial_state dict

    rect rgb(134, 188, 36, 0.1)
        Note over G: 🔗 LangGraph 10-Node Linear Pipeline
        A->>G: compiled_graph.invoke(initial_state)

        rect rgb(30, 30, 30, 0.15)
            Note over R1: 1️⃣ Repository Ingestion
            G->>R1: run_repo_agent(state)
            R1->>GH: fetch_repository_structure(url)
            GH->>GHAPI: GET /repos/{owner}/{repo}/git/trees/{branch}
            GHAPI-->>GH: Recursive file tree
            GH->>GH: Filter high-signal files
            GH-->>R1: {owner, repo, branch, flat_structure}

            loop For each high-value file (README, manifests, configs, source)
                R1->>GH: fetch_raw_content(owner, repo, branch, path)
                GH->>GHAPI: GET raw.githubusercontent.com/...
                GHAPI-->>GH: File content
                GH-->>R1: content string
            end

            R1->>LLM: analyze(overview_prompt, repo_context)
            LLM->>OMNI: POST /chat/completions
            OMNI-->>LLM: Executive summary JSON
            LLM-->>R1: application_overview
            R1-->>G: {repo_owner, repo_name, repo_structure, high_value_contents, application_overview}
        end

        rect rgb(30, 30, 30, 0.15)
            Note over R2: 2️⃣ Technology Stack Discovery
            G->>R2: run_tech_agent(state)
            R2->>LLM: analyze(tech_prompt, file_paths + contents)
            LLM->>OMNI: POST /chat/completions
            OMNI-->>LLM: Tech stack JSON
            LLM-->>R2: stack_summary + tech_stack_table
            R2->>R2: Merge static extension-based detection
            R2-->>G: {technology_stack}
        end

        rect rgb(30, 30, 30, 0.15)
            Note over R3: 3️⃣ Dependency & Database Analysis
            G->>R3: run_dependency_agent(state)
            R3->>R3: Static parse packages from manifests
            R3->>LLM: analyze(deps_prompt, manifest_contents)
            LLM->>OMNI: POST /chat/completions
            OMNI-->>LLM: Dependency JSON
            LLM-->>R3: dependency_table + persistence_roadmap
            R3->>R3: Supplement with regex URL extraction
            R3-->>G: {dependency_analysis}
        end

        rect rgb(30, 30, 30, 0.15)
            Note over R4: 4️⃣ Infrastructure & Deployment
            G->>R4: run_infra_agent(state)
            R4->>LLM: analyze(infra_prompt, all_contents)
            LLM->>OMNI: POST /chat/completions
            OMNI-->>LLM: Infra JSON
            LLM-->>R4: scaling + Docker + CI/CD
            R4->>R4: Heuristic scan for Docker files & GitHub Actions
            R4-->>G: {infrastructure_insights}
        end

        rect rgb(30, 30, 30, 0.15)
            Note over R5: 5️⃣ Security & Observability Audit
            G->>R5: run_security_agent(state)
            R5->>LLM: analyze(security_prompt, all_contents)
            LLM->>OMNI: POST /chat/completions
            OMNI-->>LLM: Security JSON
            LLM-->>R5: security_risks + auth_mechanisms
            R5->>R5: Heuristic scan: hardcoded keys, CORS wildcards
            R5-->>G: {security_observability}
        end

        rect rgb(30, 30, 30, 0.15)
            Note over R6: 6️⃣ Documentation Mining
            G->>R6: run_doc_agent(state)
            R6->>R6: Extract docstrings from source files
            R6->>R6: Extract API routes via regex
            R6->>R6: Extract env vars from .env files
            R6->>LLM: analyze(doc_prompt, readme + docs + docstrings)
            LLM->>OMNI: POST /chat/completions
            OMNI-->>LLM: Documentation JSON
            LLM-->>R6: doc_summary + api_documentation + features
            R6-->>G: {doc_analysis}
        end

        rect rgb(30, 30, 30, 0.15)
            Note over R7: 7️⃣ Architecture Blueprint
            G->>R7: run_architecture_agent(state)
            R7->>LLM: analyze(arch_prompt, full_repo_context)
            LLM->>OMNI: POST /chat/completions
            OMNI-->>LLM: ASCII graph + observations JSON
            LLM-->>R7: ascii_graph + observations
            R7->>R7: Fallback: auto-generate if LLM fails
            R7-->>G: {architecture_graph, architecture_observations}
        end

        rect rgb(30, 30, 30, 0.15)
            Note over R8: 8️⃣ Telemetry & Observability Deep Scan
            G->>R8: run_telemetry_agent(state)
            R8->>LLM: analyze(telemetry_prompt, all_contents)
            LLM->>OMNI: POST /chat/completions
            OMNI-->>LLM: Telemetry JSON
            LLM-->>R8: logging + metrics + tracing + score
            R8-->>G: {telemetry_analysis}
        end

        rect rgb(30, 30, 30, 0.15)
            Note over R9: 9️⃣ Deep Schematic Code Analysis
            G->>R9: run_schematic_agent(state)
            R9->>LLM: analyze(schematic_prompt, all_contents + deps + APIs)
            LLM->>OMNI: POST /chat/completions
            OMNI-->>LLM: Schematic JSON
            LLM-->>R9: data_flow + modules + API surface + auth
            R9-->>G: {schematic_analysis}
        end

        rect rgb(30, 30, 30, 0.15)
            Note over R10: 🔟 Report Consolidation
            G->>R10: run_report_agent(state)
            R10->>R10: Merge all agent outputs into final_report
            R10-->>G: {report_payload}
        end
    end

    G-->>A: final_state (complete)
    A->>RS: compile_report(final_state, base_name, output_dir, format)
    RS->>RS: Build DOCX with Deloitte design system
    RS-->>A: output filepath
    alt PDF format requested
        RS->>RS: docx2pdf convert
        RS-->>A: PDF filepath
    end
    A-->>F: {status, report_path, files_scanned, manifests_fetched}
    F-->>U: Display results + download link
```

---

## 🤖 Agent Detail Flow — Each Agent's Internal Process

```mermaid
flowchart TD
    subgraph AGENT_COMMON["🔄 Common Agent Pattern"]
        direction TB
        START(("▶️ Start")) --> READ_STATE["📦 Read state from LangGraph"]
        READ_STATE --> INIT_LLM["🧠 Initialize LLMService"]
        INIT_LLM --> BUILD_CONTEXT["📝 Build context from<br/>high_value_contents<br/>+ repo_structure"]
        BUILD_CONTEXT --> LLM_CALL["📡 LLM.analyze(<br/>system_prompt,<br/>user_context,<br/>response_schema)"]

        LLM_CALL -->|"200 OK"| PARSE["🔍 clean_and_parse_json()"]
        LLM_CALL -->|"Error"| RETRY{"🔄 Retry?"}
        RETRY -->|"Yes"| LLM_CALL
        RETRY -->|"No more retries"| DEAD["💀 mark_model_dead()<br/>Try next model"]

        PARSE -->|"Valid JSON"| MERGE["🔀 Merge with<br/>static heuristics"]
        PARSE -->|"Invalid JSON"| DEAD
        DEAD --> NEXT_MODEL{"📦 More<br/>models?"}
        NEXT_MODEL -->|"Yes"| LLM_CALL
        NEXT_MODEL -->|"All exhausted"| FALLBACK["⚠️ Use fallback defaults"]

        MERGE --> RETURN_STATE["📤 Return state update dict"]
        FALLBACK --> RETURN_STATE
    end

    style AGENT_COMMON fill:#1a1a2e,stroke:#86BC24,color:#fff
```

---

## 🔗 State Flow — What Each Agent Reads & Writes

```mermaid
flowchart LR
    subgraph STATE["📦 DiscoveryState TypedDict"]
        S1["repo_url"]
        S2["github_token"]
        S3["api_keys"]
        S4["repo_owner / repo_name / repo_branch"]
        S5["repo_structure<br/>(path → size)"]
        S6["high_value_contents<br/>(path → content)"]
        S7["application_overview"]
        S8["technology_stack"]
        S9["dependency_analysis"]
        S10["infrastructure_insights"]
        S11["security_observability"]
        S12["doc_analysis"]
        S13["architecture_graph<br/>architecture_observations"]
        S14["telemetry_analysis"]
        S15["schematic_analysis"]
        S16["report_payload"]
    end

    subgraph WRITES["✍️ Agent Write Operations"]
        W1["1️⃣ Repo Agent"] --> S4 & S5 & S6 & S7
        W2["2️⃣ Tech Agent"] --> S8
        W3["3️⃣ Dep Agent"] --> S9
        W4["4️⃣ Infra Agent"] --> S10
        W5["5️⃣ Security Agent"] --> S11
        W6["6️⃣ Doc Agent"] --> S12
        W7["7️⃣ Arch Agent"] --> S13
        W8["8️⃣ Telemetry Agent"] --> S14
        W9["9️⃣ Schematic Agent"] --> S15
        W10["🔟 Report Agent"] --> S16
    end

    style STATE fill:#0f3460,stroke:#86BC24,color:#fff
    style WRITES fill:#1a1a2e,stroke:#86BC24,color:#fff
```

---

## 🧠 LLM Service — Model Fallback & Retry Flow

```mermaid
flowchart TD
    START(("🧠 LLM.analyze()")) --> INIT["Initialize:<br/>active_models = all - dead_models"]

    INIT --> CHECK{"active_models<br/>empty?"}
    CHECK -->|"Yes"| CRASH["💀 RuntimeError:<br/>All models exhausted"]
    CHECK -->|"No"| MODEL_LOOP

    MODEL_LOOP["🔄 For each model in:<br/>auto/best-free → openai/best-free<br/>→ qwen3-coder → deepseek-r1 → glm-4.7"] --> RETRY_LOOP

    RETRY_LOOP["🔁 attempt = 1 to max_retries<br/>(3 for auto, 2 for others)"] --> BUILD["Build payload:<br/>model + messages +<br/>response_format (json_schema)"]

    BUILD --> HTTP["📡 httpx.POST<br/>OmniRoute API<br/>timeout=90s"]
    HTTP --> STATUS{"Status Code?"}

    STATUS -->|"200 OK"| PARSE_RESP{"Parse JSON<br/>response?"}
    PARSE_RESP -->|"Success"| EXTRACT["Extract content<br/>from choices[0].message.content"]
    PARSE_RESP -->|"Fail"| RETRY_OR_DIE

    EXTRACT --> EMPTY_CHECK{"Content<br/>empty?"}
    EMPTY_CHECK -->|"No"| SUCCESS["✅ Return<br/>{model_used, raw_output}"]
    EMPTY_CHECK -->|"Yes"| RETRY_OR_DIE

    STATUS -->|"400 (schema error)"| RETRY_JSON["Retry with<br/>json_object format"]
    RETRY_JSON --> HTTP

    STATUS -->|"429 Rate Limit"| WAIT["⏳ Exponential backoff:<br/>2^attempt seconds"]
    STATUS -->|"502/503/504"| WAIT503["⏳ Cooldown: 4s<br/>(ADA_COOLDOWN_503)"]
    STATUS -->|"401/402 Auth"| DEAD_MODEL["💀 mark_model_dead()<br/>(permanent)"]

    WAIT --> RETRY_OR_DIE{"More retries?"}
    WAIT503 --> RETRY_OR_DIE

    RETRY_OR_DIE -->|"Yes"| RETRY_LOOP
    RETRY_OR_DIE -->|"No"| DEAD_MODEL
    DEAD_MODEL --> NEXT["⏭️ Next model"]

    style SUCCESS fill:#10B981,stroke:#fff,color:#fff
    style CRASH fill:#EF4444,stroke:#fff,color:#fff
    style DEAD_MODEL fill:#F59E0B,stroke:#fff,color:#fff
```

---

## 🐙 GitHub Service — File Ingestion Flow

```mermaid
flowchart TD
    INPUT["🌐 GitHub Repo URL"] --> PARSE["parse_url()<br/>Extract owner/repo"]
    PARSE --> BRANCH["_get_default_branch()<br/>GET /repos/{owner}/{repo}"]
    BRANCH --> TREE["fetch_repository_structure()<br/>GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1"]

    TREE --> FLAT["Build flat_structure:<br/>path → size"]
    FLAT --> FILTER["Filter high-signal files"]

    FILTER --> SIG{"_is_high_signal(path)?"}
    SIG -->|"Yes: README, pyproject.toml,<br/>package.json, Dockerfile,<br/>.github/workflows, etc."| MANIFEST["📋 Add to manifest_paths"]
    SIG -->|"No"| SKIP["⏭️ Skip"]

    MANIFEST --> CATEGORIZE

    subgraph CATEGORIZE["📂 Agent 1 — File Category Fetching"]
        C1["📖 1. README files (max 2)<br/>→ up to 12,000 chars"]
        C2["📦 2. Manifests & Configs (max 25)<br/>requirements.txt, pyproject.toml,<br/>package.json, etc. → up to 5,000 chars"]
        C3["🔧 3. CI/CD & Infra (max 15)<br/>.github/workflows, Dockerfile,<br/>terraform, k8s, deploy"]
        C4["💻 4. Source Candidates (max ~60 total)<br/>Priority: main, app, server, index,<br/>agent, service, model, router"]
    end

    C1 & C2 & C3 & C4 --> FETCH["fetch_raw_content()<br/>raw.githubusercontent.com"]
    FETCH --> CONTENTS["📦 high_value_contents:<br/>path → content string"]
    CONTENTS --> OVERVIEW["🧠 LLM: Generate<br/>application_overview"]

    style FETCH fill:#86BC24,stroke:#fff,color:#000
```

---

## 📄 Report Generation Flow

```mermaid
flowchart TD
    INPUT["📦 final_state<br/>(all agent outputs)"] --> UNPACK["Unpack payloads:<br/>tech_data, dep_data, infra_data,<br/>sec_data, telemetry, schematic,<br/>arch_graph, arch_obs, app_overview"]

    UNPACK --> P1["📄 PAGE 1: Cover Page<br/>• Brand: DELOITTE AI ASSISTANCE<br/>• Title: APPLICATION DISCOVERY<br/>• Metadata: repo, date, version<br/>• Distribution Notice"]
    P1 --> P2["📄 PAGE 2: Executive Summary<br/>• AI executive summary<br/>• WHAT/STACK/SCALE/RISK/ACTION table"]
    P2 --> P3["📄 PAGE 3: Application Summary<br/>• Telemetry & Attributes table<br/>• Key Logical Components table"]
    P3 --> P4["📄 PAGE 4: Technology Stack<br/>• AI stack_summary<br/>• 4-col tech table (layer/tech/version/usage)"]
    P4 --> P5["📄 PAGE 5: Dependencies<br/>• Database summary<br/>• Package table<br/>• Persistence roadmap table"]
    P5 --> P6["📄 PAGE 6: Infrastructure<br/>• Scaling configurations table<br/>• Docker, CI/CD, cloud services"]
    P6 --> P7["📄 PAGE 7: Security & Observability<br/>• Risk table (severity-colored)<br/>• Observability posture"]
    P7 --> P8["📄 PAGE 8: Architecture<br/>• Advisory Pattern Analysis bullets<br/>• ASCII Topography Graph"]
    P8 --> P9["📄 PAGE 9: Assumptions & Limitations<br/>• Analytical assumptions<br/>• System limitations"]
    P9 --> P10["📄 PAGE 10: Telemetry Analysis<br/>• Observability score callout<br/>• 6-dimension detail table<br/>• Recommendations"]
    P10 --> P11["📄 PAGE 11: Deep Schematic Analysis<br/>• Data flow lifecycle<br/>• Module dependency table<br/>• API surface catalog<br/>• Auth/Config/Error schematics"]

    P11 --> SAVE["💾 Save DOCX<br/>output/Deloitte_AI_Insights_{name}_{ts}.docx"]
    SAVE --> FMT{"format == 'pdf'?"}
    FMT -->|"Yes"| PDF["📕 docx2pdf convert<br/>→ PDF output"]
    FMT -->|"No"| DOCX["✅ Return DOCX path"]

    style P1 fill:#86BC24,stroke:#fff,color:#000
    style SAVE fill:#00A3E0,stroke:#fff,color:#fff
```

---

## 🖥️ Frontend — React App Architecture

```mermaid
flowchart TD
    subgraph REACT_APP["⚛️ React + TypeScript + Vite"]
        MAIN["main.tsx<br/>ReactDOM.createRoot"]
        MAIN --> APP["App.tsx"]

        APP --> LAYOUT["Layout<br/>Header + Sidebar"]
        APP --> DASHBOARD["Dashboard"]

        DASHBOARD --> FORM["DiscoveryForm<br/>• Repo URL input<br/>• GitHub token<br/>• Omniroute key<br/>• Format: DOCX/PDF<br/>• Submit button"]

        DASHBOARD --> PROGRESS["AgentProgress<br/>• 10-step pipeline visualizer<br/>• pending → active → completed"]

        DASHBOARD --> RESULTS["ResultsPanel<br/>• Tab-based results display"]

        RESULTS --> TAB1["📑 Executive Summary"]
        RESULTS --> TAB2["🔧 Tech Stack"]
        RESULTS --> TAB3["📦 Dependencies"]
        RESULTS --> TAB4["🔒 Security"]
        RESULTS --> TAB5["📡 Telemetry"]
        RESULTS --> TAB6["🧠 Schematics"]
        RESULTS --> TAB7["🏗️ Architecture"]
    end

    subgraph STATE_MGMT["🗄️ State Management"]
        ZUSTAND["Zustand Store<br/>(store.ts)"]
        ZUSTAND --> |"isRunning, error,<br/>payload, reportPath"| DASHBOARD
        ZUSTAND --> |"agentSteps,<br/>currentStepIndex"| PROGRESS
        ZUSTAND --> |"activeTab"| RESULTS
    end

    subgraph API["🔌 API Layer"]
        CLIENT["client.ts<br/>API Client"]
        CLIENT -->|"POST /api/v1/discover"| BACKEND_FASTAPI["FastAPI Backend<br/>localhost:8000"]
        CLIENT -->|"GET /api/v1/health"| BACKEND_FASTAPI
    end

    FORM -->|"onSubmit"| CLIENT
    CLIENT -->|"response"| ZUSTAND

    subgraph VITE_PROXY["🔄 Vite Proxy"]
        VP["/api/* → localhost:8000<br/>/output/* → localhost:8000"]
    end

    style REACT_APP fill:#16213e,stroke:#86BC24,color:#fff
    style STATE_MGMT fill:#533483,stroke:#86BC24,color:#fff
    style API fill:#2b2d42,stroke:#86BC24,color:#fff
```

---

## 🔌 Service Layer — Dependency Map

```mermaid
flowchart TD
    subgraph SERVICES["🔧 Service Layer"]
        GH["GitHubService<br/>(github_service.py)"]
        LLM["LLMService<br/>(llm_service.py)"]
        RPT["ReportService<br/>(report_service.py)"]
    end

    subgraph AGENTS_USE["🤖 Agent → Service Mapping"]
        A1["1️⃣ Repo Agent"] -->|"GitHub API calls"| GH
        A1 -->|"Overview generation"| LLM
        A2["2️⃣ Tech Agent"] --> LLM
        A3["3️⃣ Dep Agent"] --> LLM
        A4["4️⃣ Infra Agent"] --> LLM
        A5["5️⃣ Security Agent"] --> LLM
        A6["6️⃣ Doc Agent"] --> LLM
        A7["7️⃣ Arch Agent"] --> LLM
        A8["8️⃣ Telemetry Agent"] --> LLM
        A9["9️⃣ Schematic Agent"] --> LLM
    end

    A10["🔟 Report Agent"] -->|"Compile final report"| RPT

    GH -->|"httpx"| GHAPI["🌐 GitHub API<br/>(api.github.com<br/>raw.githubusercontent.com)"]
    LLM -->|"httpx + retry logic"| OMNI["🤖 Omniroute API<br/>(OpenAI-compatible)"]
    RPT -->|"python-docx"| DOCX_OUT["📄 DOCX File"]
    RPT -->|"docx2pdf"| PDF_OUT["📕 PDF File"]

    RPT -.->|"imports"| TEMPLATE["🎨 report_template.py<br/>(Deloitte design tokens)"]

    style GH fill:#2b2d42,stroke:#86BC24,color:#fff
    style LLM fill:#533483,stroke:#86BC24,color:#fff
    style RPT fill:#0f3460,stroke:#86BC24,color:#fff
```

---

## ⚡ Error Handling & Resilience Flow

```mermaid
flowchart TD
    subgraph LLM_ERROR["🧠 LLM Error Handling"]
        E1["429 Rate Limit"] -->|"Exponential backoff"| R1["Retry same model"]
        E2["503 Server Fault"] -->|"4s cooldown"| R2["Retry same model"]
        E3["401/402 Auth Error"] -->|"Permanent"| D1["💀 Mark model dead"]
        E4["Empty Response"] -->|"Retry"| R3["Retry same model"]
        E5["Network Exception"] -->|"Backoff"| R4["Retry same model"]
        E6["All retries exhausted"] -->|"Permanent"| D2["💀 Mark model dead → try next model"]
    end

    subgraph AGENT_ERROR["🤖 Agent Error Handling"]
        AE1["LLM returns invalid JSON"] -->|"clean_and_parse_json()"| AE2["Extract JSON from markdown blocks"]
        AE2 -->|"Still fails"| AE3["Use fallback defaults"]
        AE4["LLM call fails completely"] -->|"try/except"| AE5["Return partial/default state"]
        AE5 -->|"Architecture agent"| AE6["Auto-generate ASCII fallback diagram"]
    end

    subgraph API_ERROR["🌐 API Error Handling"]
        APIE1["GitHub 404/403"] -->|"Default branch = main"| APIE2["Continue with available files"]
        APIE3["GitHub rate limit"] -->|"httpx timeout 30s"| APIE4["Log error, return empty"]
        APIE5["All LLM models dead"] -->|"Critical"| APIE6["RuntimeError → HTTP 500"]
    end

    style D1 fill:#EF4444,stroke:#fff,color:#fff
    style D2 fill:#EF4444,stroke:#fff,color:#fff
    style AE3 fill:#F59E0B,stroke:#fff,color:#fff
    style APIE6 fill:#EF4444,stroke:#fff,color:#fff
```

---

## 🏗️ File Structure Map

```mermaid
graph TD
    ROOT["📁 gem/"] --> MAIN_PY["🚀 main.py<br/>FastAPI app entry point"]
    ROOT --> CONFIG["⚙️ config.py<br/>.env loader + Settings"]
    ROOT --> REPORT_TPL["🎨 report_template.py<br/>Deloitte design system"]
    ROOT --> REQ["📋 requirements.txt"]
    ROOT --> ENV["🔐 .env<br/>API keys + config"]
    ROOT --> PLAN["📝 plan.md<br/>Frontend roadmap"]

    ROOT --> AGENTS_DIR["🤖 agents/"]
    AGENTS_DIR --> STATE["📦 state.py<br/>DiscoveryState TypedDict"]
    AGENTS_DIR --> ORCH["🎵 orchestration.py<br/>LangGraph 10-node pipeline<br/>+ Architecture, Telemetry,<br/>Schematic agents"]
    AGENTS_DIR --> A1["1️⃣ repo_agent.py"]
    AGENTS_DIR --> A2["2️⃣ tech_agent.py"]
    AGENTS_DIR --> A3["3️⃣ dependency_agent.py"]
    AGENTS_DIR --> A4["4️⃣ infra_agent.py"]
    AGENTS_DIR --> A5["5️⃣ security_agent.py"]
    AGENTS_DIR --> A6["6️⃣ doc_agent.py"]
    AGENTS_DIR --> A10["🔟 report_agent.py"]

    ROOT --> SERVICES_DIR["🔧 services/"]
    SERVICES_DIR --> GH_SVC["🐙 github_service.py<br/>GitHub API wrapper"]
    SERVICES_DIR --> LLM_SVC["🧠 llm_service.py<br/>Omniroute LLM client<br/>+ model fallback chain"]
    SERVICES_DIR --> RPT_SVC["📄 report_service.py<br/>DOCX/PDF generation"]

    ROOT --> TEMPLATES_DIR["📁 templates/"]
    TEMPLATES_DIR --> DASH_HTML["🖥️ dashboard.html<br/>Legacy vanilla dashboard"]
    TEMPLATES_DIR --> THEME_JSON["🎨 corporate_theme.json"]

    ROOT --> FRONTEND_DIR["⚛️ frontend/"]
    FRONTEND_DIR --> F_MAIN["main.tsx"]
    FRONTEND_DIR --> F_STORE["store.ts<br/>Zustand state"]
    FRONTEND_DIR --> F_TYPES["types/index.ts<br/>TypeScript interfaces"]
    FRONTEND_DIR --> F_CLIENT["api/client.ts<br/>API client"]
    FRONTEND_DIR --> F_CSS["index.css<br/>Tailwind + custom components"]
    FRONTEND_DIR --> F_VITE["vite.config.ts<br/>Proxy + build config"]

    ROOT --> OUTPUT_DIR["📂 output/"]
    OUTPUT_DIR --> DOCX_FILES["📄 *.docx reports"]
    OUTPUT_DIR --> PDF_FILES["📕 *.pdf reports"]

    ROOT --> SRC_DIR["📁 src/"]
    SRC_DIR --> DASH_TSX["components/Dashboard.tsx<br/>(empty — planned)"]

    style ROOT fill:#0A0E17,stroke:#86BC24,color:#fff
    style AGENTS_DIR fill:#533483,stroke:#86BC24,color:#fff
    style SERVICES_DIR fill:#2b2d42,stroke:#86BC24,color:#fff
    style FRONTEND_DIR fill:#16213e,stroke:#86BC24,color:#fff
```

---

## 🎯 Quick Summary — The Perfect One-Flow

```mermaid
graph LR
    USER["👤 User submits<br/>GitHub URL"] -->|"POST /api/v1/discover"| FASTAPI["🚀 FastAPI"]

    FASTAPI -->|"1"| REPO["1️⃣ Repo Agent<br/>Fetches tree + files<br/>from GitHub API"]
    REPO -->|"2"| TECH["2️⃣ Tech Agent<br/>Identifies languages,<br/>frameworks, tools"]
    TECH -->|"3"| DEPS["3️⃣ Dep Agent<br/>Parses manifests<br/>Maps dependencies"]
    DEPS -->|"4"| INFRA["4️⃣ Infra Agent<br/>Docker, CI/CD,<br/>cloud services"]
    INFRA -->|"5"| SEC["5️⃣ Security Agent<br/>Vulnerabilities,<br/>auth mechanisms"]
    SEC -->|"6"| DOC["6️⃣ Doc Agent<br/>README, API docs,<br/>docstrings"]
    DOC -->|"7"| ARCH["7️⃣ Architecture Agent<br/>ASCII diagram,<br/>observations"]
    ARCH -->|"8"| TELE["8️⃣ Telemetry Agent<br/>Logging, metrics,<br/>tracing score"]
    TELE -->|"9"| SCHEM["9️⃣ Schematic Agent<br/>Data flows, modules,<br/>API surface"]
    SCHEM -->|"10"| REPORT["🔟 Report Agent<br/>Consolidates all"]

    REPORT -->|"Compile"| DOCX["📄 DOCX Report<br/>(Deloitte branded)"]
    DOCX -.->|"Optional"| PDF["📕 PDF Report"]
    DOCX -->|"Return path"| USER

    style USER fill:#86BC24,stroke:#fff,color:#000
    style FASTAPI fill:#00A3E0,stroke:#fff,color:#fff
    style DOCX fill:#86BC24,stroke:#fff,color:#000
```

---

## 🔑 Key Data Flow Summary

| Step | Agent | Reads From State | Writes To State | External Call |
|------|-------|------------------|-----------------|---------------|
| 1 | **Repo Agent** | `repo_url`, `github_token` | `repo_owner`, `repo_name`, `repo_branch`, `repo_structure`, `high_value_contents`, `application_overview` | GitHub API + LLM |
| 2 | **Tech Agent** | `high_value_contents`, `repo_structure` | `technology_stack` | LLM |
| 3 | **Dep Agent** | `high_value_contents`, `repo_structure` | `dependency_analysis` | LLM |
| 4 | **Infra Agent** | `high_value_contents`, `repo_structure` | `infrastructure_insights` | LLM |
| 5 | **Security Agent** | `high_value_contents`, `repo_structure` | `security_observability` | LLM |
| 6 | **Doc Agent** | `high_value_contents`, `repo_structure` | `doc_analysis` | LLM |
| 7 | **Arch Agent** | `high_value_contents`, `repo_structure` | `architecture_graph`, `architecture_observations` | LLM |
| 8 | **Telemetry Agent** | `high_value_contents`, `security_observability` | `telemetry_analysis` | LLM |
| 9 | **Schematic Agent** | `high_value_contents`, `dependency_analysis`, `doc_analysis` | `schematic_analysis` | LLM |
| 10 | **Report Agent** | All previous outputs | `report_payload` | None |
