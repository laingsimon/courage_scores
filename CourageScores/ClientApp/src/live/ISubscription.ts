import {WebSocketMode} from "./WebSocketMode";
import {ISubscriptionRequest} from "./ISubscriptionRequest";

export interface ISubscription extends ISubscriptionRequest {
    method?: WebSocketMode,
    lastUpdate?: string;
    updateHandler: (data: any) => void,
    errorHandler: (error: any) => void,
}
