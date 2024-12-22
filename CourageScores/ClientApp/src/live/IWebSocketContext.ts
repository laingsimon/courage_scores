import {WebSocketMode} from "./WebSocketMode";

export interface IWebSocketContext {
    webSocket?: WebSocket | null;
    pollingHandle?: number | null;
    modes: WebSocketMode[];
}