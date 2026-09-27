import pytest
from pydantic import ValidationError
from app.schemas.chat import ChatMessage, ChatRequest
from app.schemas.source import RagSourceItem
from app.services.bedrock_chat import format_converse_messages
from app.services.prompt_router import (
    compute_heuristic_score,
    determine_heuristic_target,
    get_display_model_name,
)
from app.services.rag_prompt import build_rag_system_prompt, escape_xml
from app.streaming.sse import format_sse


def test_chat_message_validation():
    # Valid message
    msg = ChatMessage(role="user", content="Hello Bedrock")
    assert msg.content == "Hello Bedrock"

    # Blank content should fail
    with pytest.raises(ValidationError):
        ChatMessage(role="user", content="   ")


def test_chat_request_validation():
    # Valid request
    req = ChatRequest(messages=[ChatMessage(role="user", content="What is S3?")])
    assert len(req.messages) == 1

    # Empty list fails
    with pytest.raises(ValidationError):
        ChatRequest(messages=[])

    # Last message must be user
    with pytest.raises(ValidationError):
        ChatRequest(
            messages=[
                ChatMessage(role="user", content="Hi"),
                ChatMessage(role="assistant", content="Hello"),
            ]
        )


def test_format_converse_messages():
    messages = [
        ChatMessage(role="user", content="What is S3?"),
        ChatMessage(role="assistant", content="S3 is storage."),
        ChatMessage(role="user", content="How much does it cost?"),
    ]
    formatted = format_converse_messages(messages)
    assert len(formatted) == 3
    assert formatted[0] == {"role": "user", "content": [{"text": "What is S3?"}]}
    assert formatted[1] == {"role": "assistant", "content": [{"text": "S3 is storage."}]}
    assert formatted[2] == {"role": "user", "content": [{"text": "How much does it cost?"}]}


def test_heuristic_scoring():
    # Simple prompt
    simple_prompt = "What is Amazon S3?"
    simple_score, _ = compute_heuristic_score(simple_prompt)
    assert simple_score < 3

    # Complex prompt
    complex_prompt = (
        "Design a resilient, distributed event-driven architecture on AWS using DynamoDB, "
        "Lambda, and SQS. Compare single-table vs multi-table trade-offs and optimize for high throughput."
    )
    complex_score, reasons = compute_heuristic_score(complex_prompt)
    assert complex_score >= 3
    assert any("architect" in r.lower() or "compare" in r.lower() or "technical" in r.lower() for r in reasons)


def test_determine_heuristic_target():
    simple_req = [ChatMessage(role="user", content="What is Amazon S3?")]
    target_id, display_name, reason = determine_heuristic_target(simple_req)
    assert "lite" in target_id.lower() or "haiku" in target_id.lower()

    complex_req = [
        ChatMessage(
            role="user",
            content="Please write code to architect and compare distributed microservice patterns with trade-off analysis.",
        )
    ]
    target_id, display_name, reason = determine_heuristic_target(complex_req)
    assert "pro" in target_id.lower() or "sonnet" in target_id.lower()


def test_model_display_names():
    assert get_display_model_name("amazon.nova-lite-v1:0") == "Amazon Nova Lite"
    assert get_display_model_name("amazon.nova-pro-v1:0") == "Amazon Nova Pro"
    assert "Nova Lite" in get_display_model_name("arn:aws:bedrock:us-east-1:123:foundation-model/amazon.nova-lite-v1:0")


def test_rag_prompt_construction():
    sources = [
        RagSourceItem(
            id=1,
            title="Quy_che_2025.pdf",
            snippet="Nhân viên được nghỉ 12 ngày phép hàng năm.",
            score=0.94,
            page=14,
        ),
        RagSourceItem(
            id=2,
            title="Cong_tac_phi.docx",
            snippet="Hóa đơn công tác phí phải nộp trong vòng 7 ngày.",
            score=0.88,
        ),
    ]

    prompt = build_rag_system_prompt(sources)
    assert '<source id="1" title="Quy_che_2025.pdf">' in prompt
    assert '<source id="2" title="Cong_tac_phi.docx">' in prompt
    assert "[n]" in prompt
    assert "SOURCES:" in prompt


def test_escape_xml():
    raw = '<script>alert("xss")</script> & "quote"'
    escaped = escape_xml(raw)
    assert "<script>" not in escaped
    assert "&lt;script&gt;" in escaped


def test_format_sse():
    formatted = format_sse("message.delta", {"sequence": 1, "text": "Hello"})
    assert formatted == 'event: message.delta\ndata: {"sequence": 1, "text": "Hello"}\n\n'
