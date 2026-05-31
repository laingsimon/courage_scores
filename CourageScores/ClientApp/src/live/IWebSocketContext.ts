import { WebSocketMode } from './WebSocketMode.ts';

export interface IWebSocketContext {
    webSocket?: WebSocket;
    pollingHandle?: number;
    modes: WebSocketMode[];
}
