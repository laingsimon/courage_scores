import { ISubscriptions } from './ISubscriptions.ts';
import { ISubscriptionRequest } from './ISubscriptionRequest.ts';
import { LiveDataType } from '../interfaces/models/dtos/Live/LiveDataType.ts';

export interface ILiveWebSocket {
    subscriptions: ISubscriptions;
    publish(id: string, type: LiveDataType, data: any): Promise<boolean>;
    unsubscribe(id: string): Promise<void>;
    subscribe(
        request: ISubscriptionRequest,
        dataHandler?: (data: any) => void,
        errorHandler?: (error: any) => void,
    ): Promise<boolean>;
    isConnected(): boolean;
}
