import { IWebSocketContext } from './IWebSocketContext.ts';
import { ISubscriptions } from './ISubscriptions.ts';
import { UntypedPromise } from '../interfaces/UntypedPromise.ts';

export interface IStrategyData {
    context: IWebSocketContext;
    subscriptions: ISubscriptions;
    setContext(socket: IWebSocketContext): UntypedPromise;
    setSubscriptions(subscriptions: ISubscriptions): UntypedPromise;
}
