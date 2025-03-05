from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.contact import Contact, ContactCreate, ContactUpdate, ContactWithMessages
from app.schemas.message import Message
from app.services.contact_service import (
    get_contacts,
    get_contact_by_id,
    create_contact,
    update_contact,
    get_contact_messages,
)
from app.services.user_service import get_current_user
from app.schemas.user import User

router = APIRouter()

@router.get("/", response_model=List[Contact])
def read_contacts(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve all contacts.
    """
    contacts = get_contacts(db, skip=skip, limit=limit)
    return contacts

@router.post("/", response_model=Contact)
def create_new_contact(
    contact_in: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create a new contact.
    """
    contact = create_contact(db, contact_in=contact_in)
    return contact

@router.get("/{contact_id}", response_model=Contact)
def read_contact_by_id(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve a specific contact by ID.
    """
    contact = get_contact_by_id(db, contact_id=contact_id)
    if contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact

@router.put("/{contact_id}", response_model=Contact)
def update_contact_by_id(
    contact_id: int,
    contact_in: ContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update a contact.
    """
    contact = get_contact_by_id(db, contact_id=contact_id)
    if contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    contact = update_contact(db, db_obj=contact, obj_in=contact_in)
    return contact

@router.get("/{contact_id}/messages", response_model=List[Message])
def read_contact_messages(
    contact_id: int,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve all messages for a specific contact.
    """
    contact = get_contact_by_id(db, contact_id=contact_id)
    if contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    messages = get_contact_messages(db, contact_id=contact_id, skip=skip, limit=limit)
    return messages

@router.get("/{contact_id}/with-messages", response_model=ContactWithMessages)
def read_contact_with_messages(
    contact_id: int,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve a contact with its messages.
    """
    contact = get_contact_by_id(db, contact_id=contact_id)
    if contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    messages = get_contact_messages(db, contact_id=contact_id, skip=skip, limit=limit)
    
    # Convert database model to Pydantic schema
    from app.schemas.contact import ContactWithMessages
    result = ContactWithMessages.from_orm(contact)
    result.messages = messages
    
    return result 