from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.services.database import Base

class CaseContextModel(Base):
    __tablename__= "cases"
    
    case_id= Column(String, primary_key= True, index= True)
    problem_statement= Column(String, nullable= False)
    status= Column(String, default= "pending", nullable= False)
    metadata_json= Column(JSON, default= dict)
    updated_at= Column(DateTime, default= datetime.utcnow, onupdate= datetime.utcnow)
    
    # Relationships
    facts= relationship("FactModel", back_populates= "case", cascade= "all, delete-orphan")
    hypotheses= relationship("HypothesisModel", back_populates= "case", cascade= "all, delete-orphan")
    evidence= relationship("EvidenceModel", back_populates= "case", cascade= "all, delete-orphan")
    verifications= relationship("VerificationModel", back_populates= "case", cascade= "all, delete-orphan")
    
class FactModel(Base):
    __tablename__= "facts"
    
    id= Column(String, primary_key= True, index= True)
    case_id= Column(String, ForeignKey("cases.case_id", ondelete= "CASCADE"), nullable= False)
    source= Column(String, nullable= False)
    content= Column(String, nullable= False)
    created_at= Column(DateTime, default= datetime.utcnow)
    
    case= relationship("CaseContextModel", back_populates= "facts")
    
class HypothesisModel(Base):
    __tablename__= "hypotheses"
    
    id= Column(String, primary_key= True, index= True)
    case_id= Column(String, ForeignKey("cases.case_id", ondelete= "CASCADE"), nullable= False)
    statement= Column(String, nullable= False)
    status= Column(String, default= "pending", nullable= False)
    assigned_investigator= Column(String, nullable= True)
    created_at= Column(DateTime, default= datetime.utcnow)
    
    case= relationship("CaseContextModel", back_populates= "hypotheses")
    evidence= relationship("EvidenceModel", back_populates= "hypothesis")
    
class EvidenceModel(Base):
    __tablename__= "evidence"
    
    id= Column(String, primary_key= True, index= True)
    case_id= Column(String, ForeignKey("cases.case_id", ondelete="CASCADE"), nullable= False)
    hypothesis_id= Column(String, ForeignKey("hypotheses.id", ondelete= "CASCADE"), nullable= False)
    source= Column(String, nullable= False)
    content= Column(String, nullable= False)
    confidence= Column(Float, nullable= False)
    created_at= Column(DateTime, default= datetime.utcnow)
    
    case= relationship("CaseContextModel", back_populates= "evidence")
    hypothesis= relationship("HypothesisModel", back_populates= "evidence")
    verifications= relationship("VerificationModel", back_populates= "evidence")
    
class VerificationModel(Base):
    __tablename__= "verifications"
    
    id= Column(String, primary_key= True, index= True)
    case_id= Column(String, ForeignKey("cases.case_id", ondelete= "CASCADE"), nullable= False)
    evidence_id= Column(String, ForeignKey("evidence.id", ondelete= "CASCADE"), nullable= False)
    valid= Column(Boolean, nullable= False)
    confidence_score= Column(Float, nullable= False)
    context_alignment_score = Column(Float, nullable=False)
    reason = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    case= relationship("CaseContextModel", back_populates= "verifications")
    evidence= relationship("EvidenceModel", back_populates= "verifications")