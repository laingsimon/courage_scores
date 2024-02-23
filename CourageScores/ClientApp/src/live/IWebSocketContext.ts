import {WebSocketMode} from "./WebSocketMode";

export interface IWebSocketContext {
    webSocket?: WebSocket;
    pollingHandle?: number;
    modes: WebSocketMode[];
}
