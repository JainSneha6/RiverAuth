"""
Test script to send behavioral data to TCP server and verify CSV logging
"""
import asyncio
import websockets
import json
import time

async def test_behavioral_data_logging():
    """Send test behavioral data to verify CSV logging works"""
    uri = "ws://localhost:8081"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to TCP server")
            
            # Test tap event
            tap_event = {
                "type": "tap",
                "user_id": "test_user_123",
                "timestamp": time.time() * 1000,
                "data": {
                    "clientX": 150,
                    "clientY": 200,
                    "screenX": 150,
                    "screenY": 200,
                    "pageX": 150,
                    "pageY": 200,
                    "duration": 120,
                    "pointerType": "touch",
                    "target": "button",
                    "source": "gesture"
                }
            }
            
            # Test typing event
            typing_event = {
                "type": "typing",
                "user_id": "test_user_123",
                "timestamp": time.time() * 1000,
                "data": {
                    "field": "password",
                    "length": 8,
                    "duration": 2000,
                    "wpm": 45
                }
            }
            
            # Test swipe event
            swipe_event = {
                "type": "swipe",
                "user_id": "test_user_123",
                "timestamp": time.time() * 1000,
                "data": {
                    "startX": 100,
                    "startY": 100,
                    "endX": 300,
                    "endY": 200,
                    "deltaX": 200,
                    "deltaY": 100,
                    "distance": 223.6,
                    "duration": 500,
                    "direction": "right",
                    "pointerType": "touch",
                    "target": "screen",
                    "source": "gesture"
                }
            }
            
            print("📤 Sending tap event...")
            await websocket.send(json.dumps(tap_event))
            await asyncio.sleep(1)
            
            print("📤 Sending typing event...")
            await websocket.send(json.dumps(typing_event))
            await asyncio.sleep(1)
            
            print("📤 Sending swipe event...")
            await websocket.send(json.dumps(swipe_event))
            await asyncio.sleep(2)
            
            print("✅ Test events sent successfully!")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_behavioral_data_logging())
