#!/usr/bin/env python3
"""
Test script for Model Scores CSV logging system
Demonstrates how the CSV logging works with sample data
"""

import sys
import os
import time
import random
from datetime import datetime

# Add the model directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from model_scores_logger import (
    log_model_score, 
    log_batch_model_scores, 
    get_user_summary,
    export_user_scores,
    get_system_analytics,
    model_scores_logger
)

def test_individual_score_logging():
    """Test logging individual model scores"""
    print("🧪 Testing individual score logging...")
    
    user_id = "test_user_1"
    model_type = "typing"
    
    # Simulate model score data
    score_data = {
        'anomaly_score': 0.75,
        'is_warmup': False,
        'sample_count': 45,
        'features_processed': ['typing_event_rate', 'avg_user_typing_wpm', 'characters_per_second'],
        'processing_time_ms': 12.5,
        'confidence': 0.9,
        'model_version': '1.0',
        'model_params': {
            'warmup_threshold': 40,
            'n_trees': 25,
            'height': 4
        },
        'data_quality_score': 0.95,
        'drift_detected': False,
        'feature_importance': {
            'typing_event_rate': 0.8,
            'avg_user_typing_wpm': 65.2,
            'characters_per_second': 5.2
        }
    }
    
    additional_info = {
        'session_id': 'session_123',
        'user_action': 'none',
        'notes': 'Test logging for typing model'
    }
    
    log_model_score(user_id, model_type, score_data, additional_info)
    print(f"✅ Logged score for user {user_id}, model {model_type}, score: {score_data['anomaly_score']}")

def test_batch_score_logging():
    """Test logging batch model scores"""
    print("\n🧪 Testing batch score logging...")
    
    user_id = "test_user_2"
    
    # Simulate multiple model results
    model_results = {
        'typing': {
            'anomaly_score': 0.65,
            'is_warmup': False,
            'sample_count': 50,
            'features_processed': ['typing_event_rate', 'avg_user_typing_wpm'],
            'processing_time_ms': 8.3,
            'confidence': 0.85
        },
        'tap': {
            'anomaly_score': 0.45,
            'is_warmup': False,
            'sample_count': 35,
            'features_processed': ['tap_event_rate', 'tap_pressure'],
            'processing_time_ms': 6.7,
            'confidence': 0.70
        },
        'swipe': {
            'anomaly_score': 0.30,
            'is_warmup': True,
            'sample_count': 15,
            'features_processed': ['swipe_event_rate', 'avg_user_swipe_speed'],
            'processing_time_ms': 4.2,
            'confidence': 0.35
        }
    }
    
    session_info = {
        'session_id': 'session_456',
        'user_action': 'none',
        'notes': 'Batch test logging for all models'
    }
    
    log_batch_model_scores(user_id, model_results, session_info)
    print(f"✅ Logged batch scores for user {user_id}, {len(model_results)} models")

def test_high_risk_scenario():
    """Test logging high-risk scenario"""
    print("\n🧪 Testing high-risk scenario logging...")
    
    user_id = "test_user_3"
    model_type = "tap"
    
    # Simulate high-risk score
    score_data = {
        'anomaly_score': 0.97,  # High risk
        'is_warmup': False,
        'sample_count': 60,
        'features_processed': ['tap_event_rate', 'tap_pressure', 'tap_region_entropy'],
        'processing_time_ms': 15.8,
        'confidence': 0.95,
        'alert_severity': 'high',
        'threshold_exceeded': 0.8
    }
    
    additional_info = {
        'session_id': 'session_789',
        'user_action': 'force_logout',
        'notes': 'High risk detected - unusual tap patterns'
    }
    
    log_model_score(user_id, model_type, score_data, additional_info)
    print(f"✅ Logged high-risk score for user {user_id}, score: {score_data['anomaly_score']}")

def test_warmup_scenario():
    """Test logging warmup scenario"""
    print("\n🧪 Testing warmup scenario logging...")
    
    user_id = "test_user_4"
    model_type = "typing"
    
    # Simulate warmup phase
    for i in range(5):
        score_data = {
            'anomaly_score': 0.05 + (i * 0.01),  # Gradual increase during warmup
            'is_warmup': True,
            'sample_count': i + 1,
            'features_processed': ['typing_event_rate', 'avg_user_typing_wpm'],
            'processing_time_ms': 5.0 + random.uniform(0, 3),
            'confidence': (i + 1) / 40.0,  # Increasing confidence
        }
        
        additional_info = {
            'session_id': f'warmup_session_{i+1}',
            'user_action': 'none',
            'notes': f'Warmup phase sample {i+1}'
        }
        
        log_model_score(user_id, model_type, score_data, additional_info)
        
    print(f"✅ Logged 5 warmup samples for user {user_id}")

def test_analytics_functions():
    """Test analytics and summary functions"""
    print("\n🧪 Testing analytics functions...")
    
    # Test user summary
    summary = get_user_summary("test_user_1", "typing")
    if summary:
        print(f"✅ User summary: {summary}")
    
    # Test system analytics
    analytics = get_system_analytics()
    if analytics:
        print(f"✅ System analytics: {analytics}")
    
    # Test user export
    export_file = export_user_scores("test_user_1")
    if export_file:
        print(f"✅ Exported user data to: {export_file}")

def test_realistic_session():
    """Test realistic user session with multiple interactions"""
    print("\n🧪 Testing realistic session scenario...")
    
    user_id = "realistic_user"
    session_id = f"session_{int(time.time())}"
    
    # Simulate a realistic session with multiple interactions
    interactions = [
        ('typing', 0.45, False, 35),
        ('tap', 0.30, False, 42),
        ('typing', 0.52, False, 36),
        ('swipe', 0.25, True, 8),
        ('tap', 0.38, False, 43),
        ('typing', 0.48, False, 37),
        ('tap', 0.72, False, 44),  # Slightly elevated
        ('typing', 0.85, False, 38),  # High score - trigger alert
        ('tap', 0.92, False, 45),  # Very high score
    ]
    
    for i, (model_type, score, is_warmup, samples) in enumerate(interactions):
        score_data = {
            'anomaly_score': score,
            'is_warmup': is_warmup,
            'sample_count': samples,
            'features_processed': [f'{model_type}_event_rate', f'avg_user_{model_type}_metric'],
            'processing_time_ms': random.uniform(5, 15),
            'confidence': 0.8 if not is_warmup else 0.3,
        }
        
        additional_info = {
            'session_id': session_id,
            'user_action': 'security_challenge' if score > 0.8 else 'none',
            'notes': f'Realistic session interaction {i+1}'
        }
        
        log_model_score(user_id, model_type, score_data, additional_info)
        time.sleep(0.1)  # Small delay to simulate real-time
    
    print(f"✅ Logged realistic session with {len(interactions)} interactions")

def main():
    """Main test function"""
    print("🚀 Starting Model Scores CSV Logging Tests")
    print("=" * 50)
    
    # Run all tests
    test_individual_score_logging()
    test_batch_score_logging()
    test_high_risk_scenario()
    test_warmup_scenario()
    test_realistic_session()
    test_analytics_functions()
    
    print("\n" + "=" * 50)
    print("✅ All tests completed successfully!")
    print(f"📊 Check the CSV file at: {model_scores_logger.csv_file}")
    print(f"📁 Log directory: {model_scores_logger.log_dir}")
    
    # Show final analytics
    analytics = get_system_analytics()
    if analytics:
        print("\n📈 Final System Analytics:")
        print(f"   Total scores logged: {analytics['total_scores_logged']}")
        print(f"   Unique users: {analytics['unique_users']}")
        print(f"   Model types: {analytics['model_types']}")
        print(f"   High risk events: {analytics['high_risk_events']}")
        print(f"   High risk percentage: {analytics['high_risk_percentage']}%")

if __name__ == "__main__":
    main()
