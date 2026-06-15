import os

# 1. Setup absolute path for multi-process metrics
metrics_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "prometheus_multiproc_dir"))
os.environ["PROMETHEUS_MULTIPROC_DIR"] = metrics_path

print("--- DIAGNOSTICS STARTUP ---")
print("PROMETHEUS_MULTIPROC_DIR set to:", os.environ.get("PROMETHEUS_MULTIPROC_DIR"))
print("Does directory exist?:", os.path.isdir(metrics_path))
print("----------------------------")

from fastapi import FastAPI, Response, Request  # type: ignore
from fastapi.middleware.cors import CORSMiddleware   # type: ignore
from prometheus_client import CollectorRegistry, multiprocess, generate_latest, CONTENT_TYPE_LATEST
from starlette.middleware.sessions import SessionMiddleware # type: ignore
from app.api.routes import router as cases_router
from app.api.auth import router as auth_router

app = FastAPI(
    title="Multi-Agent Investigator Engine",
    description="An agent orchestration runtime with shared context and verification.",
    version="0.1.0"
)

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET_KEY", "super-secret-session-key-for-oauth"),
    same_site="none",
    https_only=True
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
@app.middleware("http")
async def forward_proto_middleware(request: Request, call_next):
    # Trust Hugging Face reverse proxy protocol header
    proto = request.headers.get("x-forwarded-proto")
    if proto:
        request.scope["scheme"] = proto
    elif "localhost" not in request.url.host and "127.0.0.1" not in request.url.host:
        request.scope["scheme"] = "https"
    return await call_next(request)

app.include_router(cases_router)
app.include_router(auth_router)

# 2. Expose aggregate multi-process metrics endpoint
@app.get("/metrics/")
def metrics():
    print("--- DIAGNOSTICS REQUEST ---")
    print("PROMETHEUS_MULTIPROC_DIR in metrics request:", os.environ.get("PROMETHEUS_MULTIPROC_DIR"))
    print("Is it a directory?:", os.path.isdir(os.environ.get("PROMETHEUS_MULTIPROC_DIR", "")))
    print("----------------------------")
    
    registry = CollectorRegistry()
    # Explicitly pass the path parameter to bypass the default env lookup
    multiprocess.MultiProcessCollector(registry, path=metrics_path)
    
    data = generate_latest(registry)
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "Multi-Agent Investigation Engine API Gateway",
        "version": "0.1.0"
    }