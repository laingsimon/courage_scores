import { MultiModeLiveWebSocket } from './MultiModeLiveWebSocket';
import { IWebSocketContext } from './IWebSocketContext';
import { ISubscriptions } from './ISubscriptions';
import { createTemporaryId } from '../helpers/projection';
import { ILiveWebSocket } from './ILiveWebSocket';
import { WebSocketMode } from './WebSocketMode';
import { IUpdateStrategy } from './IUpdateStrategy';
import { ISubscriptionRequest } from './ISubscriptionRequest';
import { LiveDataType } from '../interfaces/models/dtos/Live/LiveDataType';
import { IStrategyData } from './IStrategyData';
import { noop } from '../helpers/tests';

interface IMockUpdateStrategy extends IUpdateStrategy {
    refreshRequest: IStrategyData[];
    refreshed: number;

    publishRequest?: { props: IStrategyData; id: string; data: any };
    publishResponse?: IWebSocketContext | null;

    subscribeRequest?: { props: IStrategyData; request: ISubscriptionRequest };
    subscribeResponse?: IWebSocketContext | null;

    unsubscribeRequest?: { props: IStrategyData; id: string };
    unsubscribeResponse?: IWebSocketContext | null;
}

describe('MultiModeLiveWebSocket', () => {
    let both = createContext(WebSocketMode.socket, WebSocketMode.polling);
    let newSocketContext: IWebSocketContext | null;
    let newSubscriptions: ISubscriptions | null;
    let polling: IMockUpdateStrategy;
    let webSocket: IMockUpdateStrategy;
    let defaultProps: IStrategyData;

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
            async publish(
                props: IStrategyData,
                id: string,
                type: string,
                data: any,
            ): Promise<IWebSocketContext | null> {
                this.publishRequest = { props, id, type, data };
                return this.publishResponse === undefined
                    ? props.context
                    : this.publishResponse;
            },
            async subscribe(
                props: IStrategyData,
                request: ISubscriptionRequest,
            ): Promise<IWebSocketContext | null> {
                this.subscribeRequest = { props, request };
                return this.subscribeResponse === undefined
                    ? props.context
                    : this.subscribeResponse;
            },
            async unsubscribe(
                props: IStrategyData,
                id: string,
            ): Promise<IWebSocketContext> {
                this.unsubscribeRequest = { props, id };
                return this.unsubscribeResponse === undefined
                    ? props.context
                    : this.unsubscribeResponse;
            },
        };
    }

    function multiMode(
        socketContext: IWebSocketContext,
        pollingStrategy?: IMockUpdateStrategy,
        webSocketStrategy?: IMockUpdateStrategy,
        subscriptions?: ISubscriptions,
    ): ILiveWebSocket {
        return new MultiModeLiveWebSocket({
            setSocketContext,
            setSubscriptions,
            pollingStrategy: pollingStrategy!,
            webSocketStrategy: webSocketStrategy!,
            socketContext: socketContext,
            subscriptions: subscriptions || {},
        });
    }

    function createContext(...modes: WebSocketMode[]): IWebSocketContext {
        return {
            modes,
        };
    }

    beforeEach(() => {
        newSocketContext = null;
        newSubscriptions = null;
        polling = mockStrategy();
        webSocket = mockStrategy();
        both = createContext(WebSocketMode.socket, WebSocketMode.polling);
        defaultProps = {
            context: both,
            subscriptions: {},
            setContext: expect.any(Function),
            setSubscriptions: expect.any(Function),
        };
    });

    describe('publish', () => {
        it('throws if there are no strategies', async () => {
            const socket = multiMode(createContext());
            let error: string | undefined;
            console.error = (msg: string) => (error = msg);

            const result = await socket.publish(
                createTemporaryId(),
                LiveDataType.sayg,
                'data',
            );

            expect(result).toEqual(false);
            expect(error).toEqual(
                'Unable to publish update; no strategy was able to publish the update',
            );
        });

        it('refreshes all strategies', async () => {
            const socket = multiMode(both, polling, webSocket);

            await socket.publish(
                createTemporaryId(),
                LiveDataType.sayg,
                'data',
            );

            expect(polling.refreshed).toEqual(1);
            expect(webSocket.refreshed).toEqual(1);
        });

        it('publishes via the first strategy only', async () => {
            const socket = multiMode(both, polling, webSocket);
            webSocket.publishResponse = { modes: [] };
            const id = createTemporaryId();

            await socket.publish(id, LiveDataType.sayg, 'data');

            expect(webSocket.publishRequest).toEqual({
                props: {
                    context: both,
                    subscriptions: {},
                    setContext: expect.any(Function),
                    setSubscriptions: expect.any(Function),
                },
                id,
                data: 'data',
                type: LiveDataType.sayg,
            });
            expect(polling.publishRequest).toBeFalsy();
        });

        it('publishes via the second strategy if the first strategy cannot publish', async () => {
            const socket = multiMode(both, polling, webSocket);
            webSocket.publishResponse = null;
            polling.publishResponse = { modes: [] };
            const id = createTemporaryId();

            await socket.publish(id, LiveDataType.sayg, 'data');

            expect(webSocket.publishRequest).toEqual({
                props: defaultProps,
                id,
                data: 'data',
                type: LiveDataType.sayg,
            });
            expect(polling.publishRequest).toEqual({
                props: defaultProps,
                id,
                data: 'data',
                type: LiveDataType.sayg,
            });
        });

        it('throws if all strategies could not publish', async () => {
            const socket = multiMode(both, polling, webSocket);
            webSocket.publishResponse = null;
            polling.publishResponse = null;
            let error: string | undefined;
            console.error = (msg: string) => (error = msg);

            const result = await socket.publish(
                createTemporaryId(),
                LiveDataType.sayg,
                'data',
            );

            expect(result).toEqual(false);
            expect(webSocket.publishRequest).toBeTruthy();
            expect(polling.publishRequest).toBeTruthy();
            expect(error).toEqual(
                'Unable to publish update; no strategy was able to publish the update',
            );
        });
    });

    describe('unsubscribe', () => {
        it('refreshes all strategies', async () => {
            const socket = multiMode(both, polling, webSocket);

            await socket.unsubscribe(createTemporaryId());

            expect(polling.refreshed).toEqual(1);
            expect(webSocket.refreshed).toEqual(1);
        });

        it('removes the subscription and updates subscriptions state', async () => {
            const id = createTemporaryId();
            const initialSubscriptions = {};
            initialSubscriptions[id] = {
                id,
                type: LiveDataType.sayg,
                errorHandler: noop,
                updateHandler: noop,
            };
            const socket = multiMode(
                both,
                polling,
                webSocket,
                initialSubscriptions,
            );

            await socket.unsubscribe(id);

            expect(newSubscriptions).toEqual({});
        });

        it('unsubscribes from all strategies and updates context state', async () => {
            const id = createTemporaryId();
            const socket = multiMode(both, polling, webSocket);

            await socket.unsubscribe(id);

            expect(webSocket.unsubscribeRequest).toEqual({
                props: {
                    ...defaultProps,
                    context: {
                        modes: [WebSocketMode.socket, WebSocketMode.polling],
                    },
                },
                id,
            });
            expect(polling.unsubscribeRequest).toEqual({
                props: {
                    ...defaultProps,
                    context: {
                        modes: [WebSocketMode.socket, WebSocketMode.polling],
                    },
                },
                id,
            });
        });
    });

    describe('subscribe', () => {
        it('warns if the subscription is being replaced', async () => {
            const id = createTemporaryId();
            const initialSubscriptions = {};
            initialSubscriptions[id] = {
                id,
                type: LiveDataType.sayg,
                errorHandler: noop,
                updateHandler: noop,
            };
            const socket = multiMode(
                both,
                polling,
                webSocket,
                initialSubscriptions,
            );
            let warn: string | undefined;
            console.log = (msg: string) => (warn = msg);

            await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(warn).toEqual('WARN: Sayg subscription is being replaced');
        });

        it('adds subscription and updates state', async () => {
            const socket = multiMode(both, polling, webSocket);

            await socket.subscribe({ id: 'NEW_ID', type: LiveDataType.sayg });

            expect(newSubscriptions).toEqual({
                NEW_ID: {
                    id: 'NEW_ID',
                    type: LiveDataType.sayg,
                    method: WebSocketMode.socket,
                    errorHandler: expect.any(Function),
                    updateHandler: expect.any(Function),
                },
            });
        });

        it('handles no strategies', async () => {
            const socket = multiMode(
                createContext(),
                mockStrategy(),
                mockStrategy(),
            );

            const result = await socket.subscribe({
                id: 'NEW_ID',
                type: LiveDataType.sayg,
            });

            expect(result).toEqual(false);
        });

        it('subscribes via the first strategy', async () => {
            const socket = multiMode(both, polling, webSocket);

            await socket.subscribe({ id: 'NEW_ID', type: LiveDataType.sayg });

            expect(webSocket.subscribeRequest).toEqual({
                props: {
                    ...defaultProps,
                    context: {
                        modes: [WebSocketMode.socket, WebSocketMode.polling],
                    },
                    subscriptions: {
                        NEW_ID: {
                            id: 'NEW_ID',
                            method: WebSocketMode.socket,
                            type: LiveDataType.sayg,
                            updateHandler: expect.any(Function),
                            errorHandler: expect.any(Function),
                        },
                    },
                },
                request: {
                    id: 'NEW_ID',
                    type: LiveDataType.sayg,
                },
            });
        });

        it('does not subscribe via subsequent strategies', async () => {
            const socket = multiMode(both, polling, webSocket);

            await socket.subscribe({ id: 'NEW_ID', type: LiveDataType.sayg });

            expect(polling.subscribeRequest).toBeFalsy();
        });

        it('updates websocket state', async () => {
            const socket = multiMode(both, polling, webSocket);

            await socket.subscribe({ id: 'NEW_ID', type: LiveDataType.sayg });

            expect(newSocketContext).toEqual({
                modes: [WebSocketMode.socket, WebSocketMode.polling],
            });
        });

        it('removes strategy if unable to subscribe', async () => {
            const socket = multiMode(both, polling, webSocket);
            webSocket.subscribeResponse = null;

            await socket.subscribe({ id: 'NEW_ID', type: LiveDataType.sayg });

            expect(newSocketContext).toEqual({
                modes: [WebSocketMode.polling],
            });
        });

        it('subscribes via subsequent strategy if first fails', async () => {
            const id = 'NEW_ID';
            const socket = multiMode(both, polling, webSocket);
            webSocket.subscribeResponse = null;

            await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(webSocket.subscribeRequest).toBeTruthy();
            expect(polling.subscribeRequest).toEqual({
                props: {
                    ...defaultProps,
                    context: {
                        modes: [WebSocketMode.polling],
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
                },
                request: {
                    id,
                    type: LiveDataType.sayg,
                },
            });
        });

        it('does not update subscriptions if no strategies', async () => {
            const socket = multiMode(createContext(), polling, webSocket);
            webSocket.subscribeResponse = null;

            await socket.subscribe({ id: 'NEW_ID', type: LiveDataType.sayg });

            expect(newSubscriptions).toBeFalsy();
        });

        it('returns false if all strategies fail to subscribe', async () => {
            const socket = multiMode(createContext(), polling, webSocket);
            webSocket.subscribeResponse = null;
            polling.subscribeResponse = null;

            const result = await socket.subscribe({
                id: 'NEW_ID',
                type: LiveDataType.sayg,
            });

            expect(result).toEqual(false);
        });

        it('does not update subscriptions if all fails to subscribe', async () => {
            const socket = multiMode(createContext(), polling, webSocket);
            webSocket.subscribeResponse = null;
            polling.subscribeResponse = null;

            await socket.subscribe({ id: 'NEW_ID', type: LiveDataType.sayg });

            expect(newSubscriptions).toBeNull();
        });
    });
});
