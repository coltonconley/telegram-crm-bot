from typing import Dict, Optional
from datetime import datetime
from pydantic import BaseModel


class MLPrediction(BaseModel):
    """
    Schema for ML prediction results.
    
    This is returned when a message is categorized by the ML model.
    """
    message_id: int
    predicted_category: str
    confidence: float
    confidence_scores: Dict[str, float]


class MLFeedback(BaseModel):
    """
    Schema for ML feedback submission.
    
    This represents feedback data submitted for ML model training.
    """
    id: int
    message_id: int
    correct_category: str
    feedback_source: str
    created_at: datetime
    
    class Config:
        orm_mode = True


class MLStats(BaseModel):
    """
    Schema for ML model statistics.
    
    This provides information about the current state of the ML model.
    """
    training_data_count: int
    category_distribution: Dict[str, int]
    recent_feedback_count: int
    model_exists: bool
    last_trained: Optional[datetime] = None 