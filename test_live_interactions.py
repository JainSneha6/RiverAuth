"""
Test client to simulate real user interactions and demonstrate live model updates
"""
import asyncio
import websockets
import json
import time
import random

async def simulate_user_interactions():
    """Simulate a real user interacting with the website"""
    uri = "ws://localhost:8081"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("🔗 Connected to WebSocket server")
            
            # Simulate different users
            test_users = ["user_alice", "user_bob", "user_charlie"]
            
            for user_id in test_users:
                print(f"\n👤 Simulating interactions for {user_id}")
                
                # 1. Simulate tap events
                for i in range(5):
                    tap_message = {
                        "type": "tap",
                        "user_id": user_id,
                        "timestamp": time.time() * 1000,
                        "data": {
                            "x": random.randint(100, 800),
                            "y": random.randint(100, 600),
                            "pressure": random.uniform(0.3, 0.9),
                            "target": random.choice(["button", "link", "input"]),
                            "pointer_type": "touch"
                        }
                    }
                    
                    await websocket.send(json.dumps(tap_message))
                    print(f"📱 Sent tap #{i+1} for {user_id}")
                    await asyncio.sleep(0.5)
                
                # 2. Simulate swipe events
                for i in range(3):
                    swipe_message = {
                        "type": "swipe",
                        "user_id": user_id,
                        "timestamp": time.time() * 1000,
                        "data": {
                            "start_x": random.randint(100, 400),
                            "start_y": random.randint(100, 400),
                            "end_x": random.randint(500, 800),
                            "end_y": random.randint(500, 700),
                            "duration": random.randint(200, 800),
                            "target": "screen",
                            "pointer_type": "touch"
                        }
                    }
                    
                    await websocket.send(json.dumps(swipe_message))
                    print(f"👆 Sent swipe #{i+1} for {user_id}")
                    await asyncio.sleep(0.7)
                
                # 3. Simulate typing events
                for i in range(4):
                    typing_message = {
                        "type": "typing",
                        "user_id": user_id,
                        "timestamp": time.time() * 1000,
                        "data": {
                            "field": random.choice(["username", "password", "email"]),
                            "length": random.randint(5, 20),
                            "duration": random.randint(1000, 3000),
                            "wpm": random.randint(40, 80)
                        }
                    }
                    
                    await websocket.send(json.dumps(typing_message))
                    print(f"⌨️  Sent typing #{i+1} for {user_id}")
                    await asyncio.sleep(1.0)
                
                print(f"✅ Completed simulation for {user_id}")
                await asyncio.sleep(2)
            
            print("\n🎉 All user simulations completed!")
            print("Check the server logs to see real-time model updates!")
            
    except Exception as e:
        print(f"❌ Error connecting to WebSocket: {e}")
        print("Make sure the WebSocket server is running on ws://localhost:8081")

if __name__ == "__main__":
    print("🧪 Starting live user interaction simulation...")
    print("This will demonstrate real-time behavioral model creation and updates")
    asyncio.run(simulate_user_interactions())
