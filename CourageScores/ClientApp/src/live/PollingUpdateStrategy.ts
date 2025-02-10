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
import {LiveDataType} from "../interfaces/models/dtos/Live/LiveDataType";
import {IError} from "../components/common/IError";

enum PollResult {
    Updated,
    Error,
    Exception,
    NotTracked,
    NoChange,
}

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

    /* eslint-disable @typescript-eslint/no-explicit-any */
    async publish(props: IStrategyData, id: string, type: LiveDataType, data: any): Promise<IWebSocketContext | null> {
        await this.liveApi.postUpdate(id, type, data);
        return props.context;
    }

    async unsubscribe(props: IStrategyData, /* eslint-disable @typescript-eslint/no-unused-vars */ _id: string): Promise<IWebSocketContext> {
        const anySubscriptions: boolean = any(Object.keys(props.subscriptions));
        if (anySubscriptions) {
            return props.context;
        }

        const newContext: IWebSocketContext = Object.assign({}, props.context);
        if (props.context.pollingHandle) {
            window.clearTimeout(props.context.pollingHandle);
        }
        newContext.pollingHandle = undefined;
        return newContext;
    }

    async subscribe(props: IStrategyData, /* eslint-disable @typescript-eslint/no-unused-vars */ _request?: ISubscriptionRequest): Promise<IWebSocketContext | null> {
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
        let successes: number = 0;
        let exceptions: number = 0;
        let subscriptionsChanged: boolean = false;

        for (const id in allSubscriptions) {
            const subscription: ISubscription = allSubscriptions[id];
            const result: PollResult = await this.requestLatestData(subscription);

            switch (result) {
                case PollResult.Updated:
                case PollResult.NoChange:
                    successes++;
                    break;
                case PollResult.NotTracked:
                    delete newSubscriptions[id];
                    subscriptionsChanged = true;
                    break;
                case PollResult.Error:
                    delete newSubscriptions[id];
                    subscriptionsChanged = true;
                    break;
                case PollResult.Exception:
                    exceptions++;
                    delete newSubscriptions[id];
                    subscriptionsChanged = true;
                    break;
            }
        }

        const newContext: IWebSocketContext = Object.assign({}, context);

        if (exceptions === Object.keys(allSubscriptions).length) {
            // every poll failed, cancel this mode
            newContext.modes = newContext.modes.filter((m: WebSocketMode) => m !== WebSocketMode.polling);
        }
        newContext.pollingHandle = any(Object.keys(allSubscriptions)) && successes > 0
            ? window.setTimeout(this.pollingIteration.bind(this), this.subsequentDelay)
            : undefined;

        await setContext(newContext);
        if (subscriptionsChanged) {
            await setSubscriptions(newSubscriptions);
        }
    }

    private async requestLatestData(subscription: ISubscription): Promise<PollResult> {
        try {
            const latestData: IClientActionResultDto<UpdatedDataDto> | null = await this.liveApi.getUpdate(subscription.id, subscription.type, subscription.lastUpdate || '');
            if (latestData?.success) {
                if (!latestData.result) {
                    return PollResult.NotTracked;
                }

                if (!latestData.result.data) {
                    return PollResult.NoChange;
                }

                subscription.lastUpdate = latestData.result.lastUpdate;
                subscription.updateHandler(latestData.result.data);
                return PollResult.Updated;
            }

            const message: string = `Error polling for updates: ${subscription.id} (${subscription.type})`;
            subscription.errorHandler({
                message: message + (latestData?.errors ? '\n' + latestData.errors.join('\n'): ''),
            });
            return PollResult.Error;
        } catch (e) {
            const error: IError = e as IError;

            subscription.errorHandler({
                message: error.message ? error.message : error,
                stack: error.stack
            });

            return PollResult.Exception;
        }
    }
}