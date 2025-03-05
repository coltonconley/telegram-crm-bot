from typing import Any, List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get("", response_model=List[schemas.Message])
def list_messages(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    contact_id: Optional[int] = None,
    category: Optional[str] = None,
    is_responded: Optional[bool] = None,
    search: Optional[str] = None,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve messages with optional filtering
    """
    messages = crud.message.get_multi_by_user(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        contact_id=contact_id,
        category=category,
        is_responded=is_responded,
        search=search
    )
    
    # Get total count for pagination headers
    total = crud.message.get_count_by_user(
        db=db,
        user_id=current_user.id,
        contact_id=contact_id,
        category=category,
        is_responded=is_responded,
        search=search
    )
    
    # Return messages with pagination headers
    return messages

@router.get("/unresponded", response_model=List[schemas.Message])
def list_unresponded_messages(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve unresponded messages
    """
    messages = crud.message.get_multi_by_user(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        is_responded=False
    )
    
    # Get total count for pagination headers
    total = crud.message.get_count_by_user(
        db=db,
        user_id=current_user.id,
        is_responded=False
    )
    
    # Return messages with pagination headers
    return messages

@router.get("/{message_id}", response_model=schemas.Message)
def get_message(
    *,
    db: Session = Depends(deps.get_db),
    message_id: int = Path(...),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get message by ID
    """
    message = crud.message.get(db=db, id=message_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    if message.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return message

@router.put("/{message_id}", response_model=schemas.Message)
def update_message(
    *,
    db: Session = Depends(deps.get_db),
    message_id: int = Path(...),
    message_in: schemas.MessageUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a message
    """
    message = crud.message.get(db=db, id=message_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    if message.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    message = crud.message.update(db=db, db_obj=message, obj_in=message_in)
    return message

@router.post("/{message_id}/respond", response_model=schemas.Message)
async def respond_to_message(
    *,
    db: Session = Depends(deps.get_db),
    message_id: int = Path(...),
    response_data: schemas.MessageResponse,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Respond to a message via Telegram
    """
    message = crud.message.get(db=db, id=message_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    if message.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if user has Telegram session
    if not current_user.telegram_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telegram session not setup. Please connect your Telegram account."
        )
    
    # Send response via Telegram
    try:
        from app.services.telegram_client import send_message
        await send_message(
            user_session=current_user.telegram_session,
            contact_id=message.contact.telegram_id,
            text=response_data.response_text
        )
        
        # Update message in database
        message = crud.message.mark_as_responded(
            db=db, message=message, response_text=response_data.response_text
        )
        
        return message
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send message: {str(e)}"
        )

@router.post("/{message_id}/categorize", response_model=schemas.Message)
async def categorize_message(
    *,
    db: Session = Depends(deps.get_db),
    message_id: int = Path(...),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Categorize a message using AI
    """
    message = crud.message.get(db=db, id=message_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    if message.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        from app.services.ai_categorization import ai_categorization
        categorization = await ai_categorization.categorize_message(message.message_text)
        
        # Update message with categorization
        message.ai_category = categorization["category"]
        message.ai_confidence = categorization["confidence"]
        message.ai_reasoning = categorization["reasoning"]
        message.ai_categorized_at = datetime.now()
        
        db.add(message)
        db.commit()
        db.refresh(message)
        
        return message
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to categorize message: {str(e)}"
        ) 