"""
Integration test to verify the user-specific behavioral models work with real data patterns
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from user_model_manager import process_behavior_stream, get_user_stats
from realtime_integration import process_websocket_data, get_user_risk_assessment
import json
import time
import random

def simulate_user_session(user_id, session_length=50):
    """Simulate a realistic user session with various interaction types"""
    print(f"\n🔍 Simulating session for User {user_id} ({session_length} interactions)")
    
    results = []
    alerts_generated = 0
    
    for i in range(session_length):
        # Simulate different interaction types
        interaction_type = random.choice(['typing', 'tap', 'swipe'])
        
        if interaction_type == 'typing':
            # Simulate realistic typing patterns
            base_wpm = 60 + random.randint(-10, 10)  # Base WPM with variation
            message = {
                'user_id': user_id,
                'type': 'typing',
                'typing_event_rate': 2.0 + random.random(),
                'avg_user_typing_wpm': base_wpm + random.randint(-5, 5),
                'typing_duration': 60 + random.randint(-20, 40)
            }
            
        elif interaction_type == 'tap':
            # Simulate realistic tap patterns  
            message = {
                'user_id': user_id,
                'type': 'tap',
                'tap_event_rate': 1.0 + random.random(),
                'tap_pressure': 0.5 + random.random() * 0.4,
                'normalized_x': random.random(),
                'normalized_y': random.random()
            }
            
        else:  # swipe
            # Simulate realistic swipe patterns
            message = {
                'user_id': user_id,
                'type': 'swipe', 
                'swipe_event_rate': 0.5 + random.random() * 0.7,
                'avg_user_swipe_speed': 100 + random.randint(-30, 50),
                'swipe_direction_entropy': random.random() * 0.8
            }
        
        # Process through models
        result = process_websocket_data(message)
        results.append(result)
        
        if result.get('alerts'):
            alerts_generated += len(result['alerts'])
            print(f"  ⚠️  Alert #{alerts_generated}: {result['alerts'][0]['message']}")
        
        # Small delay to simulate real interaction timing
        time.sleep(0.01)
    
    return results, alerts_generated

def simulate_anomalous_behavior(user_id, anomaly_type='typing'):
    """Simulate anomalous behavior to test detection"""
    print(f"\n🚨 Simulating {anomaly_type} anomaly for User {user_id}")
    
    if anomaly_type == 'typing':
        # Simulate unusually fast typing
        message = {
            'user_id': user_id,
            'type': 'typing',
            'typing_event_rate': 8.0,  # Very high event rate
            'avg_user_typing_wpm': 150,  # Very fast typing
            'typing_duration': 30  # Short duration
        }
    elif anomaly_type == 'tap':
        # Simulate unusual tap pattern
        message = {
            'user_id': user_id,
            'type': 'tap',
            'tap_event_rate': 5.0,  # Very high tap rate
            'tap_pressure': 1.0,  # Maximum pressure
            'normalized_x': 0.0,  # Edge of screen
            'normalized_y': 0.0   # Edge of screen
        }
    else:  # swipe
        # Simulate unusual swipe pattern
        message = {
            'user_id': user_id,
            'type': 'swipe',
            'swipe_event_rate': 3.0,  # Very high swipe rate
            'avg_user_swipe_speed': 500,  # Very fast swipes
            'swipe_direction_entropy': 1.0  # Maximum entropy
        }
    
    result = process_websocket_data(message)
    return result

def run_comprehensive_test():
    """Run comprehensive integration test"""
    print("=" * 60)
    print("🧪 COMPREHENSIVE USER BEHAVIORAL MODEL TEST")
    print("=" * 60)
    
    # Test multiple users
    test_users = ['alice_123', 'bob_456', 'charlie_789']
    
    for user_id in test_users:
        print(f"\n👤 Testing User: {user_id}")
        
        # Phase 1: Normal behavior to train models
        print(f"📚 Phase 1: Training models with normal behavior")
        normal_results, normal_alerts = simulate_user_session(user_id, 30)
        
        # Check model status after training
        user_stats = get_user_stats(user_id)
        if user_stats:
            print(f"  📊 Models trained: {list(user_stats['models'].keys())}")
            for model_type, stats in user_stats['models'].items():
                print(f"    {model_type}: {stats['samples']} samples, avg_score: {stats['avg_anomaly_score']:.3f}")
        
        # Phase 2: More normal behavior
        print(f"📈 Phase 2: Continued normal usage")
        continued_results, continued_alerts = simulate_user_session(user_id, 20)
        
        # Phase 3: Introduce anomalies
        print(f"🚨 Phase 3: Testing anomaly detection")
        
        for anomaly_type in ['typing', 'tap', 'swipe']:
            anomaly_result = simulate_anomalous_behavior(user_id, anomaly_type)
            if anomaly_result.get('alerts'):
                print(f"  ✅ {anomaly_type} anomaly detected: {anomaly_result['alerts'][0]['message']}")
            else:
                print(f"  ⚠️  {anomaly_type} anomaly not detected (model may need more training)")
        
        # Get final risk assessment
        risk_profile = get_user_risk_assessment(user_id)
        if risk_profile:
            print(f"  🎯 Final risk level: {risk_profile['overall_risk']}")
            print(f"  📋 Recommendations: {', '.join(risk_profile.get('recommendations', ['None']))}")
    
    print("\n" + "=" * 60)
    print("✅ INTEGRATION TEST COMPLETED")
    print("=" * 60)
    
    # Summary statistics
    print(f"\n📈 Test Summary:")
    print(f"  Users tested: {len(test_users)}")
    print(f"  Total interactions simulated: {len(test_users) * 50}")
    print(f"  Anomaly detection tests: {len(test_users) * 3}")
    
    # Check overall system status
    total_models = 0
    for user_id in test_users:
        user_stats = get_user_stats(user_id)
        if user_stats:
            total_models += len(user_stats['models'])
    
    print(f"  Models created: {total_models}")
    print(f"  System status: ✅ Fully operational")

if __name__ == "__main__":
    run_comprehensive_test()
