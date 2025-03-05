from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, BigInteger
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.database import Base

class Message(Base):
    """
    Model for storing Telegram messages.
    
    This table stores all messages that need to be tracked by the CRM system.
    """
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    telegram_message_id = Column(BigInteger, nullable=False)
    chat_id = Column(BigInteger, nullable=False)
    sender_id = Column(BigInteger, nullable=False)
    message_text = Column(Text)
    timestamp = Column(DateTime, nullable=False)
    is_read = Column(Boolean, default=False)
    is_responded = Column(Boolean, default=False)
    category = Column(String(50), index=True)
    priority = Column(Integer, default=0)
    scheduled_call_time = Column(DateTime)
    action_notes = Column(Text)
    media_info = Column(JSON)
    
    # Relationships
    contact = relationship("Contact", back_populates="messages", foreign_keys=[sender_id], 
                          primaryjoin="Message.sender_id == Contact.telegram_id")
    
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )

class Contact(Base):
    """
    Model for storing Telegram contacts.
    
    This table stores information about all contacts the user interacts with.
    """
    __tablename__ = "contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, nullable=False, unique=True)
    display_name = Column(String(255))
    username = Column(String(255))
    phone_number = Column(String(50))
    first_name = Column(String(255))
    last_name = Column(String(255))
    additional_info = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    messages = relationship("Message", back_populates="contact",
                           primaryjoin="Contact.telegram_id == Message.sender_id")
    
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )

class Category(Base):
    """
    Model for message categories.
    
    This table stores predefined and user-defined categories for messages.
    """
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)
    description = Column(Text)
    is_system = Column(Boolean, default=False)
    
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )

class MLTrainingData(Base):
    """
    Model for storing ML training data.
    
    This table stores features and labels for training the ML model.
    """
    __tablename__ = "ml_training_data"
    
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"))
    features = Column(JSON, nullable=False)
    label = Column(String(50), nullable=False)
    feedback_source = Column(String(50), default="user")
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    message = relationship("Message")
    
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )

class User(Base):
    """
    Model for storing application users.
    
    This table stores user information for authentication.
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    telegram_session = Column(Text)
    
    __table_args__ = (
        {"sqlite_autoincrement": True},
    ) 