from fastapi import FastAPI     # type: ignore
from fastapi.middleware.cors import CORSMiddleware      # type: ignore
from app.api.routes import router as cases_router

app= FastAPI(
    title= "Multi-Agent Investigator Engine",
    description= "An agent orchestration runtime with shared context and verification.",
    version= "0.1.0"
)
# Enable CORS for frontend/local development later
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials= True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(cases_router)

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "Multi-Agent Investigation Engine API Gateway",
        "version": "0.1.0"
    }