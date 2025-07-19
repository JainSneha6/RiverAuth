"""
Real-time Model Score Logger for RiverAuth Behavioral Authentication

This module provides real-time logging of model scores to CSV files
and ensures the admin dashboard gets updated immediately.
"""

import csv
import os
import logging
from datetime import datetime
from typing import Dict, Any, Optional
import threading
import queue
import time

# Set up logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

class RealTimeModelScoreLogger:
    """Real-time logger for model scores with immediate CSV updates"""
    
    def __init__(self, csv_file="model_scores.csv"):
        self.csv_file = csv_file
        self.fieldnames = [
            'timestamp', 'user_id', 'model_type', 'anomaly_score', 
            'is_warmup', 'samples_count', 'features_processed',
            'risk_level', 'action_taken', 'session_duration'
        ]
        
        # Create directories if they don't exist
        os.makedirs(os.path.dirname(csv_file) if os.path.dirname(csv_file) else '.', exist_ok=True)
        
        # Initialize CSV file with headers if it doesn't exist
        self._initialize_csv_file()
        
        # Real-time queue for batch processing (optional)
        self.log_queue = queue.Queue()
        self.batch_mode = False
        self._batch_thread = None
        
        log.info(f"🔄 Real-time model score logger initialized: {self.csv_file}")
    
    def _initialize_csv_file(self):
        """Initialize CSV file with headers if it doesn't exist"""
        if not os.path.exists(self.csv_file):
            try:
                with open(self.csv_file, 'w', newline='', encoding='utf-8') as csvfile:
                    writer = csv.DictWriter(csvfile, fieldnames=self.fieldnames)
                    writer.writeheader()
                log.info(f"📄 Created new CSV file: {self.csv_file}")
            except Exception as e:
                log.error(f"❌ Failed to create CSV file: {e}")
    
    def log_score(self, user_id, model_type, anomaly_score, is_warmup=False, 
                  samples_count=0, features_processed=0, risk_level="unknown", 
                  action_taken="none", session_duration=0):
        """Log a single model score entry in real-time"""
        
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        entry = {
            'timestamp': timestamp,
            'user_id': user_id,
            'model_type': model_type,
            'anomaly_score': round(float(anomaly_score), 4),
            'is_warmup': bool(is_warmup),
            'samples_count': int(samples_count),
            'features_processed': int(features_processed),
            'risk_level': str(risk_level),
            'action_taken': str(action_taken),
            'session_duration': int(session_duration)
        }
        
        # Write to CSV file immediately (real-time)
        try:
            with open(self.csv_file, 'a', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=self.fieldnames)
                writer.writerow(entry)
                csvfile.flush()  # Force immediate write to disk
            
            # Also copy to admin dashboard directory for immediate access
            self._update_admin_csv(entry)
            
            log.info(f"✅ Real-time logged: User {user_id}, Model {model_type}, Score {anomaly_score:.3f}, Risk {risk_level}")
            
        except Exception as e:
            log.error(f"❌ Failed to log score: {e}")
        
        return entry
    
    def _update_admin_csv(self, entry):
        """Update the admin dashboard CSV file immediately"""
        try:
            # Path to admin dashboard CSV
            admin_csv_path = os.path.join(
                os.path.dirname(self.csv_file), 
                '..', 
                'admin-dashboard', 
                'model_scores.csv'
            )
            
            os.makedirs(os.path.dirname(admin_csv_path), exist_ok=True)
            file_exists = os.path.exists(admin_csv_path)
            
            with open(admin_csv_path, 'a', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=self.fieldnames)
                
                if not file_exists:
                    writer.writeheader()
                
                writer.writerow(entry)
                csvfile.flush()  # Force immediate write
                
        except Exception as e:
            log.error(f"❌ Failed to update admin CSV: {e}")
    
    def log_batch(self, entries):
        """Log multiple entries at once"""
        try:
            with open(self.csv_file, 'a', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=self.fieldnames)
                writer.writerows(entries)
                csvfile.flush()
            
            log.info(f"✅ Batch logged {len(entries)} entries")
            
        except Exception as e:
            log.error(f"❌ Failed to batch log: {e}")
    
    def start_batch_mode(self, batch_size=10, flush_interval=5):
        """Start batch processing mode for high-volume logging"""
        self.batch_mode = True
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        
        if not self._batch_thread or not self._batch_thread.is_alive():
            self._batch_thread = threading.Thread(target=self._batch_processor, daemon=True)
            self._batch_thread.start()
            log.info(f"🔄 Started batch mode: {batch_size} entries or {flush_interval}s intervals")
    
    def stop_batch_mode(self):
        """Stop batch processing mode"""
        self.batch_mode = False
        if self._batch_thread:
            self._batch_thread.join(timeout=10)
        log.info("⏹️ Stopped batch mode")
    
    def _batch_processor(self):
        """Background thread for batch processing"""
        batch = []
        last_flush = time.time()
        
        while self.batch_mode:
            try:
                # Get entries from queue with timeout
                try:
                    entry = self.log_queue.get(timeout=1)
                    batch.append(entry)
                except queue.Empty:
                    pass
                
                # Flush batch if size limit reached or time interval passed
                current_time = time.time()
                should_flush = (
                    len(batch) >= self.batch_size or 
                    (batch and current_time - last_flush >= self.flush_interval)
                )
                
                if should_flush and batch:
                    self.log_batch(batch)
                    batch.clear()
                    last_flush = current_time
                    
            except Exception as e:
                log.error(f"❌ Batch processor error: {e}")
        
        # Flush remaining entries when stopping
        if batch:
            self.log_batch(batch)
    
    def queue_score(self, user_id, model_type, anomaly_score, **kwargs):
        """Queue a score for batch processing"""
        if not self.batch_mode:
            return self.log_score(user_id, model_type, anomaly_score, **kwargs)
        
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        entry = {
            'timestamp': timestamp,
            'user_id': user_id,
            'model_type': model_type,
            'anomaly_score': round(float(anomaly_score), 4),
            'is_warmup': kwargs.get('is_warmup', False),
            'samples_count': kwargs.get('samples_count', 0),
            'features_processed': kwargs.get('features_processed', 0),
            'risk_level': kwargs.get('risk_level', 'unknown'),
            'action_taken': kwargs.get('action_taken', 'none'),
            'session_duration': kwargs.get('session_duration', 0)
        }
        
        self.log_queue.put(entry)
        return entry
    
    def get_latest_scores(self, limit=100):
        """Get the latest scores from CSV file"""
        try:
            with open(self.csv_file, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                rows = list(reader)
                return rows[-limit:] if len(rows) > limit else rows
        except Exception as e:
            log.error(f"❌ Failed to read scores: {e}")
            return []
    
    def get_stats(self):
        """Get statistics about logged scores"""
        try:
            scores = self.get_latest_scores(limit=None)  # Get all
            
            if not scores:
                return {}
            
            total_records = len(scores)
            high_risk_count = len([s for s in scores if s.get('risk_level') == 'high'])
            unique_users = len(set(s.get('user_id') for s in scores))
            
            # Calculate average anomaly score
            anomaly_scores = []
            for s in scores:
                try:
                    score = float(s.get('anomaly_score', 0))
                    anomaly_scores.append(score)
                except (ValueError, TypeError):
                    pass
            
            avg_anomaly_score = sum(anomaly_scores) / len(anomaly_scores) if anomaly_scores else 0
            
            # Model counts
            model_counts = {}
            for model_type in ['typing', 'tap', 'swipe']:
                model_counts[model_type] = len([s for s in scores if s.get('model_type') == model_type])
            
            return {
                'total_records': total_records,
                'high_risk_count': high_risk_count,
                'unique_users': unique_users,
                'avg_anomaly_score': round(avg_anomaly_score, 3),
                'model_counts': model_counts,
                'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            
        except Exception as e:
            log.error(f"❌ Failed to get stats: {e}")
            return {}

# Global logger instance
_global_logger = None

def get_logger(csv_file="model_scores.csv"):
    """Get or create the global logger instance"""
    global _global_logger
    if _global_logger is None:
        _global_logger = RealTimeModelScoreLogger(csv_file)
    return _global_logger

def log_model_score(user_id, model_type, anomaly_score, **kwargs):
    """Convenience function to log a model score"""
    logger = get_logger()
    return logger.log_score(user_id, model_type, anomaly_score, **kwargs)

def get_latest_stats():
    """Convenience function to get latest statistics"""
    logger = get_logger()
    return logger.get_stats()

if __name__ == "__main__":
    # Test the real-time logger
    logger = RealTimeModelScoreLogger("test_model_scores.csv")
    
    # Test real-time logging
    import random
    users = ['user_1', 'user_2', 'user_3']
    models = ['typing', 'tap', 'swipe']
    
    print("🧪 Testing real-time model score logging...")
    
    for i in range(10):
        user_id = random.choice(users)
        model_type = random.choice(models)
        anomaly_score = random.uniform(0.0, 1.0)
        
        # Determine risk level based on score
        if anomaly_score < 0.4:
            risk_level = 'low'
            action_taken = 'none'
        elif anomaly_score < 0.8:
            risk_level = 'medium'
            action_taken = 'security_challenge' if random.random() < 0.5 else 'none'
        else:
            risk_level = 'high'
            action_taken = 'force_logout'
        
        logger.log_score(
            user_id=user_id,
            model_type=model_type,
            anomaly_score=anomaly_score,
            risk_level=risk_level,
            action_taken=action_taken,
            samples_count=random.randint(10, 100),
            features_processed=random.randint(5, 15)
        )
        
        time.sleep(0.5)  # Simulate real-time intervals
    
    print("✅ Real-time logging test completed!")
    print("📊 Statistics:", logger.get_stats())
