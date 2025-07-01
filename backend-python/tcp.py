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
    print(f'🔌  New client connected: {client_ip}')
    connected_clients.add(websocket)

    try:
        async for message in websocket:
            # Show raw message exactly as received
            print(f"=== RAW DATA FROM {client_ip} ===")
            print(message)
            print(f"=== END RAW DATA ===")
            print()  # Empty line for readability
                
    except websockets.exceptions.ConnectionClosed:
        print(f'👋  Client disconnected: {client_ip}')
    finally:
        connected_clients.discard(websocket)

async def main():
    # Try different ports if 8080 is busy
    ports_to_try = [8081, 8080, 8082, 8083, 8084] #frontend listens to 8081, listen to that first
    
    for port in ports_to_try:
        try:
            async with websockets.serve(handler, 'localhost', port):
                print(f'✅  WebSocket server up at ws://localhost:{port}')
                print(f'🔗  Frontend should connect to: ws://localhost:{port}')
                await asyncio.Future()  # run forever
        except OSError as e:
            if e.errno == 13:  # Permission denied
                print(f'❌  Port {port} - Permission denied (may be in use)')
            elif e.errno == 10048:  # Address already in use
                print(f'❌  Port {port} - Already in use')
            else:
                print(f'❌  Port {port} - Error: {e}')
            
            if port == ports_to_try[-1]:  # Last port in list
                print('❌  All ports failed. Try running as administrator or check firewall.')
                raise
            else:
                print(f'🔄  Trying next port...')
                continue

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print('👋  Server stopped by user')
    except Exception as e:
        print(f'💥  Server crashed: {e}')
