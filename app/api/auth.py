import os
import uuid
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from passlib.context import CryptContext
from authlib.integrations.starlette_client import OAuth

from app.services.database import get_db
from app.models.database_models import UserModel

# Security config
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "supersecretagentbondkey123")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Configure OAuth
oauth = OAuth()
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

# Schemas
class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(request: Request, db: Session = Depends(get_db)) -> UserModel:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise credentials_exception
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

# Routes
@router.post("/register", response_model=TokenResponse)
def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(UserModel).filter(UserModel.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = UserModel(
        id=uuid.uuid4().hex,
        email=payload.email,
        name=payload.name or payload.email.split("@")[0],
        hashed_password=hash_password(payload.password),
        avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={payload.email}"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate token
    token = create_access_token(data={"sub": new_user.id})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login", response_model=TokenResponse)
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    # Get user
    user = db.query(UserModel).filter(UserModel.email == payload.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check password
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Generate token
    token = create_access_token(data={"sub": user.id})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/google")
async def google_login(request: Request):
    # Google OAuth client expects a session or state to protect against CSRF. 
    # For Starlette OAuth to work, we need a redirect_uri.
    redirect_uri = request.url_for("google_callback")
    # Force http redirection to matching protocol if SSL termination happens
    if "https" in str(request.base_url):
        redirect_uri = str(redirect_uri).replace("http://", "https://")
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google authentication failed: {str(e)}"
        )
    
    user_info = token.get("userinfo")
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to retrieve user info from Google"
        )
    
    email = user_info.get("email")
    name = user_info.get("name")
    picture = user_info.get("picture")
    google_id = user_info.get("sub")
    
    # Find user by google_id or email
    user = db.query(UserModel).filter(
        (UserModel.google_id == google_id) | (UserModel.email == email)
    ).first()
    
    if not user:
        # Register new user
        user = UserModel(
            id=uuid.uuid4().hex,
            email=email,
            name=name or email.split("@")[0],
            avatar_url=picture or f"https://api.dicebear.com/7.x/bottts/svg?seed={email}",
            google_id=google_id
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif not user.google_id:
        # Link existing email account to google
        user.google_id = google_id
        if picture and not user.avatar_url:
            user.avatar_url = picture
        db.commit()
        db.refresh(user)
        
    # Generate JWT
    jwt_token = create_access_token(data={"sub": user.id})
    
    # Return HTML payload that uses postMessage to send token back to react app
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Authenticating...</title>
    </head>
    <body>
        <script>
            window.opener.postMessage({{ type: "AUTH_SUCCESS", token: "{jwt_token}" }}, "*");
            window.close();
        </script>
        <p>Authentication complete. You can close this window now.</p>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@router.get("/me", response_model=UserResponse)
def get_me(user: UserModel = Depends(get_current_user)):
    return user
