import {IUpdateStrategy} from "./IUpdateStrategy";
import {IWebSocketContext} from "./IWebSocketContext";
import {any} from "../helpers/collections";
import {ISubscriptions} from "./ISubscriptions";
import {ISubscriptionRequest} from "./ISubscriptionRequest";
import {ISubscription} from "./ISubscription";
import {MessageType} from "../interfaces/models/dtos/MessageType";
import {IStrategyData} from "./IStrategyData";
import {LiveDataType} from "../interfaces/models/dtos/Live/LiveDataType";
import {LiveMessageDto} from "../interfaces/models/dtos/LiveMessageDto";
import {IError} from "../components/common/IError";

export class WebSocketUpdateStrategy implements IUpdateStrategy {
    private readonly createSocket: () => WebSocket;

    constructor(createSocket: () => WebSocket) {
        this.createSocket = createSocket;
    }

    refresh(props: IStrategyData): void {
        if (!props.context.webSocket) {
            return;
        }

        /* eslint-disable @typescript-eslint/no-explicit-any */
        props.context.webSocket.onmessage = ((msg: any) => this.handleWebSocketMessage(props, msg));
        props.context.webSocket.onclose = (async () => await props.setContext(await this.handleDisconnect(props.context)));
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    async publish(props: IStrategyData, id: string, type: LiveDataType, data: any): Promise<IWebSocketContext | null> {
        let context: IWebSocketContext = props.context;
        if (!props.context.webSocket) {
            context = await this.createSocketAndWaitForReady(props);
            if (!context) {
                return null;
            }
        }

        const update: LiveMessageDto = {
            type: MessageType.update,
            id: id,
            data: data,
            dataType: type,
        };
        context.webSocket.send(JSON.stringify(update));
        return context;
    }

    async unsubscribe(props: IStrategyData, id: string): Promise<IWebSocketContext> {
        if (!props.context.webSocket) {
            return props.context;
        }

        props.context.webSocket.send(JSON.stringify({
            type: MessageType.unsubscribed,
            id: id,
        }));

        const anySubscriptions: boolean = any(Object.keys(props.subscriptions));
        if (anySubscriptions) {
            return props.context;
        }

        const newContext: IWebSocketContext = Object.assign({}, props.context);
        props.context.webSocket.close();
        newContext.webSocket = null;
        return newContext;
    }

    async subscribe(props: IStrategyData, request: ISubscriptionRequest): Promise<IWebSocketContext | null> {
        let context: IWebSocketContext = props.context;
        if (!context.webSocket) {
            context = await this.createSocketAndWaitForReady(props);
            if (!context) {
                return null;
            }
        }

        if (context.webSocket) {
            context.webSocket.send(JSON.stringify({
                type: MessageType.subscribed,
                id: request.id,
            }));
        }

        return context;
    }

    private async awaitReady(context: IWebSocketContext): Promise<IWebSocketContext | null> {
        if (!context.webSocket || context.webSocket.readyState === 1) {
            return context;
        }

        return new Promise((resolve, reject) => {
            const handle = window.setInterval(() => {
                try {
                    if (context.webSocket && context.webSocket.readyState === 0) {
                        // connecting...
                        /* istanbul ignore next */
                        return;
                    }

                    window.clearInterval(handle);
                    if (context.webSocket && context.webSocket.readyState === 1) {
                        /* istanbul ignore next */
                        resolve(context);
                    } else {
                        context.webSocket.close(); // Assume closing the socket is good practice, even though it isn't at an applicable ready state
                        resolve(null); // report that this strategy was unable to connect
                    }
                } catch (e) {
                    /* istanbul ignore next */
                    const error: IError = e as IError;
                    /* istanbul ignore next */
                    console.error(e);
                    /* istanbul ignore next */
                    window.clearInterval(handle);
                    /* istanbul ignore next */
                    reject(error.message || 'Error waiting for socket to be ready');
                }
            }, 100);
        });
    }

    private async createSocketAndWaitForReady(props: IStrategyData): Promise<IWebSocketContext | null>{
        const socket: WebSocket = this.createSocket();
        const newContext: IWebSocketContext = Object.assign({}, props.context);
        newContext.webSocket = socket;

        const newProps: IStrategyData = Object.assign({}, props);
        newProps.context = newContext;
        this.refresh(newProps);

        return await this.awaitReady(newContext);
    }

    private publishToSubscribers(allSubscriptions: ISubscriptions, id: string, data: any) {
        const subscriptions: ISubscription[] = id
            ? [ allSubscriptions[id] ].filter((s: ISubscription) => s)
            : Object.values(allSubscriptions);

        const update = new Date();
        for (const subscription of subscriptions) {
            subscription.lastUpdate = update.toISOString();
            subscription.updateHandler(data);
        }
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    private alertSubscribers(allSubscriptions: ISubscriptions, id: string, error: any) {
        const subscriptions: ISubscription[] = id
            ? [ allSubscriptions[id] ].filter((s: ISubscription) => s)
            : Object.values(allSubscriptions);

        for (const subscription of subscriptions) {
            subscription.errorHandler(error);
        }
    }

    private async handleWebSocketMessage(props: IStrategyData, messageEvent: any) {
        if (messageEvent.type !== 'message') {
            console.log(`Unhandled message: ${JSON.stringify(messageEvent)}`);
            return;
        }

        const jsonData = JSON.parse(messageEvent.data);
        switch (jsonData.type) {
            case MessageType.update: {
                this.publishToSubscribers(props.subscriptions, jsonData.id, jsonData.data);
                break;
            }
            case MessageType.marco: {
                // send back polo
                props.context.webSocket.send(JSON.stringify({
                    type: MessageType.polo,
                }));
                break;
            }
            case MessageType.polo: {
                // nothing to do
                break;
            }
            case MessageType.error: {
                console.error(jsonData);
                if (jsonData.message) {
                    this.alertSubscribers(props.subscriptions, jsonData.id, jsonData.message);
                }
                break;
            }
            default: {
                console.log(`Unhandled live message: ${messageEvent.data}`);
                break;
            }
        }
    }

    private async handleDisconnect(context: IWebSocketContext): Promise<IWebSocketContext> {
        console.error('Socket disconnected');
        const newContext: IWebSocketContext = Object.assign({}, context);
        newContext.webSocket = null;
        return newContext;
    }
}