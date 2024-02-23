import {IWebSocketContext} from "./IWebSocketContext";
import {ISubscriptions} from "./ISubscriptions";

export interface IStrategyData {
    context: IWebSocketContext;
    subscriptions: ISubscriptions;
    setContext: (socket: IWebSocketContext) => Promise<any>;
    setSubscriptions: (subscriptions: ISubscriptions) => Promise<any>;
}