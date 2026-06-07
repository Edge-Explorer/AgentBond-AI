import os

os.environ["PROMETHEUS_MULTIPROC_DIR"]= os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "prometheus_multiproc_dir"))
from prometheus_client import Counter, Histogram, Gauge

# 1. Track Agent Latency (Histogram)
AGENT_LATENCY= Histogram(
    "agent_latency_seconds",
    "Time spent in seconds by each agent execution block",
    labelnames= ["agent_name"]
)

# 2. Track Agent Failure Rates (Counter)
AGENT_FAILURES= Counter(
    "agent_failures_total",
    "Total number of failures encountered during agent execution",
    labelnames= ["agent_name", "error_type"]
)

# 3. Track LLM Token Usage and Costs (Counter)
LLM_TOKENS= Counter(
    "llm_tokens_total",
    "Total number of input/output tokens used by LLM provider",
    labelnames= ["model_name", "token_type"] # token_type: "input" or "output"
)

# 4. Context Drift Score (Gauge)
CONTEXT_DRIFT_SCORE= Gauge(
    "context_drift_score",
    "Quantitative score measuring drift from original case constraints (0.0 to 1.0)",
    labelnames= ["case_id"]
)

# 5. Verification Failures (Counter)
VERIFICATION_FAILURES= Counter(
    "verification_failures_total",
    "Total number of verification failures flagged by the Verifier Agent",
    labelnames= ["case_id"]
)