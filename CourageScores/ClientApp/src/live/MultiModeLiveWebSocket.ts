import {ISubscriptions} from "./ISubscriptions";
import {IWebSocketContext} from "./IWebSocketContext";
import {ILiveWebSocket} from "./ILiveWebSocket";
import {ISubscriptionRequest} from "./ISubscriptionRequest";
import {IUpdateStrategy} from "./IUpdateStrategy";
import {WebSocketMode} from "./WebSocketMode";

interface IMultiModeLiveWebSocketProps {
    socketContext: IWebSocketContext;
    subscriptions: ISubscriptions;
    setSubscriptions: (subscriptions: ISubscriptions) => Promise<any>;
    setSocketContext: (socket: IWebSocketContext) => Promise<any>;
    webSocketStrategy: IUpdateStrategy;
    pollingStrategy: IUpdateStrategy;
}

export class MultiModeLiveWebSocket implements ILiveWebSocket {
    private readonly socketContext: IWebSocketContext;
    private readonly setSubscriptions: (subscriptions: ISubscriptions) => Promise<any>;
    private readonly setSocketContext: (socket: IWebSocketContext) => Promise<any>;
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

    async publish(id: string, data: any): Promise<boolean> {
        const strategies: IUpdateStrategy[] = this.getAllStrategies(this.socketContext);
        strategies.forEach((s: IUpdateStrategy) => s.refresh(this.socketContext, this.subscriptions, this.setSocketContext));

        for (const strategy of strategies) {
            const published: IWebSocketContext = await strategy.publish(this.socketContext, this.subscriptions, this.setSocketContext, id, data);
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
        strategies.forEach((s: IUpdateStrategy) => s.refresh(this.socketContext, this.subscriptions, this.setSocketContext));

        const newSubscriptions: ISubscriptions = Object.assign({}, this.subscriptions);
        delete newSubscriptions[id];
        delete this.subscriptions[id];
        await this.setSubscriptions(newSubscriptions);

        let newSocketContext: IWebSocketContext = Object.assign({}, this.socketContext);

        for (const strategy of strategies) {
            newSocketContext = await strategy.unsubscribe(newSocketContext, newSubscriptions, id);
        }

        await this.setSocketContext(newSocketContext);
    }

    async subscribe(request: ISubscriptionRequest, dataHandler?: (data: any) => void, errorHandler?: (error: any) => void) {
        if (this.subscriptions[request.id]) {
            console.log(`WARN: ${request.type} subscription is being replaced`);
        }

        const newSubscriptions: ISubscriptions = Object.assign({}, this.subscriptions);
        newSubscriptions[request.id] = {
            id: request.id,
            type: request.type,
            updateHandler: dataHandler || ((msg: any) => console.log(msg)),
            errorHandler: errorHandler || ((err: any) => console.error(err)),
        };
        let newSocketContext: IWebSocketContext = Object.assign({}, this.socketContext);
        let subscribed = false;

        for (let i = 0; i < this.socketContext.modes.length; i++) {
            const mode: WebSocketMode = this.socketContext.modes[i];
            const strategy: IUpdateStrategy = this.getStrategy(mode);
            if (!strategy) {
                continue; // null strategy
            }

            strategy.refresh(newSocketContext, newSubscriptions, this.setSocketContext);
            const result: IWebSocketContext = await strategy.subscribe(newSocketContext, newSubscriptions, this.setSocketContext, request);
            if (result) {
                newSocketContext = result;
                newSubscriptions[request.id].method = mode;
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