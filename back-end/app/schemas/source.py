from typing import Optional
from pydantic import BaseModel, Field


class RagSourceItem(BaseModel):
    id: int = Field(..., description="1-indexed numeric citation marker matching [n]")
    title: str = Field(..., description="Document filename or clean title")
    snippet: str = Field(..., description="Retrieved passage chunk")
    score: float = Field(..., description="Relative retrieval similarity score")
    page: Optional[int] = Field(default=None, description="Page number if available in metadata")
    documentId: Optional[str] = Field(default=None, description="Internal document identifier")
