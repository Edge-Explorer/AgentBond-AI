---
title: AgentBond API
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# AgentBond AI — Multi-Agent Investigator Engine

A production-grade, full-stack multi-agent system that accepts an open-ended problem statement, decomposes it into structured hypotheses, investigates each hypothesis against live web data, and verifies the findings for hallucination and context drift.

The investigation use-case is the demonstration surface. The architecture beneath it is a general-purpose, asynchronous agent orchestration runtime.

- **Live Frontend:** [agent-bond-ai.vercel.app](https://agent-bond-ai.vercel.app)
- **Live Backend API:** [karan6124-agentbond-api.hf.space](https://karan6124-agentbond-api.hf.space)
- **API Documentation:** [karan6124-agentbond-api.hf.space/docs](https://karan6124-agentbond-api.hf.space/docs)

---

## Table of Contents

1. [What This Is](#1-what-this-is)
2. [System Architecture](#2-system-architecture)
3. [Agent Roles](#3-agent-roles)
4. [Shared Context Store](#4-shared-context-store)
5. [Authentication System](#5-authentication-system)
6. [Observability Stack](#6-observability-stack)
7. [Project Structure](#7-project-structure)
8. [Tech Stack](#8-tech-stack)
9. [Production Deployment](#9-production-deployment)
10. [Local Development Setup](#10-local-development-setup)
11. [Environment Variables](#11-environment-variables)
12. [Design Decisions](#12-design-decisions)

---

## 1. What This Is

AgentBond AI is not a chatbot wrapper. It is an agent orchestration system with the following properties:

- Structured inter-agent communication via a shared context store that is authoritative for the entire investigation session.
- Asynchronous task execution using Celery workers backed by Upstash Redis as the message broker in production.
- A Verifier Agent that independently scores each piece of investigator output for hallucination and context alignment before the result is committed.
- Full observability via Prometheus multi-process metrics exported from the FastAPI backend and visualized in Grafana dashboards.
- Google OAuth 2.0 authentication with a JWT-secured API, supporting both email/password registration and Google Sign-In.
- A React frontend deployed to Vercel, communicating securely with the backend on Hugging Face Spaces via a Vite environment variable.

---

## 2. System Architecture

```
Browser (Vercel — agent-bond-ai.vercel.app)
    |
    | HTTPS REST + JWT
    |
FastAPI API Gateway (Hugging Face Spaces — karan6124-agentbond-api.hf.space)
    |
    |--- Google OAuth 2.0 (accounts.google.com)
    |--- JWT Authentication Middleware
    |
Case Manager Agent  (Google Gemini 2.5 Flash)
    |
    | Celery Task Dispatch
    |
Upstash Redis (Message Broker + Result Backend)
    |
Investigator Agents  (parallel Celery workers)
    |
Shared Context Store  (PostgreSQL via Neon — per-case authoritative state)
    |
Verifier Agent  (hallucination and context drift scoring)
    |
Prometheus Metrics Exporter  (/metrics/ endpoint)
    |
Local Grafana  (scraping production HF Space over HTTPS)
```

---

## 3. Agent Roles

### Case Manager Agent

Receives the raw problem statement from the user and decomposes it into a structured set of investigable hypotheses. Each hypothesis represents a discrete, testable claim that downstream investigators can act on.

**Input:**
```
"Why are Nvidia's stock gains decelerating in Q2 2025?"
```

**Output:**
```json
{
  "hypotheses": [
    "Increased competition from AMD and Intel in the data center GPU segment",
    "Slowdown in hyperscaler capital expenditure growth",
    "Export control restrictions limiting China revenue",
    "Market saturation in the consumer GPU segment"
  ]
}
```

---

### Investigator Agent

Receives a single hypothesis and executes a structured web search using DuckDuckGo. It retrieves relevant evidence, summarises the findings, and writes the result back to the shared context store.

Investigators run as asynchronous Celery tasks, allowing multiple hypotheses to be investigated concurrently within the constraints of the worker pool.

---

### Verifier Agent

The most critical component of the system. After each investigator reports a finding, the Verifier Agent independently evaluates the output for:

- **Context alignment:** Did the agent stay within the defined scope of the investigation?
- **Hallucination detection:** Are the claims grounded in the retrieved evidence, or are they fabricated?
- **Confidence scoring:** A numeric confidence value between 0.0 and 1.0.

**Output:**
```json
{
  "verdict": "SUPPORTED",
  "confidence": 0.84,
  "reason": "The retrieved evidence from three independent sources confirms a 15% decline in China-region GPU export approvals under the updated BIS regulations."
}
```

---

## 4. Shared Context Store

All agents read from and write to a single authoritative context object scoped to each investigation case. This prevents the context drift that occurs in multi-agent systems where individual agents maintain separate memory representations of the same problem.

**Context schema:**
```json
{
  "case_id": "cec768e8d57e4b7db5ed9a8248f65fd4",
  "problem": "Why are Nvidia's stock gains decelerating in Q2 2025?",
  "constraints": ["Focus on macroeconomic and regulatory factors only"],
  "facts": [],
  "hypotheses": [],
  "evidence": [],
  "verifications": []
}
```

The context is persisted in PostgreSQL (Neon, production) and updated transactionally after each agent writes a result. All agents receive the full current state of the context before executing, ensuring coherent multi-step reasoning.

---

## 5. Authentication System

AgentBond AI uses a dual-mode authentication system:

### Email and Password

Standard registration and login backed by bcrypt password hashing. Successful authentication returns a signed JWT token with a 7-day expiry. The token is stored in `localStorage` on the frontend and attached to every API request in the `Authorization: Bearer` header.

### Google OAuth 2.0

Login with Google is initiated via a popup window opened by the React frontend. The flow is:

1. The popup navigates to `/api/auth/google` on the backend.
2. The backend redirects to Google's authorization endpoint with a PKCE-style state value stored in the Starlette session.
3. Google redirects to `/api/auth/google/callback` with an authorization code.
4. The backend exchanges the code for tokens using the Google OAuth 2.0 token endpoint.
5. User profile data is retrieved from Google's userinfo API.
6. A JWT is generated and returned to the frontend via `window.postMessage`.
7. The popup closes automatically and the main window completes the login.

**Cross-Domain Cookie Handling:** Because the frontend is on `vercel.app` and the backend is on `hf.space`, and because `hf.space` is on the [Public Suffix List](https://publicsuffix.org/), modern browsers isolate session cookies between these origins. A fallback mechanism in the callback handler reconstructs the session state from the URL query parameters before Authlib validates it, resolving the `mismatching_state` error that occurs in cross-domain OAuth flows.

---

## 6. Observability Stack

### Prometheus

The FastAPI backend exposes a `/metrics/` endpoint compatible with the Prometheus exposition format. Because the container runs two processes (FastAPI and Celery) under `supervisord`, the `prometheus_client` library is configured in multi-process mode. Metric files are written to `/code/prometheus_multiproc_dir` (created automatically on startup) and aggregated at scrape time.

The following custom metrics are tracked:

| Metric | Type | Description |
|---|---|---|
| `llm_tokens_input_total` | Counter | Total input tokens consumed across all LLM calls |
| `llm_tokens_output_total` | Counter | Total output tokens generated across all LLM calls |
| `agent_latency_seconds` | Histogram | End-to-end latency per agent type |
| `agent_runs_total` | Counter | Total agent invocations by type and outcome |

### Grafana

A local Grafana instance connects to the production backend over HTTPS. The Prometheus scrape target in `prometheus.yml` is configured as:

```yaml
scrape_configs:
  - job_name: "agent-engine-api"
    metrics_path: "/metrics/"
    scheme: "https"
    static_configs:
      - targets: ["karan6124-agentbond-api.hf.space"]
```

Dashboards available in the `AgentBond Analytics` folder at `http://localhost:3000`:

- **LLM Token Consumption Rate** — input and output token throughput over time (tokens/second)
- **Average Agent Latency** — rolling average latency per agent type in seconds

---

## 7. Project Structure

```
AgentBond-AI/
|
├── app/
│   ├── api/
│   │   ├── routes.py              # Case and hypothesis REST endpoints
│   │   └── auth.py                # Google OAuth + JWT authentication routes
│   |
│   ├── agents/
│   │   ├── case_manager.py        # Decomposes problem into hypotheses via Gemini
│   │   ├── investigator.py        # Investigates a single hypothesis via web search
│   │   └── verifier.py            # Scores investigator output for hallucination
│   |
│   ├── services/
│   │   ├── llm.py                 # Gemini API client abstraction
│   │   ├── database.py            # SQLAlchemy session factory and engine
│   │   └── context_manager.py     # Shared context read/write operations
│   |
│   ├── workers/
│   │   └── celery_worker.py       # Celery app configuration and task definitions
│   |
│   ├── observability/
│   │   └── metrics.py             # Prometheus metric definitions
│   |
│   ├── models/
│   │   ├── schemas.py             # Pydantic models for all API data contracts
│   │   └── database_models.py     # SQLAlchemy ORM models
│   |
│   └── main.py                    # FastAPI application entry point, middleware, metrics
|
├── frontend/
│   ├── public/
│   │   └── favicon.svg            # Custom AgentBond investigator emblem
│   ├── src/
│   │   ├── components/            # Navbar, AuthModal, ConfirmModal, UI components
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # JWT state, Google OAuth popup flow
│   │   ├── sections/              # WorkspaceSection, LandingSection
│   │   └── main.jsx               # React application entry point
│   ├── index.html                 # Page title and font imports
│   └── vite.config.js             # Vite build configuration
|
├── alembic/                       # Database migration scripts
├── tests/                         # Unit tests for agents and context manager
├── Dockerfile                     # Production container image definition
├── supervisord.conf               # Process manager: FastAPI + Celery in one container
├── docker-compose.yml             # Local infrastructure: Redis, Prometheus
├── prometheus.yml                 # Prometheus scrape configuration
├── pyproject.toml                 # Python project metadata and dependencies
└── .env.example                   # Environment variable template
```

---

## 8. Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 with Vite |
| Frontend Hosting | Vercel |
| API Framework | FastAPI |
| Task Queue | Celery 5 |
| Message Broker (Production) | Upstash Redis (TLS) |
| Message Broker (Local) | Redis 7 via Docker |
| Database | PostgreSQL via Neon (serverless, production) |
| ORM | SQLAlchemy 2 with psycopg2 |
| Data Validation | Pydantic v2 |
| LLM Provider | Google Gemini 2.5 Flash |
| OAuth Library | Authlib (Starlette integration) |
| Authentication | JWT (python-jose) + bcrypt |
| Metrics | Prometheus Client (multi-process mode) |
| Dashboards | Grafana |
| Container Runtime | Docker |
| Process Manager | Supervisord |
| Backend Hosting | Hugging Face Spaces (Docker SDK) |
| Package Manager | uv |
| Migrations | Alembic |

No LangChain or agent framework dependency. Orchestration, context propagation, and inter-agent communication are implemented directly.

---

## 9. Production Deployment

The production system uses two separate hosting platforms connected via environment variables.

### Backend — Hugging Face Spaces

The backend runs as a Docker container on a Hugging Face Space at [karan6124-agentbond-api.hf.space](https://karan6124-agentbond-api.hf.space).

The `Dockerfile` produces a `python:3.12-slim` image that installs all Python dependencies, copies the application code, creates the Prometheus metrics directory, and boots `supervisord` as PID 1.

`supervisord` manages two concurrent processes inside the single container:

- `uvicorn app.main:app --host 0.0.0.0 --port 7860` — the FastAPI web server on the port Hugging Face exposes publicly.
- `celery -A app.workers.celery_worker worker --loglevel=info --concurrency=2` — the Celery task worker connected to Upstash Redis.

All secrets (database credentials, Redis URL, Google OAuth credentials, Gemini API key, JWT secret) are configured as **Secrets** under the Space's **Settings** tab, never in the committed codebase.

To deploy a new version of the backend:

```bash
git push hf main
```

Hugging Face automatically detects the push, rebuilds the Docker image, and redeploys the container.

### Frontend — Vercel

The React frontend is deployed to Vercel from the `frontend/` subdirectory. The only environment variable required is:

```
VITE_API_URL=https://karan6124-agentbond-api.hf.space
```

This is configured in the Vercel project settings under **Environment Variables**. Vite bakes this value into the production build at compile time, and all API requests in the frontend target this URL.

To deploy a new version of the frontend:

```bash
git push origin main
```

Vercel detects the push and automatically rebuilds and redeploys the frontend.

### Git Remotes

This repository is connected to two separate git remotes:

| Remote | URL | Purpose |
|---|---|---|
| `origin` | `https://github.com/Edge-Explorer/AgentBond-AI.git` | Source of truth, triggers Vercel deploys |
| `hf` | `https://huggingface.co/spaces/Karan6124/agentbond-api` | Triggers Hugging Face backend deploys |

---

## 10. Local Development Setup

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) for running local Redis and Prometheus
- Python 3.12
- [uv](https://docs.astral.sh/uv/) for Python dependency management
- [Node.js 18+](https://nodejs.org/) for the frontend
- A Google Cloud project with an OAuth 2.0 Web Application client
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Edge-Explorer/AgentBond-AI.git
   cd AgentBond-AI
   ```

2. Copy the environment template and populate all values:
   ```bash
   cp .env.example .env
   ```

3. Create the Python virtual environment and install all dependencies:
   ```bash
   uv sync
   ```

4. Activate the virtual environment:
   ```bash
   # Windows
   .venv\Scripts\activate

   # macOS / Linux
   source .venv/bin/activate
   ```

5. Start the local infrastructure services (Redis and Prometheus):
   ```bash
   docker compose up -d
   ```

6. Run database migrations:
   ```bash
   alembic upgrade head
   ```

7. Start the API server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

8. Start the Celery worker in a separate terminal:
   ```bash
   celery -A app.workers.celery_worker worker --loglevel=info
   ```

The API will be available at `http://localhost:8000`. Interactive API documentation is at `http://localhost:8000/docs`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file for local development:
   ```
   VITE_API_URL=http://localhost:8000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`.

### Observability (Local)

Once Docker Desktop is running and the backend is serving traffic:

- **Prometheus:** `http://localhost:9090` — scrapes metrics from `host.docker.internal:8000`
- **Grafana:** `http://localhost:3000` — default credentials are `admin / admin`

To view production metrics from the live Hugging Face Space, update `prometheus.yml` to use the production target:

```yaml
scrape_configs:
  - job_name: "agent-engine-api"
    metrics_path: "/metrics/"
    scheme: "https"
    static_configs:
      - targets: ["karan6124-agentbond-api.hf.space"]
```

Then restart the Prometheus container:

```bash
docker compose restart prometheus
```

---

## 11. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string with `sslmode=require` for Neon |
| `REDIS_URL` | Yes | Redis or Upstash Redis connection string (`rediss://` for TLS) |
| `GEMINI_API_KEY` | Yes | API key from Google AI Studio |
| `GEMINI_MODEL` | No | Model name, defaults to `gemini-2.5-flash` |
| `GOOGLE_CLIENT_ID` | Yes | OAuth 2.0 client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth 2.0 client secret from Google Cloud Console |
| `SESSION_SECRET_KEY` | Yes | Random secret for Starlette session cookie signing |
| `JWT_SECRET_KEY` | Yes | Secret key for signing JWT access tokens |
| `FRONTEND_URL` | Yes | The deployed frontend URL for OAuth popup postMessage targeting |
| `APP_ENV` | No | `development` or `production` |
| `LOG_LEVEL` | No | Logging verbosity, defaults to `info` |

The `FRONTEND_URL` variable controls where the OAuth callback sends the `postMessage` after a successful Google Sign-In. In production this is `https://agent-bond-ai.vercel.app`.

---

## 12. Design Decisions

**Why no LangChain or agent framework?**

Building orchestration, context propagation, state management, and inter-agent communication from scratch provides complete transparency into what the system is actually doing at every step. It also produces a codebase that is significantly easier to reason about, debug, and extend. LangChain and similar frameworks introduce layers of abstraction that obscure failures and make debugging multi-agent flows substantially harder.

**Why a Verifier Agent?**

In a multi-agent pipeline, errors from upstream agents compound downstream. An investigator that generates a partially hallucinated claim feeds that claim into subsequent reasoning steps, and the final output inherits the error with increased confidence. A dedicated verification step with an explicit confidence score makes the system self-auditing. Cases where the verifier marks a hypothesis as unsupported are visible to the user rather than silently propagated.

**Why a shared context store instead of individual agent memory?**

Individual agent memory leads to context drift — each agent develops a slightly different internal model of the problem based on the subset of information it has processed. A single authoritative context object, shared and updated by all agents and persisted in PostgreSQL, forces every agent to operate on the same ground truth. It also makes the full state of an investigation inspectable at any point in time.

**Why Celery with Redis rather than async background tasks in FastAPI?**

FastAPI's background tasks run in the same process as the web server. Long-running LLM inference calls in background tasks block the event loop and degrade API responsiveness. Celery workers are separate processes with independent memory and CPU allocation. Combined with Redis as a message broker, this produces a genuinely decoupled system where the API remains responsive regardless of how many investigation tasks are in flight.

**Why Hugging Face Spaces for the backend?**

Hugging Face Spaces provides free persistent Docker container hosting with a public HTTPS endpoint and git-based deployment. The Docker SDK allows a completely custom container image, which is necessary to run both FastAPI and Celery under `supervisord` in a single container — a deployment pattern that is otherwise impractical on platforms like Render or Railway's free tiers.

**Why Upstash Redis instead of a local Redis container in production?**

A local Redis container cannot run alongside the application on Hugging Face Spaces without significantly increasing container complexity. Upstash provides a managed, serverless Redis instance with TLS support (`rediss://`) and a free tier sufficient for the throughput of this application. The connection is shared between the FastAPI process and the Celery worker without any additional configuration.

---

## License

MIT
