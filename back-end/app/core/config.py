import os
from typing import List, Literal, Optional
from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Ensure .env is explicitly loaded into environment
_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
load_dotenv(_env_path)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_env_path,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Environment & Security
    app_env: str = Field(default="development", alias="APP_ENV")
    app_cors_origins: str = Field(default="http://localhost:3000", alias="APP_CORS_ORIGINS")
    aws_region: str = Field(default="us-east-1", alias="AWS_REGION")
    allowed_client_ips: str = Field(default="", alias="ALLOWED_CLIENT_IPS")

    # AWS Credentials (optional, fallback to default AWS credentials chain if not set)
    aws_access_key_id: Optional[str] = Field(default=None, alias="AWS_ACCESS_KEY_ID")
    aws_secret_access_key: Optional[str] = Field(default=None, alias="AWS_SECRET_ACCESS_KEY")
    aws_session_token: Optional[str] = Field(default=None, alias="AWS_SESSION_TOKEN")
    aws_profile: Optional[str] = Field(default=None, alias="AWS_PROFILE")

    # Routing Configuration (Screen 1)
    routing_mode: Literal["auto", "native", "heuristic"] = Field(default="auto", alias="ROUTING_MODE")
    bedrock_prompt_router_arn: str = Field(default="", alias="BEDROCK_PROMPT_ROUTER_ARN")
    bedrock_fast_model_id: str = Field(default="amazon.nova-lite-v1:0", alias="BEDROCK_FAST_MODEL_ID")
    bedrock_smart_model_id: str = Field(default="amazon.nova-pro-v1:0", alias="BEDROCK_SMART_MODEL_ID")
    router_heuristic_threshold: int = Field(default=3, alias="ROUTER_HEURISTIC_THRESHOLD")

    # Knowledge Base RAG Configuration (Screen 2)
    bedrock_knowledge_base_id: str = Field(default="", alias="BEDROCK_KNOWLEDGE_BASE_ID")
    bedrock_rag_model_id: str = Field(default="amazon.nova-lite-v1:0", alias="BEDROCK_RAG_MODEL_ID")
    bedrock_max_output_tokens: int = Field(default=1024, alias="BEDROCK_MAX_OUTPUT_TOKENS")
    bedrock_temperature: float = Field(default=0.2, alias="BEDROCK_TEMPERATURE")
    rag_number_of_results: int = Field(default=4, alias="RAG_NUMBER_OF_RESULTS")
    rag_max_context_chars: int = Field(default=24000, alias="RAG_MAX_CONTEXT_CHARS")

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.app_cors_origins:
            return ["http://localhost:3000"]
        return [origin.strip() for origin in self.app_cors_origins.split(",") if origin.strip()]

    @property
    def allowed_ips_list(self) -> List[str]:
        if not self.allowed_client_ips:
            return []
        return [ip.strip() for ip in self.allowed_client_ips.split(",") if ip.strip()]

    def validate_runtime_mode(self) -> None:
        """Fail-fast check on startup if strict native mode is configured without ARN."""
        if self.routing_mode == "native" and not self.bedrock_prompt_router_arn:
            raise ValueError(
                "ROUTING_MODE is set to 'native' but BEDROCK_PROMPT_ROUTER_ARN is empty. "
                "Please set BEDROCK_PROMPT_ROUTER_ARN in .env or switch ROUTING_MODE to 'auto' or 'heuristic'."
            )


# Global settings instance
settings = Settings()
