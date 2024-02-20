import {ISubscriptions} from "./ISubscriptions";

import {ISubscriptionRequest} from "./ISubscriptionRequest";

export interface ILiveWebSocket {
    subscriptions: ISubscriptions;
    publish(id: string, data: any): Promise<void>;
    unsubscribe(id: string): Promise<void>;
    subscribe(request: ISubscriptionRequest, dataHandler?: (data: any) => void, errorHandler?: (error: any) => void): Promise<void>;
}

