from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.db import models
from app.schemas.message import MessageCreate, MessageUpdate

def get_messages(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    category: Optional[str] = None,
    is_responded: Optional[bool] = None,
) -> List[models.Message]:
    """
    Get messages with optional filtering.
    
    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        category: Optional category filter
        is_responded: Optional responded status filter
        
    Returns:
        List of messages
    """
    query = db.query(models.Message)
    
    if category:
        query = query.filter(models.Message.category == category)
    
    if is_responded is not None:
        query = query.filter(models.Message.is_responded == is_responded)
    
    return query.offset(skip).limit(limit).all()

def get_message_by_id(db: Session, message_id: int) -> Optional[models.Message]:
    """
    Get a specific message by ID.
    
    Args:
        db: Database session
        message_id: Message ID
        
    Returns:
        Message object or None if not found
    """
    return db.query(models.Message).filter(models.Message.id == message_id).first()

def create_message(db: Session, message_in: MessageCreate) -> models.Message:
    """
    Create a new message.
    
    Args:
        db: Database session
        message_in: Message creation data
        
    Returns:
        Created message object
    """
    db_message = models.Message(
        telegram_message_id=message_in.telegram_message_id,
        chat_id=message_in.chat_id,
        sender_id=message_in.sender_id,
        message_text=message_in.message_text,
        timestamp=message_in.timestamp,
        category=message_in.category,
        priority=message_in.priority,
        scheduled_call_time=message_in.scheduled_call_time,
        action_notes=message_in.action_notes,
        media_info=message_in.media_info,
        is_read=False,
        is_responded=False,
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def update_message(db: Session, db_obj: models.Message, obj_in: MessageUpdate) -> models.Message:
    """
    Update a message.
    
    Args:
        db: Database session
        db_obj: Existing message object
        obj_in: Message update data
        
    Returns:
        Updated message object
    """
    update_data = obj_in.dict(exclude_unset=True)
    
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_unresponded_messages(db: Session, skip: int = 0, limit: int = 100, days_back: int = 7) -> List[models.Message]:
    """
    Get unresponded messages from the last N days.
    
    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        days_back: Number of days to look back
        
    Returns:
        List of unresponded messages
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days_back)
    
    return db.query(models.Message).filter(
        models.Message.is_responded == False,
        models.Message.timestamp >= cutoff_date
    ).offset(skip).limit(limit).all() 