import { useEffect, useRef } from 'react';

export interface WebSocketAPI {
  readonly sendJSON: (payload: unknown) => void;
  readonly readyState: () => number;
}

let sharedSocket: WebSocket | null = null;      // 👈 module‑level singleton
let clients = 0;                                // track how many hooks mount

export function useSingletonWebSocket(url: string): WebSocketAPI {
  const localRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    clients++;

    if (!sharedSocket || sharedSocket.readyState === WebSocket.CLOSED) {
      sharedSocket = new WebSocket(url);
      console.log('[WS] opening one global socket');

      // simple keep‑alive so many proxies won’t kill the connection
      const keepAlive = setInterval(() => {
        if (sharedSocket?.readyState === WebSocket.OPEN) sharedSocket.send('{"ping":1}');
      }, 25_000);

      // inside useSingletonWebSocket — runs only once per tab
        sharedSocket.onopen = () => {
        console.log('[WS] OPEN');
            sharedSocket!.send(JSON.stringify({ type: 'hello', ts: Date.now() }));
        };

      sharedSocket.onerror   = (e) => console.error('[WS] error', e);
      sharedSocket.onclose   = (e) => { console.warn('[WS] CLOSED', e.code); clearInterval(keepAlive); };
      sharedSocket.onmessage = (e) => console.log('[WS] →', e.data);
    }

    localRef.current = sharedSocket;

    return () => {
      clients--;
      if (clients === 0 && sharedSocket?.readyState === WebSocket.OPEN) {
        // only close when the LAST component using it unmounts
        console.log('[WS] no more listeners; closing');
        sharedSocket.close(1000, 'all listeners gone');
      }
    };
  }, [url]);

  const sendJSON = (payload: unknown) => {
    if (sharedSocket?.readyState === WebSocket.OPEN) {
      sharedSocket.send(JSON.stringify(payload));
    } else {
      console.warn('[WS] not open, payload dropped / queue it here if needed');
    }
  };

  const readyState = () => sharedSocket?.readyState ?? WebSocket.CLOSED;

  return { sendJSON, readyState };
}
