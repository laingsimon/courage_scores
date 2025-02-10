import {IWebSocketContext} from "./IWebSocketContext";
import {ISubscriptionRequest} from "./ISubscriptionRequest";
import {IStrategyData} from "./IStrategyData";
import {LiveDataType} from "../interfaces/models/dtos/Live/LiveDataType";

export interface IUpdateStrategy {
    refresh(props: IStrategyData): void;
    publish(props: IStrategyData, id: string, type: LiveDataType, data: any): Promise<IWebSocketContext | null>;
    unsubscribe(props: IStrategyData, id: string): Promise<IWebSocketContext>;
    subscribe(props: IStrategyData, request?: ISubscriptionRequest): Promise<IWebSocketContext | null>;
}