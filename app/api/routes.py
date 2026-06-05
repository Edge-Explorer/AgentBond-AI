from fastapi import APIRouter, Depends, HTTPException, status   # type: ignore
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field

from app.services.database import get_db
from app.services.context_manager import ContextManager
from app.models.schemas import CaseContext, CaseStatus
from app.agents.case_manager import CaseManagerAgent

router= APIRouter(prefix= "/api/cases", tags= ["Cases"])

class CreateCaseRequest(BaseModel):
    problem_statement: str= Field(..., example= "Why are my Instagram views dropping?")
    constraints: Optional[List[str]]= Field(default_factory= list, example= ["creator niche= tech"])
@router.post("", response_model= CaseContext, status_code= status.HTTP_201_CREATED)
def create_case(payload: CreateCaseRequest, db: Session= Depends(get_db)):
    """
    Initializes a new investigation case in the shared context database.
    """
    try:
        context= ContextManager.create_context(
            db= db,
            problem_statement= payload.problem_statement,
            constraints= payload.constraints
        )
        return context
    except Exception as e:
        raise HTTPException(
            status_code= status.HTTP_500_INTERNAL_SERVER_ERROR, detail= f"Failed to create case: {str(e)}"
        )
@router.get("/{case_id}", response_model= CaseContext)
def get_case(case_id: str, db: Session= Depends(get_db)):
    """
    Retrieves the complete shared context for a case.
    """
    context= ContextManager.get_context(db= db, case_id= case_id)
    if not context:
        raise HTTPException(
            status_code= status.HTTP_404_NOT_FOUND, detail= f"Case with ID {case_id} not found."
        )
    return context
@router.post("/{case_id}/decompose", response_model= CaseContext)
def decompose_case(case_id: str, db: Session= Depends(get_db)):
    """
    Runs the Case Manager Agent to break down the case problem statement
    into structured hypotheses.
    """
    # 1. Get current case context
    context= ContextManager.get_context(db= db, case_id= case_id)
    if not context:
        raise HTTPException(
            status_code= status.HTTP_404_NOT_FOUND, detail= f"Case with ID {case_id} not found."
        )
    if context.hypotheses:
        raise HTTPException(
            status_code= status.HTTP_400_BAD_REQUEST, detail= f"This case has already been decomposed into hypotheses."
        )
    # 2. Update status to investigating
    ContextManager.update_status(db= db, case_id= case_id, status= CaseStatus.INVESTIGATING)
    try:
        # 3. Instantiate and run Case Manager Agent
        agent= CaseManagerAgent()
        new_hypotheses= agent.execute(context)
        
        # 4. Save new hypotheses into the database
        updated_context= ContextManager.add_hypotheses(
            db= db,
            case_id= case_id,
            new_hypotheses= new_hypotheses
        )
        return updated_context
    except Exception as e:
        # Rollback status to failed if agent run crashes
        ContextManager.update_status(db= db, case_id= case_id, status= CaseStatus.FAILED)
        raise HTTPException(
            status_code= status.HTTP_500_INTERNAL_SERVER_ERROR, detail= f"Agent execution failed: {str(e)}"
        )