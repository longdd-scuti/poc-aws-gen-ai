from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.router import api_router
from app.core.config import settings
from app.core.logging import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup verification
    logger.info("Starting AWS Bedrock Chat PoC API...")
    logger.info(f"Environment: {settings.app_env}")
    logger.info(f"AWS Region: {settings.aws_region}")
    logger.info(f"Routing Mode: {settings.routing_mode}")
    logger.info(f"Allowed CORS Origins: {settings.cors_origins_list}")

    try:
        settings.validate_runtime_mode()
    except Exception as e:
        logger.error(f"Startup configuration error: {e}")

    yield

    logger.info("Shutting down AWS Bedrock Chat PoC API...")


app = FastAPI(
    title="AWS Bedrock Chat PoC API",
    version="2.0.0",
    description="FastAPI Backend for AWS Bedrock Intelligent Prompt Routing and Knowledge Base RAG Chat",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred. Please verify backend logs.",
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
