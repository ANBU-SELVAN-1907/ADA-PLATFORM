import os
import re
import base64
import logging
from typing import Dict, List, Any, Optional, Tuple
import httpx

logger = logging.getLogger("ADA.GitHubService")

# Files that carry the richest architectural signal — config/manifests only, NOT source code
HIGH_SIGNAL_FILENAMES = {
    "readme.md", "readme.rst", "readme.txt",
    "pyproject.toml", "setup.py", "setup.cfg",
    "requirements.txt", "requirements-dev.txt", "requirements_dev.txt",
    "package.json", "package-lock.json",
    "cargo.toml", "cargo.lock",
    "go.mod", "go.sum",
    "pom.xml", "build.gradle", "build.gradle.kts", "settings.gradle",
    "dockerfile", "docker-compose.yml", "docker-compose.yaml",
    "makefile", "gemfile", "composer.json",
    "tsconfig.json", "jsconfig.json",
    "vite.config.ts", "vite.config.js",
    "next.config.js", "next.config.ts", "next.config.mjs",
    "angular.json", "nuxt.config.ts",
    ".env.example", ".env.sample",
}

HIGH_SIGNAL_PATH_FRAGMENTS = [
    ".github/workflows/",
    ".github/actions/",
    "helm/", "charts/", "k8s/", "kubernetes/",
    "terraform/", "infra/", "deploy/",
    "ci/", "cd/", "pipeline/",
]


class GitHubService:
    def __init__(self, token: Optional[str] = None):
        raw_token = token or os.getenv("ADA_GITHUB_TOKEN", "")
        if raw_token in ["INITIAL_PLACEHOLDER", "placeholder", "None", "null", "undefined"]:
            raw_token = ""
        self.token = raw_token
        
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Enterprise-Application-Discovery-Agent"
        }
        if self.token:
            self.headers["Authorization"] = f"token {self.token}"


    @staticmethod
    def parse_url(repo_url: str) -> Tuple[str, str]:
        pattern = r"(?:https:\/\/github\.com\/|git@github\.com:)([^\/]+)\/([^\/\.]+)(?:\.git)?"
        match = re.search(pattern, repo_url)
        if not match:
            raise ValueError("Provided URL is not a valid GitHub repository resource.")
        return match.group(1), match.group(2)

    def _get_default_branch(self, owner: str, repo: str) -> str:
        url = f"https://api.github.com/repos/{owner}/{repo}"
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.get(url, headers=self.headers)
                if response.status_code != 200:
                    logger.error(f"Failed fetching metadata for {owner}/{repo}: {response.text[:200]}")
                    return "main"
                return response.json().get("default_branch", "main")
        except Exception as e:
            logger.error(f"Network exception getting default branch: {str(e)}")
            return "main"

    def _is_high_signal(self, path: str) -> bool:
        """Determine if a file path is a high-signal manifest/config worth fetching."""
        filename = path.split("/")[-1].lower()
        if filename in HIGH_SIGNAL_FILENAMES:
            return True
        # Match fragment patterns (e.g. .github/workflows/ci.yml)
        path_lower = path.lower()
        for fragment in HIGH_SIGNAL_PATH_FRAGMENTS:
            if fragment in path_lower:
                return True
        # Also catch: Dockerfile.prod, docker-compose.dev.yml, *.tf files
        if filename.startswith("dockerfile") or filename.endswith(".dockerfile"):
            return True
        if filename.endswith(".tf") or filename.endswith(".tfvars"):
            return True
        if filename.endswith(".yml") or filename.endswith(".yaml"):
            # Only workflow/ci yamls, not every yaml in the repo
            if any(k in path_lower for k in ["workflow", "pipeline", "ci", "cd", "github", "helm", "k8s", "deploy"]):
                return True
        return False

    def fetch_repository_structure(self, repo_url: str) -> Dict[str, Any]:
        owner, repo = self.parse_url(repo_url)
        branch = self._get_default_branch(owner, repo)

        url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"

        try:
            with httpx.Client(timeout=45.0) as client:
                response = client.get(url, headers=self.headers)
                if response.status_code != 200:
                    raise RuntimeError(f"GitHub API tree retrieval failed: {response.text[:300]}")
                tree_data = response.json()
        except Exception as e:
            raise RuntimeError(f"Failed connecting to GitHub API: {str(e)}")

        # Flat structure: path -> size string (what downstream consumers expect)
        flat_structure: Dict[str, str] = {}
        manifest_paths: List[str] = []

        for item in tree_data.get("tree", []):
            if item.get("type") == "blob":
                path = item.get("path", "")
                size = str(item.get("size", 0))
                flat_structure[path] = size

                if self._is_high_signal(path):
                    manifest_paths.append(path)

        logger.info(
            f"Scanned {len(flat_structure)} files in {owner}/{repo}@{branch}. "
            f"Found {len(manifest_paths)} high-signal manifest files."
        )

        return {
            "owner": owner,
            "repo": repo,
            "branch": branch,
            "total_files": len(flat_structure),
            "flat_structure": flat_structure,   # path -> size
            "manifest_files": manifest_paths
        }

    def fetch_raw_content(self, owner: str, repo: str, branch: str, path: str) -> str:
        """Fetch file content via raw.githubusercontent.com — fast, no rate limits for public repos."""
        url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
        try:
            with httpx.Client(timeout=20.0) as client:
                response = client.get(url)
                if response.status_code == 200:
                    return response.text
                logger.warning(f"raw.githubusercontent.com returned {response.status_code} for {path}")
                return ""
        except Exception as e:
            logger.error(f"Raw content fetch failed for {path}: {str(e)}")
            return ""

    def fetch_file_content(self, owner: str, repo: str, file_sha: str) -> str:
        """Fallback: fetch via blob SHA API (slower, rate-limited)."""
        url = f"https://api.github.com/repos/{owner}/{repo}/git/blobs/{file_sha}"
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.get(url, headers=self.headers)
                if response.status_code != 200:
                    logger.error(f"Failed to fetch blob SHA {file_sha}: {response.text[:200]}")
                    return ""
                payload = response.json()
                encoding = payload.get("encoding", "")
                content_raw = payload.get("content", "")
                if encoding == "base64":
                    clean_content = content_raw.replace("\n", "").replace("\r", "")
                    return base64.b64decode(clean_content).decode("utf-8", errors="ignore")
                return content_raw
        except Exception as e:
            logger.error(f"Network error parsing blob {file_sha}: {str(e)}")
            return ""
