import {WebSocketMode} from "./WebSocketMode";

export interface IWebSocketContext {
    webSocket?: WebSocket;
    connectionAttempts?: number;
    closures?: number;
    banned?: boolean;
    pollingHandle?: number;
    modes?: WebSocketMode[];
}
