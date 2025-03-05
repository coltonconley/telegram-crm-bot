import pytest
from unittest.mock import MagicMock, patch
from telegram_crm.telegram_integration import TelegramIntegration

@pytest.fixture
def mock_telethon_client():
    with patch('telegram_crm.telegram_integration.TelegramClient') as mock_client:
        # Configure the mock to return predefined responses
        mock_instance = MagicMock()
        mock_client.return_value = mock_instance
        
        # Mock the start method
        mock_instance.start.return_value = None
        
        # Set up mock messages
        mock_message = MagicMock()
        mock_message.text = "Hello, this is a test message"
        mock_message.date.hour = 14
        mock_message.date.weekday.return_value = 2
        
        # Configure the mock to yield messages
        mock_instance.iter_messages.return_value = [mock_message]
        
        yield mock_instance

async def test_connect(mock_telethon_client):
    # Test the connection process
    integration = TelegramIntegration(12345, "test_hash")
    session_string = await integration.connect(phone="+1234567890")
    
    # Verify client was started with the phone number
    mock_telethon_client.start.assert_called_once()
    
    # Verify we got a session string back
    assert isinstance(session_string, str) 