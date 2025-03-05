from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.ml import MLPrediction, MLFeedback, MLStats
from app.services.ml_service import (
    categorize_message,
    add_training_feedback,
    get_ml_stats,
    retrain_model,
)
from app.services.user_service import get_current_user
from app.schemas.user import User

router = APIRouter()

@router.post("/predict", response_model=MLPrediction)
def predict_category(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Predict category for a message.
    """
    prediction = categorize_message(db, message_id)
    return prediction

@router.post("/feedback", response_model=MLFeedback)
def submit_feedback(
    message_id: int,
    correct_category: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Submit feedback for model training.
    """
    feedback = add_training_feedback(db, message_id, correct_category)
    return feedback

@router.get("/stats", response_model=MLStats)
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get ML model statistics.
    """
    stats = get_ml_stats(db)
    return stats

@router.post("/retrain")
def trigger_retraining(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Trigger model retraining.
    """
    retrain_model(db)
    return {"message": "Model retraining started"} 