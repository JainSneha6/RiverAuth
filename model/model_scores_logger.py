"""
Model Scores Logger for RiverAuth Behavioral Authentication System
Logs all model scores with timestamps for analysis and debugging
"""

import csv
import os
import threading
from datetime import datetime
from collections import defaultdict
import json

class ModelScoresLogger:
    """
    Logger for tracking all model scores over time for each user
    """
    
    def __init__(self, log_dir="model_scores_logs"):
        self.log_dir = log_dir
        self.create_log_directory()
        self.csv_file = os.path.join(log_dir, "model_scores.csv")
        self.lock = threading.Lock()
        
        # Initialize CSV file with headers if it doesn't exist
        self.initialize_csv()
        
        # Cache for recent scores (for performance analysis)
        self.recent_scores = defaultdict(list)
        self.max_recent_scores = 100  # Keep last 100 scores per user
        
    def create_log_directory(self):
        """Create log directory if it doesn't exist"""
        if not os.path.exists(self.log_dir):
            os.makedirs(self.log_dir)
            print(f"✅ Created model scores log directory: {self.log_dir}")
    
    def initialize_csv(self):
        """Initialize CSV file with headers"""
        headers = [
            'timestamp',
            'datetime',
            'user_id',
            'session_id',
            'model_type',
            'anomaly_score',
            'is_warmup',
            'sample_count',
            'risk_level',
            'threshold_high',
            'threshold_medium',
            'threshold_low',
            'features_processed',
            'feature_count',
            'model_version',
            'processing_time_ms',
            'alert_triggered',
            'alert_severity',
            'user_action_taken',
            'model_confidence',
            'feature_importance',
            'statistical_deviation',
            'historical_mean',
            'historical_std',
            'z_score',
            'model_params',
            'data_quality_score',
            'drift_detected',
            'notes'
        ]
        
        # Check if file exists and has content
        if not os.path.exists(self.csv_file) or os.path.getsize(self.csv_file) == 0:
            with open(self.csv_file, 'w', newline='', encoding='utf-8') as file:
                writer = csv.writer(file)
                writer.writerow(headers)
            print(f"✅ Initialized model scores CSV: {self.csv_file}")
    
    def log_score(self, user_id, model_type, score_data, additional_info=None):
        """
        Log a single model score with comprehensive metadata
        
        Args:
            user_id: User identifier
            model_type: Type of model (typing, tap, swipe, geo, device)
            score_data: Dictionary containing score and model information
            additional_info: Optional additional information
        """
        timestamp = datetime.now().timestamp()
        datetime_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
        
        # Extract data from score_data
        anomaly_score = score_data.get('anomaly_score', 0.0)
        is_warmup = score_data.get('is_warmup', True)
        sample_count = score_data.get('sample_count', 0)
        features_processed = score_data.get('features_processed', [])
        processing_time_ms = score_data.get('processing_time_ms', 0)
        model_confidence = score_data.get('confidence', 0.0)
        
        # Determine risk level
        risk_level = self._determine_risk_level(anomaly_score)
        
        # Calculate statistical metrics
        stats = self._calculate_statistics(user_id, model_type, anomaly_score)
        
        # Prepare row data
        row_data = [
            timestamp,
            datetime_str,
            user_id,
            additional_info.get('session_id', '') if additional_info else '',
            model_type,
            round(anomaly_score, 6),
            is_warmup,
            sample_count,
            risk_level,
            0.95,  # HIGH_RISK threshold
            0.8,   # MEDIUM_RISK threshold
            0.3,   # LOW_RISK threshold
            json.dumps(features_processed) if features_processed else '',
            len(features_processed) if features_processed else 0,
            score_data.get('model_version', '1.0'),
            processing_time_ms,
            anomaly_score > 0.8,  # Alert triggered
            'high' if anomaly_score > 0.95 else 'medium' if anomaly_score > 0.8 else 'low',
            additional_info.get('user_action', 'none') if additional_info else 'none',
            model_confidence,
            json.dumps(score_data.get('feature_importance', {})),
            stats['deviation'],
            stats['mean'],
            stats['std'],
            stats['z_score'],
            json.dumps(score_data.get('model_params', {})),
            score_data.get('data_quality_score', 1.0),
            score_data.get('drift_detected', False),
            additional_info.get('notes', '') if additional_info else ''
        ]
        
        # Write to CSV with thread safety
        with self.lock:
            try:
                with open(self.csv_file, 'a', newline='', encoding='utf-8') as file:
                    writer = csv.writer(file)
                    writer.writerow(row_data)
                
                # Update recent scores cache
                self._update_recent_scores(user_id, model_type, anomaly_score)
                
            except Exception as e:
                print(f"❌ Error logging model score: {e}")
    
    def log_batch_scores(self, user_id, model_results, session_info=None):
        """
        Log multiple model scores in a batch
        
        Args:
            user_id: User identifier
            model_results: Dictionary of model results {model_type: score_data}
            session_info: Optional session information
        """
        for model_type, score_data in model_results.items():
            self.log_score(user_id, model_type, score_data, session_info)
    
    def _determine_risk_level(self, score):
        """Determine risk level based on score"""
        if score > 0.95:
            return 'HIGH'
        elif score > 0.8:
            return 'MEDIUM'
        elif score > 0.3:
            return 'LOW'
        else:
            return 'NORMAL'
    
    def _calculate_statistics(self, user_id, model_type, current_score):
        """Calculate statistical metrics for the current score"""
        key = f"{user_id}_{model_type}"
        scores = self.recent_scores[key]
        
        if len(scores) < 2:
            return {
                'deviation': 0.0,
                'mean': current_score,
                'std': 0.0,
                'z_score': 0.0
            }
        
        import numpy as np
        scores_array = np.array(scores)
        mean_score = np.mean(scores_array)
        std_score = np.std(scores_array)
        
        # Calculate z-score
        z_score = (current_score - mean_score) / (std_score + 1e-6)
        deviation = abs(current_score - mean_score)
        
        return {
            'deviation': round(deviation, 6),
            'mean': round(mean_score, 6),
            'std': round(std_score, 6),
            'z_score': round(z_score, 6)
        }
    
    def _update_recent_scores(self, user_id, model_type, score):
        """Update recent scores cache"""
        key = f"{user_id}_{model_type}"
        self.recent_scores[key].append(score)
        
        # Keep only recent scores
        if len(self.recent_scores[key]) > self.max_recent_scores:
            self.recent_scores[key].pop(0)
    
    def get_user_score_summary(self, user_id, model_type=None, last_n=10):
        """Get summary of recent scores for a user"""
        if model_type:
            key = f"{user_id}_{model_type}"
            scores = self.recent_scores[key][-last_n:]
        else:
            scores = []
            for key in self.recent_scores:
                if key.startswith(f"{user_id}_"):
                    scores.extend(self.recent_scores[key][-last_n:])
        
        if not scores:
            return None
        
        import numpy as np
        return {
            'count': len(scores),
            'mean': round(np.mean(scores), 6),
            'std': round(np.std(scores), 6),
            'min': round(np.min(scores), 6),
            'max': round(np.max(scores), 6),
            'recent_trend': 'increasing' if len(scores) > 1 and scores[-1] > scores[-2] else 'decreasing'
        }
    
    def export_user_data(self, user_id, output_file=None):
        """Export all data for a specific user to a separate CSV"""
        if not output_file:
            output_file = os.path.join(self.log_dir, f"user_{user_id}_scores.csv")
        
        try:
            # Read the main CSV and filter for the user
            user_data = []
            with open(self.csv_file, 'r', encoding='utf-8') as file:
                reader = csv.reader(file)
                headers = next(reader)
                user_data.append(headers)
                
                for row in reader:
                    if len(row) > 2 and row[2] == str(user_id):  # user_id is in column 2
                        user_data.append(row)
            
            # Write user-specific data
            with open(output_file, 'w', newline='', encoding='utf-8') as file:
                writer = csv.writer(file)
                writer.writerows(user_data)
            
            print(f"✅ Exported user {user_id} data to: {output_file}")
            return output_file
            
        except Exception as e:
            print(f"❌ Error exporting user data: {e}")
            return None
    
    def get_analytics_summary(self):
        """Get overall analytics summary"""
        try:
            with open(self.csv_file, 'r', encoding='utf-8') as file:
                reader = csv.reader(file)
                headers = next(reader)
                
                total_scores = 0
                users = set()
                model_types = set()
                high_risk_count = 0
                
                for row in reader:
                    if len(row) > 8:
                        total_scores += 1
                        users.add(row[2])  # user_id
                        model_types.add(row[4])  # model_type
                        if row[8] == 'HIGH':  # risk_level
                            high_risk_count += 1
                
                return {
                    'total_scores_logged': total_scores,
                    'unique_users': len(users),
                    'model_types': list(model_types),
                    'high_risk_events': high_risk_count,
                    'high_risk_percentage': round((high_risk_count / total_scores) * 100, 2) if total_scores > 0 else 0
                }
                
        except Exception as e:
            print(f"❌ Error getting analytics summary: {e}")
            return None

# Global logger instance
model_scores_logger = ModelScoresLogger()

# Convenience functions
def log_model_score(user_id, model_type, score_data, additional_info=None):
    """Convenience function to log a single model score"""
    model_scores_logger.log_score(user_id, model_type, score_data, additional_info)

def log_batch_model_scores(user_id, model_results, session_info=None):
    """Convenience function to log multiple model scores"""
    model_scores_logger.log_batch_scores(user_id, model_results, session_info)

def get_user_summary(user_id, model_type=None):
    """Convenience function to get user score summary"""
    return model_scores_logger.get_user_score_summary(user_id, model_type)

def export_user_scores(user_id, output_file=None):
    """Convenience function to export user data"""
    return model_scores_logger.export_user_data(user_id, output_file)

def get_system_analytics():
    """Convenience function to get system analytics"""
    return model_scores_logger.get_analytics_summary()
