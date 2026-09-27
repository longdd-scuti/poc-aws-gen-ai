import boto3
from fastapi import APIRouter, Response, status
from app.core.config import settings
from app.core.logging import logger

router = APIRouter(tags=["Health"])


@router.get("/healthz", status_code=status.HTTP_200_OK)
def liveness():
    """Liveness probe: returns 200 immediately without external calls."""
    return {"status": "ok"}


@router.get("/readyz")
def readiness(response: Response):
    """Readiness probe: checks configuration and lightweight credential resolution
    without invoking any Bedrock inference models or leaking sensitive ARNs.
    """
    ready = True
    checks = {
        "region_configured": bool(settings.aws_region),
        "routing_mode": settings.routing_mode,
        "credentials_available": False,
        "knowledge_base_configured": bool(settings.bedrock_knowledge_base_id),
    }

    # Lightweight credential check using botocore session
    try:
        session = boto3.Session(region_name=settings.aws_region)
        creds = session.get_credentials()
        if creds is not None:
            checks["credentials_available"] = True
    except Exception as e:
        logger.warning(f"Readiness credential check warning: {e}")
        checks["credentials_available"] = False

    # Check routing requirements
    if settings.routing_mode == "native" and not settings.bedrock_prompt_router_arn:
        checks["routing_valid"] = False
        ready = False
    else:
        checks["routing_valid"] = True

    if not ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "ready" if ready else "not_ready",
        "checks": checks,
    }
