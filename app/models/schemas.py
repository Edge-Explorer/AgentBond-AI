from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class CaseStatus(str, Enum):
    PENDING= "pending"
    INVESTIGATING= "investigating"
    VERIFYING= "verifying"
    COMPLETED= "completed"
    FAILED= "failed"
    
class Fact(BaseModel):
    id: str= Field(..., description= "Unique identifier for the fact")
    source: str= Field(..., description= "Where the fact came from (e.g., 'user_input', 'system_log')")
    content: str= Field(..., description= "The actual factual statement")
    created_at: datetime= Field(default_factory= datetime.utcnow)
    
class Hypothesis(BaseModel):
    id: str= Field(..., description= "Unique identifier for the hypothesis")
    statement: str= Field(..., description= "The hypothesis statement to be investigated")
    status: str= Field(..., description= "Status of this hypothesis (pending, active, investigated, discarded)")
    assigned_investigator: Optional[str]= Field(None, description= "Name or ID of the assigned investigator agent")
    created_at: datetime= Field(default_factory= datetime.utcnow)
    
class Evidence(BaseModel):
    id: str= Field(..., description= "Unique identifier for the evidence")
    hypothesis_id: str= Field(..., description= "The hypothesis this evidence relates to")
    source: str= Field(..., description= "Source of the evidence (e.g., Web Search, API Call, DB Query)")
    content: str = Field(..., description="Detailed content of the evidence collected")
    confidence: float= Field(..., description= "Confidence score of the evidence source (0.0 to 1.0)")
    created_at: datetime= Field(default_factory= datetime.utcnow)
    
class Verification(BaseModel):
    id: str= Field(..., description= "Unique identifier for the verification record")
    evidence_id: str= Field(..., description= "The evidence ID that was verified")
    valid: bool= Field(..., description= "Whether the verification passed or failed")
    confidence_score: float= Field(..., description= "Calculated confidence score of the investigator's claim")
    context_alignment_score: float= Field(..., description= "Detailed explanation of the validation decision")
    reason: str = Field(..., description="Detailed explanation of the validation decision")
    created_at: datetime= Field(default_factory= datetime.utcnow)
    
class CaseContext(BaseModel):
    case_id: str = Field(..., description="Unique UUID for this investigation case")
    problem_statement: str = Field(..., description="The original user query or problem statement")
    status: CaseStatus = Field(default=CaseStatus.PENDING, description="Current lifecycle state of the investigation")
    
    constraints: List[str] = Field(default_factory=list, description="Boundaries or assumptions constraints defined by the user/system")
    facts: List[Fact] = Field(default_factory=list, description="Validated ground truth facts")
    hypotheses: List[Hypothesis] = Field(default_factory=list, description="List of hypotheses generated to decompose the problem")
    evidence: List[Evidence] = Field(default_factory=list, description="Raw evidence collected during investigation")
    verifications: List[Verification] = Field(default_factory=list, description="Validation reports checking evidence against facts/constraints")
    
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Arbitrary execution metadata, cost/token tracking, or agent performance scores")
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        use_enum_values= True
        json_encoders= {
            datetime: lambda v: v.isoformat()
        }