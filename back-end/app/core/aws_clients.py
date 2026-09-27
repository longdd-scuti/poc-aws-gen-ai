from typing import Optional, Dict, Any
import boto3
from botocore.config import Config
from app.core.config import settings
from app.core.logging import logger

# Boto3 client configuration with timeout and retry settings
_boto_config = Config(
    region_name=settings.aws_region,
    retries={"max_attempts": 2, "mode": "standard"},
    connect_timeout=5,
    read_timeout=60,
)

_bedrock_runtime_client = None
_bedrock_agent_runtime_client = None


def get_boto3_session() -> boto3.Session:
    """Creates a Boto3 Session using AWS_PROFILE (e.g. from aws sso login)
    or static keys from .env, falling back to default credential provider chain.
    """
    session_kwargs: Dict[str, Any] = {"region_name": settings.aws_region}

    # 1. If using AWS SSO or named profile
    if settings.aws_profile:
        logger.info(f"Using AWS Profile: {settings.aws_profile}")
        session_kwargs["profile_name"] = settings.aws_profile

    # 2. If using explicit access keys from .env
    elif settings.aws_access_key_id and settings.aws_secret_access_key:
        session_kwargs["aws_access_key_id"] = settings.aws_access_key_id
        session_kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
        if settings.aws_session_token:
            session_kwargs["aws_session_token"] = settings.aws_session_token

    return boto3.Session(**session_kwargs)


def get_bedrock_runtime_client():
    global _bedrock_runtime_client
    if _bedrock_runtime_client is None:
        logger.info(f"Initializing bedrock-runtime client for region: {settings.aws_region}")
        session = get_boto3_session()
        _bedrock_runtime_client = session.client("bedrock-runtime", config=_boto_config)
    return _bedrock_runtime_client


def get_bedrock_agent_runtime_client():
    global _bedrock_agent_runtime_client
    if _bedrock_agent_runtime_client is None:
        logger.info(f"Initializing bedrock-agent-runtime client for region: {settings.aws_region}")
        session = get_boto3_session()
        _bedrock_agent_runtime_client = session.client("bedrock-agent-runtime", config=_boto_config)
    return _bedrock_agent_runtime_client


def set_bedrock_runtime_client_mock(mock_client):
    """Allows test suites to inject stubbed/mocked client."""
    global _bedrock_runtime_client
    _bedrock_runtime_client = mock_client


def set_bedrock_agent_runtime_client_mock(mock_client):
    """Allows test suites to inject stubbed/mocked client."""
    global _bedrock_agent_runtime_client
    _bedrock_agent_runtime_client = mock_client
