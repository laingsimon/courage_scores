import {IUpdateStrategy} from "./IUpdateStrategy";
import {IWebSocketContext} from "./IWebSocketContext";
import {any} from "../helpers/collections";
import {ISubscriptions} from "./ISubscriptions";
import {ISubscriptionRequest} from "./ISubscriptionRequest";
import {ISubscription} from "./ISubscription";
import {MessageType} from "../interfaces/models/dtos/MessageType";

export class WebSocketUpdateStrategy implements IUpdateStrategy {
    private readonly createSocket: () => WebSocket;

    constructor(createSocket: () => WebSocket) {
        this.createSocket = createSocket;
    }

    refresh(context: IWebSocketContext, subscriptions: ISubscriptions, setContext: (socket: IWebSocketContext) => Promise<any>): void {
        if (!context.webSocket) {
            return;
        }

        context.webSocket.onmessage = ((msg: any) => this.handleWebSocketMessage(context, subscriptions, msg));
        context.webSocket.onclose = (async () => await setContext(await this.handleDisconnect(context)));
    }

    async publish(context: IWebSocketContext, subscriptions: ISubscriptions, setContext: (socket: IWebSocketContext) => Promise<any>, id: string, data: any): Promise<IWebSocketContext | null> {
        if (!context.webSocket) {
            context = await this.createSocketAndWaitForReady(context, subscriptions, setContext);
            if (!context) {
                return null;
            }
        }

        context.webSocket.send(JSON.stringify({
            type: MessageType.update,
            id: id,
            data: data,
        }));
        return context;
    }

    async unsubscribe(context: IWebSocketContext, subscriptions: ISubscriptions, id: string): Promise<IWebSocketContext> {
        if (!context.webSocket) {
            return context;
        }

        context.webSocket.send(JSON.stringify({
            type: MessageType.unsubscribed,
            id: id,
        }));

        const anySubscriptions: boolean = any(Object.keys(subscriptions));
        if (anySubscriptions) {
            return context;
        }

        const newContext: IWebSocketContext = Object.assign({}, context);
        context.webSocket.close();
        newContext.webSocket = null;
        return newContext;
    }

    async subscribe(context: IWebSocketContext, subscriptions: ISubscriptions, setContext: (socket: IWebSocketContext) => Promise<any>, request: ISubscriptionRequest): Promise<IWebSocketContext | null> {
        if (!context.webSocket) {
            context = await this.createSocketAndWaitForReady(context, subscriptions, setContext);
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
                        return;
                    }

                    window.clearInterval(handle);
                    if (context.webSocket && context.webSocket.readyState === 1) {
                        resolve(context);
                    } else {
                        context.webSocket.close(); // Assume closing the socket is good practice, even though it isn't at an applicable ready state
                        resolve(null); // report that this strategy was unable to connect
                    }
                } catch (e: any) {
                    console.error(e);
                    window.clearInterval(handle);
                    reject(e.message || 'Error waiting for socket to be ready');
                }
            }, 100);
        });
    }

    private async createSocketAndWaitForReady(context: IWebSocketContext, subscriptions: ISubscriptions, setContext: (socket: IWebSocketContext) => Promise<any>): Promise<IWebSocketContext | null>{
        const socket: WebSocket = this.createSocket();
        const newContext: IWebSocketContext = Object.assign({}, context);
        newContext.connectionAttempts = (newContext.connectionAttempts || 0) + 1;
        newContext.webSocket = socket;
        this.refresh(newContext, subscriptions, setContext);

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

    private alertSubscribers(allSubscriptions: ISubscriptions, id: string, error: any) {
        const subscriptions: ISubscription[] = id
            ? [ allSubscriptions[id] ].filter((s: ISubscription) => s)
            : Object.values(allSubscriptions);

        for (const subscription of subscriptions) {
            subscription.errorHandler(error);
        }
    }

    private async handleWebSocketMessage(context: IWebSocketContext, allSubscriptions: ISubscriptions, messageEvent: any) {
        if (messageEvent.type !== 'message') {
            console.log(`Unhandled message: ${JSON.stringify(messageEvent)}`);
            return;
        }

        const jsonData = JSON.parse(messageEvent.data);
        switch (jsonData.type) {
            case MessageType.update: {
                this.publishToSubscribers(allSubscriptions, jsonData.id, jsonData.data);
                break;
            }
            case MessageType.marco: {
                // send back polo
                context.webSocket.send(JSON.stringify({
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
                    this.alertSubscribers(allSubscriptions, jsonData.id, jsonData.message);
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