import { WebSocketMode } from './WebSocketMode.ts';
import { ISubscriptionRequest } from './ISubscriptionRequest.ts';

export interface ISubscription extends ISubscriptionRequest {
    method?: WebSocketMode;
    lastUpdate?: string;
    connected?: boolean;
    updateHandler(data: any): void;
    errorHandler(error: any): void;
}
