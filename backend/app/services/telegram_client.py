import asyncio
import logging
import uuid
from typing import Dict, Tuple, Optional, Any
import os

from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError, PhoneCodeInvalidError
from telethon.sessions import StringSession

from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Store ongoing auth sessions
auth_sessions: Dict[str, Dict[str, Any]] = {}

async def get_telegram_client(session_string: Optional[str] = None) -> TelegramClient:
    """
    Create or get a Telegram client instance
    """
    if not settings.TELEGRAM_API_ID or not settings.TELEGRAM_API_HASH:
        raise ValueError("Telegram API credentials not configured")
    
    if session_string:
        # Create client from session string
        client = TelegramClient(
            StringSession(session_string),
            settings.TELEGRAM_API_ID,
            settings.TELEGRAM_API_HASH
        )
    else:
        # Create new client
        client = TelegramClient(
            StringSession(),
            settings.TELEGRAM_API_ID,
            settings.TELEGRAM_API_HASH
        )
    
    return client

# Global client for background operations
telegram_client = None

async def start_telegram_client():
    """Start global Telegram client"""
    global telegram_client
    
    if not telegram_client:
        telegram_client = await get_telegram_client()
        await telegram_client.start(bot_token=settings.TELEGRAM_BOT_TOKEN)
        logger.info("Global Telegram client started")

async def stop_telegram_client():
    """Stop global Telegram client"""
    global telegram_client
    
    if telegram_client:
        await telegram_client.disconnect()
        telegram_client = None
        logger.info("Global Telegram client stopped")

async def start_telegram_auth(phone: str) -> Tuple[str, str]:
    """
    Start Telegram authentication process
    
    Returns:
        Tuple[str, str]: Auth ID and phone code hash
    """
    client = await get_telegram_client()
    
    try:
        await client.connect()
        
        # Start authentication
        result = await client.send_code_request(phone)
        phone_code_hash = result.phone_code_hash
        
        # Generate unique auth ID
        auth_id = str(uuid.uuid4())
        
        # Store session info
        auth_sessions[auth_id] = {
            "client": client,
            "phone": phone,
            "phone_code_hash": phone_code_hash
        }
        
        return auth_id, phone_code_hash
    
    except Exception as e:
        if client:
            await client.disconnect()
        raise e

async def confirm_telegram_auth(auth_id: str, code: str) -> str:
    """
    Confirm Telegram authentication with verification code
    
    Returns:
        str: Session string
    """
    if auth_id not in auth_sessions:
        raise ValueError("Invalid authentication session")
    
    auth_info = auth_sessions[auth_id]
    client = auth_info["client"]
    phone = auth_info["phone"]
    phone_code_hash = auth_info["phone_code_hash"]
    
    try:
        # Sign in with code
        await client.sign_in(phone, code, phone_code_hash=phone_code_hash)
        
        # Get session string
        session_string = client.session.save()
        
        # Clean up
        await client.disconnect()
        del auth_sessions[auth_id]
        
        return session_string
    
    except PhoneCodeInvalidError:
        if client:
            await client.disconnect()
        raise ValueError("Invalid verification code")
    
    except SessionPasswordNeededError:
        if client:
            await client.disconnect()
        raise ValueError("Two-factor authentication required. Please use a phone number without 2FA.")
    
    except Exception as e:
        if client:
            await client.disconnect()
        raise e

async def send_message(user_session: str, contact_id: int, text: str) -> bool:
    """
    Send a message to a Telegram contact
    
    Returns:
        bool: True if successful
    """
    client = await get_telegram_client(user_session)
    
    try:
        await client.connect()
        
        # Send message
        await client.send_message(contact_id, text)
        
        # Clean up
        await client.disconnect()
        
        return True
    
    except Exception as e:
        if client:
            await client.disconnect()
        raise e

async def get_contacts(user_session: str) -> list:
    """
    Get user's Telegram contacts
    
    Returns:
        list: List of contacts
    """
    client = await get_telegram_client(user_session)
    
    try:
        await client.connect()
        
        # Get dialogs
        dialogs = await client.get_dialogs()
        
        # Extract contacts
        contacts = []
        for dialog in dialogs:
            if dialog.is_user:
                user = dialog.entity
                contacts.append({
                    "telegram_id": user.id,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "phone": user.phone if hasattr(user, "phone") else None,
                    "display_name": user.first_name + (f" {user.last_name}" if user.last_name else "")
                })
        
        # Clean up
        await client.disconnect()
        
        return contacts
    
    except Exception as e:
        if client:
            await client.disconnect()
        raise e 