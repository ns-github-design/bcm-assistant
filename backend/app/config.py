from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mode: str = "mock"  # "mock" or "live"

    # Azure (live mode)
    azure_tenant_id: str = ""
    azure_client_id: str = ""
    azure_client_secret: str = ""

    # GitHub Copilot SDK — auth is handled by the Copilot CLI.
    # Set COPILOT_GITHUB_TOKEN or run `copilot auth login`.
    copilot_github_token: str = ""

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list[str] = ["http://localhost:5173"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
