from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field

from app.services.database import get_db
from app.services.context_manager import ContextManager
from app.models.schemas import CaseContext, CaseStatus
from app.workers.celery_worker import run_case_manager_task
from app.api.auth import get_current_user
from app.models.database_models import UserModel

router = APIRouter(prefix="/api/cases", tags=["Cases"])

class CreateCaseRequest(BaseModel):
    problem_statement: str = Field(..., example="Why are my Instagram views dropping?")
    constraints: Optional[List[str]] = Field(default_factory=list, example=["creator niche = tech"])

@router.post("", response_model=CaseContext, status_code=status.HTTP_201_CREATED)
def create_case(
    payload: CreateCaseRequest, 
    db: Session = Depends(get_db), 
    current_user: UserModel = Depends(get_current_user)
):
    """
    Initializes a new investigation case in the shared context database and links it to the current user.
    """
    try:
        context = ContextManager.create_context(
            db=db,
            problem_statement=payload.problem_statement,
            constraints=payload.constraints,
            user_id=current_user.id
        )
        return context
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create case: {str(e)}"
        )

@router.get("/{case_id}", response_model=CaseContext)
def get_case(
    case_id: str, 
    db: Session = Depends(get_db), 
    current_user: UserModel = Depends(get_current_user)
):
    """
    Retrieves the complete shared context for a case, validating user authorization.
    """
    context = ContextManager.get_context(db=db, case_id=case_id)
    if not context:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {case_id} not found."
        )
    
    from app.models.database_models import CaseContextModel
    case_db = db.query(CaseContextModel).filter(CaseContextModel.case_id == case_id).first()
    if case_db and case_db.user_id and case_db.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this case."
        )

    return context

@router.post("/{case_id}/decompose", response_model=CaseContext, status_code=status.HTTP_202_ACCEPTED)
def decompose_case(
    case_id: str, 
    db: Session = Depends(get_db), 
    current_user: UserModel = Depends(get_current_user)
):
    """
    Triggers the Case Manager Agent task asynchronously via Celery, validating user authorization.
    """
    from app.models.database_models import CaseContextModel
    case_db = db.query(CaseContextModel).filter(CaseContextModel.case_id == case_id).first()
    if not case_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {case_id} not found."
        )
    
    if case_db.user_id and case_db.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this case."
        )

    context = ContextManager.get_context(db=db, case_id=case_id)
    if context.hypotheses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This case has already been decomposed into hypotheses."
        )

    # 2. Update status to investigating
    updated_context = ContextManager.update_status(db=db, case_id=case_id, status=CaseStatus.INVESTIGATING)

    try:
        # 3. Dispatch Celery task to the Redis broker
        run_case_manager_task.delay(case_id)
        
        # Return the updated context showing the new 'investigating' status immediately
        return updated_context

    except Exception as e:
        # Rollback status to failed if task dispatch fails
        ContextManager.update_status(db=db, case_id=case_id, status=CaseStatus.FAILED)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue agent task: {str(e)}"
        )

@router.get("", response_model=List[CaseContext])
def get_cases(
    limit: int = 20, 
    db: Session = Depends(get_db), 
    current_user: UserModel = Depends(get_current_user)
):
    """
    Retrieves all investigation cases in the database belonging to the current user.
    """
    try:
        return ContextManager.get_all_contexts(db=db, limit=limit, user_id=current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch cases: {str(e)}"
        )