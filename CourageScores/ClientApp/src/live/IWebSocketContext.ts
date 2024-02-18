export interface IWebSocketContext {
    webSocket?: WebSocket;
    connectionAttempts?: number;
    closures?: number;
    banned?: boolean;
}