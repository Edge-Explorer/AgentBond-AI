import os
import logging
from celery import Celery    # type: ignore
from dotenv import load_dotenv
import time

from app.services.database import SessionLocal
from app.services.context_manager import ContextManager
from app.agents.case_manager import CaseManagerAgent
from app.models.schemas import CaseStatus
from app.observability.metrics import AGENT_LATENCY, AGENT_FAILURES

load_dotenv()

os.environ["PROMETHEUS_MULTIPROC_DIR"] = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "prometheus_multiproc_dir"))

# Configure Celery Logging
logging.basicConfig(level=logging.INFO)
logger= logging.getLogger(__name__)

# Retrieve Redis URL
REDIS_URL= os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create Celery instance
celery_app= Celery(
    "investigator_tasks",
    broker= REDIS_URL,
    backend= REDIS_URL
)

# Optional configuration settings
celery_app.conf.update(
    task_serializer= "json",
    accept_content= ["json"],
    result_serializer= "json",
    timezone= "UTC",
    enable_utc= True,
)

@celery_app.task(name= "app.workers.celery_worker.run_case_manager_task", bind= True, max_retries= 3)
def run_case_manager_task(self, case_id: str):
    """
    Asynchronous Celery task that fetches the case context, executes the Case Manager agent,
    and updates the shared context in NeonDB.
    """
    logger.info(f"Starting async case decomposition for case ID: {case_id}")
    db= SessionLocal()
    start_time= time.time()
    agent_name= "CaseManagerAgent"
    
    try:
        # 1. Fetch case context from NeonDB
        context= ContextManager.get_context(db= db, case_id= case_id)
        if not context:
            error_msg= f"Case with ID {case_id} not found in database."
            logger.error(error_msg)
            return {"status": "failed", "error": error_msg}
        
        # 2. Run the Case Manager Agent
        logger.info(f"Invoking CaseManagerAgent for problem: {context.problem_statement}")
        # Context manager timer to automatically record latency into Prometheus Histogram
        with AGENT_LATENCY.labels(agent_name= agent_name).time():
            
            agent= CaseManagerAgent()
            new_hypotheses= agent.execute(context)
        
        # 3. Add generated hypotheses back into NeonDB
        ContextManager.add_hypotheses(
            db= db,
            case_id= case_id,
            new_hypotheses= new_hypotheses
        )
        
        # 4. Success log and status update
        logger.info(f"Sucessfully generated {len(new_hypotheses)} hypotheses for case ID: {case_id}")
        return {
            "status": "sucess",
            "case_id": case_id,
            "hypotheses_count": len(new_hypotheses) 
        }
    
    except Exception as e:
        logger.error(f"Error executing run_case_manager_task: {str(e)}")
        
        # Increment failure metrics for observability
        AGENT_FAILURES.labels(
            agent_name= agent_name,
            error_type= type(e).__name__
        ).inc()
        
        # If it failed, mark case status as FAILED in NeonDB
        try:
            ContextManager.update_status(db= db, case_id= case_id, status= CaseStatus.FAILED)
        except Exception as rollback_err:
            logger.error(f"Failed to set status to FAILED for case ID {case_id}: {str(rollback_err)}")
            
        # Retry task if possible, otherwise raise
        try:
            raise self.retry(exc= e, countdown= 10)
        except Exception as retry_err:
            logger.error(f"Task retry failed: {str(retry_err)}")
            return {
                "status": "failed",
                "error": str(e)
            }
    finally:
        db.close()