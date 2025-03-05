from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.preprocessing import StandardScaler
import joblib
import numpy as np

class MessageFeatureExtractor:
    def __init__(self):
        self.text_vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        
    def extract_metadata_features(self, messages):
        """Extract non-text features from messages"""
        features = np.zeros((len(messages), 5))
        
        for i, msg in enumerate(messages):
            features[i, 0] = len(msg.text) if msg.text else 0  # Length
            features[i, 1] = msg.date.hour  # Hour of day
            features[i, 2] = msg.date.weekday()  # Day of week
            features[i, 3] = 1 if '?' in (msg.text or '') else 0  # Has question
            features[i, 4] = self._urgency_score(msg.text)  # Urgency heuristic
            
        return features
    
    def _urgency_score(self, text):
        """Calculate urgency score based on keywords and patterns"""
        if not text:
            return 0
            
        urgent_terms = ['urgent', 'asap', 'emergency', 'immediately', 'help']
        return sum(term in text.lower() for term in urgent_terms) 