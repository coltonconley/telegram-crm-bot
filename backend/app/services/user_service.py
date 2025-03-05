from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import verify_password, get_password_hash, ALGORITHM
from app.db import models
from app.db.database import get_db
from app.schemas.token import TokenPayload
from app.schemas.user import User, UserCreate, UserUpdate

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    """
    Get a user by ID.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        User object or None if not found
    """
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """
    Get a user by email.
    
    Args:
        db: Database session
        email: User email
        
    Returns:
        User object or None if not found
    """
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user_in: UserCreate) -> models.User:
    """
    Create a new user.
    
    Args:
        db: Database session
        user_in: User creation data
        
    Returns:
        Created user object
    """
    db_user = models.User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        is_active=True,
        is_superuser=user_in.is_superuser,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str) -> Optional[models.User]:
    """
    Authenticate a user with email and password.
    
    Args:
        db: Database session
        email: User email
        password: User password
        
    Returns:
        User object if authenticated, None otherwise
    """
    user = get_user_by_email(db=db, email=email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def update_telegram_session(db: Session, user_id: int, session_string: str) -> models.User:
    """
    Update a user's Telegram session.
    
    Args:
        db: Database session
        user_id: User ID
        session_string: Encrypted Telegram session string
        
    Returns:
        Updated user object
    """
    user = get_user(db=db, user_id=user_id)
    if not user:
        raise ValueError(f"User with ID {user_id} not found")
    
    user.telegram_session = session_string
    db.commit()
    db.refresh(user)
    return user

def get_user_telegram_session(db: Session, user_id: int) -> Optional[str]:
    """
    Get a user's Telegram session.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        Encrypted Telegram session string or None if not found
    """
    user = get_user(db=db, user_id=user_id)
    if not user:
        raise ValueError(f"User with ID {user_id} not found")
    
    return user.telegram_session

async def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> models.User:
    """
    Get the current authenticated user.
    
    This is a dependency that can be used in API endpoints to get the current user
    based on the JWT token provided in the request.
    
    Args:
        db: Database session
        token: JWT token
        
    Returns:
        Current user object
        
    Raises:
        HTTPException: If authentication fails
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[ALGORITHM]
        )
        user_id: Optional[int] = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenPayload(sub=user_id)
    except JWTError:
        raise credentials_exception
    
    user = get_user(db=db, user_id=token_data.sub)
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    return user 