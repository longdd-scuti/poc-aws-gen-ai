from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from app.schemas.source import RagSourceItem


class StreamStartData(BaseModel):
    requestId: str
    mode: str
    createdAt: str


class RagSourcesData(BaseModel):
    sources: List[RagSourceItem]


class MessageDeltaData(BaseModel):
    sequence: int
    text: str


class RoutingCompletedData(BaseModel):
    routingMode: Literal["native", "heuristic"]
    routedModelId: str
    routedModelName: str
    inputTokens: int
    outputTokens: int
    modelLatencyMs: float
    ttftMs: float
    endToEndLatencyMs: float
    routingReason: Optional[str] = None


class MessageCompletedData(BaseModel):
    inputTokens: int
    outputTokens: int
    modelLatencyMs: float
    ttftMs: float
    endToEndLatencyMs: float
    stopReason: str


class StreamErrorData(BaseModel):
    code: str
    message: str
    retryable: bool
    requestId: str


class StreamDoneData(BaseModel):
    requestId: str
