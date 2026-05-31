import { IWebSocketContext } from './IWebSocketContext.ts';
import { ISubscriptionRequest } from './ISubscriptionRequest.ts';
import { IStrategyData } from './IStrategyData.ts';
import { LiveDataType } from '../interfaces/models/dtos/Live/LiveDataType.ts';

export interface IUpdateStrategy {
    refresh(props: IStrategyData): void;
    publish(
        props: IStrategyData,
        id: string,
        type: LiveDataType,
        data: any,
    ): Promise<IWebSocketContext | null>;
    unsubscribe(props: IStrategyData, id: string): Promise<IWebSocketContext>;
    subscribe(
        props: IStrategyData,
        request?: ISubscriptionRequest,
    ): Promise<IWebSocketContext | null>;
}
