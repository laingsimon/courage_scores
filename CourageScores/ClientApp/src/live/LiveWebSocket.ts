import {any} from "../helpers/collections";
import {ISubscription} from "./ISubscription";
import {ISubscriptions} from "./ISubscriptions";
import {IWebSocketContext} from "./IWebSocketContext";

interface ILiveWebSocketProps {
    socketContext: IWebSocketContext;
    subscriptions: ISubscriptions;
    setSubscriptions: (subscriptions: ISubscriptions) => Promise<any>;
    setSocketContext: (socket: IWebSocketContext) => Promise<any>;
    createSocket: () => WebSocket;
}

export interface ILiveWebSocket {
    subscriptions: ISubscriptions;
    publish(id: string, data: any): Promise<void>;
    unsubscribe(id: string): Promise<void>;
    subscribe(id: string, dataHandler?: (data: any) => void, errorHandler?: (error: any) => void): Promise<void>;
    isConnected: () => boolean;
}

export class LiveWebSocket implements ILiveWebSocket {
    socket: WebSocket | null;
    subscriptions: ISubscriptions;
    setSubscriptions: (subscriptions: ISubscriptions) => Promise<any>;
    setSocketContext: (context: IWebSocketContext) => Promise<any>;
    createSocket: () => WebSocket;
    socketContext: IWebSocketContext;

    constructor({socketContext,
                subscriptions,
                setSubscriptions,
                setSocketContext,
                createSocket}: ILiveWebSocketProps) {
        this.socketContext = socketContext;
        this.socket = socketContext.webSocket;
        this.subscriptions = subscriptions;
        this.setSubscriptions = setSubscriptions;
        this.setSocketContext = setSocketContext;
        this.createSocket = createSocket;
        if (this.socket) {
            this.socket.onmessage = this.handleMessage.bind(this);
            this.socket.onclose = this.handleClose.bind(this);
        }
    }

    isConnected(): boolean {
        return !!this.socket;
    }

    async banConnections() {
        console.error(`Banning web-socket connections after ${this.socketContext.closures} unexpected closures`);

        const newContext = Object.assign({}, this.socketContext);
        newContext.banned = true;
        this.socketContext = newContext;
        await this.setSocketContext(newContext);
    }

    async awaitStateChange() {
        if (this.socketContext.banned) {
            return Promise.reject('banned');
        }

        if (!this.socket || this.socket.readyState === 1) {
            return;
        }

        if (this.socketContext.closures >= 10) {
            await this.banConnections();
            return Promise.reject('just banned');
        }

        return new Promise((resolve, reject) => {
            const handle = window.setInterval(() => {
                try {
                    if (this.socket && this.socket.readyState === 0) {
                        // connecting...
                        return;
                    }

                    window.clearInterval(handle);
                    if (this.socket && this.socket.readyState === 1) {
                        resolve(this);
                    } else {
                        const errorMessage = any(Object.keys(this.subscriptions))
                            ? 'Socket was closed'
                            : 'Socket did not connect';
                        this.closeSocket();
                        reject(errorMessage);
                    }
                } catch (e: any) {
                    console.error(e);
                    window.clearInterval(handle);
                    reject(e.message || 'Error waiting for socket to be ready');
                }
            }, 100);
        });
    }

    async closeSocket() {
        if (this.socket) {
            this.socket.close();

            const newContext: IWebSocketContext = Object.assign({}, this.socketContext);
            newContext.webSocket = null;

            await this.setSocketContext(newContext);
            await this.setSubscriptions({});
        }
    }

    async __send(data: object) {
        if (!this.socket) {
            this.socket = this.createSocket();
            const newContext: IWebSocketContext = Object.assign({}, this.socketContext);
            newContext.connectionAttempts = (newContext.connectionAttempts || 0) + 1;
            newContext.webSocket = this.socket;

            await this.setSocketContext(newContext);
        }

        await this.awaitStateChange();
        this.socket.send(JSON.stringify(data));
    }

    async publish(id: string, data: any) {
        await this.__send({
            type: 'update',
            id: id,
            data: data,
        });
    }

    async unsubscribe(id: string) {
        if (!this.socket) {
            return;
        }

        const newSubscriptions: { [key: string]: any } = Object.assign({}, this.subscriptions);
        delete newSubscriptions[id];
        await this.setSubscriptions(newSubscriptions);

        await this.__send({
            type: 'unsubscribed',
            id: id,
        }).then(() => {
            if (Object.keys(this.subscriptions).length === 0) {
                // when there are no subscriptions left, close the socket
                this.closeSocket();
            }
        });
    }

    async subscribe(id: string, dataHandler?: (data: any) => void, errorHandler?: (error: any) => void) {
        if (this.subscriptions[id]) {
            console.log('WARN: Subscription is being replaced');
        }

        const newSubscriptions = Object.assign({}, this.subscriptions);
        newSubscriptions[id] = {
            id,
            updateHandler: dataHandler || ((msg: any) => console.log(msg)),
            errorHandler: errorHandler || ((err: any) => console.error(err)),
        };
        await this.setSubscriptions(newSubscriptions);

        await this.__send({
            type: 'subscribed',
            id: id,
        });
    }

    publishToSubscribers(id: string, data: any) {
        this.forEachSubscription(id, (sub: ISubscription) => sub.updateHandler(data));
    }

    alertSubscribers(id: string, error: any) {
        this.forEachSubscription(id, (sub: ISubscription) => sub.errorHandler(error));
    }

    forEachSubscription(id: string, handler: (sub: ISubscription) => void) {
        if (id) {
            const subscription = this.subscriptions[id];
            if (subscription) {
                handler(subscription);
            }
            return;
        }

        for (let id in this.subscriptions) {
            const subscription = this.subscriptions[id];
            handler(subscription);
        }
    }

    async handleMessage(messageEvent: any) {
        if (messageEvent.type !== 'message') {
            console.log(`Unhandled message: ${JSON.stringify(messageEvent)}`);
            return;
        }

        const jsonData = JSON.parse(messageEvent.data);
        switch (jsonData.type) {
            case 'Update': {
                this.publishToSubscribers(jsonData.id, jsonData.data);
                break;
            }
            case 'Marco': {
                // send back polo
                await this.__send({
                    type: 'polo',
                });
                break;
            }
            case 'Polo': {
                // nothing to do
                break;
            }
            case 'Error': {
                console.error(jsonData);
                if (jsonData.message) {
                    this.alertSubscribers(jsonData.id, jsonData.message);
                }
                break;
            }
            default: {
                console.log(`Unhandled live message: ${messageEvent.data}`);
                break;
            }
        }
    }

    async handleClose() {
        console.error('Socket closed');
        const newContext: IWebSocketContext = Object.assign({}, this.socketContext);
        newContext.webSocket = null;
        newContext.closures = (newContext.closures || 0) + 1;
        await this.setSocketContext(newContext);
    }
}