import {IWebSocketContext} from "./IWebSocketContext";
import {ISubscriptions} from "./ISubscriptions";
import {ISubscriptionRequest} from "./ISubscriptionRequest";

export interface IUpdateStrategy {
    refresh(context: IWebSocketContext, subscriptions: ISubscriptions, setContext: (socket: IWebSocketContext) => Promise<any>): void;
    publish(context: IWebSocketContext, subscriptions: ISubscriptions, setContext: (socket: IWebSocketContext) => Promise<any>, id: string, data: any): Promise<IWebSocketContext | null>;
    unsubscribe(context: IWebSocketContext, subscriptions: ISubscriptions, id: string): Promise<IWebSocketContext>;
    subscribe(context: IWebSocketContext, subscriptions: ISubscriptions, setContext: (socket: IWebSocketContext) => Promise<any>, request: ISubscriptionRequest): Promise<IWebSocketContext | null>;
}