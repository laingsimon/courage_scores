import {WebSocketMode} from "./WebSocketMode";

export interface IWebSocketContext {
    webSocket?: WebSocket;
    /*
    * @deprecated
    * TODO: Remove this when (legacy) LiveWebSocket is removed
    * */
    connectionAttempts?: number;
    /*
    * @deprecated
    * TODO: Remove this when (legacy) LiveWebSocket is removed
    * */
    closures?: number;
    /*
    * @deprecated
    * TODO: Remove this when (legacy) LiveWebSocket is removed
    * */
    banned?: boolean;
    pollingHandle?: number;
    modes: WebSocketMode[];
}
