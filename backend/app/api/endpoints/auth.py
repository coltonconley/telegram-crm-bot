from datetime import timedelta
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import schemas, models, crud
from app.api import deps
from app.core import security
from app.core.config import settings
from app.services.telegram_client import start_telegram_auth, confirm_telegram_auth

router = APIRouter()

@router.post("/login", response_model=schemas.Token)
def login_access_token(
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = crud.user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/telegram-auth", response_model=schemas.TelegramAuthStart)
def start_telegram_authentication(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    phone: str = Body(..., embed=True)
) -> Any:
    """
    Start Telegram authentication process
    """
    try:
        auth_id, phone_code_hash = start_telegram_auth(phone)
        return {
            "auth_id": auth_id,
            "phone": phone,
            "message": "Verification code sent"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to start Telegram authentication: {str(e)}"
        )

@router.post("/telegram-auth-confirm", response_model=schemas.TelegramAuthConfirm)
def confirm_telegram_authentication(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    auth_data: schemas.TelegramAuthCode
) -> Any:
    """
    Confirm Telegram authentication with verification code
    """
    try:
        session_string = confirm_telegram_auth(
            auth_id=auth_data.auth_id, 
            code=auth_data.code
        )
        
        # Update user with telegram session
        user = crud.user.update_telegram_session(
            db=db, 
            db_obj=current_user, 
            session=session_string
        )
        
        return {
            "status": "success",
            "message": "Telegram authentication successful"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to confirm Telegram authentication: {str(e)}"
        )

@router.post("/reset-telegram", response_model=schemas.Msg)
def reset_telegram_session(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Reset Telegram session for current user
    """
    crud.user.update_telegram_session(db=db, db_obj=current_user, session=None)
    return {"message": "Telegram session reset successfully"} 