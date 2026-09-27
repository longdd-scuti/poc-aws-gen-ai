import re
from typing import List, Tuple
from app.core.config import settings
from app.core.logging import logger
from app.schemas.chat import ChatMessage

MODEL_NAMES = {
    "amazon.nova-lite-v1:0": "Amazon Nova Lite",
    "amazon.nova-pro-v1:0": "Amazon Nova Pro",
    "amazon.nova-micro-v1:0": "Amazon Nova Micro",
    "anthropic.claude-3-5-haiku-20241022-v1:0": "Claude 3.5 Haiku",
    "anthropic.claude-3-5-sonnet-20241022-v2:0": "Claude 3.5 Sonnet",
}

COMPLEX_KEYWORDS = [
    r"\barchitect\b",
    r"\barchitecture\b",
    r"\bcode\b",
    r"\bcompare\b",
    r"\bcomparison\b",
    r"\brefactor\b",
    r"\banalyze\b",
    r"\banalysis\b",
    r"\btrade-off\b",
    r"\bresilient\b",
    r"\bdistributed\b",
    r"\bmicroservice\b",
    r"\bimplementation\b",
    r"\boptimize\b",
    r"\bperformance\b",
    r"\bsecurity\b",
]


def resolve_routing_strategy() -> str:
    """Resolves whether to run 'native' Prompt Router or 'heuristic' fallback."""
    mode = settings.routing_mode.lower()
    if mode == "auto":
        if settings.bedrock_prompt_router_arn:
            return "native"
        return "heuristic"
    return mode


def compute_heuristic_score(prompt: str) -> Tuple[int, List[str]]:
    """Calculates complexity score and reasoning triggers for heuristic routing."""
    score = 0
    reasons = []
    text_lower = prompt.lower()

    # Length-based complexity
    if len(prompt) > 400:
        score += 2
        reasons.append("Long detailed prompt (>400 chars)")
    elif len(prompt) > 150:
        score += 1
        reasons.append("Moderate prompt length (>150 chars)")

    # Keyword indicators
    matched_keywords = []
    for pattern in COMPLEX_KEYWORDS:
        if re.search(pattern, text_lower):
            matched_keywords.append(pattern.replace(r"\b", ""))

    if matched_keywords:
        keyword_score = min(len(matched_keywords), 3)
        score += keyword_score
        reasons.append(f"Technical keywords detected: {', '.join(matched_keywords[:4])}")

    # Structural complexity (multiple constraints, bullet points, numbers)
    if prompt.count("\n") >= 3 or ("1." in prompt and "2." in prompt):
        score += 1
        reasons.append("Multi-step / structured constraints")

    return score, reasons


def determine_heuristic_target(messages: List[ChatMessage]) -> Tuple[str, str, str]:
    """Returns (model_id, display_name, reason) using rule-based scoring."""
    last_prompt = messages[-1].content
    score, reasons = compute_heuristic_score(last_prompt)
    threshold = settings.router_heuristic_threshold

    if score >= threshold:
        model_id = settings.bedrock_smart_model_id
        display_name = get_display_model_name(model_id)
        reason = f"Score {score}>={threshold}: " + ("; ".join(reasons) if reasons else "Complex request")
        return model_id, display_name, reason
    else:
        model_id = settings.bedrock_fast_model_id
        display_name = get_display_model_name(model_id)
        reason = f"Score {score}<{threshold}: Straightforward query (optimized for low latency and cost)"
        return model_id, display_name, reason


def get_display_model_name(model_id_or_arn: str) -> str:
    """Normalizes raw model IDs or Bedrock ARNs to human-readable display names."""
    if not model_id_or_arn:
        return "Unknown Model"

    # Exact match
    if model_id_or_arn in MODEL_NAMES:
        return MODEL_NAMES[model_id_or_arn]

    # Partial substring check
    lower = model_id_or_arn.lower()
    if "nova-lite" in lower:
        return "Amazon Nova Lite"
    if "nova-pro" in lower:
        return "Amazon Nova Pro"
    if "nova-micro" in lower:
        return "Amazon Nova Micro"
    if "claude-3-5-haiku" in lower:
        return "Claude 3.5 Haiku"
    if "claude-3-5-sonnet" in lower:
        return "Claude 3.5 Sonnet"

    # Fallback to last segment of ARN/ID
    clean_id = model_id_or_arn.split("/")[-1] if "/" in model_id_or_arn else model_id_or_arn
    return clean_id
