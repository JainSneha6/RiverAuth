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
feature_data = []  # List to store features for DataFrame
last_event_time = {}  # Track last event time per client
event_counts = {}  # Track event counts per client for frequency
session_stats = {}  # Track session-based stats
user_stats = {}  # Track user-specific stats
EDGE_THRESHOLD = 50  # Pixels from edge to consider "near edge"
FREQUENCY_WINDOW = 5  # Seconds for frequency calculation
SCREEN_WIDTH = 1920  # Default, updated by device message
SCREEN_HEIGHT = 1080  # Default, updated by device message
FREQUENCY_THRESHOLD = 5  # Events per second for unusual frequency

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
            event_ts = event.get('ts', time.time() * 1000) / 1000  # Convert to seconds
            client_ip = event.get('client_ip', 'unknown')
            user_id = event_data.get('user_id', client_ip)  # Use client_ip if user_id not provided

            # Handle unexpected event types
            if event_type not in ['tap', 'swipe', 'device']:
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
                last_event_time[client_ip] = {'tap': 0, 'swipe': 0, 'any': 0}
                event_counts[client_ip] = {'tap': [], 'swipe': []}
                session_stats[client_ip] = {
                    'tap_durations': [], 'swipe_speeds': [], 'swipe_distances': [],
                    'event_times': [], 'regions': [], 'directions': [], 'event_sequence': []
                }
            if user_id not in user_stats:
                user_stats[user_id] = {
                    'tap_durations': [], 'swipe_speeds': [], 'tap_x': [], 'tap_y': [],
                    'swipe_start_x': [], 'swipe_start_y': [], 'regions': [], 'directions': [],
                    'pointer_types': []
                }

            # Update event counts for frequency
            current_time = time.time()
            event_counts[client_ip][event_type].append(current_time)
            event_counts[client_ip][event_type] = [
                t for t in event_counts[client_ip][event_type]
                if current_time - t <= FREQUENCY_WINDOW
            ]
            session_stats[client_ip]['event_times'].append(event_ts)

            # Base features
            features = {
                'event_type': event_type,
                'timestamp': event_ts,
                'user_id': user_id,
                'client_ip': client_ip,
                'event_count': len(event_counts[client_ip]['tap']) + len(event_counts[client_ip]['swipe']),
                'event_rate': (
                    len(event_counts[client_ip]['tap'] + event_counts[client_ip]['swipe']) / FREQUENCY_WINDOW
                    if FREQUENCY_WINDOW > 0 else 0
                ),
                'is_unusual_frequency': (
                    (len(event_counts[client_ip]['tap'] + event_counts[client_ip]['swipe']) / FREQUENCY_WINDOW) > FREQUENCY_THRESHOLD
                ),
                'time_since_last_event': (
                    event_ts - last_event_time[client_ip]['any']
                    if last_event_time[client_ip]['any'] > 0 else 0
                ),
                'session_duration': (
                    event_ts - min(session_stats[client_ip]['event_times'])
                    if session_stats[client_ip]['event_times'] else 0
                ),
                'time_of_day': int(time.strftime("%H", time.localtime(event_ts))),
            }

            # User-specific statistics
            avg_user_tap_duration = np.mean(user_stats[user_id]['tap_durations']) if user_stats[user_id]['tap_durations'] else 0
            std_user_tap_duration = np.std(user_stats[user_id]['tap_durations']) if user_stats[user_id]['tap_durations'] else 0
            avg_user_swipe_speed = np.mean(user_stats[user_id]['swipe_speeds']) if user_stats[user_id]['swipe_speeds'] else 0
            std_user_swipe_speed = np.std(user_stats[user_id]['swipe_speeds']) if user_stats[user_id]['swipe_speeds'] else 0
            region_counts = [user_stats[user_id]['regions'].count(r) for r in ['top-left', 'top-right', 'bottom-left', 'bottom-right']]
            preferred_region = ['top-left', 'top-right', 'bottom-left', 'bottom-right'][np.argmax(region_counts)] if sum(region_counts) > 0 else 'none'
            region_entropy = compute_entropy(region_counts)
            direction_counts = [user_stats[user_id]['directions'].count(d) for d in ['left', 'right', 'up', 'down', 'unknown']]
            swipe_direction_consistency = max(direction_counts) / sum(direction_counts) if sum(direction_counts) > 0 else 0
            event_sequence_entropy = compute_entropy([session_stats[client_ip]['event_sequence'].count(e) for e in ['tap', 'swipe']])
            features.update({
                'avg_user_tap_duration': avg_user_tap_duration,
                'std_user_tap_duration': std_user_tap_duration,
                'avg_user_swipe_speed': avg_user_swipe_speed,
                'std_user_swipe_speed': std_user_swipe_speed,
                'preferred_region': preferred_region,
                'region_entropy': region_entropy,
                'swipe_direction_consistency': swipe_direction_consistency,
                'event_sequence_entropy': event_sequence_entropy,
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

                # Compute additional tap features
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
                time_since_last_tap = (
                    event_ts - last_event_time[client_ip]['tap']
                    if last_event_time[client_ip]['tap'] > 0 else 0
                )
                tap_pressure = min(duration / 1000, 1.0)
                avg_tap_x = np.mean(user_stats[user_id]['tap_x']) if user_stats[user_id]['tap_x'] else tap_x
                avg_tap_y = np.mean(user_stats[user_id]['tap_y']) if user_stats[user_id]['tap_y'] else tap_y
                distance_from_user_mean = math.sqrt((tap_x - avg_tap_x) ** 2 + (tap_y - avg_tap_y) ** 2)
                tap_pressure_deviation = abs(tap_pressure - avg_user_tap_duration / 1000) if user_stats[user_id]['tap_durations'] else 0
                is_new_pointer_type = pointer_type != max(
                    [user_stats[user_id]['pointer_types'].count(p) for p in ['mouse', 'touch', 'gesture', 'unknown']],
                    default='unknown'
                )
                target_change_frequency = (
                    sum(1 for i in range(1, len(session_stats[client_ip]['event_times']))
                        if session_stats[client_ip]['event_times'][i] != session_stats[client_ip]['event_times'][i-1])
                    / len(session_stats[client_ip]['event_times']) if session_stats[client_ip]['event_times'] else 0
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
                    'time_since_last_tap': time_since_last_tap,
                    'tap_pressure': tap_pressure,
                    'distance_from_user_mean': distance_from_user_mean,
                    'tap_pressure_deviation': tap_pressure_deviation,
                    'is_new_pointer_type': is_new_pointer_type,
                    'target_change_frequency': target_change_frequency,
                })

                # Log for debugging
                logger.info(f"Tap at ({tap_x}, {tap_y}), region: {region}, "
                            f"SCREEN_WIDTH: {SCREEN_WIDTH}, distance_from_center: {distance_from_center:.2f}")

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
                source = event_data.get('source', 'unknown')

                # Compute additional swipe features
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
                time_since_last_swipe = (
                    event_ts - last_event_time[client_ip]['swipe']
                    if last_event_time[client_ip]['swipe'] > 0 else 0
                )
                acceleration = speed / duration if duration > 0 else 0
                avg_start_x = np.mean(user_stats[user_id]['swipe_start_x']) if user_stats[user_id]['swipe_start_x'] else start_x
                avg_start_y = np.mean(user_stats[user_id]['swipe_start_y']) if user_stats[user_id]['swipe_start_y'] else start_y
                distance_from_user_mean = math.sqrt((start_x - avg_start_x) ** 2 + (start_y - avg_start_y) ** 2)
                is_new_pointer_type = pointer_type != max(
                    [user_stats[user_id]['pointer_types'].count(p) for p in ['mouse', 'touch', 'gesture', 'unknown']],
                    default='unknown'
                )
                target_change_frequency = (
                    sum(1 for i in range(1, len(session_stats[client_ip]['event_times']))
                        if session_stats[client_ip]['event_times'][i] != session_stats[client_ip]['event_times'][i-1])
                    / len(session_stats[client_ip]['event_times']) if session_stats[client_ip]['event_times'] else 0
                )

                # Update session and user stats
                session_stats[client_ip]['swipe_speeds'].append(speed)
                session_stats[client_ip]['swipe_distances'].append(distance)
                session_stats[client_ip]['regions'].append(start_region)
                session_stats[client_ip]['directions'].append(direction)
                session_stats[client_ip]['event_sequence'].append('swipe')
                user_stats[user_id]['swipe_speeds'].append(speed)
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
                    'time_since_last_swipe': time_since_last_swipe,
                    'acceleration': acceleration,
                    'distance_from_user_mean': distance_from_user_mean,
                    'is_new_pointer_type': is_new_pointer_type,
                    'target_change_frequency': target_change_frequency,
                })

                # Log for debugging
                logger.info(f"Swipe from ({start_x}, {start_y}) to ({end_x}, {end_y}), "
                            f"start_region: {start_region}, end_region: {end_region}")

            # Store features
            feature_data.append(features)
            last_event_time[client_ip][event_type] = event_ts
            last_event_time[client_ip]['any'] = event_ts

            # Save to CSV after every event (for testing)
            df = pd.DataFrame(feature_data)
            csv_path = os.path.abspath('gesture_features.csv')
            df.to_csv(csv_path, index=False)
            logger.info(f"Saved {len(feature_data)} features to {csv_path}")

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
        if feature_data:
            df = pd.DataFrame(feature_data)
            csv_path = os.path.abspath('gesture_features.csv')
            df.to_csv(csv_path, index=False)
            logger.info(f"Saved {len(feature_data)} features to {csv_path}")
    except Exception as e:
        logger.error(f'Server crashed: {e}')