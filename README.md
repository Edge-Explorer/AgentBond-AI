# Multi-Agent Investigation Engine

A production-grade agent orchestration runtime built for collaborative, context-aware investigation of complex problems. The investigation use-case is the demo — the architecture underneath is a general-purpose agent runtime.

---

## What This Is

This system allows a user to submit an open-ended problem. A pipeline of specialized agents then collaborates to break down, investigate, and verify findings — all operating on a shared context store to prevent drift, hallucination, and out-of-scope reasoning.

This is not a chatbot wrapper. This is an agent orchestration system with:

- Structured inter-agent communication via a shared context store
- Asynchronous task execution using Celery and Redis
- A verification layer that scores agent output for hallucination and context drift
- Full observability via Prometheus metrics and Grafana dashboards

---

## System Architecture

```
User Input
    |
FastAPI API Gateway
    |
Case Manager Agent
    |
Celery Task Queue  <--  Redis Broker
    |
Investigator Agent(s)
    |
Shared Context Store  (PostgreSQL + in-memory)
    |
Verifier Agent
    |
Observability Layer  (Prometheus + Grafana)
    |
PostgreSQL  (persistent case storage)
```

---

## Agent Roles

### Case Manager Agent
Receives the raw problem statement and decomposes it into structured hypotheses.

**Input:**
```
"Why are my Instagram views dropping?"
```

**Output:**
```json
{
  "possible_causes": [
    "algorithm change",
    "content fatigue",
    "posting inconsistency"
  ]
}
```

---

### Investigator Agent
Takes a single hypothesis and returns supporting or refuting evidence based on the shared context.

---

### Verifier Agent
The most critical component. Evaluates investigator output for:

- Context alignment (did the agent stay in scope?)
- Hallucination detection (are claims grounded in facts?)
- Confidence scoring

**Output:**
```json
{
  "valid": true,
  "confidence": 0.82,
  "reason": "Claim is consistent with established facts in context."
}
```

---

## Shared Context Store

All agents read from and write to a single shared context object per case. This is the core mechanism that prevents agent drift and ensures coherent multi-step reasoning.

**Context schema:**
```json
{
  "case_id": 1,
  "problem": "Instagram views dropping",
  "constraints": ["creator niche = tech"],
  "facts": ["posting reduced from 5/week to 2/week"],
  "hypotheses": [],
  "evidence": [],
  "verifications": []
}
```

---

## Project Structure

```
investigator-ai/
|
├── app/
│   ├── api/
│   │   └── routes.py              # FastAPI route definitions
│   |
│   ├── agents/
│   │   ├── case_manager.py        # Decomposes the problem into hypotheses
│   │   ├── investigator.py        # Investigates individual hypotheses
│   │   └── verifier.py            # Validates investigator output
│   |
│   ├── services/
│   │   ├── llm.py                 # LLM client abstraction (OpenAI / Gemini)
│   │   └── context_manager.py     # Shared context read/write operations
│   |
│   ├── workers/
│   │   └── celery_worker.py       # Celery app and task definitions
│   |
│   ├── observability/
│   │   └── metrics.py             # Prometheus metric definitions
│   |
│   ├── models/
│   │   └── schemas.py             # Pydantic models for all data contracts
│   |
│   └── main.py                    # FastAPI app entry point
|
├── tests/
│   ├── test_agents.py             # Unit tests for agent logic
│   └── test_context.py            # Unit tests for context manager
|
├── docker-compose.yml             # Orchestrates Redis, Postgres, Grafana, Prometheus
├── pyproject.toml                 # Project metadata and dependencies (managed by uv)
├── .env.example                   # Environment variable template
└── README.md
```

---

## Phase Roadmap

### Phase 1 — Core Engine
- FastAPI server running
- Three agents implemented with LLM calls
- Shared context store operational
- Synchronous pipeline working end to end

### Phase 2 — Async with Celery
- Agents execute as Celery tasks
- Redis as message broker
- Retry logic and task state tracking

### Phase 3 — Observability
- Prometheus metrics: agent latency, failure rate, context drift score
- Grafana dashboards: Agent Health, Context Tracking, Cost Monitoring
- `context_alignment_score` metric — measures when an agent's output diverges from the established investigation scope

### Phase 4 — Memory Experiments
- Compare memory strategies: Sliding Window vs Shared Context vs Summary Memory
- Measure: accuracy, context retention, hallucination rate
- Forms the research/analysis angle of the project

### Phase 5 — Frontend
- Minimal chat UI
- Backend remains the primary artifact

---

## Tech Stack

| Layer              | Technology                  |
|--------------------|--------------------------|
| API Framework      | FastAPI                     |
| Task Queue         | Celery                      |
| Message Broker     | Redis                       |
| Database           | PostgreSQL + SQLAlchemy      |
| Data Validation    | Pydantic                    |
| LLM Provider       | OpenAI / Google Gemini      |
| Metrics            | Prometheus                  |
| Dashboards         | Grafana                     |
| Package Manager    | uv                          |
| Dependency File    | pyproject.toml              |

No LangChain. Orchestration is implemented directly to maximize learning and architectural clarity.

---

## Getting Started

### Prerequisites

- Docker and Docker Compose installed (for infrastructure services only)
- Python 3.11+
- [uv](https://docs.astral.sh/uv/) installed
- An OpenAI or Gemini API key

### Setup

1. Copy the environment template and fill in your values:
   ```bash
   cp .env.example .env
   ```

2. Create a virtual environment and install dependencies using uv:
   ```bash
   uv venv
   uv sync
   ```

3. Activate the virtual environment:
   ```bash
   # Windows
   .venv\Scripts\activate

   # macOS / Linux
   source .venv/bin/activate
   ```

4. Start infrastructure services:
   ```bash
   docker-compose up -d
   ```

5. Run the API server:
   ```bash
   uvicorn app.main:app --reload
   ```

6. Start the Celery worker (in a separate terminal):
   ```bash
   celery -A app.workers.celery_worker worker --loglevel=info
   ```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values. Key entries:

| Variable           | Description                        |
|--------------------|------------------------------------|
| `OPENAI_API_KEY`   | API key for the LLM provider       |
| `REDIS_URL`        | Redis connection string            |
| `DATABASE_URL`     | PostgreSQL connection string       |
| `LLM_PROVIDER`     | `openai` or `gemini`               |

---

## Observability

Once running, access dashboards at:

- **Grafana:** `http://localhost:3000` (default credentials: `admin / admin`)
- **Prometheus:** `http://localhost:9090`

Pre-built dashboards:

1. **Agent Health** — success rate, failure rate, retries, latency per agent
2. **Context Tracking** — context drift score, memory size, hallucination count, verification failures
3. **Cost Monitoring** — tokens used, estimated LLM cost, case runtime

---

## Design Decisions

**Why no LangChain?**
Building orchestration from scratch provides a deeper understanding of agent coordination, context propagation, and failure handling. It also produces a cleaner, more interview-demonstrable codebase.

**Why a Verifier Agent?**
In multi-agent systems, downstream agents inherit errors from upstream agents. A dedicated verification step with a quantified confidence score makes the system self-auditing and significantly reduces hallucination propagation.

**Why a shared context store instead of individual agent memory?**
Individual agent memory leads to context drift — each agent developing a slightly different model of the problem. A single authoritative context object forces all agents to operate on the same ground truth.

---

## License

MIT
