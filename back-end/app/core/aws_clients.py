from typing import Optional
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


def get_bedrock_runtime_client():
    global _bedrock_runtime_client
    if _bedrock_runtime_client is None:
        logger.info(f"Initializing bedrock-runtime client for region: {settings.aws_region}")
        _bedrock_runtime_client = boto3.client(
            "bedrock-runtime",
            region_name=settings.aws_region,
            config=_boto_config,
        )
    return _bedrock_runtime_client


def get_bedrock_agent_runtime_client():
    global _bedrock_agent_runtime_client
    if _bedrock_agent_runtime_client is None:
        logger.info(f"Initializing bedrock-agent-runtime client for region: {settings.aws_region}")
        _bedrock_agent_runtime_client = boto3.client(
            "bedrock-agent-runtime",
            region_name=settings.aws_region,
            config=_boto_config,
        )
    return _bedrock_agent_runtime_client


def set_bedrock_runtime_client_mock(mock_client):
    """Allows test suites to inject stubbed/mocked client."""
    global _bedrock_runtime_client
    _bedrock_runtime_client = mock_client


def set_bedrock_agent_runtime_client_mock(mock_client):
    """Allows test suites to inject stubbed/mocked client."""
    global _bedrock_agent_runtime_client
    _bedrock_agent_runtime_client = mock_client
