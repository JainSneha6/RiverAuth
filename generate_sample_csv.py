#!/usr/bin/env python3
"""
Generate sample CSV data for the admin dashboard to display
This simulates the model scoring system generating real data
"""
import csv
import random
import time
from datetime import datetime, timedelta

def generate_sample_data(num_records=100):
    """Generate sample model scores data"""
    
    users = ['user_1', 'user_2', 'user_3', 'user_4', 'user_5', 'user_8']
    models = ['typing', 'tap', 'swipe']
    risk_levels = ['low', 'medium', 'high']
    actions = ['none', 'security_challenge', 'force_logout']
    
    data = []
    base_time = datetime.now() - timedelta(hours=24)
    
    for i in range(num_records):
        # Generate realistic timestamps
        timestamp = base_time + timedelta(minutes=random.randint(0, 1440))
        
        # Pick random user and model
        user_id = random.choice(users)
        model_type = random.choice(models)
        
        # Generate anomaly score with some bias toward normal behavior
        if random.random() < 0.7:  # 70% normal behavior
            anomaly_score = random.uniform(0.0, 0.4)
            risk_level = 'low'
            action_taken = 'none'
        elif random.random() < 0.9:  # 20% medium risk
            anomaly_score = random.uniform(0.4, 0.8)
            risk_level = 'medium'
            action_taken = random.choice(['none', 'security_challenge'])
        else:  # 10% high risk
            anomaly_score = random.uniform(0.8, 1.0)
            risk_level = 'high'
            action_taken = random.choice(['security_challenge', 'force_logout'])
        
        # Generate other realistic data
        is_warmup = random.random() < 0.1  # 10% warmup
        samples_count = random.randint(5, 100) if not is_warmup else random.randint(1, 10)
        features_processed = {
            'typing': random.randint(6, 12),
            'tap': random.randint(8, 15),
            'swipe': random.randint(10, 18)
        }[model_type]
        
        session_duration = random.randint(30, 3600)  # 30s to 1hr
        
        record = {
            'timestamp': timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'user_id': user_id,
            'model_type': model_type,
            'anomaly_score': round(anomaly_score, 4),
            'is_warmup': is_warmup,
            'samples_count': samples_count,
            'features_processed': features_processed,
            'risk_level': risk_level,
            'action_taken': action_taken,
            'session_duration': session_duration,
        }
        
        data.append(record)
    
    # Sort by timestamp
    data.sort(key=lambda x: x['timestamp'])
    
    return data

def write_csv(data, filename='model_scores.csv'):
    """Write data to CSV file"""
    
    fieldnames = [
        'timestamp', 'user_id', 'model_type', 'anomaly_score', 
        'is_warmup', 'samples_count', 'features_processed',
        'risk_level', 'action_taken', 'session_duration'
    ]
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
    
    print(f"✅ Generated {len(data)} records in {filename}")

if __name__ == "__main__":
    print("🎲 Generating sample model scores data...")
    
    # Generate different amounts of data
    datasets = [
        (50, 'model_scores_small.csv'),
        (200, 'model_scores_medium.csv'),
        (1000, 'model_scores_large.csv'),
        (100, 'model_scores.csv')  # Default for admin dashboard
    ]
    
    for num_records, filename in datasets:
        data = generate_sample_data(num_records)
        write_csv(data, filename)
    
    print("\n📊 Sample data summary:")
    print("- model_scores.csv: 100 records (default for dashboard)")
    print("- model_scores_small.csv: 50 records")
    print("- model_scores_medium.csv: 200 records") 
    print("- model_scores_large.csv: 1000 records")
    print("\n🚀 You can now view this data in the admin dashboard!")
    print("💡 Place model_scores.csv in the backend-python directory to see real data in the dashboard")
