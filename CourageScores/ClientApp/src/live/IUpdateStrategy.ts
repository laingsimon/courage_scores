import {IWebSocketContext} from "./IWebSocketContext";
import {ISubscriptionRequest} from "./ISubscriptionRequest";
import {IStrategyData} from "./IStrategyData";

export interface IUpdateStrategy {
    refresh(props: IStrategyData): void;
    publish(props: IStrategyData, id: string, data: any): Promise<IWebSocketContext | null>;
    unsubscribe(props: IStrategyData, id: string): Promise<IWebSocketContext>;
    subscribe(props: IStrategyData, request: ISubscriptionRequest): Promise<IWebSocketContext | null>;
}