import asyncio
import websockets
import json

async def test_client():
    uri = "ws://localhost:8081"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to WebSocket server")
            
            # Test hello message
            hello_msg = {
                "type": "hello",
                "ts": 12345
            }
            await websocket.send(json.dumps(hello_msg))
            response = await websocket.recv()
            print(f"📨 Response: {response}")
            
            # Test signup message
            signup_msg = {
                "type": "signup",
                "form": {
                    "firstName": "John",
                    "lastName": "Doe",
                    "email": "john@example.com",
                    "phone": "1234567890",
                    "accountType": "savings"
                },
                "gestures": {
                    "taps": [{"x": 100, "y": 200}],
                    "swipes": [{"direction": "left", "distance": 50}]
                },
                "typing": [{"field": "firstName", "wpm": 45}],
                "metadata": {"platform": "web"}
            }
            await websocket.send(json.dumps(signup_msg))
            response = await websocket.recv()
            print(f"📨 Signup Response: {response}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_client())
