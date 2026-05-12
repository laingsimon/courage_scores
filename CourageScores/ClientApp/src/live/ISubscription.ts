import { WebSocketMode } from './WebSocketMode';
import { ISubscriptionRequest } from './ISubscriptionRequest';

export interface ISubscription extends ISubscriptionRequest {
    method?: WebSocketMode;
    lastUpdate?: string;
    connected?: boolean;
    updateHandler(data: any): void;
    errorHandler(error: any): void;
}
