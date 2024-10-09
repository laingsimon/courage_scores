import {IWebSocketContext} from "./IWebSocketContext";
import {ISubscriptions} from "./ISubscriptions";
import {UntypedPromise} from "../interfaces/UntypedPromise";

export interface IStrategyData {
    context: IWebSocketContext;
    subscriptions: ISubscriptions;
    setContext(socket: IWebSocketContext): UntypedPromise;
    setSubscriptions(subscriptions: ISubscriptions): UntypedPromise;
}