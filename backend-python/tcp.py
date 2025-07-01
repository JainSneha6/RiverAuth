import asyncio
import websockets
import json
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

connected_clients = set()

async def handler(websocket):
    client_ip = websocket.remote_address[0]
    logger.info(f'🔌  New client connected: {client_ip}')
    connected_clients.add(websocket)

    try:
        async for message in websocket:
            try:
                # Parse JSON message from frontend
                data = json.loads(message)
                message_type = data.get('type', 'unknown')
                timestamp = data.get('ts', datetime.now().isoformat())
                
                logger.info(f'📨  Received {message_type} from {client_ip}')
                
                # Handle different message types
                if message_type == 'hello':
                    await websocket.send(json.dumps({
                        'type': 'welcome',
                        'message': 'Connected to River Auth WebSocket Server',
                        'timestamp': datetime.now().isoformat()
                    }))
                
                elif message_type == 'signup':
                    await handle_signup_data(websocket, data, client_ip)
                
                elif message_type == 'typing':
                    await handle_typing_data(websocket, data, client_ip)
                
                elif message_type == 'tap' or message_type == 'swipe':
                    await handle_gesture_data(websocket, data, client_ip)
                
                elif data.get('ping'):
                    # Respond to keep-alive ping
                    await websocket.send(json.dumps({'pong': 1}))
                
                else:
                    logger.warning(f'Unknown message type: {message_type}')
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'message': f'Unknown message type: {message_type}'
                    }))
                    
            except json.JSONDecodeError as e:
                logger.error(f'Invalid JSON from {client_ip}: {e}')
                await websocket.send(json.dumps({
                    'type': 'error',
                    'message': 'Invalid JSON format'
                }))
            except Exception as e:
                logger.error(f'Error processing message from {client_ip}: {e}')
                
    except websockets.exceptions.ConnectionClosed:
        logger.info(f'👋  Client disconnected: {client_ip}')
    finally:
        connected_clients.discard(websocket)

async def handle_signup_data(websocket, data, client_ip):
    """Handle complete signup form submission with all tracking data"""
    logger.info(f'📋  Processing signup data from {client_ip}')
    
    form_data = data.get('form', {})
    gestures = data.get('gestures', {})
    typing_events = data.get('typing', [])
    metadata = data.get('metadata', {})
    
    # Log the received data (you can save to database here)
    logger.info(f'Form Data: {form_data.get("firstName", "")} {form_data.get("lastName", "")}')
    logger.info(f'Email: {form_data.get("email", "")}')
    logger.info(f'Phone: {form_data.get("phone", "")}')
    logger.info(f'Account Type: {form_data.get("accountType", "")}')
    logger.info(f'Gestures - Taps: {len(gestures.get("taps", []))}, Swipes: {len(gestures.get("swipes", []))}')
    logger.info(f'Typing Events: {len(typing_events)}')
    logger.info(f'Platform: {metadata.get("platform", "unknown")}')
    
    # TODO: Save to database here
    # await save_user_data_to_db(form_data, gestures, typing_events, client_ip)
    
    # Send confirmation back to frontend
    await websocket.send(json.dumps({
        'type': 'signup_received',
        'status': 'success',
        'message': 'Signup data received and processed successfully',
        'timestamp': datetime.now().isoformat(),
        'user_id': f'user_{datetime.now().strftime("%Y%m%d_%H%M%S")}_{client_ip.replace(".", "_")}'
    }))

async def handle_typing_data(websocket, data, client_ip):
    """Handle real-time typing speed data"""
    typing_event = data.get('data', {})
    field = typing_event.get('field', 'unknown')
    wpm = typing_event.get('wpm', 0)
    
    logger.info(f'⌨️  Typing event from {client_ip}: {field} - {wpm} WPM')
    
    # Send acknowledgment
    await websocket.send(json.dumps({
        'type': 'typing_ack',
        'field': field,
        'wpm': wpm,
        'timestamp': datetime.now().isoformat()
    }))

async def handle_gesture_data(websocket, data, client_ip):
    """Handle real-time gesture data (taps, swipes)"""
    gesture_type = data.get('type')
    gesture_data = data.get('data', {})
    
    if gesture_type == 'tap':
        target = gesture_data.get('target', 'unknown')
        coordinates = gesture_data.get('coordinates', {})
        logger.info(f'👆  Tap from {client_ip}: {target} at ({coordinates.get("x", 0)}, {coordinates.get("y", 0)})')
    elif gesture_type == 'swipe':
        direction = gesture_data.get('direction', 'unknown')
        distance = gesture_data.get('distance', 0)
        logger.info(f'👋  Swipe from {client_ip}: {direction} ({distance}px)')
    
    # Send acknowledgment
    await websocket.send(json.dumps({
        'type': f'{gesture_type}_ack',
        'received': True,
        'timestamp': datetime.now().isoformat()
    }))

async def main():
    # Try different ports if 8080 is busy
    ports_to_try = [8081, 8080, 8082, 8083, 8084] #frontend listens to 8081, listen to that first
    
    for port in ports_to_try:
        try:
            async with websockets.serve(handler, 'localhost', port):
                logger.info(f'✅  WebSocket server up at ws://localhost:{port}')
                logger.info(f'🔗  Update your frontend to connect to: ws://localhost:{port}')
                await asyncio.Future()  # run forever
        except OSError as e:
            if e.errno == 13:  # Permission denied
                logger.error(f'❌  Port {port} - Permission denied (may be in use)')
            elif e.errno == 10048:  # Address already in use
                logger.error(f'❌  Port {port} - Already in use')
            else:
                logger.error(f'❌  Port {port} - Error: {e}')
            
            if port == ports_to_try[-1]:  # Last port in list
                logger.error('❌  All ports failed. Try running as administrator or check firewall.')
                raise
            else:
                logger.info(f'🔄  Trying next port...')
                continue

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info('👋  Server stopped by user')
    except Exception as e:
        logger.error(f'💥  Server crashed: {e}')
