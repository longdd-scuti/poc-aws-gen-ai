import uuid
from typing import Generator
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.core.config import settings
from app.core.logging import logger
from app.schemas.chat import ChatRequest
from app.schemas.events import RagSourcesData
from app.services.bedrock_chat import generate_rag_stream
from app.services.knowledge_base import retrieve_documents
from app.services.rag_prompt import build_rag_system_prompt
from app.streaming.sse import SSE_HEADERS, format_sse

router = APIRouter(prefix="/v1/chat/rag", tags=["Knowledge Base RAG"])


def _rag_composite_stream(request_id: str, request: ChatRequest) -> Generator[str, None, None]:
    """Composite generator that retrieves Knowledge Base sources, emits rag.sources,
    and then streams generated text with citations.
    """
    user_query = request.messages[-1].content

    # Step 1: Retrieve relevant sources from Knowledge Base
    sources = []
    try:
        sources = retrieve_documents(user_query)
    except Exception as e:
        logger.error(f"[{request_id}] Error during Knowledge Base retrieve: {e}", exc_info=True)
        # Proceed with empty sources to let model indicate insufficient data

    # Step 2: Yield rag.sources event BEFORE text streaming starts
    yield format_sse("rag.sources", RagSourcesData(sources=sources))

    # Step 3: Build grounded system prompt
    system_prompt = build_rag_system_prompt(sources)

    # Step 4: Stream Converse response
    rag_model = settings.bedrock_rag_model_id
    for chunk in generate_rag_stream(
        request_id=request_id,
        messages=request.messages,
        system_prompt=system_prompt,
        model_id=rag_model,
        retrieval_count=len(sources),
    ):
        yield chunk


@router.post("/stream")
def stream_rag_chat(request: ChatRequest):
    """Screen 2: Knowledge Base / RAG Chat with ConverseStream and source citations."""
    request_id = f"rag_{uuid.uuid4().hex[:12]}"
    logger.info(f"[{request_id}] Starting RAG stream for query: '{request.messages[-1].content[:50]}...'")

    return StreamingResponse(
        _rag_composite_stream(request_id, request),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )
