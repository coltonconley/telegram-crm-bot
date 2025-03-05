from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

# Shared properties
class ContactBase(BaseModel):
    display_name: Optional[str] = None
    username: Optional[str] = None
    phone_number: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    additional_info: Optional[Dict[str, Any]] = None

# Properties to receive via API on creation
class ContactCreate(ContactBase):
    telegram_id: int

# Properties to receive via API on update
class ContactUpdate(ContactBase):
    pass

# Database model properties
class ContactInDBBase(ContactBase):
    id: int
    telegram_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# Properties returned to client
class Contact(ContactInDBBase):
    pass

# Properties stored in DB
class ContactInDB(ContactInDBBase):
    pass

# Contact with messages
class ContactWithMessages(Contact):
    messages: List["Message"] = [] 