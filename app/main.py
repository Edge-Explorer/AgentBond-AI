import os

# 1. Setup multi-process metrics directory env before importing prometheus
os.environ["prometheus_multiproc_dir"] = os.path.join(os.path.dirname(__file__), "..", "prometheus_multiproc_dir")

from fastapi import FastAPI, Response    # type: ignore
from fastapi.middleware.cors import CORSMiddleware     # type: ignore
from prometheus_client import CollectorRegistry, multiprocess, generate_latest, CONTENT_TYPE_LATEST
from app.api.routes import router as cases_router

app = FastAPI(
    title="Multi-Agent Investigator Engine",
    description="An agent orchestration runtime with shared context and verification.",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(cases_router)

# 2. Expose aggregate multi-process metrics endpoint
@app.get("/metrics/")
def metrics():
    registry = CollectorRegistry()
    multiprocess.MultiProcessCollector(registry)
    data = generate_latest(registry)
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "Multi-Agent Investigation Engine API Gateway",
        "version": "0.1.0"
    }