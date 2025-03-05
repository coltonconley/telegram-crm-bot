import os
import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from typing import Dict, List, Optional, Tuple, Any
import datetime
import logging

from app.core.config import settings

# Set up logger
logger = logging.getLogger(__name__)

class MLEngine:
    def __init__(self):
        self.model_dir = settings.ML_MODEL_PATH
        self.model_path = os.path.join(self.model_dir, "message_classifier.joblib")
        self.vectorizer_path = os.path.join(self.model_dir, "vectorizer.joblib")
        self.stats_path = os.path.join(self.model_dir, "training_stats.joblib")
        self.model = None
        self.vectorizer = None
        self.training_stats = {}
        self._load_model()
    
    def _load_model(self) -> None:
        """Load the model and vectorizer if they exist"""
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.vectorizer_path):
                self.model = joblib.load(self.model_path)
                self.vectorizer = joblib.load(self.vectorizer_path)
                if os.path.exists(self.stats_path):
                    self.training_stats = joblib.load(self.stats_path)
                logger.info("ML model loaded successfully")
            else:
                logger.warning("No model found. Please train the model first.")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
    
    def train_model(self, messages: List[Dict]) -> Dict:
        """Train a new model on the message data"""
        if not messages:
            raise ValueError("No messages provided for training")
        
        # Ensure directory exists
        os.makedirs(self.model_dir, exist_ok=True)
        
        # Prepare data
        data = pd.DataFrame(messages)
        
        # Drop rows with missing category or message_text
        data = data.dropna(subset=['category', 'message_text'])
        
        if len(data) < 20:  # Minimum required for reasonable training
            raise ValueError(f"Not enough data for training. Need at least 20 samples, got {len(data)}")
        
        # Feature extraction
        X = data['message_text'].values
        y = data['category'].values
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Create and fit vectorizer
        self.vectorizer = TfidfVectorizer(max_features=5000)
        X_train_vectorized = self.vectorizer.fit_transform(X_train)
        
        # Train model
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model.fit(X_train_vectorized, y_train)
        
        # Evaluate
        X_test_vectorized = self.vectorizer.transform(X_test)
        y_pred = self.model.predict(X_test_vectorized)
        accuracy = accuracy_score(y_test, y_pred)
        
        # Save model and vectorizer
        joblib.dump(self.model, self.model_path)
        joblib.dump(self.vectorizer, self.vectorizer_path)
        
        # Save category distribution
        category_counts = data['category'].value_counts().to_dict()
        
        # Save training stats
        self.training_stats = {
            'training_data_count': len(data),
            'accuracy': accuracy,
            'last_trained': datetime.datetime.now().isoformat(),
            'category_distribution': category_counts
        }
        joblib.dump(self.training_stats, self.stats_path)
        
        return self.training_stats
    
    def predict_category(self, message_text: str) -> Dict:
        """Predict category for a message"""
        if not self.model or not self.vectorizer:
            raise ValueError("Model not loaded. Please train the model first.")
        
        # Vectorize input
        X = self.vectorizer.transform([message_text])
        
        # Get prediction and probabilities
        category = self.model.predict(X)[0]
        proba = self.model.predict_proba(X)[0]
        
        # Map probabilities to classes
        class_probabilities = {
            cls: float(prob) 
            for cls, prob in zip(self.model.classes_, proba)
        }
        
        return {
            'predicted_category': category,
            'confidence': float(max(proba)),
            'class_probabilities': class_probabilities
        }
    
    def get_stats(self) -> Dict:
        """Get model statistics"""
        return {
            'model_exists': self.model is not None and self.vectorizer is not None,
            'training_data_count': self.training_stats.get('training_data_count', 0),
            'accuracy': self.training_stats.get('accuracy', 0),
            'last_trained': self.training_stats.get('last_trained'),
            'category_distribution': self.training_stats.get('category_distribution', {})
        }

ml_engine = MLEngine() 