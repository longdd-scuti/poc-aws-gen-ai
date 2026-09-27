import json
from typing import Any, Tuple
from botocore.exceptions import ClientError
from app.schemas.events import StreamErrorData

SSE_HEADERS = {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
    "Connection": "keep-alive",
}


def format_sse(event_name: str, data: Any) -> str:
    """Formats an event name and arbitrary data into standard SSE wire format.
    Every event must have single-line JSON data and end with two newlines.
    """
    if hasattr(data, "model_dump_json"):
        json_str = data.model_dump_json()
    elif isinstance(data, (dict, list)):
        json_str = json.dumps(data, ensure_ascii=False)
    else:
        json_str = json.dumps({"value": str(data)}, ensure_ascii=False)

    return f"event: {event_name}\ndata: {json_str}\n\n"


def map_exception_to_error_data(exc: Exception, request_id: str) -> StreamErrorData:
    """Maps internal and AWS exceptions to safe, stable client error codes."""
    if isinstance(exc, ClientError):
        error_code = exc.response.get("Error", {}).get("Code", "ClientError")
        raw_msg = exc.response.get("Error", {}).get("Message", str(exc))

        if error_code in ("AccessDeniedException", "UnauthorizedException"):
            return StreamErrorData(
                code="BEDROCK_ACCESS_DENIED",
                message="Access denied to AWS Bedrock. Please verify AWS credentials, IAM permissions, and Bedrock model access.",
                retryable=False,
                requestId=request_id,
            )
        elif error_code in ("ValidationException", "InvalidParameterException"):
            return StreamErrorData(
                code="INVALID_BEDROCK_REQUEST",
                message=f"Invalid request parameters for Bedrock: {raw_msg}",
                retryable=False,
                requestId=request_id,
            )
        elif error_code in ("ResourceNotFoundException", "ModelNotReadyException"):
            return StreamErrorData(
                code="BEDROCK_RESOURCE_NOT_FOUND",
                message="The requested Bedrock model, router, or knowledge base could not be found.",
                retryable=False,
                requestId=request_id,
            )
        elif error_code in ("ThrottlingException", "TooManyRequestsException"):
            return StreamErrorData(
                code="BEDROCK_THROTTLED",
                message="Bedrock request was throttled due to account rate limits. Please retry shortly.",
                retryable=True,
                requestId=request_id,
            )
        elif error_code in ("ServiceUnavailableException", "InternalServerException", "ModelTimeoutException"):
            return StreamErrorData(
                code="BEDROCK_UNAVAILABLE",
                message="AWS Bedrock service is temporarily unavailable. Please retry.",
                retryable=True,
                requestId=request_id,
            )

    return StreamErrorData(
        code="INTERNAL_ERROR",
        message="An unexpected server error occurred while processing the request.",
        retryable=False,
        requestId=request_id,
    )
