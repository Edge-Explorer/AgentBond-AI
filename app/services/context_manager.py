import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.schemas import CaseContext, Fact, Hypothesis, Evidence, Verification, CaseStatus
from app.models.database_models import CaseContextModel, FactModel, HypothesisModel, EvidenceModel, VerificationModel

class ContextManager:
    @staticmethod
    def create_context(db: Session, problem_statement: str, constraints: List[str] = None) -> CaseContext:
        """
        Creates a new case context row in the database and returns the Pydantic schema representation.
        """
        case_id = str(uuid.uuid4())
        
        # 1. Create the base case model
        case_db = CaseContextModel(
            case_id=case_id,
            problem_statement=problem_statement,
            status=CaseStatus.PENDING,
            metadata_json={},
            updated_at=datetime.utcnow()
        )
        db.add(case_db)
        
        # 2. Add constraints as initial Facts (or keep as metadata if preferred; here we save them as string metadata list)
        # We can also add default constraints
        if constraints:
            case_db.metadata_json = {"constraints": constraints}
            
        db.commit()
        db.refresh(case_db)
        
        return ContextManager.get_context(db, case_id)

    @staticmethod
    def get_context(db: Session, case_id: str) -> Optional[CaseContext]:
        """
        Retrieves a fully populated CaseContext by reading the relational database schemas.
        """
        case_db = db.query(CaseContextModel).filter(CaseContextModel.case_id == case_id).first()
        if not case_db:
            return None

        # Build list of Facts
        facts = [
            Fact(
                id=f.id,
                source=f.source,
                content=f.content,
                created_at=f.created_at
            ) for f in case_db.facts
        ]

        # Build list of Hypotheses
        hypotheses = [
            Hypothesis(
                id=h.id,
                statement=h.statement,
                status=h.status,
                assigned_investigator=h.assigned_investigator,
                created_at=h.created_at
            ) for h in case_db.hypotheses
        ]

        # Build list of Evidence
        evidence = [
            Evidence(
                id=e.id,
                hypothesis_id=e.hypothesis_id,
                source=e.source,
                content=e.content,
                confidence=e.confidence,
                created_at=e.created_at
            ) for e in case_db.evidence
        ]

        # Build list of Verifications
        verifications = [
            Verification(
                id=v.id,
                evidence_id=v.evidence_id,
                valid=v.valid,
                confidence_score=v.confidence_score,
                context_alignment_score=v.context_alignment_score,
                reason=v.reason,
                created_at=v.created_at
            ) for v in case_db.verifications
        ]

        # Read constraints from metadata
        constraints = case_db.metadata_json.get("constraints", []) if case_db.metadata_json else []

        return CaseContext(
            case_id=case_db.case_id,
            problem_statement=case_db.problem_statement,
            status=case_db.status,
            constraints=constraints,
            facts=facts,
            hypotheses=hypotheses,
            evidence=evidence,
            verifications=verifications,
            metadata=case_db.metadata_json or {},
            updated_at=case_db.updated_at
        )

    @staticmethod
    def update_status(db: Session, case_id: str, status: CaseStatus) -> Optional[CaseContext]:
        """
        Updates the execution status of a case.
        """
        case_db = db.query(CaseContextModel).filter(CaseContextModel.case_id == case_id).first()
        if not case_db:
            return None
        
        case_db.status = status.value if hasattr(status, 'value') else status
        case_db.updated_at = datetime.utcnow()
        db.commit()
        
        return ContextManager.get_context(db, case_id)

    @staticmethod
    def add_facts(db: Session, case_id: str, new_facts: List[Dict[str, Any]]) -> Optional[CaseContext]:
        """
        Appends facts to the shared case context database record.
        """
        for fact_data in new_facts:
            fact_db = FactModel(
                id=str(uuid.uuid4()),
                case_id=case_id,
                source=fact_data.get("source", "system"),
                content=fact_data["content"],
                created_at=datetime.utcnow()
            )
            db.add(fact_db)
        
        db.commit()
        return ContextManager.get_context(db, case_id)

    @staticmethod
    def add_hypotheses(db: Session, case_id: str, new_hypotheses: List[Dict[str, Any]]) -> Optional[CaseContext]:
        """
        Appends hypotheses to the shared case context database record.
        """
        for hyp_data in new_hypotheses:
            hyp_db = HypothesisModel(
                id=str(uuid.uuid4()),
                case_id=case_id,
                statement=hyp_data["statement"],
                status=hyp_data.get("status", "pending"),
                assigned_investigator=hyp_data.get("assigned_investigator"),
                created_at=datetime.utcnow()
            )
            db.add(hyp_db)
        
        db.commit()
        return ContextManager.get_context(db, case_id)

    @staticmethod
    def add_evidence(db: Session, case_id: str, new_evidence: List[Dict[str, Any]]) -> Optional[CaseContext]:
        """
        Appends evidence to the shared case context database record.
        """
        for ev_data in new_evidence:
            ev_db = EvidenceModel(
                id=str(uuid.uuid4()),
                case_id=case_id,
                hypothesis_id=ev_data["hypothesis_id"],
                source=ev_data["source"],
                content=ev_data["content"],
                confidence=ev_data["confidence"],
                created_at=datetime.utcnow()
            )
            db.add(ev_db)
            
        db.commit()
        return ContextManager.get_context(db, case_id)

    @staticmethod
    def add_verifications(db: Session, case_id: str, new_verifications: List[Dict[str, Any]]) -> Optional[CaseContext]:
        """
        Appends verification metrics to the shared case context database record.
        """
        for ver_data in new_verifications:
            ver_db = VerificationModel(
                id=str(uuid.uuid4()),
                case_id=case_id,
                evidence_id=ver_data["evidence_id"],
                valid=ver_data["valid"],
                confidence_score=ver_data["confidence_score"],
                context_alignment_score=ver_data["context_alignment_score"],
                reason=ver_data["reason"],
                created_at=datetime.utcnow()
            )
            db.add(ver_db)
            
        db.commit()
        return ContextManager.get_context(db, case_id)
    
    @staticmethod
    def update_hypothesis(db: Session, hypothesis_id: str, status: str, assigned_investigator: Optional[str]= None) -> Optional[HypothesisModel]:
        """
        Updates the execution status and assigned investigator of a specific hypothesis.
        """
        hyp_db= db.query(HypothesisModel).filter(HypothesisModel.id == hypothesis_id).first()
        if hyp_db:
            hyp_db.status= status
            if assigned_investigator:
                hyp_db.assigned_investigator= assigned_investigator
            db.commit()
            db.refresh(hyp_db)
        return hyp_db