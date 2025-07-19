"""
Behavioral Data Logger for RiverAuth

This module logs typing speed, swipe gestures, and tap gestures data to CSV files
for comprehensive behavioral analysis and dashboard visualization.
"""

import csv
import os
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
import threading
import json

# Set up logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

class BehavioralDataLogger:
    """Logger for behavioral data including typing, swipe, and tap gestures"""
    
    def __init__(self, base_dir="behavioral_data"):
        self.base_dir = base_dir
        self.ensure_directories()
        
        # CSV file paths
        self.csv_files = {
            'typing': os.path.join(base_dir, 'typing_speed_data.csv'),
            'swipe': os.path.join(base_dir, 'swipe_gesture_data.csv'),
            'tap': os.path.join(base_dir, 'tap_gesture_data.csv')
        }
        
        # CSV field definitions
        self.field_definitions = {
            'typing': [
                'timestamp', 'user_id', 'session_id', 'words_per_minute', 
                'characters_per_minute', 'accuracy_percentage', 'word_count',
                'total_characters', 'errors_count', 'typing_duration_ms',
                'average_keystroke_time_ms', 'keystroke_variance', 'pause_count',
                'longest_pause_ms', 'text_complexity_score', 'device_type'
            ],
            'swipe': [
                'timestamp', 'user_id', 'session_id', 'swipe_direction',
                'start_x', 'start_y', 'end_x', 'end_y', 'distance_pixels',
                'duration_ms', 'velocity_pixels_per_ms', 'acceleration',
                'pressure_start', 'pressure_end', 'pressure_variance',
                'touch_area_start', 'touch_area_end', 'curve_deviation',
                'device_type', 'screen_orientation'
            ],
            'tap': [
                'timestamp', 'user_id', 'session_id', 'tap_x', 'tap_y',
                'pressure', 'touch_area', 'duration_ms', 'tap_type',
                'screen_zone', 'distance_from_previous_tap', 'time_since_previous_tap_ms',
                'tap_sequence_position', 'is_double_tap', 'finger_used',
                'device_type', 'screen_orientation', 'app_context'
            ]
        }
        
        # Initialize CSV files
        self.initialize_csv_files()
        
        log.info(f"🔄 Behavioral data logger initialized in: {self.base_dir}")
    
    def ensure_directories(self):
        """Create necessary directories"""
        os.makedirs(self.base_dir, exist_ok=True)
        
        # Also create in admin dashboard for direct access
        admin_dir = os.path.join(self.base_dir, '..', 'admin-dashboard', 'behavioral_data')
        os.makedirs(admin_dir, exist_ok=True)
    
    def initialize_csv_files(self):
        """Initialize CSV files with headers if they don't exist"""
        for data_type, file_path in self.csv_files.items():
            if not os.path.exists(file_path):
                try:
                    with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
                        writer = csv.DictWriter(csvfile, fieldnames=self.field_definitions[data_type])
                        writer.writeheader()
                    log.info(f"📄 Created {data_type} CSV file: {file_path}")
                except Exception as e:
                    log.error(f"❌ Failed to create {data_type} CSV file: {e}")
    
    def log_typing_data(self, user_id: str, session_id: str, **kwargs):
        """Log typing speed and pattern data"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        typing_entry = {
            'timestamp': timestamp,
            'user_id': user_id,
            'session_id': session_id,
            'words_per_minute': kwargs.get('words_per_minute', 0),
            'characters_per_minute': kwargs.get('characters_per_minute', 0),
            'accuracy_percentage': kwargs.get('accuracy_percentage', 100.0),
            'word_count': kwargs.get('word_count', 0),
            'total_characters': kwargs.get('total_characters', 0),
            'errors_count': kwargs.get('errors_count', 0),
            'typing_duration_ms': kwargs.get('typing_duration_ms', 0),
            'average_keystroke_time_ms': kwargs.get('average_keystroke_time_ms', 0),
            'keystroke_variance': kwargs.get('keystroke_variance', 0),
            'pause_count': kwargs.get('pause_count', 0),
            'longest_pause_ms': kwargs.get('longest_pause_ms', 0),
            'text_complexity_score': kwargs.get('text_complexity_score', 1.0),
            'device_type': kwargs.get('device_type', 'unknown')
        }
        
        self._write_to_csv('typing', typing_entry)
        
        # Also copy to admin dashboard
        self._copy_to_admin_dashboard('typing', typing_entry)
        
        log.info(f"✅ Logged typing data: User {user_id}, WPM: {typing_entry['words_per_minute']}")
        return typing_entry
    
    def log_swipe_data(self, user_id: str, session_id: str, **kwargs):
        """Log swipe gesture data"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        swipe_entry = {
            'timestamp': timestamp,
            'user_id': user_id,
            'session_id': session_id,
            'swipe_direction': kwargs.get('swipe_direction', 'unknown'),
            'start_x': kwargs.get('start_x', 0),
            'start_y': kwargs.get('start_y', 0),
            'end_x': kwargs.get('end_x', 0),
            'end_y': kwargs.get('end_y', 0),
            'distance_pixels': kwargs.get('distance_pixels', 0),
            'duration_ms': kwargs.get('duration_ms', 0),
            'velocity_pixels_per_ms': kwargs.get('velocity_pixels_per_ms', 0),
            'acceleration': kwargs.get('acceleration', 0),
            'pressure_start': kwargs.get('pressure_start', 0),
            'pressure_end': kwargs.get('pressure_end', 0),
            'pressure_variance': kwargs.get('pressure_variance', 0),
            'touch_area_start': kwargs.get('touch_area_start', 0),
            'touch_area_end': kwargs.get('touch_area_end', 0),
            'curve_deviation': kwargs.get('curve_deviation', 0),
            'device_type': kwargs.get('device_type', 'unknown'),
            'screen_orientation': kwargs.get('screen_orientation', 'portrait')
        }
        
        self._write_to_csv('swipe', swipe_entry)
        self._copy_to_admin_dashboard('swipe', swipe_entry)
        
        log.info(f"✅ Logged swipe data: User {user_id}, Direction: {swipe_entry['swipe_direction']}")
        return swipe_entry
    
    def log_tap_data(self, user_id: str, session_id: str, **kwargs):
        """Log tap gesture data"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        tap_entry = {
            'timestamp': timestamp,
            'user_id': user_id,
            'session_id': session_id,
            'tap_x': kwargs.get('tap_x', 0),
            'tap_y': kwargs.get('tap_y', 0),
            'pressure': kwargs.get('pressure', 0),
            'touch_area': kwargs.get('touch_area', 0),
            'duration_ms': kwargs.get('duration_ms', 0),
            'tap_type': kwargs.get('tap_type', 'single'),
            'screen_zone': kwargs.get('screen_zone', 'center'),
            'distance_from_previous_tap': kwargs.get('distance_from_previous_tap', 0),
            'time_since_previous_tap_ms': kwargs.get('time_since_previous_tap_ms', 0),
            'tap_sequence_position': kwargs.get('tap_sequence_position', 1),
            'is_double_tap': kwargs.get('is_double_tap', False),
            'finger_used': kwargs.get('finger_used', 'index'),
            'device_type': kwargs.get('device_type', 'unknown'),
            'screen_orientation': kwargs.get('screen_orientation', 'portrait'),
            'app_context': kwargs.get('app_context', 'general')
        }
        
        self._write_to_csv('tap', tap_entry)
        self._copy_to_admin_dashboard('tap', tap_entry)
        
        log.info(f"✅ Logged tap data: User {user_id}, Position: ({tap_entry['tap_x']}, {tap_entry['tap_y']})")
        return tap_entry
    
    def _write_to_csv(self, data_type: str, entry: Dict):
        """Write entry to the appropriate CSV file"""
        try:
            file_path = self.csv_files[data_type]
            with open(file_path, 'a', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=self.field_definitions[data_type])
                writer.writerow(entry)
                csvfile.flush()
        except Exception as e:
            log.error(f"❌ Failed to write {data_type} data to CSV: {e}")
    
    def _copy_to_admin_dashboard(self, data_type: str, entry: Dict):
        """Copy entry to admin dashboard directory for immediate access"""
        try:
            admin_file = os.path.join(
                self.base_dir, '..', 'admin-dashboard', 'behavioral_data', f'{data_type}_data.csv'
            )
            
            # Ensure admin directory exists
            os.makedirs(os.path.dirname(admin_file), exist_ok=True)
            
            # Check if file exists, if not create with header
            file_exists = os.path.exists(admin_file)
            
            with open(admin_file, 'a', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=self.field_definitions[data_type])
                
                if not file_exists:
                    writer.writeheader()
                
                writer.writerow(entry)
                csvfile.flush()
                
        except Exception as e:
            log.error(f"❌ Failed to copy {data_type} data to admin dashboard: {e}")
    
    def get_typing_stats(self, user_id: Optional[str] = None, limit: int = 1000) -> Dict:
        """Get typing statistics"""
        try:
            data = self._read_csv_data('typing', user_id, limit)
            
            if not data:
                return {}
            
            # Calculate statistics
            wpm_values = [float(row.get('words_per_minute', 0)) for row in data]
            accuracy_values = [float(row.get('accuracy_percentage', 100)) for row in data]
            
            stats = {
                'total_sessions': len(data),
                'average_wpm': round(sum(wpm_values) / len(wpm_values), 2) if wpm_values else 0,
                'max_wpm': max(wpm_values) if wpm_values else 0,
                'min_wpm': min(wpm_values) if wpm_values else 0,
                'average_accuracy': round(sum(accuracy_values) / len(accuracy_values), 2) if accuracy_values else 100,
                'unique_users': len(set(row.get('user_id') for row in data)),
                'data': data[-limit:] if len(data) > limit else data
            }
            
            return stats
            
        except Exception as e:
            log.error(f"❌ Failed to get typing stats: {e}")
            return {}
    
    def get_swipe_stats(self, user_id: Optional[str] = None, limit: int = 1000) -> Dict:
        """Get swipe gesture statistics"""
        try:
            data = self._read_csv_data('swipe', user_id, limit)
            
            if not data:
                return {}
            
            # Calculate statistics
            velocity_values = [float(row.get('velocity_pixels_per_ms', 0)) for row in data]
            distance_values = [float(row.get('distance_pixels', 0)) for row in data]
            
            # Count directions
            directions = {}
            for row in data:
                direction = row.get('swipe_direction', 'unknown')
                directions[direction] = directions.get(direction, 0) + 1
            
            stats = {
                'total_swipes': len(data),
                'average_velocity': round(sum(velocity_values) / len(velocity_values), 2) if velocity_values else 0,
                'average_distance': round(sum(distance_values) / len(distance_values), 2) if distance_values else 0,
                'direction_distribution': directions,
                'unique_users': len(set(row.get('user_id') for row in data)),
                'data': data[-limit:] if len(data) > limit else data
            }
            
            return stats
            
        except Exception as e:
            log.error(f"❌ Failed to get swipe stats: {e}")
            return {}
    
    def get_tap_stats(self, user_id: Optional[str] = None, limit: int = 1000) -> Dict:
        """Get tap gesture statistics"""
        try:
            data = self._read_csv_data('tap', user_id, limit)
            
            if not data:
                return {}
            
            # Calculate statistics
            pressure_values = [float(row.get('pressure', 0)) for row in data]
            duration_values = [float(row.get('duration_ms', 0)) for row in data]
            
            # Count tap types
            tap_types = {}
            screen_zones = {}
            for row in data:
                tap_type = row.get('tap_type', 'single')
                zone = row.get('screen_zone', 'center')
                tap_types[tap_type] = tap_types.get(tap_type, 0) + 1
                screen_zones[zone] = screen_zones.get(zone, 0) + 1
            
            stats = {
                'total_taps': len(data),
                'average_pressure': round(sum(pressure_values) / len(pressure_values), 2) if pressure_values else 0,
                'average_duration': round(sum(duration_values) / len(duration_values), 2) if duration_values else 0,
                'tap_type_distribution': tap_types,
                'screen_zone_distribution': screen_zones,
                'unique_users': len(set(row.get('user_id') for row in data)),
                'data': data[-limit:] if len(data) > limit else data
            }
            
            return stats
            
        except Exception as e:
            log.error(f"❌ Failed to get tap stats: {e}")
            return {}
    
    def _read_csv_data(self, data_type: str, user_id: Optional[str] = None, limit: int = 1000) -> List[Dict]:
        """Read data from CSV file with optional user filtering"""
        try:
            file_path = self.csv_files[data_type]
            
            if not os.path.exists(file_path):
                return []
            
            with open(file_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                data = []
                
                for row in reader:
                    if user_id is None or row.get('user_id') == user_id:
                        data.append(row)
                
                return data[-limit:] if len(data) > limit else data
                
        except Exception as e:
            log.error(f"❌ Failed to read {data_type} CSV data: {e}")
            return []

# Global logger instance
_global_behavioral_logger = None

def get_behavioral_logger(base_dir="behavioral_data"):
    """Get or create the global behavioral logger instance"""
    global _global_behavioral_logger
    if _global_behavioral_logger is None:
        _global_behavioral_logger = BehavioralDataLogger(base_dir)
    return _global_behavioral_logger

# Convenience functions
def log_typing_speed(user_id: str, session_id: str, **kwargs):
    """Convenience function to log typing data"""
    logger = get_behavioral_logger()
    return logger.log_typing_data(user_id, session_id, **kwargs)

def log_swipe_gesture(user_id: str, session_id: str, **kwargs):
    """Convenience function to log swipe data"""
    logger = get_behavioral_logger()
    return logger.log_swipe_data(user_id, session_id, **kwargs)

def log_tap_gesture(user_id: str, session_id: str, **kwargs):
    """Convenience function to log tap data"""
    logger = get_behavioral_logger()
    return logger.log_tap_data(user_id, session_id, **kwargs)

if __name__ == "__main__":
    # Test the behavioral data logger
    logger = BehavioralDataLogger("test_behavioral_data")
    
    print("🧪 Testing behavioral data logging...")
    
    import random
    import time
    
    users = ['user_001', 'user_002', 'user_003', 'user_004', 'user_005']
    
    # Test typing data
    for i in range(5):
        user_id = random.choice(users)
        session_id = f"session_{i+1}"
        
        logger.log_typing_data(
            user_id=user_id,
            session_id=session_id,
            words_per_minute=random.randint(30, 80),
            characters_per_minute=random.randint(150, 400),
            accuracy_percentage=random.uniform(85, 100),
            word_count=random.randint(10, 50),
            total_characters=random.randint(50, 250),
            errors_count=random.randint(0, 5),
            typing_duration_ms=random.randint(5000, 30000),
            device_type='mobile'
        )
        
        # Test swipe data
        logger.log_swipe_data(
            user_id=user_id,
            session_id=session_id,
            swipe_direction=random.choice(['up', 'down', 'left', 'right']),
            start_x=random.randint(0, 400),
            start_y=random.randint(0, 800),
            end_x=random.randint(0, 400),
            end_y=random.randint(0, 800),
            distance_pixels=random.randint(50, 300),
            duration_ms=random.randint(100, 800),
            velocity_pixels_per_ms=random.uniform(0.1, 2.0),
            pressure_start=random.uniform(0.2, 1.0),
            device_type='mobile'
        )
        
        # Test tap data
        logger.log_tap_data(
            user_id=user_id,
            session_id=session_id,
            tap_x=random.randint(0, 400),
            tap_y=random.randint(0, 800),
            pressure=random.uniform(0.3, 1.0),
            touch_area=random.randint(20, 100),
            duration_ms=random.randint(50, 300),
            tap_type=random.choice(['single', 'double', 'long_press']),
            screen_zone=random.choice(['top', 'center', 'bottom', 'left', 'right']),
            device_type='mobile'
        )
        
        time.sleep(0.2)
    
    print("✅ Behavioral data logging test completed!")
    
    # Test statistics
    print("\n📊 Statistics:")
    print("Typing:", logger.get_typing_stats())
    print("Swipe:", logger.get_swipe_stats())
    print("Tap:", logger.get_tap_stats())
