from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.services.database import Base

class UserModel(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    google_id = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    cases = relationship("CaseContextModel", back_populates="user", cascade="all, delete-orphan")


class CaseContextModel(Base):
    __tablename__= "cases"
    
    case_id= Column(String, primary_key= True, index= True)
    user_id= Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    problem_statement= Column(String, nullable= False)
    status= Column(String, default= "pending", nullable= False)
    metadata_json= Column(JSON, default= dict)
    updated_at= Column(DateTime, default= datetime.utcnow, onupdate= datetime.utcnow)
    
    # Relationships
    user= relationship("UserModel", back_populates="cases")
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