from typing import List, Optional
from app.core.aws_clients import get_bedrock_agent_runtime_client
from app.core.config import settings
from app.core.logging import logger
from app.schemas.source import RagSourceItem


def retrieve_documents(query: str, max_results: Optional[int] = None) -> List[RagSourceItem]:
    """Calls bedrock-agent-runtime.retrieve to fetch relevant source chunks from Knowledge Base."""
    kb_id = settings.bedrock_knowledge_base_id
    if not kb_id:
        logger.warning("BEDROCK_KNOWLEDGE_BASE_ID is not configured in .env. Returning empty sources.")
        return []

    count = max_results or settings.rag_number_of_results
    agent_client = get_bedrock_agent_runtime_client()

    logger.info(f"Retrieving from Knowledge Base: {kb_id}, query: '{query[:50]}...', maxResults: {count}")

    response = agent_client.retrieve(
        knowledgeBaseId=kb_id,
        retrievalQuery={"text": query},
        retrievalConfiguration={
            "vectorSearchConfiguration": {
                "numberOfResults": count
            }
        },
    )

    raw_results = response.get("retrievalResults", [])
    sources: List[RagSourceItem] = []
    seen_snippets = set()

    for item in raw_results:
        content_obj = item.get("content", {})
        raw_text = content_obj.get("text", "").strip()

        # Deduplicate identical chunks
        snippet_hash = raw_text[:100]
        if snippet_hash in seen_snippets:
            continue
        seen_snippets.add(snippet_hash)

        # Extract title from location metadata
        location = item.get("location", {})
        s3_loc = location.get("s3Location", {})
        s3_uri = s3_loc.get("uri", "")

        if s3_uri and "/" in s3_uri:
            title = s3_uri.split("/")[-1]
        elif s3_uri:
            title = s3_uri
        else:
            title = "Enterprise Document"

        # Extract optional page number from metadata
        metadata = item.get("metadata", {})
        page_num = None
        for key in ("page", "page_number", "pageNumber", "x-amz-bedrock-kb-document-page-number"):
            if key in metadata:
                try:
                    page_num = int(metadata[key])
                    break
                except (ValueError, TypeError):
                    pass

        raw_score = float(item.get("score", 0.0))
        doc_id = metadata.get("document_id") or metadata.get("source_id")

        sources.append(
            RagSourceItem(
                id=len(sources) + 1,
                title=title,
                snippet=raw_text,
                score=round(raw_score, 3),
                page=page_num,
                documentId=str(doc_id) if doc_id else None,
            )
        )

    return sources
