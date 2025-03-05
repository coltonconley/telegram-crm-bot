from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base_class import Base

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    telegram_message_id = Column(Integer, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    message_text = Column(Text)
    is_from_user = Column(Boolean, default=False)  # From CRM user to contact
    is_responded = Column(Boolean, default=False)  # Has been responded to
    timestamp = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    response_text = Column(Text, nullable=True)
    response_timestamp = Column(DateTime(timezone=True), nullable=True)
    category = Column(String, nullable=True)  # For ML classification
    ai_category = Column(String, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    ai_reasoning = Column(Text, nullable=True)
    ai_categorized_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    contact = relationship("Contact", back_populates="messages")
    user = relationship("User") 