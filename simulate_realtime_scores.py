#!/usr/bin/env python3
"""
Real-time Model Score Generation Script

This script continuously generates realistic model scores to test the real-time 
dashboard functionality. It simulates behavioral authentication events.
"""

import time
import random
import sys
import os
from datetime import datetime
import json

# Add the model directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'model'))

try:
    from model_score_logger import log_model_score, get_latest_stats, get_logger
    print("✅ Successfully imported real-time model score logger")
except ImportError as e:
    print(f"❌ Failed to import model score logger: {e}")
    print("Please ensure model_score_logger.py is in the model directory")
    sys.exit(1)

class RealtimeModelScoreSimulator:
    """Simulates real-time model scores for testing the dashboard"""
    
    def __init__(self):
        self.users = [
            'user_001', 'user_002', 'user_003', 'user_004', 'user_005',
            'user_006', 'user_007', 'user_008', 'user_009', 'user_010'
        ]
        self.model_types = ['typing', 'tap', 'swipe']
        
        # User behavior patterns (some users are more suspicious)
        self.user_patterns = {
            'user_001': {'base_risk': 0.1, 'variance': 0.2},  # Normal user
            'user_002': {'base_risk': 0.15, 'variance': 0.25}, # Normal user
            'user_003': {'base_risk': 0.75, 'variance': 0.15}, # Suspicious user
            'user_004': {'base_risk': 0.12, 'variance': 0.3},  # Normal user
            'user_005': {'base_risk': 0.85, 'variance': 0.1},  # High-risk user
            'user_006': {'base_risk': 0.08, 'variance': 0.2},  # Good user
            'user_007': {'base_risk': 0.4, 'variance': 0.4},   # Variable user
            'user_008': {'base_risk': 0.6, 'variance': 0.3},   # Medium risk
            'user_009': {'base_risk': 0.05, 'variance': 0.1},  # Very good user
            'user_010': {'base_risk': 0.9, 'variance': 0.05},  # Very suspicious
        }
        
        self.session_durations = {}
        self.samples_count = {}
        
        # Initialize counters
        for user in self.users:
            self.samples_count[user] = random.randint(20, 100)
    
    def generate_anomaly_score(self, user_id):
        """Generate realistic anomaly score for a user"""
        pattern = self.user_patterns.get(user_id, {'base_risk': 0.2, 'variance': 0.3})
        
        # Generate score based on user pattern
        base_score = pattern['base_risk']
        variance = pattern['variance']
        
        # Add some randomness with occasional spikes
        if random.random() < 0.05:  # 5% chance of anomaly spike
            score = min(1.0, base_score + random.uniform(0.3, 0.5))
        else:
            score = max(0.0, min(1.0, base_score + random.uniform(-variance, variance)))
        
        return round(score, 4)
    
    def determine_risk_level_and_action(self, anomaly_score):
        """Determine risk level and action based on anomaly score"""
        if anomaly_score <= 0.3:
            return 'low', 'none'
        elif anomaly_score <= 0.6:
            return 'medium', 'security_challenge' if random.random() < 0.3 else 'none'
        elif anomaly_score <= 0.8:
            return 'high', 'require_additional_auth'
        else:
            return 'high', 'force_logout'
    
    def simulate_session_event(self):
        """Simulate a single session event"""
        user_id = random.choice(self.users)
        model_type = random.choice(self.model_types)
        
        # Generate realistic parameters
        anomaly_score = self.generate_anomaly_score(user_id)
        risk_level, action_taken = self.determine_risk_level_and_action(anomaly_score)
        
        # Update counters
        if user_id not in self.samples_count:
            self.samples_count[user_id] = 0
        self.samples_count[user_id] += 1
        
        # Simulate session duration (in seconds)
        session_duration = random.randint(30, 300)
        
        # Features processed varies by model type
        features_map = {
            'typing': random.randint(6, 9),
            'tap': random.randint(8, 12),
            'swipe': random.randint(4, 8)
        }
        features_processed = features_map.get(model_type, 8)
        
        # Determine if still in warmup (first 40 samples)
        is_warmup = self.samples_count[user_id] < 40
        
        return {
            'user_id': user_id,
            'model_type': model_type,
            'anomaly_score': anomaly_score,
            'is_warmup': is_warmup,
            'samples_count': self.samples_count[user_id],
            'features_processed': features_processed,
            'risk_level': risk_level,
            'action_taken': action_taken,
            'session_duration': session_duration
        }
    
    def run_simulation(self, duration_minutes=10, events_per_minute=12):
        """Run the real-time simulation"""
        print(f"🚀 Starting real-time model score simulation")
        print(f"Duration: {duration_minutes} minutes")
        print(f"Events per minute: {events_per_minute}")
        print(f"Total events: {duration_minutes * events_per_minute}")
        print("-" * 60)
        
        event_interval = 60.0 / events_per_minute  # seconds between events
        start_time = time.time()
        end_time = start_time + (duration_minutes * 60)
        event_count = 0
        
        try:
            while time.time() < end_time:
                # Generate and log event
                event_data = self.simulate_session_event()
                
                # Log to CSV in real-time
                log_model_score(**event_data)
                
                event_count += 1
                
                # Print progress every 10 events
                if event_count % 10 == 0:
                    elapsed = time.time() - start_time
                    remaining = end_time - time.time()
                    
                    print(f"📊 Event {event_count:4d} | "
                          f"User: {event_data['user_id']:8s} | "
                          f"Model: {event_data['model_type']:6s} | "
                          f"Score: {event_data['anomaly_score']:5.3f} | "
                          f"Risk: {event_data['risk_level']:6s} | "
                          f"Elapsed: {elapsed:4.0f}s | "
                          f"Remaining: {remaining:4.0f}s")
                
                # Wait for next event
                time.sleep(event_interval)
                
        except KeyboardInterrupt:
            print(f"\n⏹️  Simulation stopped by user after {event_count} events")
        
        # Show final statistics
        print("\n" + "="*60)
        print("📈 Final Statistics:")
        stats = get_latest_stats()
        if stats:
            print(f"Total Records: {stats.get('total_records', 0)}")
            print(f"High Risk Count: {stats.get('high_risk_count', 0)}")
            print(f"Unique Users: {stats.get('unique_users', 0)}")
            print(f"Average Anomaly Score: {stats.get('avg_anomaly_score', 0):.3f}")
            print(f"Model Counts: {stats.get('model_counts', {})}")
        
        print(f"✅ Simulation completed! Generated {event_count} events")
        return event_count

def main():
    """Main function to run the simulation"""
    print("🔐 RiverAuth Real-time Model Score Simulator")
    print("=" * 60)
    
    # Initialize the logger to create CSV file structure
    logger = get_logger("d:/Backend/the_new_model/RiverAuth/model_scores.csv")
    
    # Also create in admin dashboard directory
    admin_logger = get_logger("d:/Backend/the_new_model/RiverAuth/admin-dashboard/model_scores.csv")
    
    simulator = RealtimeModelScoreSimulator()
    
    # Configuration
    if len(sys.argv) > 1:
        try:
            duration = int(sys.argv[1])
        except ValueError:
            duration = 5
    else:
        duration = 5  # Default 5 minutes
    
    events_per_minute = 12  # Realistic rate for behavioral auth
    
    print(f"CSV files will be created at:")
    print(f"  - {logger.csv_file}")
    print(f"  - {admin_logger.csv_file}")
    print()
    
    try:
        event_count = simulator.run_simulation(duration, events_per_minute)
        print(f"\n🎉 Successfully generated {event_count} real-time model score events!")
        print("🔄 Check your admin dashboard to see the real-time updates!")
        
    except Exception as e:
        print(f"❌ Error during simulation: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
