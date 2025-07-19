"""
Integration module for connecting user behavioral models with WebSocket stream
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from user_model_manager import process_behavior_stream, get_user_stats, model_manager
from model_scores_logger import log_model_score, get_system_analytics
import json
import asyncio
from datetime import datetime

class RealTimeModelProcessor:
    """
    Processes real-time behavioral data from WebSocket and updates user models
    """
    def __init__(self):
        self.model_manager = model_manager
        self.risk_thresholds = {
            "typing": 0.8,   # Updated to match model.py changes
            "tap": 0.8,      # Updated to match model.py changes
            "swipe": 0.8     # Updated to match model.py changes
        }
        self.alert_callbacks = []
    
    def add_alert_callback(self, callback):
        """Add callback function for security alerts"""
        self.alert_callbacks.append(callback)
    
    def process_websocket_message(self, message_data):
        """
        Process incoming WebSocket message and update user models
        Returns: dict with processing results and any alerts
        """
        try:
            # Extract user ID
            user_id = message_data.get('user_id')
            if not user_id:
                return {"error": "No user_id in message"}
            
            # Add timestamp if not present
            if 'timestamp' not in message_data:
                message_data['timestamp'] = datetime.now().timestamp()
            
            # Process through user-specific models
            result = process_behavior_stream(message_data)
            
            if not result:
                return {"error": "Failed to process user session"}
            
            # Check for anomalies and generate alerts
            alerts = self.check_for_anomalies(result)
            
            # Prepare response
            response = {
                "user_id": user_id,
                "timestamp": result["timestamp"],
                "models_updated": list(result["models"].keys()),
                "alerts": alerts,
                "model_results": result["models"]
            }
            
            # Trigger alert callbacks if needed
            if alerts:
                for callback in self.alert_callbacks:
                    try:
                        callback(user_id, alerts, result)
                    except Exception as e:
                        print(f"Alert callback error: {e}")
            
            return response
            
        except Exception as e:
            return {"error": f"Processing error: {str(e)}"}
    
    def check_for_anomalies(self, result):
        """Check if any model scores indicate suspicious behavior"""
        alerts = []
        
        for model_type, model_result in result["models"].items():
            if not model_result["is_warmup"]:
                score = model_result["anomaly_score"]
                threshold = self.risk_thresholds.get(model_type, 0.7)
                
                if score > threshold:
                    severity = "high" if score > 0.95 else "medium"
                    
                    alert = {
                        "type": "anomaly_detected",
                        "model": model_type,
                        "score": score,
                        "threshold": threshold,
                        "severity": severity,
                        "message": f"Unusual {model_type} behavior detected (score: {score:.3f})"
                    }
                    alerts.append(alert)
                    
                    # Log the alert with additional context
                    try:
                        alert_info = {
                            'user_action': 'alert_generated',
                            'session_id': result.get('session_id', ''),
                            'notes': f"Alert: {severity} risk detected for {model_type} model"
                        }
                        
                        score_data = {
                            'anomaly_score': score,
                            'is_warmup': model_result["is_warmup"],
                            'sample_count': model_result.get("samples_count", 0),
                            'features_processed': [],
                            'processing_time_ms': 0,
                            'confidence': 1.0,
                            'alert_severity': severity,
                            'threshold_exceeded': threshold
                        }
                        
                        log_model_score(result["user_id"], f"{model_type}_alert", score_data, alert_info)
                    except Exception as e:
                        print(f"Error logging alert: {e}")
        
        return alerts
    
    def get_user_risk_profile(self, user_id):
        """Get comprehensive risk assessment for user"""
        stats = get_user_stats(user_id)
        if not stats:
            return None
        
        risk_profile = {
            "user_id": user_id,
            "overall_risk": "low",
            "model_status": {},
            "recommendations": []
        }
        
        high_risk_count = 0
        total_models = 0
        
        for model_type, model_stats in stats["models"].items():
            total_models += 1
            avg_score = model_stats["avg_anomaly_score"]
            
            if avg_score > 0.8:
                risk_level = "high"
                high_risk_count += 1
            elif avg_score > 0.6:
                risk_level = "medium"
            else:
                risk_level = "low"
            
            risk_profile["model_status"][model_type] = {
                "risk_level": risk_level,
                "avg_score": avg_score,
                "samples": model_stats["samples"],
                "model_ready": model_stats["model_exists"]
            }
        
        # Calculate overall risk
        if high_risk_count >= 2 or (high_risk_count >= 1 and total_models <= 2):
            risk_profile["overall_risk"] = "high"
            risk_profile["recommendations"].append("Consider additional authentication factors")
        elif high_risk_count >= 1:
            risk_profile["overall_risk"] = "medium"
            risk_profile["recommendations"].append("Monitor user activity closely")
        
        return risk_profile

# Global processor instance
real_time_processor = RealTimeModelProcessor()

def process_websocket_data(message_data):
    """
    Main function to be called from WebSocket handler
    """
    return real_time_processor.process_websocket_message(message_data)

def get_user_risk_assessment(user_id):
    """
    Get user risk assessment
    """
    return real_time_processor.get_user_risk_profile(user_id)

def add_security_alert_handler(callback_function):
    """
    Add custom alert handler
    """
    real_time_processor.add_alert_callback(callback_function)

# Example usage and testing
if __name__ == "__main__":
    # Example alert handler
    def security_alert_handler(user_id, alerts, model_results):
        print(f"🚨 SECURITY ALERT for User {user_id}:")
        for alert in alerts:
            print(f"  - {alert['message']} (Severity: {alert['severity']})")
    
    # Add alert handler
    add_security_alert_handler(security_alert_handler)
    
    # Simulate WebSocket messages
    test_messages = [
        {
            "user_id": "123",
            "type": "typing",
            "typing_event_rate": 2.5,
            "avg_user_typing_wpm": 45,
            "typing_duration": 120
        },
        {
            "user_id": "123", 
            "type": "tap",
            "tap_event_rate": 1.2,
            "tap_pressure": 0.8,
            "normalized_x": 0.3,
            "normalized_y": 0.7
        },
        {
            "user_id": "456",
            "type": "swipe",
            "swipe_event_rate": 0.8,
            "avg_user_swipe_speed": 150,
            "swipe_direction_entropy": 0.6
        }
    ]
    
    print("=== TESTING REAL-TIME MODEL INTEGRATION ===\n")
    
    for i, message in enumerate(test_messages):
        print(f"Processing message {i+1}:")
        result = process_websocket_data(message)
        print(f"Result: {json.dumps(result, indent=2, default=str)}\n")
    
    # Test risk assessment
    print("=== USER RISK ASSESSMENTS ===")
    for user_id in ["123", "456"]:
        risk_profile = get_user_risk_assessment(user_id)
        if risk_profile:
            print(f"\nUser {user_id} Risk Profile:")
            print(f"Overall Risk: {risk_profile['overall_risk']}")
            for model_type, status in risk_profile['model_status'].items():
                print(f"  {model_type}: {status['risk_level']} (avg score: {status['avg_score']:.3f})")
