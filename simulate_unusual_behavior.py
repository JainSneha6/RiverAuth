#!/usr/bin/env python3
"""
Simulate unusual tap behavior to trigger security alerts
"""
import asyncio
import websockets
import json
import time
import random

async def simulate_unusual_taps():
    uri = "ws://localhost:8081"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WebSocket server for unusual tap simulation")
            
            # Send device info first
            device_message = {
                "type": "device",
                "data": {
                    "screen_width": 1920,
                    "screen_height": 1080,
                    "device_type": "test"
                },
                "user_id": 1,
                "timestamp": time.time() * 1000
            }
            await websocket.send(json.dumps(device_message))
            print("Sent device info")
            await asyncio.sleep(0.5)
            
            # Simulate very unusual tap patterns that should trigger alerts
            for i in range(20):
                # Create unusual tap pattern: very fast, unusual locations, abnormal pressure
                unusual_tap = {
                    "type": "tap",
                    "data": {
                        "x": random.randint(1800, 1920),  # Far right edge (unusual)
                        "y": random.randint(1000, 1080),  # Bottom edge (unusual)
                        "timestamp": time.time() * 1000,
                        "pressure": random.uniform(0.95, 1.0),  # Very high pressure (unusual)
                        "duration": random.randint(10, 20),  # Very short duration (unusual)
                        "target": "unusual_area"
                    },
                    "user_id": 1,
                    "timestamp": time.time() * 1000
                }
                
                await websocket.send(json.dumps(unusual_tap))
                print(f"Sent unusual tap {i+1}: x={unusual_tap['data']['x']}, y={unusual_tap['data']['y']}, pressure={unusual_tap['data']['pressure']:.3f}")
                
                # Very rapid tapping (unusual frequency)
                await asyncio.sleep(0.1)
            
            print("Finished sending unusual tap patterns")
            await asyncio.sleep(2)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(simulate_unusual_taps())
