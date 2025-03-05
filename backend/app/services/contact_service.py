from typing import List, Optional
from sqlalchemy.orm import Session

from app.db import models
from app.schemas.contact import ContactCreate, ContactUpdate

def get_contacts(db: Session, skip: int = 0, limit: int = 100) -> List[models.Contact]:
    """
    Get all contacts.
    
    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        List of contacts
    """
    return db.query(models.Contact).offset(skip).limit(limit).all()

def get_contact_by_id(db: Session, contact_id: int) -> Optional[models.Contact]:
    """
    Get a specific contact by ID.
    
    Args:
        db: Database session
        contact_id: Contact ID
        
    Returns:
        Contact object or None if not found
    """
    return db.query(models.Contact).filter(models.Contact.id == contact_id).first()

def get_contact_by_telegram_id(db: Session, telegram_id: int) -> Optional[models.Contact]:
    """
    Get a specific contact by Telegram ID.
    
    Args:
        db: Database session
        telegram_id: Telegram user ID
        
    Returns:
        Contact object or None if not found
    """
    return db.query(models.Contact).filter(models.Contact.telegram_id == telegram_id).first()

def create_contact(db: Session, contact_in: ContactCreate) -> models.Contact:
    """
    Create a new contact.
    
    Args:
        db: Database session
        contact_in: Contact creation data
        
    Returns:
        Created contact object
    """
    db_contact = models.Contact(
        telegram_id=contact_in.telegram_id,
        display_name=contact_in.display_name,
        username=contact_in.username,
        phone_number=contact_in.phone_number,
        first_name=contact_in.first_name,
        last_name=contact_in.last_name,
        additional_info=contact_in.additional_info,
    )
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

def update_contact(db: Session, db_obj: models.Contact, obj_in: ContactUpdate) -> models.Contact:
    """
    Update a contact.
    
    Args:
        db: Database session
        db_obj: Existing contact object
        obj_in: Contact update data
        
    Returns:
        Updated contact object
    """
    update_data = obj_in.dict(exclude_unset=True)
    
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_contact_messages(db: Session, contact_id: int, skip: int = 0, limit: int = 100) -> List[models.Message]:
    """
    Get messages for a specific contact.
    
    Args:
        db: Database session
        contact_id: Contact ID
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        List of messages for the contact
    """
    contact = get_contact_by_id(db, contact_id)
    if not contact:
        return []
    
    return db.query(models.Message).filter(
        models.Message.sender_id == contact.telegram_id
    ).order_by(models.Message.timestamp.desc()).offset(skip).limit(limit).all() 