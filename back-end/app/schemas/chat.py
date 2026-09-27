from typing import List, Literal
from pydantic import BaseModel, Field, field_validator


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=8000)

    @field_validator("content")
    @classmethod
    def validate_content_not_blank(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Message content cannot be blank or whitespace-only.")
        return trimmed


class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., min_length=1, max_length=20)

    @field_validator("messages")
    @classmethod
    def validate_conversation(cls, messages: List[ChatMessage]) -> List[ChatMessage]:
        if not messages:
            raise ValueError("Messages list cannot be empty.")
        if messages[-1].role != "user":
            raise ValueError("The last message must be from the 'user'.")

        total_chars = sum(len(m.content) for m in messages)
        if total_chars > 32000:
            raise ValueError(f"Total conversation length exceeds 32,000 characters limit (got {total_chars}).")

        return messages
