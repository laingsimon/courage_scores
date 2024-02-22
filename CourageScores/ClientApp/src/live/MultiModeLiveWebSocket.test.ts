import {MultiModeLiveWebSocket} from "./MultiModeLiveWebSocket";
import {IWebSocketContext} from "./IWebSocketContext";
import {ISubscriptions} from "./ISubscriptions";
import {createTemporaryId} from "../helpers/projection";
import {ILiveWebSocket} from "./ILiveWebSocket";
import {WebSocketMode} from "./WebSocketMode";
import {IUpdateStrategy} from "./IUpdateStrategy";
import {ISubscriptionRequest} from "./ISubscriptionRequest";
import {LiveDataType} from "../interfaces/models/dtos/Live/LiveDataType";

interface IMockUpdateStrategy extends IUpdateStrategy {
    refreshRequest?: { context: IWebSocketContext, subscriptions: ISubscriptions };
    refreshed: boolean;

    publishRequest?: { context: IWebSocketContext, id: string, data: any };
    publishResponse?: IWebSocketContext;

    subscribeRequest?: { context: IWebSocketContext, request: ISubscriptionRequest };
    subscribeResponse?: IWebSocketContext;

    unsubscribeRequest?: { context: IWebSocketContext, subscriptions: ISubscriptions, id: string };
    unsubscribeResponse?: IWebSocketContext;
}

describe('MultiModeLiveWebSocket', () => {
    let newSocketContext: IWebSocketContext;
    let newSubscriptions: ISubscriptions;

    async function setSocketContext(value: IWebSocketContext) {
        newSocketContext = value;
    }

    async function setSubscriptions(value: ISubscriptions) {
        newSubscriptions = value;
    }

    function mockStrategy(): IMockUpdateStrategy {
        return {
            refreshed: false,
            refresh(context: IWebSocketContext, subscriptions: ISubscriptions) {
                this.refreshRequest = { context, subscriptions };
                this.refreshed = true;
            },
            async publish(context: IWebSocketContext, id: string, data: any): Promise<IWebSocketContext | null> {
                this.publishRequest = { context, id, data };
                return this.publishResponse === undefined ? context : this.publishResponse;
            },
            async subscribe(context: IWebSocketContext, request: ISubscriptionRequest): Promise<IWebSocketContext | null> {
                this.subscribeRequest = { context, request };
                return this.subscribeResponse === undefined ? context : this.subscribeResponse;
            },
            async unsubscribe(context: IWebSocketContext, subscriptions: ISubscriptions, id: string): Promise<IWebSocketContext> {
                this.unsubscribeRequest = { context, subscriptions, id };
                return this.unsubscribeResponse === undefined ? context : this.unsubscribeResponse;
            }
        }
    }

    beforeEach(() => {
        newSocketContext = null;
        newSubscriptions = null;
    });

    describe('publish', () => {
        it('throws if there are no strategies', async () => {
            const socketContext: IWebSocketContext = {
                modes: [],
            };
            const socket: ILiveWebSocket = new MultiModeLiveWebSocket({
                setSocketContext,
                setSubscriptions,
                pollingStrategy: null,
                webSocketStrategy: null,
                socketContext: socketContext,
                subscriptions: {}
            });
            let error: string;
            console.error = (msg: string) => error = msg;

            const result = await socket.publish(createTemporaryId(), 'data');

            expect(result).toEqual(false);
            expect(error).toEqual('Unable to publish update; no strategy was able to publish the update');
        });

        it('refreshes all strategies', async () => {
            const pollingStrategy = mockStrategy();
            const webSocketStrategy = mockStrategy();
            const socketContext: IWebSocketContext = {
                modes: [ WebSocketMode.socket, WebSocketMode.polling ],
            };
            const socket: ILiveWebSocket = new MultiModeLiveWebSocket({
                setSocketContext,
                setSubscriptions,
                pollingStrategy,
                webSocketStrategy,
                socketContext: socketContext,
                subscriptions: {}
            });

            await socket.publish(createTemporaryId(), 'data');

            expect(pollingStrategy.refreshed).toEqual(true);
            expect(webSocketStrategy.refreshed).toEqual(true);
        });

        it('publishes via the first strategy only', async () => {
            const pollingStrategy = mockStrategy();
            const webSocketStrategy = mockStrategy();
            const socketContext: IWebSocketContext = {
                modes: [ WebSocketMode.socket, WebSocketMode.polling ],
            };
            const socket: ILiveWebSocket = new MultiModeLiveWebSocket({
                setSocketContext,
                setSubscriptions,
                pollingStrategy,
                webSocketStrategy,
                socketContext: socketContext,
                subscriptions: {}
            });
            webSocketStrategy.publishResponse = {};
            const id: string = createTemporaryId();

            await socket.publish(id, 'data');

            expect(webSocketStrategy.publishRequest).toEqual({
                context: socketContext,
                id,
                data: 'data',
            });
            expect(pollingStrategy.publishRequest).toBeFalsy();
        });

        it('publishes via the second strategy if the first strategy cannot publish', async () => {
            const pollingStrategy = mockStrategy();
            const webSocketStrategy = mockStrategy();
            const socketContext: IWebSocketContext = {
                modes: [ WebSocketMode.socket, WebSocketMode.polling ],
            };
            const socket: ILiveWebSocket = new MultiModeLiveWebSocket({
                setSocketContext,
                setSubscriptions,
                pollingStrategy,
                webSocketStrategy,
                socketContext: socketContext,
                subscriptions: {}
            });
            webSocketStrategy.publishResponse = null;
            pollingStrategy.publishResponse = {};
            const id: string = createTemporaryId();

            await socket.publish(id, 'data');

            expect(webSocketStrategy.publishRequest).toEqual({
                context: socketContext,
                id,
                data: 'data',
            });
            expect(pollingStrategy.publishRequest).toEqual({
                context: socketContext,
                id,
                data: 'data',
            });
        });

        it('throws if all strategies could not publish', async () => {
            const pollingStrategy = mockStrategy();
            const webSocketStrategy = mockStrategy();
            const socketContext: IWebSocketContext = {
                modes: [ WebSocketMode.socket, WebSocketMode.polling ],
            };
            const socket: ILiveWebSocket = new MultiModeLiveWebSocket({
                setSocketContext,
                setSubscriptions,
                pollingStrategy,
                webSocketStrategy,
                socketContext: socketContext,
                subscriptions: {}
            });
            webSocketStrategy.publishResponse = null;
            pollingStrategy.publishResponse = null;
            let error: string;
            console.error = (msg: string) => error = msg;

            const result = await socket.publish(createTemporaryId(), 'data');

            expect(result).toEqual(false);
            expect(webSocketStrategy.publishRequest).toBeTruthy();
            expect(pollingStrategy.publishRequest).toBeTruthy();
            expect(error).toEqual('Unable to publish update; no strategy was able to publish the update');
        });
    });

    describe('unsubscribe', () => {
        it('refreshes all strategies', async () => {
            const pollingStrategy = mockStrategy();
            const webSocketStrategy = mockStrategy();
            const socketContext: IWebSocketContext = {
                modes: [ WebSocketMode.socket, WebSocketMode.polling ],
            };
            const socket: ILiveWebSocket = new MultiModeLiveWebSocket({
                setSocketContext,
                setSubscriptions,
                pollingStrategy,
                webSocketStrategy,
                socketContext: socketContext,
                subscriptions: {}
            });

            await socket.unsubscribe(createTemporaryId());

            expect(pollingStrategy.refreshed).toEqual(true);
            expect(webSocketStrategy.refreshed).toEqual(true);
        });

        it('removes the subscription and updates subscriptions state', async () => {
            const id = createTemporaryId();
            const initialSubscriptions: ISubscriptions = {};
            initialSubscriptions[id] = {
                id,
                type: LiveDataType.sayg,
                errorHandler: () => {},
                updateHandler: () => {},
            };
            const pollingStrategy = mockStrategy();
            const webSocketStrategy = mockStrategy();
            const socketContext: IWebSocketContext = {
                modes: [ WebSocketMode.socket, WebSocketMode.polling ],
            };
            const socket: ILiveWebSocket = new MultiModeLiveWebSocket({
                setSocketContext,
                setSubscriptions,
                pollingStrategy,
                webSocketStrategy,
                socketContext: socketContext,
                subscriptions: initialSubscriptions
            });

            await socket.unsubscribe(id);

            expect(newSubscriptions).toEqual({});
        });

        it('unsubscribes from all strategies and updates context state', async () => {
            const id = createTemporaryId();
            const pollingStrategy = mockStrategy();
            const webSocketStrategy = mockStrategy();
            const socketContext: IWebSocketContext = {
                modes: [ WebSocketMode.socket, WebSocketMode.polling ],
            };
            const socket: ILiveWebSocket = new MultiModeLiveWebSocket({
                setSocketContext,
                setSubscriptions,
                pollingStrategy,
                webSocketStrategy,
                socketContext: socketContext,
                subscriptions: {}
            });

            await socket.unsubscribe(id);

            expect(webSocketStrategy.unsubscribeRequest).toEqual({
                context: {
                    modes: [ WebSocketMode.socket, WebSocketMode.polling ],
                },
                subscriptions: {},
                id,
            });
            expect(pollingStrategy.unsubscribeRequest).toEqual({
                context: {
                    modes: [ WebSocketMode.socket, WebSocketMode.polling ],
                },
                subscriptions: {},
                id,
            });
        });
    });

    describe('subscribe', () => {
        it('warns if the subscription is being replaced', async () => {
            const id = createTemporaryId();
            const initialSubscriptions: ISubscriptions = {};
            initialSubscriptions[id] = {
                id,
                type: LiveDataType.sayg,
                errorHandler: () => {},
                updateHandler: () => {},
            };
            const pollingStrategy = mockStrategy();
            const webSocketStrategy = mockStrategy();
            const socketContext: IWebSocketContext = {
                modes: [ WebSocketMode.socket, WebSocketMode.polling ],
            };
            const socket: ILiveWebSocket = new MultiModeLiveWebSocket({
                setSocketContext,
                setSubscriptions,
                pollingStrategy,
                webSocketStrategy,
                socketContext: socketContext,
                subscriptions: initialSubscriptions
            });
            let warn: string;
            console.log = (msg: string) => warn = msg;

            await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(warn).toEqual('WARN: Sayg subscription is being replaced');
        });

        it('adds subscription and updates state', async () => {
            const id = 'NEW_ID';
            const pollingStrategy = mockStrategy();
            const webSocketStrategy = mockStrategy();
            const socketContext: IWebSocketContext = {
                modes: [ WebSocketMode.socket, WebSocketMode.polling ],
            };
            const socket: ILiveWebSocket = new MultiModeLiveWebSocket({
                setSocketContext,
                setSubscriptions,
                pollingStrategy,
                webSocketStrategy,
                socketContext: socketContext,
                subscriptions: {}
            });

            await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(newSubscriptions).toEqual({
                NEW_ID: {
                    id,
                    type: LiveDataType.sayg,
                    method: WebSocketMode.socket,
                    errorHandler: expect.any(Function),
                    updateHandler: expect.any(Function),
                }
            });
        });

        it('handles no strategies', async () => {
            const id = 'NEW_ID';
            const pollingStrategy = mockStrategy();
            const webSocketStrategy = mockStrategy();
            const socketContext: IWebSocketContext = {
                modes: [ ],
            };
            const socket: ILiveWebSocket = new MultiModeLiveWebSocket({
                setSocketContext,
                setSubscriptions,
                pollingStrategy,
                webSocketStrategy,
                socketContext: socketContext,
                subscriptions: {}
            });

            const result = await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(result).toEqual(false);
        });

        it('subscribes via the first strategy', async () => {
            const id = 'NEW_ID';
            const pollingStrategy = mockStrategy();
            const webSocketStrategy = mockStrategy();
            const socketContext: IWebSocketContext = {
                modes: [ WebSocketMode.socket, WebSocketMode.polling ],
            };
            const socket: ILiveWebSocket = new MultiModeLiveWebSocket({
                setSocketContext,
                setSubscriptions,
                pollingStrategy,
                webSocketStrategy,
                socketContext: socketContext,
                subscriptions: {}
            });

            await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(webSocketStrategy.subscribeRequest).toEqual({
                context: {
                    modes: [ WebSocketMode.socket, WebSocketMode.polling ],
                },
                request: {
                    id,
                    type: LiveDataType.sayg,
                }
            });
        });

        it('does not subscribe via subsequent strategies', async () => {
            const id = 'NEW_ID';
            const pollingStrategy = mockStrategy();
            const webSocketStrategy = mockStrategy();
            const socketContext: IWebSocketContext = {
                modes: [ WebSocketMode.socket, WebSocketMode.polling ],
            };
            const socket: ILiveWebSocket = new MultiModeLiveWebSocket({
                setSocketContext,
                setSubscriptions,
                pollingStrategy,
                webSocketStrategy,
                socketContext: socketContext,
                subscriptions: {}
            });

            await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(pollingStrategy.subscribeRequest).toBeFalsy();
        });

        it('updates websocket state', async () => {
            const id = 'NEW_ID';
            const pollingStrategy = mockStrategy();
            const webSocketStrategy = mockStrategy();
            const socketContext: IWebSocketContext = {
                modes: [ WebSocketMode.socket, WebSocketMode.polling ],
            };
            const socket: ILiveWebSocket = new MultiModeLiveWebSocket({
                setSocketContext,
                setSubscriptions,
                pollingStrategy,
                webSocketStrategy,
                socketContext: socketContext,
                subscriptions: {}
            });

            await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(newSocketContext).toEqual({
                modes: [ WebSocketMode.socket, WebSocketMode.polling ],
            });
        });

        it('removes strategy if unable to subscribe', async () => {
            const id = 'NEW_ID';
            const pollingStrategy = mockStrategy();
            const webSocketStrategy = mockStrategy();
            const socketContext: IWebSocketContext = {
                modes: [ WebSocketMode.socket, WebSocketMode.polling ],
            };
            const socket: ILiveWebSocket = new MultiModeLiveWebSocket({
                setSocketContext,
                setSubscriptions,
                pollingStrategy,
                webSocketStrategy,
                socketContext: socketContext,
                subscriptions: {}
            });
            webSocketStrategy.subscribeResponse = null;

            await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(newSocketContext).toEqual({
                modes: [ WebSocketMode.polling ],
            });
        });

        it('subscribes via subsequent strategy if first fails', async () => {
            const id = 'NEW_ID';
            const pollingStrategy = mockStrategy();
            const webSocketStrategy = mockStrategy();
            const socketContext: IWebSocketContext = {
                modes: [ WebSocketMode.socket, WebSocketMode.polling ],
            };
            const socket: ILiveWebSocket = new MultiModeLiveWebSocket({
                setSocketContext,
                setSubscriptions,
                pollingStrategy,
                webSocketStrategy,
                socketContext: socketContext,
                subscriptions: {}
            });
            webSocketStrategy.subscribeResponse = null;

            await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(webSocketStrategy.subscribeRequest).toBeTruthy();
            expect(pollingStrategy.subscribeRequest).toEqual({
                context: {
                    modes: [ WebSocketMode.polling ],
                },
                request: {
                    id,
                    type: LiveDataType.sayg,
                }
            });
        });

        it('does not update subscriptions if no strategies', async () => {
            const id = 'NEW_ID';
            const pollingStrategy = mockStrategy();
            const webSocketStrategy = mockStrategy();
            const socketContext: IWebSocketContext = {
                modes: [ ],
            };
            const socket: ILiveWebSocket = new MultiModeLiveWebSocket({
                setSocketContext,
                setSubscriptions,
                pollingStrategy,
                webSocketStrategy,
                socketContext: socketContext,
                subscriptions: {}
            });
            webSocketStrategy.subscribeResponse = null;

            await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(newSubscriptions).toBeFalsy();
        });

        it('returns false if all strategies fail to subscribe', async () => {
            const id = 'NEW_ID';
            const pollingStrategy = mockStrategy();
            const webSocketStrategy = mockStrategy();
            const socketContext: IWebSocketContext = {
                modes: [ ],
            };
            const socket: ILiveWebSocket = new MultiModeLiveWebSocket({
                setSocketContext,
                setSubscriptions,
                pollingStrategy,
                webSocketStrategy,
                socketContext: socketContext,
                subscriptions: {}
            });
            webSocketStrategy.subscribeResponse = null;
            pollingStrategy.subscribeResponse = null;

            const result = await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(result).toEqual(false);
        });

        it('does not update subscriptions if all fails to subscribe', async () => {
            const id = 'NEW_ID';
            const pollingStrategy = mockStrategy();
            const webSocketStrategy = mockStrategy();
            const socketContext: IWebSocketContext = {
                modes: [ ],
            };
            const socket: ILiveWebSocket = new MultiModeLiveWebSocket({
                setSocketContext,
                setSubscriptions,
                pollingStrategy,
                webSocketStrategy,
                socketContext: socketContext,
                subscriptions: {}
            });
            webSocketStrategy.subscribeResponse = null;
            pollingStrategy.subscribeResponse = null;

            await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(newSubscriptions).toBeNull();
        });
    });
});