import time
from datetime import datetime, timezone
from typing import Generator, List, Optional
from app.core.aws_clients import get_bedrock_runtime_client
from app.core.config import settings
from app.core.logging import logger, log_request_metric
from app.schemas.chat import ChatMessage
from app.schemas.events import (
    MessageCompletedData,
    MessageDeltaData,
    RoutingCompletedData,
    StreamDoneData,
    StreamStartData,
)
from app.services.prompt_router import get_display_model_name
from app.streaming.sse import format_sse, map_exception_to_error_data


def format_converse_messages(messages: List[ChatMessage]) -> List[dict]:
    """Converts ChatMessage list into Boto3 Converse API expected schema:
    [{"role": "user"|"assistant", "content": [{"text": "..."}]}]
    """
    formatted = []
    for msg in messages:
        formatted.append({
            "role": msg.role,
            "content": [{"text": msg.content}],
        })
    return formatted


def generate_routing_stream(
    request_id: str,
    messages: List[ChatMessage],
    routing_mode: str,
    target_model_or_arn: str,
    heuristic_display_name: str = "",
    heuristic_reason: str = "",
) -> Generator[str, None, None]:
    """Synchronous generator for Screen 1 (Prompt Routing + ConverseStream).
    Runs within Starlette's threadpool to avoid blocking FastAPI's asyncio event loop.
    """
    start_time = time.perf_counter()
    created_at = datetime.now(timezone.utc).isoformat()
    bedrock = get_bedrock_runtime_client()

    # 1. Send stream.start
    yield format_sse("stream.start", StreamStartData(requestId=request_id, mode=routing_mode, createdAt=created_at))

    ttft_ms = 0.0
    sequence = 0
    input_tokens = 0
    output_tokens = 0
    model_latency_ms = 0.0
    routed_model_id = target_model_or_arn
    stream_obj = None

    try:
        converse_params = {
            "modelId": target_model_or_arn,
            "messages": format_converse_messages(messages),
            "inferenceConfig": {
                "temperature": settings.bedrock_temperature,
                "maxTokens": settings.bedrock_max_output_tokens,
            },
        }

        response = bedrock.converse_stream(**converse_params)
        stream_obj = response.get("stream")

        if stream_obj:
            for event in stream_obj:
                # Text delta chunk
                if "contentBlockDelta" in event:
                    delta = event["contentBlockDelta"].get("delta", {})
                    text_chunk = delta.get("text", "")
                    if text_chunk:
                        sequence += 1
                        if ttft_ms == 0.0:
                            ttft_ms = (time.perf_counter() - start_time) * 1000.0
                        yield format_sse("message.delta", MessageDeltaData(sequence=sequence, text=text_chunk))

                # Metadata event with usage, metrics, and trace
                elif "metadata" in event:
                    metadata = event["metadata"]
                    usage = metadata.get("usage", {})
                    input_tokens = usage.get("inputTokens", 0)
                    output_tokens = usage.get("outputTokens", 0)
                    metrics = metadata.get("metrics", {})
                    model_latency_ms = float(metrics.get("latencyMs", 0.0))

                    # Read actual routed model from Bedrock trace if available
                    trace = metadata.get("trace", {})
                    prompt_router_trace = trace.get("promptRouter", {})
                    invoked_id = prompt_router_trace.get("invokedModelId")
                    if invoked_id:
                        routed_model_id = invoked_id

        end_to_end_ms = (time.perf_counter() - start_time) * 1000.0
        routed_display_name = (
            heuristic_display_name
            if routing_mode == "heuristic" and heuristic_display_name
            else get_display_model_name(routed_model_id)
        )

        routing_data = RoutingCompletedData(
            routingMode=routing_mode,  # "native" or "heuristic"
            routedModelId=routed_model_id,
            routedModelName=routed_display_name,
            inputTokens=input_tokens,
            outputTokens=output_tokens,
            modelLatencyMs=round(model_latency_ms, 1),
            ttftMs=round(ttft_ms if ttft_ms > 0 else end_to_end_ms, 1),
            endToEndLatencyMs=round(end_to_end_ms, 1),
            routingReason=heuristic_reason if routing_mode == "heuristic" else "AWS Bedrock Intelligent Prompt Router selected model",
        )
        yield format_sse("routing.completed", routing_data)
        yield format_sse("stream.done", StreamDoneData(requestId=request_id))

        log_request_metric(
            request_id=request_id,
            endpoint="/v1/chat/routing/stream",
            routing_mode=routing_mode,
            routed_model_id=routed_model_id,
            status="success",
            ttft_ms=ttft_ms,
            model_latency_ms=model_latency_ms,
            end_to_end_latency_ms=end_to_end_ms,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
        )

    except Exception as exc:
        end_to_end_ms = (time.perf_counter() - start_time) * 1000.0
        error_data = map_exception_to_error_data(exc, request_id)
        logger.error(f"[{request_id}] Error in routing stream: {exc}", exc_info=True)
        yield format_sse("error", error_data)
        yield format_sse("stream.done", StreamDoneData(requestId=request_id))

        log_request_metric(
            request_id=request_id,
            endpoint="/v1/chat/routing/stream",
            routing_mode=routing_mode,
            routed_model_id=routed_model_id,
            status="error",
            ttft_ms=ttft_ms,
            model_latency_ms=model_latency_ms,
            end_to_end_latency_ms=end_to_end_ms,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            error_code=error_data.code,
        )
    finally:
        # Guarantee closure of stream if supported by boto3 EventStream
        if stream_obj is not None and hasattr(stream_obj, "close"):
            try:
                stream_obj.close()
            except Exception:
                pass


def generate_rag_stream(
    request_id: str,
    messages: List[ChatMessage],
    system_prompt: str,
    model_id: str,
    retrieval_count: int = 0,
) -> Generator[str, None, None]:
    """Synchronous generator for Screen 2 (Knowledge Base RAG Chat + ConverseStream)."""
    start_time = time.perf_counter()
    created_at = datetime.now(timezone.utc).isoformat()
    bedrock = get_bedrock_runtime_client()

    yield format_sse("stream.start", StreamStartData(requestId=request_id, mode="rag", createdAt=created_at))

    ttft_ms = 0.0
    sequence = 0
    input_tokens = 0
    output_tokens = 0
    model_latency_ms = 0.0
    stop_reason = "end_turn"
    stream_obj = None

    try:
        converse_params = {
            "modelId": model_id,
            "messages": format_converse_messages(messages),
            "system": [{"text": system_prompt}],
            "inferenceConfig": {
                "temperature": settings.bedrock_temperature,
                "maxTokens": settings.bedrock_max_output_tokens,
            },
        }

        response = bedrock.converse_stream(**converse_params)
        stream_obj = response.get("stream")

        if stream_obj:
            for event in stream_obj:
                if "contentBlockDelta" in event:
                    delta = event["contentBlockDelta"].get("delta", {})
                    text_chunk = delta.get("text", "")
                    if text_chunk:
                        sequence += 1
                        if ttft_ms == 0.0:
                            ttft_ms = (time.perf_counter() - start_time) * 1000.0
                        yield format_sse("message.delta", MessageDeltaData(sequence=sequence, text=text_chunk))

                elif "messageStop" in event:
                    stop_reason = event["messageStop"].get("stopReason", "end_turn")

                elif "metadata" in event:
                    metadata = event["metadata"]
                    usage = metadata.get("usage", {})
                    input_tokens = usage.get("inputTokens", 0)
                    output_tokens = usage.get("outputTokens", 0)
                    metrics = metadata.get("metrics", {})
                    model_latency_ms = float(metrics.get("latencyMs", 0.0))

        end_to_end_ms = (time.perf_counter() - start_time) * 1000.0

        yield format_sse(
            "message.completed",
            MessageCompletedData(
                inputTokens=input_tokens,
                outputTokens=output_tokens,
                modelLatencyMs=round(model_latency_ms, 1),
                ttftMs=round(ttft_ms if ttft_ms > 0 else end_to_end_ms, 1),
                endToEndLatencyMs=round(end_to_end_ms, 1),
                stopReason=stop_reason,
            ),
        )
        yield format_sse("stream.done", StreamDoneData(requestId=request_id))

        log_request_metric(
            request_id=request_id,
            endpoint="/v1/chat/rag/stream",
            routing_mode="rag",
            routed_model_id=model_id,
            status="success",
            ttft_ms=ttft_ms,
            model_latency_ms=model_latency_ms,
            end_to_end_latency_ms=end_to_end_ms,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            retrieval_count=retrieval_count,
        )

    except Exception as exc:
        end_to_end_ms = (time.perf_counter() - start_time) * 1000.0
        error_data = map_exception_to_error_data(exc, request_id)
        logger.error(f"[{request_id}] Error in RAG stream: {exc}", exc_info=True)
        yield format_sse("error", error_data)
        yield format_sse("stream.done", StreamDoneData(requestId=request_id))

        log_request_metric(
            request_id=request_id,
            endpoint="/v1/chat/rag/stream",
            routing_mode="rag",
            routed_model_id=model_id,
            status="error",
            ttft_ms=ttft_ms,
            model_latency_ms=model_latency_ms,
            end_to_end_latency_ms=end_to_end_ms,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            retrieval_count=retrieval_count,
            error_code=error_data.code,
        )
    finally:
        if stream_obj is not None and hasattr(stream_obj, "close"):
            try:
                stream_obj.close()
            except Exception:
                pass
