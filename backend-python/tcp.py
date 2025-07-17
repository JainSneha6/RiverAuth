import asyncio
import websockets
import logging
import json
from collections import deque
import math
import pandas as pd
import time
import os
import numpy as np
from scipy.stats import entropy
import sys
import pymssql
from dotenv import load_dotenv
from werkzeug.security import check_password_hash

# Load environment variables
load_dotenv()

# Azure SQL setup
server = os.getenv('AZURE_SQL_SERVER')
database = os.getenv('AZURE_SQL_DATABASE')
username = os.getenv('AZURE_SQL_USERNAME')
password = os.getenv('AZURE_SQL_PASSWORD')

def get_db_connection():
    """Get a fresh database connection"""
    try:
        conn = pymssql.connect(
            server=server,
            user=username,
            password=password,
            database=database,
            timeout=30,
            login_timeout=10,
            as_dict=False
        )
        return conn
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return None

# Add model directory to path for real-time behavioral models
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'model'))

# Import real-time behavioral model system
try:
    from realtime_integration import process_websocket_data, get_user_risk_assessment, add_security_alert_handler
    BEHAVIORAL_MODELS_ENABLED = True
    print("✅ Real-time behavioral models loaded successfully!")
except ImportError as e:
    print(f"⚠️  Behavioral models not available: {e}")
    BEHAVIORAL_MODELS_ENABLED = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

connected_clients = set()
event_queue = deque()
tap_features = []  # Store tap features
swipe_features = []  # Store swipe features
typing_features = []  # Store typing features
geolocation_features = []  # Store geolocation features
ip_features = []  # Store IP features
last_event_time = {}  # Track last event time per client
event_counts = {}  # Track event counts per client
session_stats = {}  # Track session-based stats
user_stats = {}  # Track user-specific stats

def get_user_security_questions(user_id):
    """Get user security questions from database"""
    conn = get_db_connection()
    if not conn:
        logger.warning(f"Database connection failed, using fallback questions for user {user_id}")
        return [
            {'id': 1, 'question': 'What is your favorite color?', 'type': 'text'},
            {'id': 2, 'question': 'What city were you born in?', 'type': 'text'},
            {'id': 3, 'question': 'What is your favorite food?', 'type': 'text'}
        ]
    
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT question, question_index 
            FROM user_security_questions 
            WHERE user_id = %s 
            ORDER BY question_index
        """, (user_id,))
        
        rows = cursor.fetchall()
        questions = [{'id': row[1], 'question': row[0], 'type': 'text'} for row in rows]
        
        logger.info(f"🔐 Loaded {len(questions)} security questions for user {user_id}")
        
        # If no questions found in database, use fallback
        if not questions:
            logger.warning(f"No security questions found in database for user {user_id}, using fallback")
            return [
                {'id': 1, 'question': 'What is your favorite color?', 'type': 'text'},
                {'id': 2, 'question': 'What city were you born in?', 'type': 'text'},
                {'id': 3, 'question': 'What is your favorite food?', 'type': 'text'}
            ]
        
        return questions
        
    except Exception as e:
        logger.error(f"Error loading security questions for user {user_id}: {e}")
        logger.warning(f"Using fallback questions for user {user_id}")
        return [
            {'id': 1, 'question': 'What is your favorite color?', 'type': 'text'},
            {'id': 2, 'question': 'What city were you born in?', 'type': 'text'},
            {'id': 3, 'question': 'What is your favorite food?', 'type': 'text'}
        ]
    finally:
        conn.close()

def verify_security_answers(user_id, answers):
    """Verify security answers against database"""
    conn = get_db_connection()
    if not conn:
        logger.warning(f"Database connection failed, using fallback verification for user {user_id}")
        # Fallback verification - accept any reasonable answers
        return verify_fallback_answers(answers)
    
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT question_index, answer_hash 
            FROM user_security_questions 
            WHERE user_id = %s 
            ORDER BY question_index
        """, (user_id,))
        
        stored_answers = cursor.fetchall()
        
        if not stored_answers:
            logger.error(f"No security questions found for user {user_id}, using fallback verification")
            return verify_fallback_answers(answers)
        
        correct_count = 0
        for answer in answers:
            question_id = answer.get('question_id')
            user_answer = answer.get('answer', '').lower().strip()
            
            # Find the stored answer hash for this question
            stored_hash = None
            for stored_index, stored_hash_value in stored_answers:
                if stored_index == question_id:
                    stored_hash = stored_hash_value
                    break
            
            if stored_hash and check_password_hash(stored_hash, user_answer):
                correct_count += 1
                logger.info(f"✅ Question {question_id} answered correctly by user {user_id}")
            else:
                logger.warning(f"❌ Question {question_id} answered incorrectly by user {user_id}")
        
        # Require at least 2 out of 3 correct answers (or 3 out of 5 if more questions)
        total_questions = len(stored_answers)
        required_correct = max(2, total_questions // 2 + 1)
        is_verified = correct_count >= required_correct
        
        logger.info(f"🔐 User {user_id} security verification: {correct_count}/{total_questions} correct, required: {required_correct}, verified: {is_verified}")
        return is_verified, correct_count
        
    except Exception as e:
        logger.error(f"Error verifying security answers for user {user_id}: {e}")
        return verify_fallback_answers(answers)
    finally:
        conn.close()

def verify_fallback_answers(answers):
    """Fallback verification when database is unavailable"""
    # For demo purposes, accept any non-empty answers
    valid_answers = 0
    for answer in answers:
        user_answer = answer.get('answer', '').strip()
        if user_answer and len(user_answer) > 1:
            valid_answers += 1
    
    # Accept if at least 2 out of 3 questions have reasonable answers
    is_verified = valid_answers >= 2
    logger.info(f"🔐 Fallback verification: {valid_answers}/3 valid answers, verified: {is_verified}")
    return is_verified, valid_answers

# Security alert handler for behavioral anomalies
def behavioral_security_alert_handler(user_id, alerts, model_results):
    """Handle security alerts from behavioral models with automatic actions"""
    for alert in alerts:
        severity = alert['severity']
        score = alert['score']
        model_type = alert['model']
        
        severity_emoji = "🚨" if severity == 'high' else "⚠️"
        logger.warning(f"{severity_emoji} BEHAVIORAL ALERT - User {user_id}: {alert['message']} (Score: {score:.3f})")
        
        # Determine action based on risk level
        if severity == 'high' and score > 0.95:  # Increased threshold for less frequent logout
            # HIGH RISK: Automatic logout
            action = "force_logout"
            alert_message = {
                "type": "behavioral_alert",
                "user_id": user_id,
                "score": score,
                "model": model_type,
                "severity": severity,
                "action": action,
                "message": "⚠️ Suspicious activity detected. You have been logged out for security reasons.",
                "title": "Security Alert",
                "timestamp": time.time() * 1000,
                "threshold": alert.get('threshold', 0.8)
            }
            logger.critical(f"🔴 HIGH RISK BEHAVIOR DETECTED: User {user_id} - Model: {model_type} - FORCE LOGOUT")
            
        elif severity == 'medium' or (0.8 < score <= 0.95):  # Updated range to match model.py
            # MEDIUM RISK: Security questions
            action = "security_challenge"
            
            # Load security questions from database
            security_questions = get_user_security_questions(user_id)
            
            if not security_questions:
                # If no security questions found, fall back to force logout
                logger.error(f"No security questions found for user {user_id}, forcing logout")
                action = "force_logout"
                alert_message = {
                    "type": "behavioral_alert",
                    "user_id": user_id,
                    "score": score,
                    "model": model_type,
                    "severity": "high",
                    "action": action,
                    "message": "⚠️ Suspicious activity detected. No security questions available. You have been logged out for security reasons.",
                    "title": "Security Alert",
                    "timestamp": time.time() * 1000,
                    "threshold": alert.get('threshold', 0.8)
                }
                logger.critical(f"🔴 NO SECURITY QUESTIONS - User {user_id} - FORCE LOGOUT")
            else:
                alert_message = {
                    "type": "behavioral_alert",
                    "user_id": user_id,
                    "score": score,
                    "model": model_type,
                    "severity": "medium",
                    "action": action,
                    "message": "We've detected unusual activity. Please answer your security questions to continue.",
                    "title": "Security Verification",
                    "timestamp": time.time() * 1000,
                    "threshold": alert.get('threshold', 0.8),
                    "security_questions": security_questions
                }
                logger.warning(f"⚠️ MEDIUM RISK BEHAVIOR DETECTED: User {user_id} - Model: {model_type} - SECURITY CHALLENGE - {len(security_questions)} questions loaded")
            
        else:
            # LOW RISK: Normal monitoring
            action = "monitor"
            alert_message = {
                "type": "behavioral_alert",
                "user_id": user_id,
                "score": score,
                "model": model_type,
                "severity": "low",
                "action": action,
                "message": f"Monitoring unusual {model_type} behavior",
                "title": "Security Monitoring",
                "timestamp": time.time() * 1000,
                "threshold": alert.get('threshold', 0.8)  # Updated threshold
            }
            logger.info(f"ℹ️ LOW RISK BEHAVIOR DETECTED: User {user_id} - Model: {model_type} - MONITORING")
        
        # Send alert to all connected clients (in a real app, you'd filter by user_id)
        asyncio.create_task(broadcast_security_alert(alert_message))

async def broadcast_security_alert(alert_message):
    """Broadcast security alert to all connected clients"""
    global connected_clients
    if connected_clients:
        disconnected_clients = set()
        for client in connected_clients.copy():
            try:
                await client.send(json.dumps(alert_message))
                logger.info(f"Security alert sent to client: {alert_message['severity']} risk detected")
            except websockets.exceptions.ConnectionClosed:
                disconnected_clients.add(client)
            except Exception as e:
                logger.error(f"Error sending security alert: {e}")
                disconnected_clients.add(client)
        
        # Clean up disconnected clients
        connected_clients -= disconnected_clients

# Register behavioral alert handler if models are available
if BEHAVIORAL_MODELS_ENABLED:
    add_security_alert_handler(behavioral_security_alert_handler)
    logger.info("🛡️  Behavioral security monitoring enabled")
else:
    logger.warning("⚠️  Running without behavioral model protection")
EDGE_THRESHOLD = 50  # Pixels from edge to consider "near edge"
FREQUENCY_WINDOW = 5  # Seconds for frequency calculation
SCREEN_WIDTH = 1920  # Default, updated by device message
SCREEN_HEIGHT = 1080  # Default, updated by device message
FREQUENCY_THRESHOLD = 5  # Events per second for unusual frequency
WPM_THRESHOLD_HIGH = 120  # WPM above which is considered unusual
WPM_THRESHOLD_LOW = 10  # WPM below which is considered unusual

# Load existing data from CSV files at startup
def load_existing_data():
    global tap_features, swipe_features, typing_features, geolocation_features, ip_features
    try:
        if os.path.exists('tap_features_data.csv'):
            tap_df = pd.read_csv('tap_features_data.csv')
            tap_features.extend(tap_df.to_dict('records'))
            logger.info(f"Loaded {len(tap_features)} tap features from tap_features_data.csv")
        if os.path.exists('swipe_features_data.csv'):
            swipe_df = pd.read_csv('swipe_features_data.csv')
            swipe_features.extend(swipe_df.to_dict('records'))
            logger.info(f"Loaded {len(swipe_features)} swipe features from swipe_features_data.csv")
        if os.path.exists('typing_features_data.csv'):
            typing_df = pd.read_csv('typing_features_data.csv')
            typing_features.extend(typing_df.to_dict('records'))
            logger.info(f"Loaded {len(typing_features)} typing features from typing_features_data.csv")
        if os.path.exists('geolocation_features_data.csv'):
            geo_df = pd.read_csv('geolocation_features_data.csv')
            geolocation_features.extend(geo_df.to_dict('records'))
            logger.info(f"Loaded {len(geolocation_features)} geolocation features from geolocation_features_data.csv")
        if os.path.exists('ip_features_data.csv'):
            ip_df = pd.read_csv('ip_features_data.csv')
            ip_features.extend(ip_df.to_dict('records'))
            logger.info(f"Loaded {len(ip_features)} ip features from ip_features_data.csv")
    except Exception as e:
        logger.error(f"Error loading existing data: {e}")

def haversine(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance between two points on Earth (in km)."""
    R = 6371  # Earth radius in km
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

def get_region(x, y, screen_width, screen_height):
    """Assign screen region based on coordinates."""
    try:
        logger.debug(f"get_region: x={x}, y={y}, screen_width={screen_width}, screen_height={screen_height}")
        logger.debug(f"x >= screen_width/2: {x >= screen_width / 2}, y >= screen_height/2: {y >= screen_height / 2}")
        if x < screen_width / 2 and y < screen_height / 2:
            return "top-left"
        elif x >= screen_width / 2 and y < screen_height / 2:
            return "top-right"
        elif x < screen_width / 2 and y >= screen_height / 2:
            return "bottom-left"
        else:
            return "bottom-right"
    except Exception as e:
        logger.error(f"Error in get_region: {e}")
        return "unknown"

def compute_entropy(counts):
    """Compute Shannon entropy from a list of counts."""
    probabilities = [c / sum(counts) for c in counts if sum(counts) > 0]
    return entropy(probabilities) if probabilities else 0

async def process_events():
    global SCREEN_WIDTH, SCREEN_HEIGHT
    while True:
        if event_queue:
            event = event_queue.popleft()
            event_type = event.get('type')
            event_data = event.get('data', {})
            event_ts = event.get('timestamp', time.time() * 1000) / 1000 
            client_ip = event.get('client_ip', 'unknown')
            user_id = event.get('user_id') 

            # Handle unexpected event types
            if event_type not in ['tap', 'swipe', 'device', 'typing', 'geolocation', 'ip', 'test_alert']:
                logger.warning(f"Unknown event type: {event_type}, skipping")
                continue

            # Handle test alerts
            if event_type == 'test_alert':
                logger.info(f"🧪 Test alert received from user {user_id}")
                continue

            # Handle device message to update screen dimensions
            if event_type == 'device':
                SCREEN_WIDTH = event_data.get('screen_width', SCREEN_WIDTH)
                SCREEN_HEIGHT = event_data.get('screen_height', SCREEN_HEIGHT)
                logger.info(f"Updated screen dimensions: {SCREEN_WIDTH}x{SCREEN_HEIGHT}")
                continue

            # Initialize client and user tracking
            if client_ip not in last_event_time:
                last_event_time[client_ip] = {'tap': 0, 'swipe': 0, 'typing': 0, 'geolocation': 0, 'ip': 0, 'any': 0}
                event_counts[client_ip] = {'tap': [], 'swipe': [], 'typing': [], 'geolocation': [], 'ip': []}
                session_stats[client_ip] = {
                    'tap_durations': [], 'swipe_speeds': [], 'swipe_distances': [],
                    'typing_wpms': [], 'typing_durations': [], 'typing_lengths': [],
                    'event_times': [], 'tap_times': [], 'swipe_times': [], 'typing_times': [],
                    'geolocation_times': [], 'ip_times': [],  # Added to prevent KeyError
                    'regions': [], 'directions': [], 'event_sequence': [], 'targets': [], 'fields': []
                }
            if user_id not in user_stats:
                user_stats[user_id] = {
                    'tap_durations': [], 'tap_x': [], 'tap_y': [],
                    'swipe_speeds': [], 'swipe_distances': [], 'swipe_start_x': [], 'swipe_start_y': [],
                    'typing_wpms': [], 'typing_durations': [], 'typing_lengths': [], 'fields': [],
                    'regions': [], 'directions': [], 'pointer_types': [],
                    'geolocation_history': [], 'ip_history': [], 'velocities': [], 'region_hops': []
                }

            # Update event counts for frequency (only for tap, swipe, typing)
            current_time = time.time()
            if event_type in ['tap', 'swipe', 'typing']:
                event_counts[client_ip][event_type].append(current_time)
                event_counts[client_ip][event_type] = [
                    t for t in event_counts[client_ip][event_type]
                    if current_time - t <= FREQUENCY_WINDOW
                ]
                session_stats[client_ip]['event_times'].append(event_ts)
                session_stats[client_ip][f'{event_type}_times'].append(event_ts)

            # Base features
            features = {
                'timestamp': event_ts,
                'user_id': user_id,
                'client_ip': client_ip,
                'event_count': sum(len(event_counts[client_ip][et]) for et in ['tap', 'swipe', 'typing']),
                f'{event_type}_event_rate': (
                    len(event_counts[client_ip][event_type]) / FREQUENCY_WINDOW
                    if FREQUENCY_WINDOW > 0 and event_type in ['tap', 'swipe', 'typing'] else 0
                ),
                f'is_unusual_{event_type}_frequency': (
                    len(event_counts[client_ip][event_type]) / FREQUENCY_WINDOW > FREQUENCY_THRESHOLD
                    if event_type in ['tap', 'swipe', 'typing'] else False
                ),
                f'time_since_last_{event_type}': (
                    event_ts - last_event_time[client_ip][event_type]
                    if last_event_time[client_ip][event_type] > 0 else 0
                ),
                'session_duration': (
                    event_ts - min(session_stats[client_ip]['event_times'])
                    if session_stats[client_ip]['event_times'] else 0
                ),
                'time_of_day': int(time.strftime("%H", time.localtime(event_ts))),
                f'inter_{event_type}_variability': (
                    np.std(np.diff(session_stats[client_ip][f'{event_type}_times']))
                    if len(session_stats[client_ip][f'{event_type}_times']) > 1 and event_type in ['tap', 'swipe', 'typing'] else 0
                ),
                'event_sequence_entropy': compute_entropy(
                    [session_stats[client_ip]['event_sequence'].count(e) for e in ['tap', 'swipe', 'typing']]
                ),
            }

            # User-specific statistics
            avg_user_tap_duration = np.mean(user_stats[user_id]['tap_durations']) if user_stats[user_id]['tap_durations'] else 0
            std_user_tap_duration = np.std(user_stats[user_id]['tap_durations']) if user_stats[user_id]['tap_durations'] else 0
            avg_user_swipe_speed = np.mean(user_stats[user_id]['swipe_speeds']) if user_stats[user_id]['swipe_speeds'] else 0
            std_user_swipe_speed = np.std(user_stats[user_id]['swipe_speeds']) if user_stats[user_id]['swipe_speeds'] else 0
            avg_user_swipe_distance = np.mean(user_stats[user_id]['swipe_distances']) if user_stats[user_id]['swipe_distances'] else 0
            std_user_swipe_distance = np.std(user_stats[user_id]['swipe_distances']) if user_stats[user_id]['swipe_distances'] else 0
            avg_user_typing_wpm = np.mean(user_stats[user_id]['typing_wpms']) if user_stats[user_id]['typing_wpms'] else 0
            std_user_typing_wpm = np.std(user_stats[user_id]['typing_wpms']) if user_stats[user_id]['typing_wpms'] else 0
            avg_user_typing_duration = np.mean(user_stats[user_id]['typing_durations']) if user_stats[user_id]['typing_durations'] else 0
            std_user_typing_duration = np.std(user_stats[user_id]['typing_durations']) if user_stats[user_id]['typing_durations'] else 0
            avg_user_typing_length = np.mean(user_stats[user_id]['typing_lengths']) if user_stats[user_id]['typing_lengths'] else 0
            std_user_typing_length = np.std(user_stats[user_id]['typing_lengths']) if user_stats[user_id]['typing_lengths'] else 0
            region_counts = [user_stats[user_id]['regions'].count(r) for r in ['top-left', 'top-right', 'bottom-left', 'bottom-right']]
            preferred_region = ['top-left', 'top-right', 'bottom-left', 'bottom-right'][np.argmax(region_counts)] if sum(region_counts) > 0 else 'none'
            tap_region_entropy = compute_entropy([user_stats[user_id]['regions'].count(r) for r in ['top-left', 'top-right', 'bottom-left', 'bottom-right']])
            direction_counts = [user_stats[user_id]['directions'].count(d) for d in ['left', 'right', 'up', 'down', 'unknown']]
            swipe_direction_entropy = compute_entropy(direction_counts)
            swipe_direction_consistency = max(direction_counts) / sum(direction_counts) if sum(direction_counts) > 0 else 0
            field_counts = [user_stats[user_id]['fields'].count(f) for f in set(user_stats[user_id]['fields'])] if user_stats[user_id]['fields'] else [0]
            preferred_field = max(set(user_stats[user_id]['fields']), key=user_stats[user_id]['fields'].count, default='none') if user_stats[user_id]['fields'] else 'none'
            field_entropy = compute_entropy(field_counts)
            features.update({
                'avg_user_tap_duration': avg_user_tap_duration,
                'std_user_tap_duration': std_user_tap_duration,
                'avg_user_swipe_speed': avg_user_swipe_speed,
                'std_user_swipe_speed': std_user_swipe_speed,
                'avg_user_swipe_distance': avg_user_swipe_distance,
                'std_user_swipe_distance': std_user_swipe_distance,
                'avg_user_typing_wpm': avg_user_typing_wpm,
                'std_user_typing_wpm': std_user_typing_wpm,
                'avg_user_typing_duration': avg_user_typing_duration,
                'std_user_typing_duration': std_user_typing_duration,
                'avg_user_typing_length': avg_user_typing_length,
                'std_user_typing_length': std_user_typing_length,
                'preferred_region': preferred_region,
                'tap_region_entropy': tap_region_entropy,
                'swipe_direction_entropy': swipe_direction_entropy,
                'swipe_direction_consistency': swipe_direction_consistency,
                'preferred_field': preferred_field,
                'field_entropy': field_entropy,
            })

            if event_type == 'tap':
                # Extract tap features
                tap_x = event_data.get('clientX', 0)
                tap_y = event_data.get('clientY', 0)
                screen_x = event_data.get('screenX', tap_x)
                screen_y = event_data.get('screenY', tap_y)
                page_x = event_data.get('pageX', tap_x)
                page_y = event_data.get('pageY', tap_y)
                duration = event_data.get('duration', 0)
                pointer_type = event_data.get('pointerType', 'unknown')
                target = event_data.get('target', 'unknown')
                source = event_data.get('source', 'unknown')

                # Compute tap-specific features
                distance_from_center = math.sqrt(
                    (tap_x - SCREEN_WIDTH / 2) ** 2 + (tap_y - SCREEN_HEIGHT / 2) ** 2
                )
                region = get_region(tap_x, tap_y, SCREEN_WIDTH, SCREEN_HEIGHT)
                normalized_x = tap_x / SCREEN_WIDTH if SCREEN_WIDTH > 0 else 0
                normalized_y = tap_y / SCREEN_HEIGHT if SCREEN_HEIGHT > 0 else 0
                is_near_edge = (
                    tap_x < EDGE_THRESHOLD or tap_x > SCREEN_WIDTH - EDGE_THRESHOLD or
                    tap_y < EDGE_THRESHOLD or tap_y > SCREEN_HEIGHT - EDGE_THRESHOLD
                )
                is_gesture = source == 'gesture'
                tap_pressure = min(duration / 1000, 1.0)
                avg_tap_x = np.mean(user_stats[user_id]['tap_x']) if user_stats[user_id]['tap_x'] else tap_x
                avg_tap_y = np.mean(user_stats[user_id]['tap_y']) if user_stats[user_id]['tap_y'] else tap_y
                distance_from_user_mean = math.sqrt((tap_x - avg_tap_x) ** 2 + (tap_y - avg_tap_y) ** 2)
                tap_pressure_deviation = abs(tap_pressure - avg_user_tap_duration / 1000) if user_stats[user_id]['tap_durations'] else 0
                is_new_pointer_type = pointer_type != max(
                    [user_stats[user_id]['pointer_types'].count(p) for p in ['mouse', 'touch', 'gesture', 'unknown']],
                    default='unknown'
                )
                session_stats[client_ip]['targets'].append(target)
                target_change_frequency = (
                    sum(1 for i in range(1, len(session_stats[client_ip]['targets']))
                        if session_stats[client_ip]['targets'][i] != session_stats[client_ip]['targets'][i-1])
                    / len(session_stats[client_ip]['targets']) if len(session_stats[client_ip]['targets']) > 1 else 0
                )

                # Update session and user stats
                session_stats[client_ip]['tap_durations'].append(duration)
                session_stats[client_ip]['regions'].append(region)
                session_stats[client_ip]['event_sequence'].append('tap')
                user_stats[user_id]['tap_durations'].append(duration)
                user_stats[user_id]['tap_x'].append(tap_x)
                user_stats[user_id]['tap_y'].append(tap_y)
                user_stats[user_id]['regions'].append(region)
                user_stats[user_id]['pointer_types'].append(pointer_type)

                # Add tap-specific features
                features.update({
                    'client_x': tap_x,
                    'client_y': tap_y,
                    'screen_x': screen_x,
                    'screen_y': screen_y,
                    'page_x': page_x,
                    'page_y': page_y,
                    'duration': duration,
                    'pointer_type': pointer_type,
                    'target': target,
                    'is_gesture': is_gesture,
                    'distance_from_center': distance_from_center,
                    'region': region,
                    'normalized_x': normalized_x,
                    'normalized_y': normalized_y,
                    'is_near_edge': is_near_edge,
                    'tap_pressure': tap_pressure,
                    'distance_from_user_mean': distance_from_user_mean,
                    'tap_pressure_deviation': tap_pressure_deviation,
                    'is_new_pointer_type': is_new_pointer_type,
                    'target_change_frequency': target_change_frequency,
                })

                # Store tap features
                tap_features.append(features)
                logger.info(f"Tap at ({tap_x}, {tap_y}), region: {region}, "
                            f"SCREEN_WIDTH: {SCREEN_WIDTH}, distance_from_center: {distance_from_center:.2f}")

                # 🔥 REAL-TIME BEHAVIORAL MODEL UPDATE
                if BEHAVIORAL_MODELS_ENABLED and user_id:
                    try:
                        # Prepare data for behavioral model with all required features
                        behavioral_data = {
                            'user_id': user_id,
                            'type': 'tap',
                            'tap_event_rate': features.get('tap_event_rate', 0),
                            'inter_tap_variability': features.get('inter_tap_variability', 0),
                            'avg_user_tap_duration': features.get('avg_user_tap_duration', 0),
                            'tap_region_entropy': features.get('tap_region_entropy', 0),
                            'tap_pressure': features.get('tap_pressure', 0.5),
                            'distance_from_user_mean': features.get('distance_from_user_mean', 0),
                            'normalized_x': normalized_x,
                            'normalized_y': normalized_y,
                            'is_near_edge': is_near_edge,
                            'tap_pressure_deviation': features.get('tap_pressure_deviation', 0),
                            'timestamp': event_ts
                        }
                        
                        # Process through user-specific behavioral models
                        model_result = process_websocket_data(behavioral_data)
                        
                        if model_result and not model_result.get('error'):
                            logger.info(f"🧠 User {user_id} tap model updated - Score: {model_result['model_results']['tap']['anomaly_score']:.3f}")
                            
                            # Handle any security alerts
                            if model_result.get('alerts'):
                                logger.warning(f"🚨 {len(model_result['alerts'])} tap security alerts for user {user_id}")
                        
                    except Exception as e:
                        logger.error(f"❌ Error in tap behavioral model processing: {e}")

                # Save tap features to CSV (append mode)
                tap_df = pd.DataFrame([features])  # Save only the new feature
                tap_csv_path = os.path.abspath('tap_features_data.csv')
                header = not os.path.exists(tap_csv_path)  # Write header only if file doesn't exist
                tap_df.to_csv(tap_csv_path, mode='a', header=header, index=False)
                logger.info(f"Appended tap feature to {tap_csv_path}, total: {len(tap_features)}")

            elif event_type == 'swipe':
                # Extract swipe features
                start_x = event_data.get('startX', 0)
                start_y = event_data.get('startY', 0)
                end_x = event_data.get('endX', 0)
                end_y = event_data.get('endY', 0)
                delta_x = event_data.get('deltaX', 0)
                delta_y = event_data.get('deltaY', 0)
                distance = event_data.get('distance', 0)
                duration = event_data.get('duration', 0)
                direction = event_data.get('direction', 'unknown')
                pointer_type = event_data.get('pointerType', 'unknown')
                target = event_data.get('target', 'unknown')
                source = event_data.get('source', 'unknown')

                # Compute swipe-specific features
                speed = distance / duration if duration > 0 else 0
                angle = math.degrees(math.atan2(delta_y, delta_x))
                start_region = get_region(start_x, start_y, SCREEN_WIDTH, SCREEN_HEIGHT)
                end_region = get_region(end_x, end_y, SCREEN_WIDTH, SCREEN_HEIGHT)
                region_transition = f"{start_region}_to_{end_region}"
                normalized_start_x = start_x / SCREEN_WIDTH if SCREEN_WIDTH > 0 else 0
                normalized_start_y = start_y / SCREEN_HEIGHT if SCREEN_HEIGHT > 0 else 0
                normalized_end_x = end_x / SCREEN_WIDTH if SCREEN_WIDTH > 0 else 0
                normalized_end_y = end_y / SCREEN_HEIGHT if SCREEN_HEIGHT > 0 else 0
                is_cross_screen = (
                    (start_x < SCREEN_WIDTH / 2 and end_x >= SCREEN_WIDTH / 2) or
                    (start_x >= SCREEN_WIDTH / 2 and end_x < SCREEN_WIDTH / 2) or
                    (start_y < SCREEN_HEIGHT / 2 and end_y >= SCREEN_HEIGHT / 2) or
                    (start_y >= SCREEN_HEIGHT / 2 and end_y < SCREEN_HEIGHT / 2)
                )
                is_diagonal = 30 <= abs(angle % 180) <= 60 or 120 <= abs(angle % 180) <= 150
                is_gesture = source == 'gesture'
                avg_start_x = np.mean(user_stats[user_id]['swipe_start_x']) if user_stats[user_id]['swipe_start_x'] else start_x
                avg_start_y = np.mean(user_stats[user_id]['swipe_start_y']) if user_stats[user_id]['swipe_start_y'] else start_y
                distance_from_user_mean = math.sqrt((start_x - avg_start_x) ** 2 + (start_y - avg_start_y) ** 2)
                is_new_pointer_type = pointer_type != max(
                    [user_stats[user_id]['pointer_types'].count(p) for p in ['mouse', 'touch', 'gesture', 'unknown']],
                    default='unknown'
                )
                session_stats[client_ip]['targets'].append(target)
                target_change_frequency = (
                    sum(1 for i in range(1, len(session_stats[client_ip]['targets']))
                        if session_stats[client_ip]['targets'][i] != session_stats[client_ip]['targets'][i-1])
                    / len(session_stats[client_ip]['targets']) if len(session_stats[client_ip]['targets']) > 1 else 0
                )

                # Update session and user stats
                session_stats[client_ip]['swipe_speeds'].append(speed)
                session_stats[client_ip]['swipe_distances'].append(distance)
                session_stats[client_ip]['regions'].append(start_region)
                session_stats[client_ip]['directions'].append(direction)
                session_stats[client_ip]['event_sequence'].append('swipe')
                user_stats[user_id]['swipe_speeds'].append(speed)
                user_stats[user_id]['swipe_distances'].append(distance)
                user_stats[user_id]['swipe_start_x'].append(start_x)
                user_stats[user_id]['swipe_start_y'].append(start_y)
                user_stats[user_id]['regions'].append(start_region)
                user_stats[user_id]['directions'].append(direction)
                user_stats[user_id]['pointer_types'].append(pointer_type)

                # Add swipe-specific features
                features.update({
                    'start_x': start_x,
                    'start_y': start_y,
                    'end_x': end_x,
                    'end_y': end_y,
                    'delta_x': delta_x,
                    'delta_y': delta_y,
                    'distance': distance,
                    'duration': duration,
                    'direction': direction,
                    'speed': speed,
                    'angle': angle,
                    'start_region': start_region,
                    'end_region': end_region,
                    'region_transition': region_transition,
                    'normalized_start_x': normalized_start_x,
                    'normalized_start_y': normalized_start_y,
                    'normalized_end_x': normalized_end_x,
                    'normalized_end_y': normalized_end_y,
                    'is_cross_screen': is_cross_screen,
                    'is_diagonal': is_diagonal,
                    'is_gesture': is_gesture,
                    'pointer_type': pointer_type,
                    'target': target,
                    'acceleration': speed / duration if duration > 0 else 0,
                    'distance_from_user_mean': distance_from_user_mean,
                    'is_new_pointer_type': is_new_pointer_type,
                    'target_change_frequency': target_change_frequency,
                })

                # Store swipe features
                swipe_features.append(features)
                logger.info(f"Swipe from ({start_x}, {start_y}) to ({end_x}, {end_y}), "
                            f"start_region: {start_region}, end_region: {end_region}")

                # 🔥 REAL-TIME BEHAVIORAL MODEL UPDATE
                if BEHAVIORAL_MODELS_ENABLED and user_id:
                    try:
                        # Prepare data for behavioral model with all required features
                        behavioral_data = {
                            'user_id': user_id,
                            'type': 'swipe',
                            'swipe_event_rate': features.get('swipe_event_rate', 0),
                            'inter_swipe_variability': features.get('inter_swipe_variability', 0),
                            'avg_user_swipe_speed': features.get('avg_user_swipe_speed', 0),
                            'avg_user_swipe_distance': features.get('avg_user_swipe_distance', 0),
                            'swipe_direction_entropy': features.get('swipe_direction_entropy', 0),
                            'swipe_direction_consistency': features.get('swipe_direction_consistency', 0),
                            'distance': distance,
                            'duration': duration,
                            'angle': angle,
                            'timestamp': event_ts
                        }
                        
                        # Process through user-specific behavioral models
                        model_result = process_websocket_data(behavioral_data)
                        
                        if model_result and not model_result.get('error'):
                            logger.info(f"🧠 User {user_id} swipe model updated - Score: {model_result['model_results']['swipe']['anomaly_score']:.3f}")
                            
                            # Handle any security alerts
                            if model_result.get('alerts'):
                                logger.warning(f"🚨 {len(model_result['alerts'])} swipe security alerts for user {user_id}")
                        
                    except Exception as e:
                        logger.error(f"❌ Error in swipe behavioral model processing: {e}")

                # Save swipe features to CSV (append mode)
                swipe_df = pd.DataFrame([features])  # Save only the new feature
                swipe_csv_path = os.path.abspath('swipe_features_data.csv')
                header = not os.path.exists(swipe_csv_path)  # Write header only if file doesn't exist
                swipe_df.to_csv(swipe_csv_path, mode='a', header=header, index=False)
                logger.info(f"Appended swipe feature to {swipe_csv_path}, total: {len(swipe_features)}")

            elif event_type == 'typing':
                # Extract typing features
                field = event_data.get('field', 'unknown')
                length = event_data.get('length', 0)
                duration = event_data.get('duration', 0)
                wpm = event_data.get('wpm', 0)

                # Compute typing-specific features
                characters_per_second = length / (duration / 1000) if duration > 0 else 0
                is_unusual_wpm = wpm > WPM_THRESHOLD_HIGH or wpm < WPM_THRESHOLD_LOW
                session_stats[client_ip]['fields'].append(field)
                field_switch_frequency = (
                    sum(1 for i in range(1, len(session_stats[client_ip]['fields']))
                        if session_stats[client_ip]['fields'][i] != session_stats[client_ip]['fields'][i-1])
                    / len(session_stats[client_ip]['fields']) if len(session_stats[client_ip]['fields']) > 1 else 0
                )
                wpm_deviation = abs(wpm - avg_user_typing_wpm) if user_stats[user_id]['typing_wpms'] else 0
                duration_deviation = abs(duration - avg_user_typing_duration) if user_stats[user_id]['typing_durations'] else 0
                length_deviation = abs(length - avg_user_typing_length) if user_stats[user_id]['typing_lengths'] else 0

                # Update session and user stats
                session_stats[client_ip]['typing_wpms'].append(wpm)
                session_stats[client_ip]['typing_durations'].append(duration)
                session_stats[client_ip]['typing_lengths'].append(length)
                session_stats[client_ip]['event_sequence'].append('typing')
                user_stats[user_id]['typing_wpms'].append(wpm)
                user_stats[user_id]['typing_durations'].append(duration)
                user_stats[user_id]['typing_lengths'].append(length)
                user_stats[user_id]['fields'].append(field)

                # Add typing-specific features
                features.update({
                    'field': field,
                    'length': length,
                    'duration': duration,
                    'wpm': wpm,
                    'characters_per_second': characters_per_second,
                    'is_unusual_wpm': is_unusual_wpm,
                    'field_switch_frequency': field_switch_frequency,
                    'wpm_deviation': wpm_deviation,
                    'duration_deviation': duration_deviation,
                    'length_deviation': length_deviation,
                })

                # Store typing features
                typing_features.append(features)
                logger.info(f"Typing in field '{field}', length: {length}, wpm: {wpm}, duration: {duration}ms")

                # 🔥 REAL-TIME BEHAVIORAL MODEL UPDATE
                if BEHAVIORAL_MODELS_ENABLED and user_id:
                    try:
                        # Prepare data for behavioral model with all required features
                        behavioral_data = {
                            'user_id': user_id,
                            'type': 'typing',
                            'typing_event_rate': features.get('typing_event_rate', 0),
                            'inter_typing_variability': features.get('inter_typing_variability', 0),
                            'avg_user_typing_wpm': features.get('avg_user_typing_wpm', 0),
                            'avg_user_typing_duration': features.get('avg_user_typing_duration', 0),
                            'avg_user_typing_length': features.get('avg_user_typing_length', 0),
                            'characters_per_second': characters_per_second,
                            'wpm_deviation': features.get('wpm_deviation', 0),
                            'duration_deviation': features.get('duration_deviation', 0),
                            'length_deviation': features.get('length_deviation', 0),
                            'timestamp': event_ts
                        }
                        
                        # Process through user-specific behavioral models
                        model_result = process_websocket_data(behavioral_data)
                        
                        if model_result and not model_result.get('error'):
                            logger.info(f"🧠 User {user_id} typing model updated - Score: {model_result['model_results']['typing']['anomaly_score']:.3f}")
                            
                            # Handle any security alerts
                            if model_result.get('alerts'):
                                logger.warning(f"🚨 {len(model_result['alerts'])} typing security alerts for user {user_id}")
                        
                    except Exception as e:
                        logger.error(f"❌ Error in typing behavioral model processing: {e}")

                # Save typing features to CSV (append mode)
                typing_df = pd.DataFrame([features])  # Save only the new feature
                typing_csv_path = os.path.abspath('typing_features_data.csv')
                header = not os.path.exists(typing_csv_path)  # Write header only if file doesn't exist
                typing_df.to_csv(typing_csv_path, mode='a', header=header, index=False)
                logger.info(f"Appended typing feature to {typing_csv_path}, total: {len(typing_features)}")

            elif event_type == 'geolocation':
                latitude = event_data.get('latitude', 0)
                longitude = event_data.get('longitude', 0)
                altitude = event_data.get('altitude', None)
                accuracy = event_data.get('accuracy', 0)
                speed = event_data.get('speed', None)
                current_point = {
                    'timestamp': event_ts,
                    'latitude': latitude,
                    'longitude': longitude,
                    'altitude': altitude,
                    'accuracy': accuracy,
                    'speed': speed
                }
                user_stats[user_id]['geolocation_history'].append(current_point)
                session_stats[client_ip]['geolocation_times'].append(event_ts)

                # Compute geolocation features
                geo_features = {
                    'timestamp': event_ts,
                    'user_id': user_id,
                    'client_ip': client_ip,
                    'latitude': latitude,
                    'longitude': longitude,
                    'altitude': altitude,
                    'accuracy': accuracy,
                    'speed': speed
                }

                # Geo-Velocity
                if len(user_stats[user_id]['geolocation_history']) >= 2:
                    prev_point = user_stats[user_id]['geolocation_history'][-2]
                    distance = haversine(prev_point['latitude'], prev_point['longitude'], latitude, longitude)
                    time_diff = event_ts - prev_point['timestamp']
                    velocity = distance / (time_diff / 3600) if time_diff > 0 else 0  # km/h
                    user_stats[user_id]['velocities'].append(velocity)
                    velocities = user_stats[user_id]['velocities']
                    geo_features['geo_velocity_avg'] = np.mean(velocities)
                    geo_features['geo_velocity_max'] = np.max(velocities)
                    geo_features['geo_velocity_var'] = np.var(velocities) if velocities else 0
                else:
                    geo_features.update({
                        'geo_velocity_avg': 0,
                        'geo_velocity_max': 0,
                        'geo_velocity_var': 0
                    })

                # Distance from Home Base and Radius of Gyration
                if user_stats[user_id]['geolocation_history']:
                    latitudes = [p['latitude'] for p in user_stats[user_id]['geolocation_history']]
                    longitudes = [p['longitude'] for p in user_stats[user_id]['geolocation_history']]
                    mean_lat = np.mean(latitudes)
                    mean_lon = np.mean(longitudes)
                    distances = [haversine(mean_lat, mean_lon, lat, lon) for lat, lon in zip(latitudes, longitudes)]
                    geo_features['distance_from_home_mean'] = np.mean(distances) if distances else 0
                    geo_features['distance_from_home_p90'] = np.percentile(distances, 90) if distances else 0
                    geo_features['radius_of_gyration'] = np.sqrt(np.mean([d**2 for d in distances])) if distances else 0
                else:
                    geo_features.update({
                        'distance_from_home_mean': 0,
                        'distance_from_home_p90': 0,
                        'radius_of_gyration': 0
                    })

                geolocation_features.append(geo_features)
                geo_df = pd.DataFrame([geo_features])  # Save only the new feature
                geo_csv_path = os.path.abspath('geolocation_features_data.csv')
                header = not os.path.exists(geo_csv_path)  # Write header only if file doesn't exist
                geo_df.to_csv(geo_csv_path, mode='a', header=header, index=False)
                logger.info(f"Appended geolocation feature to {geo_csv_path}, total: {len(geolocation_features)}")

            elif event_type == 'ip':
                ip = event_data.get('ip', 'unknown')
                region = event_data.get('region', 'unknown')
                country = event_data.get('country', 'unknown')
                current_ip = {
                    'timestamp': event_ts,
                    'ip': ip,
                    'region': region,
                    'country': country
                }
                if user_stats[user_id]['ip_history'] and user_stats[user_id]['ip_history'][-1]['region'] != region:
                    user_stats[user_id]['region_hops'].append(event_ts)
                user_stats[user_id]['ip_history'].append(current_ip)
                session_stats[client_ip]['ip_times'].append(event_ts)

                # Compute IP features
                hops = user_stats[user_id]['region_hops']
                ip_drift_rate_week = sum(1 for hop in hops if event_ts - hop <= 7 * 86400)
                ip_drift_rate_month = sum(1 for hop in hops if event_ts - hop <= 30 * 86400)
                ip_features_dict = {
                    'timestamp': event_ts,
                    'user_id': user_id,
                    'client_ip': client_ip,
                    'ip': ip,
                    'region': region,
                    'country': country,
                    'ip_drift_rate_week': ip_drift_rate_week,
                    'ip_drift_rate_month': ip_drift_rate_month
                }
                ip_features.append(ip_features_dict)
                ip_df = pd.DataFrame([ip_features_dict])  # Save only the new feature
                ip_csv_path = os.path.abspath('ip_features_data.csv')
                header = not os.path.exists(ip_csv_path)  # Write header only if file doesn't exist
                ip_df.to_csv(ip_csv_path, mode='a', header=header, index=False)
                logger.info(f"Appended ip feature to {ip_csv_path}, total: {len(ip_features)}")

            # Update event time
            last_event_time[client_ip][event_type] = event_ts
            last_event_time[client_ip]['any'] = event_ts

        else:
            await asyncio.sleep(0.1)

async def handler(websocket):
    client_ip = websocket.remote_address[0]
    logger.info(f'New client connected: {client_ip}')
    connected_clients.add(websocket)
    try:
        async for message in websocket:
            logger.debug(f"=== RAW DATA FROM {client_ip} ===")
            logger.debug(message)
            logger.debug(f"=== END RAW DATA ===")
            try:
                data = json.loads(message)
                data['client_ip'] = client_ip
                
                # Handle security question responses
                if data.get('type') == 'security_response':
                    await handle_security_response(websocket, data)
                # Handle test security alerts from dashboard
                elif data.get('type') == 'test_alert' and 'behavioral_alert' in data:
                    alert_data = data['behavioral_alert']
                    logger.info(f"🧪 Processing test security alert: {alert_data.get('severity', 'unknown')} risk")
                    
                    # Send the alert back to all connected clients
                    await broadcast_security_alert(alert_data)
                else:
                    # Normal event processing
                    event_queue.append(data)
                    
            except json.JSONDecodeError:
                logger.error("Received non-JSON message")
    except websockets.exceptions.ConnectionClosed:
        logger.info(f'Client disconnected: {client_ip}')
    finally:
        connected_clients.discard(websocket)

async def handle_security_response(websocket, data):
    """Handle security question responses"""
    user_id = data.get('user_id')
    answers = data.get('answers', [])
    
    logger.info(f"🔐 Security response received from user {user_id} with {len(answers)} answers")
    
    # Verify answers against database
    is_verified, correct_count = verify_security_answers(user_id, answers)
    
    # Determine action based on verification result
    if is_verified:
        # Allow user to continue
        response = {
            "type": "security_response_result",
            "user_id": user_id,
            "success": True,
            "action": "continue",
            "message": "Security verification successful. You may continue.",
            "title": "Verification Complete",
            "timestamp": time.time() * 1000
        }
        logger.info(f"✅ User {user_id} passed security verification ({correct_count} correct answers)")
        
    else:
        # Logout user due to failed verification
        response = {
            "type": "security_response_result",
            "user_id": user_id,
            "success": False,
            "action": "force_logout",
            "message": "Security verification failed. You have been logged out for security reasons.",
            "title": "Verification Failed",
            "timestamp": time.time() * 1000
        }
        logger.critical(f"🔴 User {user_id} failed security verification ({correct_count} correct answers) - FORCE LOGOUT")
    
    # Send response to the specific client
    try:
        await websocket.send(json.dumps(response))
        logger.info(f"📤 Security response sent to user {user_id}: {response['action']}")
    except Exception as e:
        logger.error(f"Error sending security response to user {user_id}: {e}")

async def main():
    # Load existing data at startup
    load_existing_data()
    ports_to_try = [8081, 8080, 8082, 8083, 8084]
    for port in ports_to_try:
        try:
            async with websockets.serve(handler, 'localhost', port):
                logger.info(f'WebSocket server up at ws://localhost:{port}')
                logger.info(f'Frontend should connect to: ws://localhost:{port}')
                asyncio.create_task(process_events())
                await asyncio.Future()
        except OSError as e:
            if e.errno == 13:
                logger.error(f'Port {port} - Permission denied (may be in use)')
            elif e.errno == 10048:
                logger.error(f'Port {port} - Already in use')
            else:
                logger.error(f'Port {port} - Error: {e}')
            if port == ports_to_try[-1]:
                logger.error('All ports failed. Try running as administrator or check firewall.')
                raise
            else:
                logger.info(f'Trying next port...')

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info('Server stopped by user')
        if tap_features:
            tap_df = pd.DataFrame([f for f in tap_features if f not in tap_features[:len(tap_features)-len([f for f in tap_features if f['timestamp'] == tap_features[-1]['timestamp']])]])  # Save only new features
            tap_csv_path = os.path.abspath('tap_features_data.csv')
            header = not os.path.exists(tap_csv_path)
            tap_df.to_csv(tap_csv_path, mode='a', header=header, index=False)
            logger.info(f"Appended {len(tap_df)} tap features to {tap_csv_path}, total: {len(tap_features)}")
        if swipe_features:
            swipe_df = pd.DataFrame([f for f in swipe_features if f not in swipe_features[:len(swipe_features)-len([f for f in swipe_features if f['timestamp'] == swipe_features[-1]['timestamp']])]])  # Save only new features
            swipe_csv_path = os.path.abspath('swipe_features_data.csv')
            header = not os.path.exists(swipe_csv_path)
            swipe_df.to_csv(swipe_csv_path, mode='a', header=header, index=False)
            logger.info(f"Appended {len(swipe_df)} swipe features to {swipe_csv_path}, total: {len(swipe_features)}")
        if typing_features:
            typing_df = pd.DataFrame([f for f in typing_features if f not in typing_features[:len(typing_features)-len([f for f in typing_features if f['timestamp'] == typing_features[-1]['timestamp']])]])  # Save only new features
            typing_csv_path = os.path.abspath('typing_features_data.csv')
            header = not os.path.exists(typing_csv_path)
            typing_df.to_csv(typing_csv_path, mode='a', header=header, index=False)
            logger.info(f"Appended {len(typing_df)} typing features to {typing_csv_path}, total: {len(typing_features)}")
        if geolocation_features:
            geo_df = pd.DataFrame([f for f in geolocation_features if f not in geolocation_features[:len(geolocation_features)-len([f for f in geolocation_features if f['timestamp'] == geolocation_features[-1]['timestamp']])]])  # Save only new features
            geo_csv_path = os.path.abspath('geolocation_features_data.csv')
            header = not os.path.exists(geo_csv_path)
            geo_df.to_csv(geo_csv_path, mode='a', header=header, index=False)
            logger.info(f"Appended {len(geo_df)} geolocation features to {geo_csv_path}, total: {len(geolocation_features)}")
        if ip_features:
            ip_df = pd.DataFrame([f for f in ip_features if f not in ip_features[:len(ip_features)-len([f for f in ip_features if f['timestamp'] == ip_features[-1]['timestamp']])]])  # Save only new features
            ip_csv_path = os.path.abspath('ip_features_data.csv')
            header = not os.path.exists(ip_csv_path)
            ip_df.to_csv(ip_csv_path, mode='a', header=header, index=False)
            logger.info(f"Appended {len(ip_df)} ip features to {ip_csv_path}, total: {len(ip_features)}")
    except Exception as e:
        logger.error(f'Server crashed: {e}')