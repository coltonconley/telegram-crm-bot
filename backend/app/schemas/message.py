from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

# Shared properties
class MessageBase(BaseModel):
    message_text: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[int] = 0
    scheduled_call_time: Optional[datetime] = None
    action_notes: Optional[str] = None
    ai_category: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_reasoning: Optional[str] = None

# Properties to receive via API on creation
class MessageCreate(MessageBase):
    telegram_message_id: int
    chat_id: int
    sender_id: int
    timestamp: datetime
    media_info: Optional[Dict[str, Any]] = None

# Properties to receive via API on update
class MessageUpdate(MessageBase):
    is_read: Optional[bool] = None
    is_responded: Optional[bool] = None

# Database model properties
class MessageInDBBase(MessageBase):
    id: int
    telegram_message_id: int
    chat_id: int
    sender_id: int
    timestamp: datetime
    is_read: bool
    is_responded: bool
    media_info: Optional[Dict[str, Any]] = None

    class Config:
        orm_mode = True

# Properties returned to client
class Message(MessageInDBBase):
    pass

# Properties stored in DB
class MessageInDB(MessageInDBBase):
    pass 