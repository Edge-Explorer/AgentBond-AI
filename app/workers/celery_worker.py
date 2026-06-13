import os
import logging
from celery import Celery    # type: ignore
from dotenv import load_dotenv
import time
from typing import Dict, Any

from app.services.database import SessionLocal
from app.services.context_manager import ContextManager
from app.agents.case_manager import CaseManagerAgent
from app.agents.research_agent import ResearchAgent
from app.models.schemas import CaseStatus
from app.observability.metrics import AGENT_LATENCY, AGENT_FAILURES

load_dotenv()

# Set multiprocess directory for Prometheus metrics
os.environ["PROMETHEUS_MULTIPROC_DIR"] = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "prometheus_multiproc_dir")
)

# Configure Celery Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Retrieve Redis URL
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create Celery instance
celery_app = Celery(
    "investigator_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL
)

# Configuration settings
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(name="app.workers.celery_worker.run_case_manager_task", bind=True, max_retries=3)
def run_case_manager_task(self, case_id: str):
    """
    Asynchronous Celery task that coordinates the multi-agent investigation:
    1. Runs CaseManagerAgent to decompose the problem statement into hypotheses.
    2. Runs ResearchAgent on each hypothesis to perform web research and gather evidence.
    3. Saves all results and updates the case status to completed.
    """
    logger.info(f"Starting async agent investigation for case ID: {case_id}")
    db = SessionLocal()
    
    try:
        # 1. Fetch case context from database
        context = ContextManager.get_context(db=db, case_id=case_id)
        if not context:
            error_msg = f"Case with ID {case_id} not found in database."
            logger.error(error_msg)
            return {"status": "failed", "error": error_msg}
        
        # Mark case as actively investigating
        ContextManager.update_status(db=db, case_id=case_id, status=CaseStatus.INVESTIGATING)

        # 2. Run the Case Manager Agent to generate hypotheses
        logger.info(f"Invoking CaseManagerAgent for problem: '{context.problem_statement}'")
        with AGENT_LATENCY.labels(agent_name="CaseManagerAgent").time():
            case_manager = CaseManagerAgent()
            new_hypotheses = case_manager.execute(context)
        
        # Add generated hypotheses to database
        ContextManager.add_hypotheses(db=db, case_id=case_id, new_hypotheses=new_hypotheses)
        
        # 3. Retrieve refreshed case context containing assigned hypothesis database IDs
        refreshed_context = ContextManager.get_context(db=db, case_id=case_id)
        
        # 4. Loop through hypotheses and execute ResearchAgent on each (No delays since we are on paid Gemini API)
        for hypothesis in refreshed_context.hypotheses:
            logger.info(f"Investigating Hypothesis: '{hypothesis.statement}' (ID: {hypothesis.id})")
            
            # Mark hypothesis status as investigating
            ContextManager.update_hypothesis(
                db=db,
                hypothesis_id=hypothesis.id,
                status="investigating",
                assigned_investigator="ResearchAgent"
            )
            
            # Run the Research Agent (which formulates searches & queries DDG)
            with AGENT_LATENCY.labels(agent_name="ResearchAgent").time():
                researcher = ResearchAgent()
                verdict = researcher.execute_research(hypothesis.statement, refreshed_context)
            
            # Save supporting evidence
            if verdict.get("supporting_evidence"):
                new_evidence = [
                    {
                        "hypothesis_id": hypothesis.id,
                        "source": f"web_search: {verdict.get('search_query')}",
                        "content": ev,
                        "confidence": 0.85
                    } for ev in verdict["supporting_evidence"]
                ]
                ContextManager.add_evidence(db=db, case_id=case_id, new_evidence=new_evidence)
                
            # Save contrary evidence
            if verdict.get("contrary_evidence"):
                contrary_ev = [
                    {
                        "hypothesis_id": hypothesis.id,
                        "source": f"web_search: {verdict.get('search_query')}",
                        "content": f"[CONTRARY] {ev}",
                        "confidence": 0.85
                    } for ev in verdict["contrary_evidence"]
                ]
                ContextManager.add_evidence(db=db, case_id=case_id, new_evidence=contrary_ev)
            
            # Add conclusion as a case Fact
            conclusion_fact = [
                {
                    "source": "ResearchAgent",
                    "content": f"Hypothesis Verdict: '{hypothesis.statement}' -> {verdict.get('conclusion')}"
                }
            ]
            ContextManager.add_facts(db=db, case_id=case_id, new_facts=conclusion_fact)
            
            # Update final status of the hypothesis
            ContextManager.update_hypothesis(
                db=db,
                hypothesis_id=hypothesis.id,
                status=verdict.get("status", "inconclusive")
            )
        
        # 5. Mark overall case status as completed
        ContextManager.update_status(db=db, case_id=case_id, status=CaseStatus.COMPLETED)
        logger.info(f"Successfully completed investigation for case ID: {case_id}")
        
        return {
            "status": "success",
            "case_id": case_id,
            "hypotheses_investigated": len(refreshed_context.hypotheses)
        }
        
    except Exception as e:
        logger.error(f"Error executing run_case_manager_task: {str(e)}")
        AGENT_FAILURES.labels(agent_name="InvestigationPipeline", error_type=type(e).__name__).inc()
        
        try:
            ContextManager.update_status(db=db, case_id=case_id, status=CaseStatus.FAILED)
        except Exception as rollback_err:
            logger.error(f"Failed to set status to FAILED for case ID {case_id}: {str(rollback_err)}")
            
        try:
            raise self.retry(exc=e, countdown=10)
        except Exception as retry_err:
            logger.error(f"Task retry failed: {str(retry_err)}")
            return {"status": "failed", "error": str(e)}
            
    finally:
        db.close()