from typing import Dict, Any, List, Optional
import joblib
import os
import numpy as np
from sqlalchemy.orm import Session
from app.db import models
from app.ml_engine import MessageFeatureExtractor
from app.schemas.ml import MLPrediction, MLFeedback, MLStats
from datetime import datetime, timedelta

# Path to the ML model file
MODEL_PATH = "models/message_classifier.joblib"

# Feature extractor instance
feature_extractor = MessageFeatureExtractor()

def categorize_message(db: Session, message_id: int) -> MLPrediction:
    """
    Predict category for a message.
    
    Args:
        db: Database session
        message_id: ID of the message to categorize
        
    Returns:
        Prediction with confidence scores
    """
    # Get message from database
    message = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not message:
        raise ValueError(f"Message with ID {message_id} not found")
    
    # Check if we have a trained model
    if not os.path.exists(MODEL_PATH):
        # If no model exists, use a fallback category
        return MLPrediction(
            message_id=message_id,
            predicted_category="needs_attention",
            confidence=1.0,
            confidence_scores={
                "needs_attention": 1.0,
                "ignore": 0.0,
                "schedule_call": 0.0,
                "action_item": 0.0
            }
        )
    
    # Load the model
    model = joblib.load(MODEL_PATH)
    
    # Extract features from the message
    message_obj = _message_db_to_obj(message)
    features = feature_extractor.extract_metadata_features([message_obj])
    
    # Get text features
    if message.message_text:
        from sklearn.feature_extraction.text import TfidfVectorizer
        vectorizer = joblib.load("models/tfidf_vectorizer.joblib")
        text_features = vectorizer.transform([message.message_text])
        # Combine with metadata features
        import scipy.sparse as sp
        combined_features = sp.hstack([text_features, features])
    else:
        # Only use metadata features
        combined_features = features
    
    # Get prediction probabilities
    proba = model.predict_proba(combined_features)
    
    # Get the predicted category and confidence
    predicted_idx = np.argmax(proba, axis=1)[0]
    confidence = proba[0][predicted_idx]
    predicted_category = model.classes_[predicted_idx]
    
    # Create confidence scores dictionary
    confidence_scores = {cat: float(proba[0][i]) for i, cat in enumerate(model.classes_)}
    
    # Return prediction
    return MLPrediction(
        message_id=message_id,
        predicted_category=predicted_category,
        confidence=float(confidence),
        confidence_scores=confidence_scores
    )

def add_training_feedback(db: Session, message_id: int, correct_category: str) -> MLFeedback:
    """
    Add training feedback for a message.
    
    Args:
        db: Database session
        message_id: ID of the message
        correct_category: Correct category label
        
    Returns:
        Feedback information
    """
    # Get message from database
    message = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not message:
        raise ValueError(f"Message with ID {message_id} not found")
    
    # Extract features
    message_obj = _message_db_to_obj(message)
    features = feature_extractor.extract_metadata_features([message_obj]).tolist()[0]
    
    # Create the training data record
    ml_data = models.MLTrainingData(
        message_id=message_id,
        features={"metadata": features},
        label=correct_category,
        feedback_source="user"
    )
    
    db.add(ml_data)
    db.commit()
    db.refresh(ml_data)
    
    # Update the message category
    message.category = correct_category
    db.commit()
    
    # Return feedback
    return MLFeedback(
        id=ml_data.id,
        message_id=message_id,
        correct_category=correct_category,
        feedback_source="user",
        created_at=ml_data.created_at
    )

def get_ml_stats(db: Session) -> MLStats:
    """
    Get ML model statistics.
    
    Args:
        db: Database session
        
    Returns:
        Statistics about the ML model
    """
    # Get training data count
    training_count = db.query(models.MLTrainingData).count()
    
    # Get distribution of categories
    category_counts = db.query(
        models.MLTrainingData.label, 
        db.func.count(models.MLTrainingData.id)
    ).group_by(models.MLTrainingData.label).all()
    
    category_distribution = {cat: count for cat, count in category_counts}
    
    # Get recent feedback (last 7 days)
    recent_count = db.query(models.MLTrainingData).filter(
        models.MLTrainingData.created_at >= datetime.utcnow() - timedelta(days=7)
    ).count()
    
    # Check if model exists and get last training time
    model_exists = os.path.exists(MODEL_PATH)
    last_trained = None
    if model_exists:
        # Get file modification time
        last_trained = datetime.fromtimestamp(os.path.getmtime(MODEL_PATH))
    
    return MLStats(
        training_data_count=training_count,
        category_distribution=category_distribution,
        recent_feedback_count=recent_count,
        model_exists=model_exists,
        last_trained=last_trained
    )

def retrain_model(db: Session) -> bool:
    """
    Retrain the ML model with all available training data.
    
    Args:
        db: Database session
        
    Returns:
        True if successful, False otherwise
    """
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.feature_extraction.text import TfidfVectorizer
    
    # Get all training data
    training_data = db.query(models.MLTrainingData).all()
    if not training_data:
        return False
    
    # Get all messages referenced by training data
    message_ids = [td.message_id for td in training_data]
    messages = db.query(models.Message).filter(models.Message.id.in_(message_ids)).all()
    message_map = {msg.id: msg for msg in messages}
    
    # Prepare features and labels
    X_metadata = []
    texts = []
    y = []
    
    for td in training_data:
        if td.message_id in message_map:
            message = message_map[td.message_id]
            message_obj = _message_db_to_obj(message)
            
            # Get metadata features
            metadata_features = feature_extractor.extract_metadata_features([message_obj]).tolist()[0]
            X_metadata.append(metadata_features)
            
            # Get text
            texts.append(message.message_text or "")
            
            # Get label
            y.append(td.label)
    
    # Convert to numpy arrays
    X_metadata = np.array(X_metadata)
    y = np.array(y)
    
    # Create TF-IDF vectorizer for text features
    vectorizer = TfidfVectorizer(max_features=1000, stop_words='english', ngram_range=(1, 2))
    X_text = vectorizer.fit_transform(texts)
    
    # Create and train the model
    from sklearn.ensemble import RandomForestClassifier
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    
    # Combine features
    import scipy.sparse as sp
    X = sp.hstack([X_text, X_metadata])
    
    # Fit the model
    model.fit(X, y)
    
    # Save the model and vectorizer
    os.makedirs("models", exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(vectorizer, "models/tfidf_vectorizer.joblib")
    
    return True

def _message_db_to_obj(message: models.Message) -> Any:
    """
    Convert a database message to an object for feature extraction.
    
    Args:
        message: Database message object
        
    Returns:
        Object with properties needed for feature extraction
    """
    from collections import namedtuple
    MessageObj = namedtuple('MessageObj', ['text', 'date'])
    
    from datetime import datetime
    message_date = message.timestamp or datetime.utcnow()
    
    return MessageObj(
        text=message.message_text or "",
        date=message_date
    ) 