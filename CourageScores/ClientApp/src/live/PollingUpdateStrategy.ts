import {IUpdateStrategy} from "./IUpdateStrategy";
import {ISubscription} from "./ISubscription";
import {IClientActionResultDto} from "../components/common/IClientActionResultDto";
import {any} from "../helpers/collections";
import {IWebSocketContext} from "./IWebSocketContext";
import {ISubscriptions} from "./ISubscriptions";
import {ISubscriptionRequest} from "./ISubscriptionRequest";
import {ILiveApi} from "../interfaces/apis/ILiveApi";
import {WebSocketMode} from "./WebSocketMode";

export class PollingUpdateStrategy implements IUpdateStrategy {
    private readonly initialDelay: number;
    private readonly liveApi: ILiveApi;
    private readonly subsequentDelay: number;

    private refreshContext?: {
        context: IWebSocketContext;
        allSubscriptions: ISubscriptions;
        setContext: (socket: IWebSocketContext) => Promise<any>;
    };

    constructor(liveApi: ILiveApi, initialDelay: number, subsequentDelay: number) {
        this.liveApi = liveApi;
        this.initialDelay = initialDelay;
        this.subsequentDelay = subsequentDelay;
    }

    refresh(context: IWebSocketContext, allSubscriptions: ISubscriptions, setContext: (socket: IWebSocketContext) => Promise<any>): void {
        this.refreshContext = { context, allSubscriptions, setContext };
    }

    async publish(_: IWebSocketContext, __: string, ___: any): Promise<IWebSocketContext | null> {
        return null;
    }

    async unsubscribe(context: IWebSocketContext, subscriptions: ISubscriptions, _: string): Promise<IWebSocketContext> {
        const anySubscriptions: boolean = any(Object.keys(subscriptions));
        if (anySubscriptions) {
            return context;
        }

        const newContext: IWebSocketContext = Object.assign({}, context);
        window.clearTimeout(context.pollingHandle);
        newContext.pollingHandle = null;
        return newContext;
    }

    async subscribe(context: IWebSocketContext, _: ISubscriptionRequest): Promise<IWebSocketContext | null> {
        if (context.pollingHandle) {
            return context;
        }

        const newContext: IWebSocketContext = Object.assign({}, context);
        newContext.pollingHandle = window.setTimeout(this.pollingIteration.bind(this), this.initialDelay);
        return newContext;
    }

    private async pollingIteration(): Promise<void> {
        if (!this.refreshContext) {
            console.log('No refresh context, unable to execute on polling iteration');
            return;
        }

        const context: IWebSocketContext = this.refreshContext.context;
        const allSubscriptions: ISubscriptions = this.refreshContext.allSubscriptions;

        // polling iteration
        const update: string = new Date().toISOString();
        let someSuccess: boolean = false;

        for (const id in allSubscriptions) {
            const subscription: ISubscription = allSubscriptions[id];
            const success: boolean = await this.requestLatestData(subscription, update);
            someSuccess = someSuccess || success;
        }

        const newContext: IWebSocketContext = Object.assign({}, context);

        if (!someSuccess && any(Object.keys(allSubscriptions))) {
            // every poll failed, cancel this mode
            newContext.modes = newContext.modes.filter((m: WebSocketMode) => m !== WebSocketMode.polling);
        }
        newContext.pollingHandle = any(Object.keys(allSubscriptions)) && someSuccess
            ? window.setTimeout(this.pollingIteration.bind(this), this.subsequentDelay)
            : null;

        await this.refreshContext.setContext(newContext);
    }

    private async requestLatestData(subscription: ISubscription, update: string): Promise<boolean> {
        try {
            const latestData: IClientActionResultDto<any> = await this.liveApi.getUpdate(subscription.id, subscription.type, subscription.lastUpdate);
            if (latestData.success) {
                if (latestData.result) {
                    subscription.lastUpdate = update;
                    subscription.updateHandler(latestData.result);
                } else {
                    // no update since last request
                }

                return true;
            } else {
                subscription.errorHandler(latestData);
                return false;
            }
        } catch (e) {
            const error = e as any;

            subscription.errorHandler({
                message: error.message ? error.message : error,
                stack: error.stack
            });

            return false;
        }
    }
}