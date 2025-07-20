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
from river.anomaly.base import AnomalyDetector
import numpy as np
import math

class ContinuousHalfSpaceTrees(AnomalyDetector):
    """
    A wrapper around HalfSpaceTrees that provides continuous anomaly scores
    instead of binary 0/1 values by using statistical methods
    """
    def __init__(self, n_trees=25, height=4, window_size=50, seed=42):
        self.n_trees = n_trees
        self.height = height
        self.window_size = window_size
        self.seed = seed
        self.model = HalfSpaceTrees(
            n_trees=n_trees,
            height=height, 
            window_size=window_size,
            seed=seed
        )
        self.feature_history = []
        self.anomaly_history = []
        self.score_history = []
        
    def learn_one(self, x):
        """Learn from a single observation"""
        self.model.learn_one(x)
        
        # Store feature values for statistical analysis
        feature_values = list(x.values())
        self.feature_history.append(feature_values)
        
        # Keep only recent history (sliding window)
        if len(self.feature_history) > self.window_size:
            self.feature_history.pop(0)
            
        return self
    
    def score_one(self, x):
        """Calculate continuous anomaly score"""
        # Get binary anomaly score from HalfSpaceTrees
        binary_score = self.model.score_one(x)
        
        # If we don't have enough history, return the binary score
        if len(self.feature_history) < 10:
            return float(binary_score)
            
        # Calculate statistical deviation score
        feature_values = list(x.values())
        
        try:
            # Calculate how much this point deviates from historical mean
            historical_array = np.array(self.feature_history)
            historical_means = np.mean(historical_array, axis=0)
            historical_stds = np.std(historical_array, axis=0)
            
            # Calculate z-scores for each feature
            z_scores = []
            for i, (current_val, mean_val, std_val) in enumerate(zip(feature_values, historical_means, historical_stds)):
                if std_val > 0:
                    z_score = abs(current_val - mean_val) / std_val
                    z_scores.append(z_score)
                else:
                    z_scores.append(0.0)
            
            # Calculate composite anomaly score
            if z_scores:
                # Use the maximum z-score as the anomaly indicator
                max_z_score = max(z_scores)
                
                # Convert z-score to probability-like score (0-1 range)
                # Using sigmoid transformation: 1 / (1 + e^(-k*(z-threshold)))
                threshold = 1.0  # Z-score threshold for anomaly
                k = 1.0  # Steepness parameter
                
                continuous_score = 1.0 / (1.0 + math.exp(-k * (max_z_score - threshold)))
                
                # Combine with binary score (give more weight to statistical method)
                final_score = 0.7 * continuous_score + 0.3 * binary_score
                
                # Store for debugging
                self.score_history.append(final_score)
                if len(self.score_history) > 100:
                    self.score_history.pop(0)
                
                return final_score
            else:
                return float(binary_score)
                
        except Exception as e:
            # Fallback to binary score if statistical calculation fails
            return float(binary_score)

# Additional imports
from scipy.stats import entropy
from scipy.spatial.distance import mahalanobis
import logging
import time

# Import the real-time model scores logger
try:
    from model_score_logger import RealTimeModelScoreLogger
    # Initialize the real-time logger
    csv_file_path = "../model_scores.csv"
    model_score_logger = RealTimeModelScoreLogger(csv_file=csv_file_path)
    
    def log_model_score(*args, **kwargs):
        """Wrapper function for logging model scores"""
        return model_score_logger.log_score(*args, **kwargs)
        
    def get_latest_stats():
        """Get latest statistics from the logger"""
        return model_score_logger.get_latest_stats() if hasattr(model_score_logger, 'get_latest_stats') else {}
        
    LOGGER_AVAILABLE = True
    print(f"✅ Real-time model score logger initialized: {csv_file_path}")
    
except ImportError as e:
    # Fallback if logger not available
    print(f"⚠️ Model score logger not available: {e}")
    def log_model_score(*args, **kwargs):
        pass
    def get_latest_stats():
        return {}
    LOGGER_AVAILABLE = False

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
        
        # Load existing metadata and initialize from CSV data
        self.load_metadata()
        self.initialize_from_csv_data()
        
        # Model configurations
        self.model_config = {
            "typing": {
                "features": [
                    "typing_event_rate", "inter_typing_variability", "avg_user_typing_wpm",
                    "avg_user_typing_duration", "avg_user_typing_length", "characters_per_second",
                    "wpm_deviation", "duration_deviation", "length_deviation"
                ],
                "warmup_threshold": 40  # Increased from 20 to 40
            },
            "tap": {
                "features": [
                    "tap_event_rate", "inter_tap_variability", "avg_user_tap_duration",
                    "tap_region_entropy", "tap_pressure", "distance_from_user_mean",
                    "normalized_x", "normalized_y", "is_near_edge", "tap_pressure_deviation"
                ],
                "warmup_threshold": 30  # Increased from 15 to 30
            },
            "swipe": {
                "features": [
                    "swipe_event_rate", "inter_swipe_variability", "avg_user_swipe_speed",
                    "avg_user_swipe_distance", "swipe_direction_entropy", 
                    "swipe_direction_consistency", "distance", "duration", "angle"
                ],
                "warmup_threshold": 25  # Increased from 10 to 25
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
        # Use our custom ContinuousHalfSpaceTrees for better anomaly scores
        return Pipeline(
            StandardScaler(),
            ContinuousHalfSpaceTrees(
                n_trees=25,      # Moderate number of trees for balance
                height=4,        # Lower height for more sensitivity
                window_size=50,  # Smaller window for faster adaptation
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
        
        # Create new model and pre-train with historical data if available
        model = self.create_new_model(model_type)
        
        # Pre-train with historical CSV data to skip warmup
        if self.user_model_metadata[user_id][model_type]["samples"] > 0:
            logger.info(f"Pre-training {model_type} model for user {user_id} with historical data...")
            self.pretrain_model_from_csv(user_id, model_type, model)
        else:
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
    
    def initialize_from_csv_data(self):
        """Initialize model metadata from existing CSV files"""
        backend_python_dir = os.path.join(os.path.dirname(__file__), '..', 'backend-python')
        
        # Count samples from CSV files for user 1 (most common user)
        csv_files = {
            'tap': 'tap_features_data.csv',
            'typing': 'typing_features_data.csv', 
            'swipe': 'swipe_features_data.csv'
        }
        
        user_id = "1"  # Initialize for user 1 based on the logs
        
        for model_type, csv_file in csv_files.items():
            csv_path = os.path.join(backend_python_dir, csv_file)
            if os.path.exists(csv_path):
                try:
                    df = pd.read_csv(csv_path)
                    # Since CSV files don't have user_id, assume all data is for user 1
                    # Use a portion of the data to simulate historical training
                    total_samples = len(df)
                    user_samples = min(total_samples, 100)  # Use up to 100 samples for warmup
                    
                    if user_samples > 0:
                        self.user_model_metadata[user_id][model_type]["samples"] = user_samples
                        self.user_model_metadata[user_id][model_type]["last_updated"] = datetime.now()
                        logger.info(f"Initialized user {user_id} {model_type} model with {user_samples} historical samples (from {total_samples} total)")
                except Exception as e:
                    logger.error(f"Error reading CSV {csv_file}: {e}")
    
    def pretrain_model_from_csv(self, user_id, model_type, model):
        """Pre-train a model using historical CSV data"""
        backend_python_dir = os.path.join(os.path.dirname(__file__), '..', 'backend-python')
        csv_file = f"{model_type}_features_data.csv"
        csv_path = os.path.join(backend_python_dir, csv_file)
        
        if not os.path.exists(csv_path):
            return
        
        try:
            df = pd.read_csv(csv_path)
            
            # Filter for this user (assume user_id 1 if no user_id column)
            if 'user_id' in df.columns:
                user_data = df[df['user_id'] == int(user_id)]
            else:
                user_data = df.head(100)  # Use first 100 samples for training
            
            if len(user_data) == 0:
                return
            
            # Get required features for this model type
            required_features = self.model_config[model_type]["features"]
            trained_samples = 0
            
            for _, row in user_data.iterrows():
                features = {}
                for feature in required_features:
                    if feature in row:
                        try:
                            features[feature] = float(row[feature])
                        except (ValueError, TypeError):
                            features[feature] = 0.0
                    else:
                        features[feature] = 0.0
                
                # Train the model with this sample
                model.learn_one(features)
                trained_samples += 1
                
                # Limit training samples to avoid overloading
                if trained_samples >= 50:
                    break
            
            logger.info(f"Pre-trained {model_type} model for user {user_id} with {trained_samples} historical samples")
            
        except Exception as e:
            logger.error(f"Error pre-training model from CSV: {e}")
    
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
        start_time = time.time()
        
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
        
        # Check if in warmup phase (account for historical data)
        warmup_threshold = self.model_config[model_type]["warmup_threshold"]
        is_warmup = metadata["samples"] < warmup_threshold
        
        if is_warmup:
            # During warmup, just learn without scoring
            model.learn_one(features)
            # Use a more gradual baseline score during warmup
            warmup_progress = metadata["samples"] / warmup_threshold
            baseline_score = 0.05 + (warmup_progress * 0.05)  # Gradually increase from 0.05 to 0.10
            anomaly_score = baseline_score
            logger.info(f"Warmup phase for user {user_id} {model_type}: {metadata['samples']}/{warmup_threshold}, baseline_score={baseline_score:.3f}")
        else:
            # Score first, then learn (online learning)
            anomaly_score = model.score_one(features)
            model.learn_one(features)
            
            # Track anomaly scores for analysis
            metadata["anomaly_scores"].append(anomaly_score)
            if len(metadata["anomaly_scores"]) > 100:  # Keep last 100 scores
                metadata["anomaly_scores"] = metadata["anomaly_scores"][-100:]
        
        # Calculate processing time
        processing_time_ms = (time.time() - start_time) * 1000
        
        # Calculate model confidence (based on number of samples)
        model_confidence = min(1.0, metadata["samples"] / warmup_threshold)
        
        # Calculate data quality score (based on feature completeness)
        total_features = len(self.model_config[model_type]["features"])
        valid_features = sum(1 for v in features.values() if v != 0.0)
        data_quality_score = valid_features / total_features if total_features > 0 else 0.0
        
        # Calculate risk level based on anomaly score
        if anomaly_score <= 0.3:
            risk_level = 'low'
            action_taken = 'none'
        elif anomaly_score <= 0.7:
            risk_level = 'medium'
            action_taken = 'security_challenge' if anomaly_score > 0.5 else 'none'
        else:
            risk_level = 'high'
            action_taken = 'force_logout' if anomaly_score > 0.9 else 'require_additional_auth'
        
        # Log the score in real-time using the new logger
        try:
            log_model_score(
                user_id=user_id,
                model_type=model_type,
                anomaly_score=anomaly_score,
                is_warmup=is_warmup,
                samples_count=metadata["samples"],
                features_processed=len(features),
                risk_level=risk_level,
                action_taken=action_taken,
                session_duration=int(processing_time_ms)  # Using processing time as session duration for now
            )
            logger.info(f"🔄 Real-time logged score: User {user_id}, Model {model_type}, Score {anomaly_score:.3f}, Risk {risk_level}")
        except Exception as e:
            logger.error(f"❌ Error logging model score for user {user_id}: {e}")
        
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
        
        # Check if we have behavioral_data (legacy format)
        behavioral_data = session_data.get("behavioral_data", {})
        
        # Get the event type from the session data (WebSocket direct format)
        event_type = session_data.get("type")
        
        # Prepare batch score data for logging
        batch_score_data = {}
        
        # Process each model type
        for model_type in ["typing", "tap", "swipe"]:
            # Check if session contains relevant data for this model type
            should_process = False
            
            # Legacy format: check behavioral_data[model_type]
            if model_type in behavioral_data and behavioral_data[model_type]:
                should_process = True
            
            # WebSocket direct format: check if event_type matches model_type
            elif event_type == model_type:
                should_process = True
            
            if should_process:
                anomaly_score, is_warmup = self.update_user_model(user_id, model_type, session_data)
                
                results["models"][model_type] = {
                    "anomaly_score": anomaly_score,
                    "is_warmup": is_warmup,
                    "samples_count": self.user_model_metadata[user_id][model_type]["samples"]
                }
                
                logger.info(f"User {user_id} {model_type}: score={anomaly_score:.3f}, samples={results['models'][model_type]['samples_count']}")
        
        # Log batch scores if any models were processed
        if results["models"]:
            session_info = {
                'session_id': session_data.get('session_id', ''),
                'user_action': 'none',
                'notes': f"Batch processing for event type: {event_type}"
            }
            
            try:
                # Note: Individual scores are already logged in update_user_model
                # This is just for session-level tracking
                pass
            except Exception as e:
                logger.error(f"Error logging batch scores for user {user_id}: {e}")
        
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
