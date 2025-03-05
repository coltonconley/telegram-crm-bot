from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    """
    Schema for the authentication token response.
    
    This is returned when a user successfully logs in.
    """
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    """
    Schema for the token payload (JWT content).
    
    This represents the data decoded from a JWT token.
    """
    sub: Optional[int] = None 