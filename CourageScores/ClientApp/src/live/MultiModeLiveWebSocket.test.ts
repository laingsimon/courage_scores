import {MultiModeLiveWebSocket} from "./MultiModeLiveWebSocket";
import {IWebSocketContext} from "./IWebSocketContext";
import {ISubscriptions} from "./ISubscriptions";
import {createTemporaryId} from "../helpers/projection";
import {ILiveWebSocket} from "./ILiveWebSocket";
import {WebSocketMode} from "./WebSocketMode";
import {IUpdateStrategy} from "./IUpdateStrategy";
import {ISubscriptionRequest} from "./ISubscriptionRequest";
import {LiveDataType} from "../interfaces/models/dtos/Live/LiveDataType";
import {IStrategyData} from "./IStrategyData";

interface IMockUpdateStrategy extends IUpdateStrategy {
    refreshRequest: IStrategyData[];
    refreshed: number;

    publishRequest?: { props: IStrategyData, id: string, data: any };
    publishResponse?: IWebSocketContext;

    subscribeRequest?: { props: IStrategyData, request: ISubscriptionRequest };
    subscribeResponse?: IWebSocketContext;

    unsubscribeRequest?: { props: IStrategyData, id: string };
    unsubscribeResponse?: IWebSocketContext;
}

describe('MultiModeLiveWebSocket', () => {
    const socketAndPollingContext: IWebSocketContext = createWebSocketContext(WebSocketMode.socket, WebSocketMode.polling);
    let newSocketContext: IWebSocketContext;
    let newSubscriptions: ISubscriptions;
    let pollingStrategy: IMockUpdateStrategy;
    let webSocketStrategy: IMockUpdateStrategy;

    async function setSocketContext(value: IWebSocketContext) {
        newSocketContext = value;
    }

    async function setSubscriptions(value: ISubscriptions) {
        newSubscriptions = value;
    }

    function mockStrategy(): IMockUpdateStrategy {
        return {
            refreshed: 0,
            refreshRequest: [],
            refresh(props: IStrategyData) {
                this.refreshRequest.push(props);
                this.refreshed++;
            },
            async publish(props: IStrategyData, id: string, type: string, data: any): Promise<IWebSocketContext | null> {
                this.publishRequest = { props, id, type, data };
                return this.publishResponse === undefined ? props.context : this.publishResponse;
            },
            async subscribe(props: IStrategyData, request: ISubscriptionRequest): Promise<IWebSocketContext | null> {
                this.subscribeRequest = { props, request };
                return this.subscribeResponse === undefined ? props.context : this.subscribeResponse;
            },
            async unsubscribe(props: IStrategyData, id: string): Promise<IWebSocketContext> {
                this.unsubscribeRequest = { props, id };
                return this.unsubscribeResponse === undefined ? props.context : this.unsubscribeResponse;
            }
        }
    }

    function multiModeLiveWebSocket(socketContext: IWebSocketContext, pollingStrategy?: IMockUpdateStrategy, webSocketStrategy?: IMockUpdateStrategy, subscriptions?: ISubscriptions): ILiveWebSocket {
        return new MultiModeLiveWebSocket({
            setSocketContext,
            setSubscriptions,
            pollingStrategy,
            webSocketStrategy,
            socketContext: socketContext,
            subscriptions: subscriptions || {},
        });
    }

    function createWebSocketContext(...modes: WebSocketMode[]): IWebSocketContext {
        return {
            modes
        };
    }

    beforeEach(() => {
        newSocketContext = null;
        newSubscriptions = null;
        pollingStrategy = mockStrategy();
        webSocketStrategy = mockStrategy();
    });

    describe('publish', () => {
        it('throws if there are no strategies', async () => {
            const socketContext: IWebSocketContext = createWebSocketContext();
            const socket: ILiveWebSocket = multiModeLiveWebSocket(socketContext);
            let error: string;
            console.error = (msg: string) => error = msg;

            const result = await socket.publish(createTemporaryId(), LiveDataType.sayg, 'data');

            expect(result).toEqual(false);
            expect(error).toEqual('Unable to publish update; no strategy was able to publish the update');
        });

        it('refreshes all strategies', async () => {
            const socket: ILiveWebSocket = multiModeLiveWebSocket(socketAndPollingContext, pollingStrategy, webSocketStrategy);

            await socket.publish(createTemporaryId(), LiveDataType.sayg, 'data');

            expect(pollingStrategy.refreshed).toEqual(1);
            expect(webSocketStrategy.refreshed).toEqual(1);
        });

        it('publishes via the first strategy only', async () => {
            const socket: ILiveWebSocket = multiModeLiveWebSocket(socketAndPollingContext, pollingStrategy, webSocketStrategy);
            webSocketStrategy.publishResponse = { modes: [] };
            const id: string = createTemporaryId();

            await socket.publish(id, LiveDataType.sayg, 'data');

            expect(webSocketStrategy.publishRequest).toEqual({
                props: {
                    context: socketAndPollingContext,
                    subscriptions: {},
                    setContext: expect.any(Function),
                    setSubscriptions: expect.any(Function),
                },
                id,
                data: 'data',
                type: LiveDataType.sayg,
            });
            expect(pollingStrategy.publishRequest).toBeFalsy();
        });

        it('publishes via the second strategy if the first strategy cannot publish', async () => {
            const socket: ILiveWebSocket = multiModeLiveWebSocket(socketAndPollingContext, pollingStrategy, webSocketStrategy);
            webSocketStrategy.publishResponse = null;
            pollingStrategy.publishResponse = { modes: [] };
            const id: string = createTemporaryId();

            await socket.publish(id, LiveDataType.sayg, 'data');

            expect(webSocketStrategy.publishRequest).toEqual({
                props: {
                    context: socketAndPollingContext,
                    subscriptions: {},
                    setContext: expect.any(Function),
                    setSubscriptions: expect.any(Function),
                },
                id,
                data: 'data',
                type: LiveDataType.sayg,
            });
            expect(pollingStrategy.publishRequest).toEqual({
                props: {
                    context: socketAndPollingContext,
                    subscriptions: {},
                    setContext: expect.any(Function),
                    setSubscriptions: expect.any(Function),
                },
                id,
                data: 'data',
                type: LiveDataType.sayg,
            });
        });

        it('throws if all strategies could not publish', async () => {
            const socket: ILiveWebSocket = multiModeLiveWebSocket(socketAndPollingContext, pollingStrategy, webSocketStrategy);
            webSocketStrategy.publishResponse = null;
            pollingStrategy.publishResponse = null;
            let error: string;
            console.error = (msg: string) => error = msg;

            const result = await socket.publish(createTemporaryId(), LiveDataType.sayg, 'data');

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
            const socket: ILiveWebSocket = multiModeLiveWebSocket(socketAndPollingContext, pollingStrategy, webSocketStrategy);

            await socket.unsubscribe(createTemporaryId());

            expect(pollingStrategy.refreshed).toEqual(1);
            expect(webSocketStrategy.refreshed).toEqual(1);
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
            const socket: ILiveWebSocket = multiModeLiveWebSocket(socketAndPollingContext, pollingStrategy, webSocketStrategy, initialSubscriptions);

            await socket.unsubscribe(id);

            expect(newSubscriptions).toEqual({});
        });

        it('unsubscribes from all strategies and updates context state', async () => {
            const id = createTemporaryId();
            const pollingStrategy = mockStrategy();
            const webSocketStrategy = mockStrategy();
            const socket: ILiveWebSocket = multiModeLiveWebSocket(socketAndPollingContext, pollingStrategy, webSocketStrategy);

            await socket.unsubscribe(id);

            expect(webSocketStrategy.unsubscribeRequest).toEqual({
                props: {
                    context: {
                        modes: [ WebSocketMode.socket, WebSocketMode.polling ],
                    },
                    subscriptions: {},
                    setContext: expect.any(Function),
                    setSubscriptions: expect.any(Function),
                },
                id,
            });
            expect(pollingStrategy.unsubscribeRequest).toEqual({
                props: {
                    context: {
                        modes: [ WebSocketMode.socket, WebSocketMode.polling ],
                    },
                    subscriptions: {},
                    setContext: expect.any(Function),
                    setSubscriptions: expect.any(Function),
                },
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
            const socket: ILiveWebSocket = multiModeLiveWebSocket(socketAndPollingContext, pollingStrategy, webSocketStrategy, initialSubscriptions);
            let warn: string;
            console.log = (msg: string) => warn = msg;

            await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(warn).toEqual('WARN: Sayg subscription is being replaced');
        });

        it('adds subscription and updates state', async () => {
            const id = 'NEW_ID';
            const socket: ILiveWebSocket = multiModeLiveWebSocket(socketAndPollingContext, pollingStrategy, webSocketStrategy);

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
            const socketContext: IWebSocketContext = createWebSocketContext();
            const socket: ILiveWebSocket = multiModeLiveWebSocket(socketContext, pollingStrategy, webSocketStrategy);

            const result = await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(result).toEqual(false);
        });

        it('subscribes via the first strategy', async () => {
            const id = 'NEW_ID';
            const socket: ILiveWebSocket = multiModeLiveWebSocket(socketAndPollingContext, pollingStrategy, webSocketStrategy);

            await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(webSocketStrategy.subscribeRequest).toEqual({
                props: {
                    context: {
                        modes: [ WebSocketMode.socket, WebSocketMode.polling ],
                    },
                    subscriptions: {
                        NEW_ID: {
                            id,
                            method: WebSocketMode.socket,
                            type: LiveDataType.sayg,
                            updateHandler: expect.any(Function),
                            errorHandler: expect.any(Function),
                        },
                    },
                    setContext: expect.any(Function),
                    setSubscriptions: expect.any(Function),
                },
                request: {
                    id,
                    type: LiveDataType.sayg,
                },
            });
        });

        it('does not subscribe via subsequent strategies', async () => {
            const id = 'NEW_ID';
            const socket: ILiveWebSocket = multiModeLiveWebSocket(socketAndPollingContext, pollingStrategy, webSocketStrategy);

            await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(pollingStrategy.subscribeRequest).toBeFalsy();
        });

        it('updates websocket state', async () => {
            const id = 'NEW_ID';
            const pollingStrategy = mockStrategy();
            const webSocketStrategy = mockStrategy();
            const socket: ILiveWebSocket = multiModeLiveWebSocket(socketAndPollingContext, pollingStrategy, webSocketStrategy);

            await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(newSocketContext).toEqual({
                modes: [ WebSocketMode.socket, WebSocketMode.polling ],
            });
        });

        it('removes strategy if unable to subscribe', async () => {
            const id = 'NEW_ID';
            const socket: ILiveWebSocket = multiModeLiveWebSocket(socketAndPollingContext, pollingStrategy, webSocketStrategy);
            webSocketStrategy.subscribeResponse = null;

            await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(newSocketContext).toEqual({
                modes: [ WebSocketMode.polling ],
            });
        });

        it('subscribes via subsequent strategy if first fails', async () => {
            const id = 'NEW_ID';
            const socket: ILiveWebSocket = multiModeLiveWebSocket(socketAndPollingContext, pollingStrategy, webSocketStrategy);
            webSocketStrategy.subscribeResponse = null;

            await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(webSocketStrategy.subscribeRequest).toBeTruthy();
            expect(pollingStrategy.subscribeRequest).toEqual({
                props: {
                    context: {
                        modes: [ WebSocketMode.polling ],
                    },
                    subscriptions: {
                        NEW_ID: {
                            id,
                            method: WebSocketMode.polling,
                            type: LiveDataType.sayg,
                            updateHandler: expect.any(Function),
                            errorHandler: expect.any(Function),
                        },
                    },
                    setContext: expect.any(Function),
                    setSubscriptions: expect.any(Function),
                },
                request: {
                    id,
                    type: LiveDataType.sayg,
                },
            });
        });

        it('does not update subscriptions if no strategies', async () => {
            const id = 'NEW_ID';
            const socketContext: IWebSocketContext = createWebSocketContext();
            const socket: ILiveWebSocket = multiModeLiveWebSocket(socketContext, pollingStrategy, webSocketStrategy);
            webSocketStrategy.subscribeResponse = null;

            await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(newSubscriptions).toBeFalsy();
        });

        it('returns false if all strategies fail to subscribe', async () => {
            const id = 'NEW_ID';
            const socketContext: IWebSocketContext = createWebSocketContext();
            const socket: ILiveWebSocket = multiModeLiveWebSocket(socketContext, pollingStrategy, webSocketStrategy);
            webSocketStrategy.subscribeResponse = null;
            pollingStrategy.subscribeResponse = null;

            const result = await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(result).toEqual(false);
        });

        it('does not update subscriptions if all fails to subscribe', async () => {
            const id = 'NEW_ID';
            const socketContext: IWebSocketContext = createWebSocketContext();
            const socket: ILiveWebSocket = multiModeLiveWebSocket(socketContext, pollingStrategy, webSocketStrategy);
            webSocketStrategy.subscribeResponse = null;
            pollingStrategy.subscribeResponse = null;

            await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(newSubscriptions).toBeNull();
        });
    });
});