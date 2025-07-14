"""
Example integration of user-specific behavioral models with tcp.py WebSocket server
This shows how to modify the existing tcp.py to use the new user-specific models
"""

# Add these imports at the top of tcp.py
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'model'))

try:
    from realtime_integration import process_websocket_data, get_user_risk_assessment, add_security_alert_handler
    MODELS_AVAILABLE = True
    print("✅ User-specific behavioral models loaded successfully")
except ImportError as e:
    print(f"⚠️  User models not available: {e}")
    MODELS_AVAILABLE = False

# Security alert handler for logging
def security_alert_handler(user_id, alerts, model_results):
    """Handle security alerts from behavioral models"""
    for alert in alerts:
        logger.warning(f"🚨 SECURITY ALERT - User {user_id}: {alert['message']} (Score: {alert['score']:.3f})")
        
        # For high-severity alerts, you could:
        # - Log to security system
        # - Send email notifications  
        # - Trigger additional authentication
        # - Block user session
        
        if alert['severity'] == 'high':
            logger.critical(f"HIGH RISK USER DETECTED: {user_id} - Model: {alert['model']}")

# Register the alert handler if models are available
if MODELS_AVAILABLE:
    add_security_alert_handler(security_alert_handler)

# Modified event processing function - add this to your existing process_events()
async def process_events_with_models():
    """Enhanced event processing with user-specific behavioral models"""
    while True:
        try:
            if event_queue:
                data = event_queue.popleft()
                
                # Your existing processing logic here...
                # (keep all the current feature extraction and CSV saving)
                
                # NEW: Process through user-specific behavioral models
                if MODELS_AVAILABLE and 'user_id' in data:
                    try:
                        model_result = process_websocket_data(data)
                        
                        if model_result and not model_result.get('error'):
                            # Log model processing results
                            user_id = model_result['user_id']
                            models_updated = model_result['models_updated']
                            alerts = model_result.get('alerts', [])
                            
                            logger.info(f"📊 User {user_id} models updated: {', '.join(models_updated)}")
                            
                            # Handle any security alerts
                            if alerts:
                                logger.warning(f"⚠️  {len(alerts)} security alerts for user {user_id}")
                            
                            # Optional: Send results back to connected clients
                            await broadcast_model_results(model_result)
                            
                        elif model_result and model_result.get('error'):
                            logger.error(f"Model processing error: {model_result['error']}")
                            
                    except Exception as e:
                        logger.error(f"Error in behavioral model processing: {e}")
                
                # Continue with your existing processing...
                
            else:
                await asyncio.sleep(0.1)
                
        except Exception as e:
            logger.error(f"Error in event processing: {e}")
            await asyncio.sleep(0.1)

# Optional: Broadcast model results to connected clients
async def broadcast_model_results(model_result):
    """Send model results back to connected clients"""
    if connected_clients:
        message = json.dumps({
            'type': 'behavioral_model_update',
            'user_id': model_result['user_id'],
            'timestamp': model_result['timestamp'],
            'models_updated': model_result['models_updated'],
            'has_alerts': len(model_result.get('alerts', [])) > 0,
            'risk_level': determine_risk_level(model_result)
        })
        
        # Send to all connected clients (or filter by user_id if needed)
        disconnected = set()
        for client in connected_clients:
            try:
                await client.send(message)
            except websockets.exceptions.ConnectionClosed:
                disconnected.add(client)
        
        # Clean up disconnected clients
        connected_clients.difference_update(disconnected)

def determine_risk_level(model_result):
    """Determine overall risk level from model results"""
    if not model_result.get('alerts'):
        return 'low'
    
    severity_levels = [alert['severity'] for alert in model_result['alerts']]
    
    if 'high' in severity_levels:
        return 'high'
    elif 'medium' in severity_levels:
        return 'medium'
    else:
        return 'low'

# Enhanced handler with user ID extraction
async def enhanced_handler(websocket):
    """Enhanced WebSocket handler with behavioral model integration"""
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
                
                # Add user_id if not present (you might get this from authentication)
                if 'user_id' not in data:
                    # You could extract user_id from session, JWT token, or other auth mechanism
                    # For now, using client_ip as fallback identifier
                    data['user_id'] = f"client_{client_ip.replace('.', '_')}"
                
                # Add to event queue for processing
                event_queue.append(data)
                
                # Optional: Send immediate feedback to client
                if MODELS_AVAILABLE and data.get('type') in ['typing', 'tap', 'swipe']:
                    try:
                        # Get user risk assessment
                        user_id = data['user_id']
                        risk_profile = get_user_risk_assessment(user_id)
                        
                        if risk_profile:
                            await websocket.send(json.dumps({
                                'type': 'risk_assessment',
                                'user_id': user_id,
                                'overall_risk': risk_profile['overall_risk'],
                                'model_status': risk_profile['model_status']
                            }))
                    except Exception as e:
                        logger.error(f"Error sending risk assessment: {e}")
                
            except json.JSONDecodeError:
                logger.error("Received non-JSON message")
                
    except websockets.exceptions.ConnectionClosed:
        logger.info(f'Client disconnected: {client_ip}')
    finally:
        connected_clients.discard(websocket)

# API endpoint for getting user risk profiles
async def get_user_profile_api(user_id):
    """API function to get user behavioral profile"""
    if not MODELS_AVAILABLE:
        return {"error": "Behavioral models not available"}
    
    try:
        risk_profile = get_user_risk_assessment(user_id)
        return risk_profile if risk_profile else {"error": "User not found"}
    except Exception as e:
        return {"error": f"Error retrieving user profile: {str(e)}"}

# Modified main function
async def main_with_models():
    """Enhanced main function with behavioral model integration"""
    # Load existing data at startup
    load_existing_data()
    
    if MODELS_AVAILABLE:
        logger.info("🔍 Behavioral biometrics system initialized")
        logger.info("📊 User-specific models will be created automatically")
    else:
        logger.warning("⚠️  Running without behavioral model integration")
    
    ports_to_try = [8081, 8080, 8082, 8083, 8084]
    for port in ports_to_try:
        try:
            # Use enhanced handler instead of original handler
            async with websockets.serve(enhanced_handler, 'localhost', port):
                logger.info(f'WebSocket server up at ws://localhost:{port}')
                logger.info(f'Frontend should connect to: ws://localhost:{port}')
                
                # Use enhanced event processing
                if MODELS_AVAILABLE:
                    asyncio.create_task(process_events_with_models())
                else:
                    asyncio.create_task(process_events())  # Use original function
                
                await asyncio.Future()
        except OSError as e:
            if e.errno == 13:
                logger.error(f'Port {port} - Permission denied (may be in use)')
            elif e.errno == 10048:
                logger.error(f'Port {port} - Already in use')
            else:
                logger.error(f'Port {port} - Error: {e}')

"""
INTEGRATION INSTRUCTIONS:

1. Add the imports at the top of your tcp.py file
2. Add the security_alert_handler function  
3. Register the alert handler with add_security_alert_handler()
4. Replace your process_events() function with process_events_with_models()
5. Replace your handler() function with enhanced_handler()
6. Replace your main() function with main_with_models()
7. Add the broadcast_model_results() and determine_risk_level() helper functions

FEATURES ADDED:
- Automatic user-specific model creation and training
- Real-time behavioral anomaly detection
- Security alert generation and logging
- Risk assessment broadcasting to clients
- Graceful fallback when models aren't available
- User ID extraction and management

SECURITY BENEFITS:
- Detects unusual typing, tap, and swipe patterns
- Provides early warning of account compromise
- Adapts to legitimate user behavior changes
- Supports multi-modal behavioral analysis
- Enables risk-based authentication decisions
"""
