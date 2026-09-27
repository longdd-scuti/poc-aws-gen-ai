import uuid
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from app.core.config import settings
from app.core.logging import logger
from app.schemas.chat import ChatRequest
from app.services.bedrock_chat import generate_routing_stream
from app.services.prompt_router import determine_heuristic_target, resolve_routing_strategy
from app.streaming.sse import SSE_HEADERS

router = APIRouter(prefix="/v1/chat/routing", tags=["Routing"])


@router.post("/stream")
def stream_routing_chat(request: ChatRequest):
    """Screen 1: Streams response using Bedrock Prompt Router or fallback heuristic."""
    request_id = f"req_{uuid.uuid4().hex[:12]}"
    mode = resolve_routing_strategy()

    target_model_or_arn = ""
    heuristic_display_name = ""
    heuristic_reason = ""

    if mode == "native":
        if not settings.bedrock_prompt_router_arn:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Native routing mode is configured but BEDROCK_PROMPT_ROUTER_ARN is empty.",
            )
        target_model_or_arn = settings.bedrock_prompt_router_arn
    else:
        # Heuristic mode
        target_model_or_arn, heuristic_display_name, heuristic_reason = determine_heuristic_target(request.messages)

    logger.info(
        f"[{request_id}] Starting routing stream. Mode: {mode}, Target: {target_model_or_arn}, Messages: {len(request.messages)}"
    )

    stream_gen = generate_routing_stream(
        request_id=request_id,
        messages=request.messages,
        routing_mode=mode,
        target_model_or_arn=target_model_or_arn,
        heuristic_display_name=heuristic_display_name,
        heuristic_reason=heuristic_reason,
    )

    return StreamingResponse(
        stream_gen,
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )
