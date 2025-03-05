import os
import logging
from typing import Dict, Optional, Literal, Union
import aiohttp
import json
from datetime import datetime

from app.core.config import settings

# Set up logger
logger = logging.getLogger(__name__)

CategoryType = Literal["not_important", "followup_required", "unsure_ask_user"]

class AICategorization:
    """Service for AI-based message categorization using OpenAI or Anthropic."""
    
    def __init__(self):
        self.provider = settings.AI_PROVIDER  # "openai" or "anthropic"
        self.openai_api_key = settings.OPENAI_API_KEY
        self.anthropic_api_key = settings.ANTHROPIC_API_KEY
        self.openai_model = settings.OPENAI_MODEL  # e.g., "gpt-4", "gpt-3.5-turbo"
        self.anthropic_model = settings.ANTHROPIC_MODEL  # e.g., "claude-3-sonnet-20240229"
        
        # Validate configuration
        if self.provider not in ["openai", "anthropic"]:
            logger.warning(f"Invalid AI provider: {self.provider}. Defaulting to OpenAI.")
            self.provider = "openai"
            
        if self.provider == "openai" and not self.openai_api_key:
            logger.error("OpenAI API key not configured")
        
        if self.provider == "anthropic" and not self.anthropic_api_key:
            logger.error("Anthropic API key not configured")
    
    async def categorize_message(self, message_text: str) -> Dict:
        """
        Categorize a message using AI.
        
        Categories:
        1. not_important - Message doesn't require attention
        2. followup_required - Message needs a response
        3. unsure_ask_user - AI is unsure, need human judgment
        
        Returns:
            Dict: {
                "category": str,  # One of the categories above
                "confidence": float,  # Confidence score (0-1)
                "reasoning": str,  # AI's reasoning for categorization
                "timestamp": str  # ISO timestamp
            }
        """
        if not message_text:
            return {
                "category": "not_important",
                "confidence": 1.0,
                "reasoning": "Empty message",
                "timestamp": datetime.now().isoformat()
            }
        
        try:
            if self.provider == "openai":
                result = await self._categorize_with_openai(message_text)
            else:  # anthropic
                result = await self._categorize_with_anthropic(message_text)
                
            # Add timestamp
            result["timestamp"] = datetime.now().isoformat()
            return result
            
        except Exception as e:
            logger.error(f"Error categorizing message: {str(e)}")
            # Return default category when AI fails
            return {
                "category": "unsure_ask_user",
                "confidence": 0.0,
                "reasoning": f"Error occurred during categorization: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
    
    async def _categorize_with_openai(self, message_text: str) -> Dict:
        """Categorize a message using OpenAI's API."""
        if not self.openai_api_key:
            raise ValueError("OpenAI API key not configured")
        
        async with aiohttp.ClientSession() as session:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.openai_api_key}"
            }
            
            payload = {
                "model": self.openai_model,
                "messages": [
                    {"role": "system", "content": """
                    You are a message categorization assistant. Your task is to categorize incoming messages into one of three categories:
                    1. not_important - Message is routine, doesn't require attention or response
                    2. followup_required - Message needs a response or action
                    3. unsure_ask_user - You're not confident about categorization, need human judgment
                    
                    Respond with a JSON object containing:
                    - category: one of the three categories above
                    - confidence: a score between 0 and 1 indicating your confidence
                    - reasoning: brief explanation for your categorization
                    """},
                    {"role": "user", "content": message_text}
                ],
                "response_format": {"type": "json_object"}
            }
            
            async with session.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise ValueError(f"OpenAI API error: {response.status} - {error_text}")
                
                data = await response.json()
                content = data["choices"][0]["message"]["content"]
                
                try:
                    result = json.loads(content)
                    # Validate response format
                    if "category" not in result or "confidence" not in result or "reasoning" not in result:
                        raise ValueError("Invalid response format from OpenAI")
                    
                    # Validate category
                    if result["category"] not in ["not_important", "followup_required", "unsure_ask_user"]:
                        raise ValueError(f"Invalid category: {result['category']}")
                    
                    return result
                except json.JSONDecodeError:
                    raise ValueError(f"Failed to parse JSON response from OpenAI: {content}")
    
    async def _categorize_with_anthropic(self, message_text: str) -> Dict:
        """Categorize a message using Anthropic's API."""
        if not self.anthropic_api_key:
            raise ValueError("Anthropic API key not configured")
        
        async with aiohttp.ClientSession() as session:
            headers = {
                "Content-Type": "application/json",
                "x-api-key": self.anthropic_api_key,
                "anthropic-version": "2023-06-01"
            }
            
            system_prompt = """
            You are a message categorization assistant. Your task is to categorize incoming messages into one of three categories:
            1. not_important - Message is routine, doesn't require attention or response
            2. followup_required - Message needs a response or action
            3. unsure_ask_user - You're not confident about categorization, need human judgment
            
            Respond with a JSON object containing:
            - category: one of the three categories above
            - confidence: a score between 0 and 1 indicating your confidence
            - reasoning: brief explanation for your categorization
            """
            
            payload = {
                "model": self.anthropic_model,
                "system": system_prompt,
                "messages": [
                    {"role": "user", "content": message_text}
                ],
                "max_tokens": 1000
            }
            
            async with session.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json=payload
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise ValueError(f"Anthropic API error: {response.status} - {error_text}")
                
                data = await response.json()
                content = data["content"][0]["text"]
                
                try:
                    # Extract JSON from the response
                    json_start = content.find('{')
                    json_end = content.rfind('}') + 1
                    if json_start == -1 or json_end == 0:
                        raise ValueError(f"No JSON found in response: {content}")
                    
                    json_str = content[json_start:json_end]
                    result = json.loads(json_str)
                    
                    # Validate response format
                    if "category" not in result or "confidence" not in result or "reasoning" not in result:
                        raise ValueError("Invalid response format from Anthropic")
                    
                    # Validate category
                    if result["category"] not in ["not_important", "followup_required", "unsure_ask_user"]:
                        raise ValueError(f"Invalid category: {result['category']}")
                    
                    return result
                except (json.JSONDecodeError, ValueError) as e:
                    raise ValueError(f"Failed to parse response from Anthropic: {str(e)} - {content}")

# Create a singleton instance
ai_categorization = AICategorization() 