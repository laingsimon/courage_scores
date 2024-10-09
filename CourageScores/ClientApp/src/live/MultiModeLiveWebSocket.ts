import {ISubscriptions} from "./ISubscriptions";
import {IWebSocketContext} from "./IWebSocketContext";
import {ILiveWebSocket} from "./ILiveWebSocket";
import {ISubscriptionRequest} from "./ISubscriptionRequest";
import {IUpdateStrategy} from "./IUpdateStrategy";
import {WebSocketMode} from "./WebSocketMode";
import {IStrategyData} from "./IStrategyData";
import {ISubscription} from "./ISubscription";
import {LiveDataType} from "../interfaces/models/dtos/Live/LiveDataType";
import {UntypedPromise} from "../interfaces/UntypedPromise";

interface IMultiModeLiveWebSocketProps {
    socketContext: IWebSocketContext;
    subscriptions: ISubscriptions;
    setSubscriptions(subscriptions: ISubscriptions): UntypedPromise;
    setSocketContext(socket: IWebSocketContext): UntypedPromise;
    webSocketStrategy: IUpdateStrategy;
    pollingStrategy: IUpdateStrategy;
}

export class MultiModeLiveWebSocket implements ILiveWebSocket {
    private readonly socketContext: IWebSocketContext;
    private readonly setSubscriptions: (subscriptions: ISubscriptions) => UntypedPromise;
    private readonly setSocketContext: (socket: IWebSocketContext) => UntypedPromise;
    private readonly webSocketStrategy: IUpdateStrategy;
    private readonly pollingStrategy: IUpdateStrategy;

    public subscriptions: ISubscriptions;

    constructor({
                    socketContext,
                    subscriptions,
                    setSubscriptions,
                    setSocketContext,
                    webSocketStrategy,
                    pollingStrategy,
                }: IMultiModeLiveWebSocketProps) {
        this.socketContext = socketContext;
        this.subscriptions = subscriptions;
        this.setSubscriptions = setSubscriptions;
        this.setSocketContext = setSocketContext;
        this.webSocketStrategy = webSocketStrategy;
        this.pollingStrategy = pollingStrategy;
    }

    async publish(id: string, type: LiveDataType, data: any): Promise<boolean> {
        const strategies: IUpdateStrategy[] = this.getAllStrategies(this.socketContext);
        const strategyProps: IStrategyData = {
            context: this.socketContext,
            subscriptions: this.subscriptions,
            setContext: this.setSocketContext,
            setSubscriptions: this.setSubscriptions,
        };
        for (const s of strategies) {
            s.refresh(strategyProps);
        }

        for (const strategy of strategies) {
            const published: IWebSocketContext = await strategy.publish(strategyProps, id, type, data);
            if (published) {
                await this.setSocketContext(published);
                return true;
            }
        }

        console.error('Unable to publish update; no strategy was able to publish the update');
        return false;
    }

    async unsubscribe(id: string) {
        const strategies: IUpdateStrategy[] = this.getAllStrategies(this.socketContext);
        const strategyProps: IStrategyData = {
            context: this.socketContext,
            subscriptions: this.subscriptions,
            setContext: this.setSocketContext,
            setSubscriptions: this.setSubscriptions,
        };
        for (const s of strategies) {
            s.refresh(strategyProps);
        }

        const newSubscriptions: ISubscriptions = Object.assign({}, this.subscriptions);
        delete newSubscriptions[id];
        delete this.subscriptions[id];
        await this.setSubscriptions(newSubscriptions);

        const newStrategyProps: IStrategyData = {
            context: Object.assign({}, this.socketContext),
            subscriptions: newSubscriptions,
            setContext: this.setSocketContext,
            setSubscriptions: this.setSubscriptions,
        };

        for (const strategy of strategies) {
            newStrategyProps.context = await strategy.unsubscribe(newStrategyProps, id);
        }

        await this.setSocketContext(newStrategyProps.context);
    }

    async subscribe(request: ISubscriptionRequest, dataHandler?: (data: any) => void, errorHandler?: (error: any) => void) {
        if (this.subscriptions[request.id]) {
            console.log(`WARN: ${request.type} subscription is being replaced`);
        }

        const newSubscriptions: ISubscriptions = Object.assign({}, this.subscriptions);
        const newSubscription: ISubscription = {
            id: request.id,
            type: request.type,
            updateHandler: dataHandler || ((msg: any) => console.log(msg)),
            errorHandler: errorHandler || ((err: any) => console.error(err)),
        };
        newSubscriptions[request.id] = newSubscription;
        let newSocketContext: IWebSocketContext = Object.assign({}, this.socketContext);
        let subscribed = false;
        const strategyProps: IStrategyData = {
            context: newSocketContext,
            subscriptions: newSubscriptions,
            setContext: this.setSocketContext,
            setSubscriptions: this.setSubscriptions,
        };

        for (const mode of this.socketContext.modes) {
            const strategy: IUpdateStrategy = this.getStrategy(mode);
            if (!strategy) {
                continue; // null strategy
            }

            strategy.refresh(strategyProps);
            const result: IWebSocketContext = await strategy.subscribe(strategyProps, request);
            if (result) {
                newSocketContext = result;
                newSubscription.method = mode;
                subscribed = true;
                break;
            } else {
                // this strategy is unusable exclude it from future iterations
                newSocketContext.modes = newSocketContext.modes.filter((m: WebSocketMode) => m !== mode);
            }
        }

        if (subscribed) {
            await this.setSubscriptions(newSubscriptions);
        }

        await this.setSocketContext(newSocketContext);
        return subscribed;
    }

    private getAllStrategies(context: IWebSocketContext): IUpdateStrategy[] {
        return context.modes
            .map((mode: WebSocketMode): IUpdateStrategy => this.getStrategy(mode))
            .filter((m: IUpdateStrategy) => !!m);
    }

    private getStrategy(mode: WebSocketMode): IUpdateStrategy {
        switch (mode) {
            case WebSocketMode.polling:
                return this.pollingStrategy;
            case WebSocketMode.socket:
                return this.webSocketStrategy;
            default:
                return null;
        }
    }
}