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
            if event_type not in ['tap', 'swipe', 'device', 'typing', 'geolocation', 'ip']:
                logger.warning(f"Unknown event type: {event_type}, skipping")
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
                event_queue.append(data)
            except json.JSONDecodeError:
                logger.error("Received non-JSON message")
    except websockets.exceptions.ConnectionClosed:
        logger.info(f'Client disconnected: {client_ip}')
    finally:
        connected_clients.discard(websocket)

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