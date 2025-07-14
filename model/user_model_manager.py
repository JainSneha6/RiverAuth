import pandas as pd
import pickle
import os
from collections import defaultdict
import json
from datetime import datetime
import numpy as np
from river.anomaly import HalfSpaceTrees
from river.preprocessing import StandardScaler
from river.compose import Pipeline
from scipy.stats import entropy
from scipy.spatial.distance import mahalanobis
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UserBehaviorModelManager:
    """
    Manages user-specific behavioral models with online learning capabilities
    """
    def __init__(self, models_dir="user_models"):
        self.models_dir = models_dir
        self.create_models_directory()
        
        # Track model metadata
        self.user_model_metadata = defaultdict(lambda: {
            "typing": {"samples": 0, "last_updated": None, "anomaly_scores": []},
            "tap": {"samples": 0, "last_updated": None, "anomaly_scores": []},
            "swipe": {"samples": 0, "last_updated": None, "anomaly_scores": []}
        })
        
        # Model configurations
        self.model_config = {
            "typing": {
                "features": [
                    "typing_event_rate", "inter_typing_variability", "avg_user_typing_wpm",
                    "avg_user_typing_duration", "avg_user_typing_length", "characters_per_second",
                    "wpm_deviation", "duration_deviation", "length_deviation"
                ],
                "warmup_threshold": 20
            },
            "tap": {
                "features": [
                    "tap_event_rate", "inter_tap_variability", "avg_user_tap_duration",
                    "tap_region_entropy", "tap_pressure", "distance_from_user_mean",
                    "normalized_x", "normalized_y", "is_near_edge", "tap_pressure_deviation"
                ],
                "warmup_threshold": 15
            },
            "swipe": {
                "features": [
                    "swipe_event_rate", "inter_swipe_variability", "avg_user_swipe_speed",
                    "avg_user_swipe_distance", "swipe_direction_entropy", 
                    "swipe_direction_consistency", "distance", "duration", "angle"
                ],
                "warmup_threshold": 10
            }
        }
        
        self.load_metadata()
    
    def create_models_directory(self):
        """Create directory structure for user models"""
        directories = [
            self.models_dir,
            f"{self.models_dir}/typing",
            f"{self.models_dir}/tap", 
            f"{self.models_dir}/swipe",
            f"{self.models_dir}/metadata"
        ]
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
    
    def get_model_path(self, user_id, model_type):
        """Get file path for user-specific model"""
        return f"{self.models_dir}/{model_type}/user_{user_id}_{model_type}_model.pkl"
    
    def get_metadata_path(self, user_id):
        """Get file path for user metadata"""
        return f"{self.models_dir}/metadata/user_{user_id}_metadata.json"
    
    def create_new_model(self, model_type):
        """Create a new River online learning model"""
        return Pipeline(
            StandardScaler(),
            HalfSpaceTrees(
                n_trees=50,
                height=8,
                window_size=250,
                seed=42
            )
        )
    
    def load_or_create_model(self, user_id, model_type):
        """Load existing model or create new one for user"""
        model_path = self.get_model_path(user_id, model_type)
        
        if os.path.exists(model_path):
            try:
                with open(model_path, 'rb') as f:
                    model = pickle.load(f)
                logger.info(f"Loaded existing {model_type} model for user {user_id}")
                return model
            except Exception as e:
                logger.error(f"Error loading model for user {user_id}: {e}")
        
        # Create new model
        model = self.create_new_model(model_type)
        logger.info(f"Created new {model_type} model for user {user_id}")
        return model
    
    def save_model(self, user_id, model_type, model):
        """Save user model to disk"""
        model_path = self.get_model_path(user_id, model_type)
        try:
            with open(model_path, 'wb') as f:
                pickle.dump(model, f)
            logger.info(f"Saved {model_type} model for user {user_id}")
        except Exception as e:
            logger.error(f"Error saving model for user {user_id}: {e}")
    
    def load_metadata(self):
        """Load user model metadata"""
        metadata_dir = f"{self.models_dir}/metadata"
        if os.path.exists(metadata_dir):
            for filename in os.listdir(metadata_dir):
                if filename.endswith('_metadata.json'):
                    user_id = filename.replace('_metadata.json', '').replace('user_', '')
                    try:
                        with open(f"{metadata_dir}/{filename}", 'r') as f:
                            self.user_model_metadata[user_id] = json.load(f)
                    except Exception as e:
                        logger.error(f"Error loading metadata for user {user_id}: {e}")
    
    def save_metadata(self, user_id):
        """Save user model metadata"""
        metadata_path = self.get_metadata_path(user_id)
        try:
            with open(metadata_path, 'w') as f:
                json.dump(self.user_model_metadata[user_id], f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving metadata for user {user_id}: {e}")
    
    def extract_features(self, session_data, model_type):
        """Extract relevant features for specific model type"""
        features = {}
        required_features = self.model_config[model_type]["features"]
        
        for feature in required_features:
            if feature in session_data:
                try:
                    features[feature] = float(session_data[feature])
                except (ValueError, TypeError):
                    features[feature] = 0.0
            else:
                features[feature] = 0.0
        
        return features
    
    def update_user_model(self, user_id, model_type, session_data):
        """
        Update user-specific model with new data (online learning)
        Returns: (anomaly_score, is_warmup_phase)
        """
        # Extract features for this model type
        features = self.extract_features(session_data, model_type)
        
        if not features:
            return 0.0, True
        
        # Load or create model
        model = self.load_or_create_model(user_id, model_type)
        
        # Update metadata
        metadata = self.user_model_metadata[user_id][model_type]
        metadata["samples"] += 1
        metadata["last_updated"] = datetime.now()
        
        # Check if in warmup phase
        warmup_threshold = self.model_config[model_type]["warmup_threshold"]
        is_warmup = metadata["samples"] < warmup_threshold
        
        if is_warmup:
            # During warmup, just learn without scoring
            model.learn_one(features)
            anomaly_score = 0.0
            logger.info(f"Warmup phase for user {user_id} {model_type}: {metadata['samples']}/{warmup_threshold}")
        else:
            # Score first, then learn (online learning)
            anomaly_score = model.score_one(features)
            model.learn_one(features)
            
            # Track anomaly scores for analysis
            metadata["anomaly_scores"].append(anomaly_score)
            if len(metadata["anomaly_scores"]) > 100:  # Keep last 100 scores
                metadata["anomaly_scores"] = metadata["anomaly_scores"][-100:]
        
        # Save updated model and metadata
        self.save_model(user_id, model_type, model)
        self.save_metadata(user_id)
        
        return anomaly_score, is_warmup
    
    def process_user_session(self, session_data):
        """
        Process a complete session for a user across all model types
        """
        user_id = str(session_data.get("user_id", "unknown"))
        
        if user_id == "unknown":
            logger.warning("No user_id found in session data")
            return None
        
        results = {
            "user_id": user_id,
            "timestamp": datetime.now(),
            "models": {}
        }
        
        # Process each model type
        for model_type in ["typing", "tap", "swipe"]:
            # Check if session contains relevant features for this model
            required_features = self.model_config[model_type]["features"]
            has_features = any(feature in session_data for feature in required_features)
            
            if has_features:
                anomaly_score, is_warmup = self.update_user_model(user_id, model_type, session_data)
                
                results["models"][model_type] = {
                    "anomaly_score": anomaly_score,
                    "is_warmup": is_warmup,
                    "samples_count": self.user_model_metadata[user_id][model_type]["samples"]
                }
                
                logger.info(f"User {user_id} {model_type}: score={anomaly_score:.3f}, samples={results['models'][model_type]['samples_count']}")
        
        return results
    
    def get_user_model_stats(self, user_id):
        """Get comprehensive stats for user's models"""
        if user_id not in self.user_model_metadata:
            return None
        
        stats = {
            "user_id": user_id,
            "models": {}
        }
        
        for model_type in ["typing", "tap", "swipe"]:
            metadata = self.user_model_metadata[user_id][model_type]
            model_path = self.get_model_path(user_id, model_type)
            
            stats["models"][model_type] = {
                "samples": metadata["samples"],
                "last_updated": metadata["last_updated"],
                "model_exists": os.path.exists(model_path),
                "avg_anomaly_score": np.mean(metadata["anomaly_scores"]) if metadata["anomaly_scores"] else 0.0,
                "recent_scores": metadata["anomaly_scores"][-10:] if metadata["anomaly_scores"] else []
            }
        
        return stats
    
    def retrain_user_model(self, user_id, model_type, historical_data):
        """
        Completely retrain a user's model with historical data
        """
        logger.info(f"Retraining {model_type} model for user {user_id}")
        
        # Create fresh model
        model = self.create_new_model(model_type)
        
        # Reset metadata
        self.user_model_metadata[user_id][model_type] = {
            "samples": 0,
            "last_updated": None,
            "anomaly_scores": []
        }
        
        # Train on historical data
        for session in historical_data:
            features = self.extract_features(session, model_type)
            if features:
                model.learn_one(features)
                self.user_model_metadata[user_id][model_type]["samples"] += 1
        
        # Save retrained model
        self.save_model(user_id, model_type, model)
        self.save_metadata(user_id)
        
        logger.info(f"Retrained {model_type} model for user {user_id} with {len(historical_data)} samples")

# Global model manager instance
model_manager = UserBehaviorModelManager()

def process_behavior_stream(session_data):
    """
    Main function for processing streaming behavioral data
    Compatible with existing WebSocket integration
    """
    return model_manager.process_user_session(session_data)

def get_user_stats(user_id):
    """Get user model statistics"""
    return model_manager.get_user_model_stats(user_id)

def retrain_user_models(user_id, historical_sessions):
    """Retrain all models for a user"""
    for model_type in ["typing", "tap", "swipe"]:
        model_manager.retrain_user_model(user_id, model_type, historical_sessions)
