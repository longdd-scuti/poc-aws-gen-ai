import logging
import sys
from typing import Any, Dict


def setup_logging(level: int = logging.INFO) -> logging.Logger:
    logger = logging.getLogger("bedrock_poc")
    logger.setLevel(level)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(level)
        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger


logger = setup_logging()


def log_request_metric(
    request_id: str,
    endpoint: str,
    routing_mode: str,
    routed_model_id: str,
    status: str,
    ttft_ms: float = 0.0,
    model_latency_ms: float = 0.0,
    end_to_end_latency_ms: float = 0.0,
    input_tokens: int = 0,
    output_tokens: int = 0,
    retrieval_count: int = 0,
    error_code: str = "",
) -> None:
    """Log request telemetry metric in structured key=value format without sensitive body data."""
    parts = [
        f"request_id={request_id}",
        f"endpoint={endpoint}",
        f"routing_mode={routing_mode}",
        f"routed_model_id={routed_model_id}",
        f"status={status}",
        f"ttft_ms={ttft_ms:.1f}",
        f"model_latency_ms={model_latency_ms:.1f}",
        f"end_to_end_latency_ms={end_to_end_latency_ms:.1f}",
        f"input_tokens={input_tokens}",
        f"output_tokens={output_tokens}",
        f"retrieval_count={retrieval_count}",
    ]
    if error_code:
        parts.append(f"error_code={error_code}")

    logger.info(" ".join(parts))
