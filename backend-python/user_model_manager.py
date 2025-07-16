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
                "warmup_threshold": 5  # Reduced from 20
            },
            "tap": {
                "features": [
                    "tap_event_rate", "inter_tap_variability", "avg_user_tap_duration",
                    "tap_region_entropy", "tap_pressure", "distance_from_user_mean",
                    "normalized_x", "normalized_y", "is_near_edge", "tap_pressure_deviation"
                ],
                "warmup_threshold": 5  # Reduced from 15
            },
            "swipe": {
                "features": [
                    "swipe_event_rate", "inter_swipe_variability", "avg_user_swipe_speed",
                    "avg_user_swipe_distance", "swipe_direction_entropy", 
                    "swipe_direction_consistency", "distance", "duration", "angle"
                ],
                "warmup_threshold": 5  # Reduced from 10
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
        """Create a new River online learning model with immediate responsiveness"""
        return Pipeline(
            StandardScaler(),
            HalfSpaceTrees(
                n_trees=25,        # Balanced tree count
                height=3,          # Shallow trees for faster response
                window_size=30,    # Small window for immediate adaptation
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
    
    def calculate_statistical_score(self, user_id, model_type, features, metadata):
        """Calculate statistical anomaly score with full 0.0-1.0 range"""
        # Initialize user statistics if not exists
        if not hasattr(self, 'user_feature_stats'):
            self.user_feature_stats = defaultdict(lambda: defaultdict(dict))
        
        stats_key = f"{user_id}_{model_type}"
        anomaly_scores = []
        
        for feature_name, value in features.items():
            if not isinstance(value, (int, float)):
                continue
                
            # Get or initialize feature statistics
            if feature_name not in self.user_feature_stats[stats_key]:
                self.user_feature_stats[stats_key][feature_name] = {
                    "sum": 0, "sq_sum": 0, "n": 0, "values": []
                }
            
            stats = self.user_feature_stats[stats_key][feature_name]
            
            # Update running statistics
            stats["sum"] += value
            stats["sq_sum"] += value**2
            stats["n"] += 1
            stats["values"].append(value)
            
            # Keep only recent values for calculation (smaller window for more sensitivity)
            if len(stats["values"]) > 15:
                old_val = stats["values"].pop(0)
                stats["sum"] -= old_val
                stats["sq_sum"] -= old_val**2
                stats["n"] = len(stats["values"])
            
            # Calculate z-score if we have enough samples
            if stats["n"] >= 3:
                mean = stats["sum"] / stats["n"]
                variance = (stats["sq_sum"] / stats["n"]) - (mean**2)
                std = max(variance**0.5, 1e-6)  # Prevent division by zero
                
                z_score = abs(value - mean) / std
                
                # Enhanced scoring with full 0.0-1.0 range utilization
                if z_score <= 0.5:
                    feature_anomaly = z_score * 0.2  # Very normal: 0.0-0.1
                elif z_score <= 1.0:
                    feature_anomaly = 0.1 + (z_score - 0.5) * 0.3  # Normal: 0.1-0.25
                elif z_score <= 2.0:
                    feature_anomaly = 0.25 + (z_score - 1.0) * 0.35  # Suspicious: 0.25-0.6
                else:
                    feature_anomaly = 0.6 + min((z_score - 2.0) * 0.25, 0.4)  # Anomalous: 0.6-1.0
                
                anomaly_scores.append(feature_anomaly)
        
        # Return max anomaly score for more sensitivity
        if anomaly_scores:
            return min(max(anomaly_scores), 1.0)  # Use max instead of mean for better detection
        else:
            return 0.1  # Slightly higher default for responsiveness
    
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
            # During warmup, provide baseline scores starting lower
            baseline_score = min(0.05 + (metadata["samples"] * 0.015), 0.15)
            model.learn_one(features)
            anomaly_score = baseline_score
            logger.info(f"Warmup phase for user {user_id} {model_type}: {metadata['samples']}/{warmup_threshold}, baseline_score={baseline_score:.3f}")
        else:
            # Score first, then learn (online learning)
            raw_score = model.score_one(features)
            
            # Use statistical scoring for low River scores OR combine both for better range
            if raw_score < 0.02:
                # River hasn't learned enough yet, use statistical method
                anomaly_score = self.calculate_statistical_score(user_id, model_type, features, metadata)
            else:
                # Combine River score with statistical analysis for full range
                statistical_score = self.calculate_statistical_score(user_id, model_type, features, metadata)
                
                # Weighted combination: 60% statistical, 40% River for balanced scoring
                anomaly_score = (0.6 * statistical_score) + (0.4 * min(raw_score, 1.0))
                anomaly_score = min(max(anomaly_score, 0.0), 1.0)
            
            # Learn after scoring
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
