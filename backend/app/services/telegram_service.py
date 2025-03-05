import uuid
import asyncio
from typing import Dict, Optional, List, Any
from app.core.config import settings
from app.telegram_client import TelegramIntegration
from app.security_utils import SessionEncryptor

# Store ongoing auth processes
auth_sessions: Dict[str, Dict[str, Any]] = {}

# Session encryptor
encryptor = SessionEncryptor(key=settings.SESSION_ENCRYPTION_KEY)

async def start_telegram_auth(phone: str, user_id: int) -> str:
    """
    Start the Telegram authentication process.
    
    Args:
        phone: User's phone number
        user_id: User ID in the application
        
    Returns:
        Auth session ID
    """
    # Create a new Telegram client
    client = TelegramIntegration(
        api_id=settings.TELEGRAM_API_ID,
        api_hash=settings.TELEGRAM_API_HASH
    )
    
    # Generate a unique ID for this auth session
    auth_id = str(uuid.uuid4())
    
    # Store the client and user information
    auth_sessions[auth_id] = {
        "client": client,
        "user_id": user_id,
        "phone": phone,
        "status": "awaiting_code"
    }
    
    # Start the authentication process
    await client.connect(phone=phone)
    
    return auth_id

async def confirm_telegram_auth(auth_id: str, code: str, user_id: int) -> str:
    """
    Confirm Telegram authentication with received code.
    
    Args:
        auth_id: Auth session ID from start_telegram_auth
        code: Verification code received from Telegram
        user_id: User ID in the application
        
    Returns:
        Encrypted session string
    """
    # Get the auth session
    if auth_id not in auth_sessions:
        raise ValueError("Invalid auth session ID")
    
    auth_session = auth_sessions[auth_id]
    
    # Verify user ID
    if auth_session["user_id"] != user_id:
        raise ValueError("User ID mismatch")
    
    # Check status
    if auth_session["status"] != "awaiting_code":
        raise ValueError("Invalid auth status")
    
    # Get the client
    client = auth_session["client"]
    
    # Submit the code
    session_string = await client.client.sign_in(auth_session["phone"], code)
    
    # Encrypt the session string
    encrypted_session = encryptor.encrypt_session(session_string)
    
    # Clean up
    del auth_sessions[auth_id]
    
    return encrypted_session

async def send_telegram_message(
    session_string: str,
    chat_id: int,
    text: str,
    reply_to: Optional[int] = None,
) -> bool:
    """
    Send a message via Telegram.
    
    Args:
        session_string: Encrypted session string
        chat_id: Telegram chat ID
        text: Message text
        reply_to: Optional message ID to reply to
        
    Returns:
        True if successful, False otherwise
    """
    # Decrypt the session string
    decrypted_session = encryptor.decrypt_session(session_string)
    
    # Create a Telegram client
    client = TelegramIntegration(
        api_id=settings.TELEGRAM_API_ID,
        api_hash=settings.TELEGRAM_API_HASH,
        session_string=decrypted_session
    )
    
    # Connect to Telegram
    await client.connect()
    
    # Send the message
    await client.client.send_message(
        entity=chat_id,
        message=text,
        reply_to=reply_to
    )
    
    return True

async def fetch_unresponded_messages(session_string: str, days_back: int = 7) -> List[Dict[str, Any]]:
    """
    Fetch unresponded messages from Telegram.
    
    Args:
        session_string: Encrypted session string
        days_back: Number of days to look back
        
    Returns:
        List of unresponded messages
    """
    # Decrypt the session string
    decrypted_session = encryptor.decrypt_session(session_string)
    
    # Create a Telegram client
    client = TelegramIntegration(
        api_id=settings.TELEGRAM_API_ID,
        api_hash=settings.TELEGRAM_API_HASH,
        session_string=decrypted_session
    )
    
    # Connect to Telegram
    await client.connect()
    
    # Get unresponded messages
    messages = await client.get_unresponded_messages(days_back=days_back)
    
    return messages 