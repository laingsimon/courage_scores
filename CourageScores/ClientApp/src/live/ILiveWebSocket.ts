import {ISubscriptions} from "./ISubscriptions";

export interface ILiveWebSocket {
    subscriptions: ISubscriptions;
    publish(id: string, data: any): Promise<void>;
    unsubscribe(id: string): Promise<void>;
    subscribe(id: string, dataHandler?: (data: any) => void, errorHandler?: (error: any) => void): Promise<void>;
    isConnected: () => boolean;
}