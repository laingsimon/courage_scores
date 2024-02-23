import {ISubscriptions} from "./ISubscriptions";
import {ISubscriptionRequest} from "./ISubscriptionRequest";
import {LiveDataType} from "../interfaces/models/dtos/Live/LiveDataType";

export interface ILiveWebSocket {
    subscriptions: ISubscriptions;
    publish(id: string, type: LiveDataType, data: any): Promise<boolean>;
    unsubscribe(id: string): Promise<void>;
    subscribe(request: ISubscriptionRequest, dataHandler?: (data: any) => void, errorHandler?: (error: any) => void): Promise<boolean>;
}

