import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL= os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# Neon DB connections sometimes require sslmode=require for serverless pooling
if "localhost" not in DATABASE_URL and "sslmode" not in DATABASE_URL:
    if "?" in DATABASE_URL:
        DATABASE_URL += "&sslmode=require"
    else:
        DATABASE_URL += "?sslmode=require"
        
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,   # Test connection health before use; silently replaces dead connections
    pool_recycle=300,     # Recycle connections every 5 min, before Neon's idle timeout closes them
)
SessionLocal= sessionmaker(autocommit= False, autoflush= False, bind= engine)
Base= declarative_base()

def get_db():
    db= SessionLocal()
    try:
        yield db
    finally:
        db.close()