import {IUpdateStrategy} from "./IUpdateStrategy";
import {ISubscription} from "./ISubscription";
import {IClientActionResultDto} from "../components/common/IClientActionResultDto";
import {any} from "../helpers/collections";
import {IWebSocketContext} from "./IWebSocketContext";
import {ISubscriptions} from "./ISubscriptions";
import {ISubscriptionRequest} from "./ISubscriptionRequest";
import {ILiveApi} from "../interfaces/apis/ILiveApi";
import {WebSocketMode} from "./WebSocketMode";
import {UpdatedDataDto} from "../interfaces/models/dtos/Live/UpdatedDataDto";
import {IStrategyData} from "./IStrategyData";

export class PollingUpdateStrategy implements IUpdateStrategy {
    private readonly initialDelay: number;
    private readonly liveApi: ILiveApi;
    private readonly subsequentDelay: number;

    private refreshContext?: IStrategyData;

    constructor(liveApi: ILiveApi, initialDelay: number, subsequentDelay: number) {
        this.liveApi = liveApi;
        this.initialDelay = initialDelay;
        this.subsequentDelay = subsequentDelay;
    }

    refresh(props: IStrategyData): void {
        this.refreshContext = props;
    }

    async publish(_: IStrategyData, __: string, ___: any): Promise<IWebSocketContext | null> {
        return null;
    }

    async unsubscribe(props: IStrategyData, _: string): Promise<IWebSocketContext> {
        const anySubscriptions: boolean = any(Object.keys(props.subscriptions));
        if (anySubscriptions) {
            return props.context;
        }

        const newContext: IWebSocketContext = Object.assign({}, props.context);
        window.clearTimeout(props.context.pollingHandle);
        newContext.pollingHandle = null;
        return newContext;
    }

    async subscribe(props: IStrategyData, _: ISubscriptionRequest): Promise<IWebSocketContext | null> {
        if (props.context.pollingHandle) {
            return props.context;
        }

        const newContext: IWebSocketContext = Object.assign({}, props.context);
        newContext.pollingHandle = window.setTimeout(this.pollingIteration.bind(this), this.initialDelay);
        return newContext;
    }

    private async pollingIteration(): Promise<void> {
        if (!this.refreshContext) {
            console.log('No refresh context, unable to execute on polling iteration');
            return;
        }

        const context: IWebSocketContext = this.refreshContext.context;
        const allSubscriptions: ISubscriptions = this.refreshContext.subscriptions;
        const setContext = this.refreshContext.setContext;
        const setSubscriptions = this.refreshContext.setSubscriptions;
        const newSubscriptions: ISubscriptions = Object.assign({}, allSubscriptions);

        // polling iteration
        let someSuccess: boolean = false;
        let someFailures: boolean = false;

        for (const id in allSubscriptions) {
            const subscription: ISubscription = allSubscriptions[id];
            const success: boolean = await this.requestLatestData(subscription);
            if (!success) {
                someFailures = true;
                delete newSubscriptions[id];
            }

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

        await setContext(newContext);
        if (someFailures) {
            await setSubscriptions(newSubscriptions);
        }
    }

    private async requestLatestData(subscription: ISubscription): Promise<boolean> {
        try {
            const latestData: IClientActionResultDto<UpdatedDataDto> = await this.liveApi.getUpdate(subscription.id, subscription.type, subscription.lastUpdate);
            if (latestData.success) {
                if (latestData.result) {
                    subscription.lastUpdate = latestData.result.lastUpdate;
                    subscription.updateHandler(latestData.result.data);
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