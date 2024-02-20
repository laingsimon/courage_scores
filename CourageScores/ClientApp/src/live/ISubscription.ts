import {LiveDataType} from "./LiveDataType";
import {WebSocketMode} from "./WebSocketMode";

export interface ISubscription {
    id: string,
    type: LiveDataType,
    method?: WebSocketMode,
    lastUpdate?: string;
    updateHandler: (data: any) => void,
    errorHandler: (error: any) => void,
}
