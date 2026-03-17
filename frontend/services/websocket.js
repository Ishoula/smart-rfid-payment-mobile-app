import { BASE_URL } from './api';

const WS_URL = BASE_URL.replace('http', 'ws');

let ws = null;
let listeners = new Set();
let reconnectTimer = null;

export function connectWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) return;

    try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            console.log('[WS] Connected');
            if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
        };

        ws.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                listeners.forEach(cb => cb(data));
            } catch (err) {
                console.log('[WS] Parse error:', err.message);
            }
        };

        ws.onerror = (e) => console.log('[WS] Error:', e.message || 'Connection failed');

        ws.onclose = () => {
            console.log('[WS] Disconnected. Reconnecting in 5s...');
            reconnectTimer = setTimeout(connectWebSocket, 5000);
        };
    } catch (e) {
        console.log('[WS] Failed to connect:', e.message);
    }
}

export function disconnectWebSocket() {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    if (ws) { ws.close(); ws = null; }
}

export function addWebSocketListener(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
}
