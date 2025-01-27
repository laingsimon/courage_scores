import {WebSocketUpdateStrategy} from "./WebSocketUpdateStrategy";
import {IWebSocketContext} from "./IWebSocketContext";
import {createTemporaryId} from "../helpers/projection";
import {ISubscriptions} from "./ISubscriptions";
import {ISubscriptionRequest} from "./ISubscriptionRequest";
import {WebSocketMode} from "./WebSocketMode";
import {noop} from "../helpers/tests";
import {MessageType} from "../interfaces/models/dtos/MessageType";
import {LiveDataType} from "../interfaces/models/dtos/Live/LiveDataType";

describe('WebSocketUpdateStrategy', () => {
    let newContext: IWebSocketContext | null;

    async function setContext(context: IWebSocketContext) {
        newContext = context;
    }

    beforeEach(() => {
        newContext = null;
    });

    function createMockWebSocket(readyState: number, sent?: string[], onClosed?: () => void): WebSocket {
        return {
            readyState,
            send: (data: string) => {
                if (sent) {
                    sent.push(data);
                }
            },
            close: () => {
                if (onClosed) {
                    onClosed();
                }
            },
        } as WebSocket;
    }

    function createWebSocketContext(webSocket?: WebSocket, ...modes: WebSocketMode[]): IWebSocketContext {
        return {
            webSocket,
            modes
        };
    }

    describe('refresh', () => {
        it('accepts no websocket', async () => {
            const strategy = new WebSocketUpdateStrategy(null!);
            const context: IWebSocketContext = createWebSocketContext();

            strategy.refresh({context, subscriptions: {}, setContext, setSubscriptions: noop});
        });

        it('binds websocket onmessage', async () => {
            const strategy = new WebSocketUpdateStrategy(null!);
            const context: IWebSocketContext = createWebSocketContext(createMockWebSocket(1));

            strategy.refresh({context, subscriptions: {}, setContext, setSubscriptions: noop});

            expect(context.webSocket?.onmessage).toBeTruthy();
        });

        it('binds websocket onclose', async () => {
            const strategy = new WebSocketUpdateStrategy(null!);
            const context: IWebSocketContext = createWebSocketContext(createMockWebSocket(1));

            strategy.refresh({context, subscriptions: {}, setContext, setSubscriptions: noop});

            expect(context.webSocket?.onclose).toBeTruthy();
        });
    });

    describe('publish', () => {
        const id = createTemporaryId();
        const disconnectedContext: IWebSocketContext = createWebSocketContext();

        it('creates a socket if none exists', async () => {
            const mockWebSocket = createMockWebSocket(1);
            const strategy = new WebSocketUpdateStrategy(() => mockWebSocket);

            const result: IWebSocketContext | null = await strategy.publish(
                {context: disconnectedContext, subscriptions: {}, setContext, setSubscriptions: noop},
                id,
                LiveDataType.sayg,
                'data');

            expect(result).toBeTruthy();
            expect(result?.webSocket).toEqual(mockWebSocket);
        });

        it('returns null if new socket is unable to connect', async () => {
            const mockWebSocket = createMockWebSocket(2);
            const strategy = new WebSocketUpdateStrategy(() => mockWebSocket);

            const result: IWebSocketContext | null = await strategy.publish(
                {context: disconnectedContext, subscriptions: {}, setContext, setSubscriptions: noop},
                id,
                LiveDataType.sayg,
                'data');

            expect(result).toBeNull();
        });

        it('sends update to new socket and returns true', async () => {
            const sent: string[] = [];
            const mockWebSocket = createMockWebSocket(1, sent);
            const strategy = new WebSocketUpdateStrategy(() => mockWebSocket);

            await strategy.publish(
                {context: disconnectedContext, subscriptions: {}, setContext, setSubscriptions: noop},
                id,
                LiveDataType.sayg,
                'data');

            expect(sent).toEqual([JSON.stringify({
                type: MessageType.update,
                id,
                data: 'data',
                dataType: LiveDataType.sayg,
            })]);
        });

        it('sends update to existing socket and returns true', async () => {
            const sent: string[] = [];
            const mockWebSocket = createMockWebSocket(1, sent);
            const strategy = new WebSocketUpdateStrategy(null!);
            const context: IWebSocketContext = createWebSocketContext(mockWebSocket);

            await strategy.publish(
                {context, subscriptions: {}, setContext, setSubscriptions: noop},
                id,
                LiveDataType.sayg,
                'data');

            expect(sent).toEqual([JSON.stringify({
                type: MessageType.update,
                id,
                data: 'data',
                dataType: LiveDataType.sayg,
            })]);
        });
    });

    describe('unsubscribe', () => {
        const id = createTemporaryId();

        it('does nothing if no websocket', async () => {
            const strategy = new WebSocketUpdateStrategy(null!);
            const context: IWebSocketContext = createWebSocketContext();

            const result: IWebSocketContext = await strategy.unsubscribe(
                {context, subscriptions: {}, setContext, setSubscriptions: noop},
                id);

            expect(result).toEqual(context);
        });

        it('sends unsubscribed if socket exists', async () => {
            const sent: string[] = [];
            const mockWebSocket = createMockWebSocket(1, sent);
            const strategy = new WebSocketUpdateStrategy(() => mockWebSocket);
            const context: IWebSocketContext = createWebSocketContext(mockWebSocket);

            await strategy.unsubscribe(
                {context, subscriptions: {}, setContext, setSubscriptions: noop},
                id);

            expect(sent).toEqual([JSON.stringify({
                type: MessageType.unsubscribed,
                id,
            })]);
        });

        it('closes websocket if no subscriptions', async () => {
            let closed: boolean = false;
            const mockWebSocket = createMockWebSocket(1, [], () => closed = true);
            const strategy = new WebSocketUpdateStrategy(() => mockWebSocket);
            const context: IWebSocketContext = createWebSocketContext(mockWebSocket);

            const result = await strategy.unsubscribe(
                {context, subscriptions: {}, setContext, setSubscriptions: noop},
                id);

            expect(closed).toEqual(true);
            expect(result).toEqual({
                modes: [],
            });
        });

        it('leaves websocket open if subscriptions remain', async () => {
            let closed: boolean = false;
            const mockWebSocket = createMockWebSocket(1, [], () => closed = true);
            const strategy = new WebSocketUpdateStrategy(() => mockWebSocket);
            const context: IWebSocketContext = createWebSocketContext(mockWebSocket);
            const subscriptions: ISubscriptions = {
                anotherId: {
                    type: LiveDataType.sayg,
                    id: 'anotherId',
                    errorHandler: noop,
                    updateHandler: noop,
                },
            };

            const result = await strategy.unsubscribe(
                {context, subscriptions, setContext, setSubscriptions: noop},
                id);

            expect(closed).toEqual(false);
            expect(result).toEqual({
                webSocket: mockWebSocket,
                modes: [],
            });
        });
    });

    describe('subscribe', () => {
        const request: ISubscriptionRequest = {
            id: createTemporaryId(),
            type: LiveDataType.sayg
        };

        it('creates a socket if none exists', async () => {
            const mockWebSocket = createMockWebSocket(1);
            const strategy = new WebSocketUpdateStrategy(() => mockWebSocket);
            const context: IWebSocketContext = createWebSocketContext();

            const result: IWebSocketContext | null = await strategy.subscribe(
                {context, subscriptions: {}, setContext, setSubscriptions: noop},
                request);

            expect(result).toBeTruthy();
            expect(result!.webSocket).toEqual(mockWebSocket);
        });

        it('returns null if new socket is unable to connect', async () => {
            const mockWebSocket = createMockWebSocket(2);
            const strategy = new WebSocketUpdateStrategy(() => mockWebSocket);
            const context: IWebSocketContext = createWebSocketContext();

            const result: IWebSocketContext | null = await strategy.subscribe(
                {context, subscriptions: {}, setContext, setSubscriptions: noop},
                request);

            expect(result).toEqual(null);
        });

        it('sends subscribed to new socket and returns true', async () => {
            const sent: string[] = [];
            const mockWebSocket = createMockWebSocket(1, sent);
            const strategy = new WebSocketUpdateStrategy(() => mockWebSocket);
            const context: IWebSocketContext = createWebSocketContext();

            await strategy.subscribe(
                {context, subscriptions: {}, setContext, setSubscriptions: noop},
                request);

            expect(sent).toEqual([JSON.stringify({
                type: MessageType.subscribed,
                id: request.id,
            })]);
        });

        it('sends subscribed to existing socket and returns true', async () => {
            const sent: string[] = [];
            const mockWebSocket = createMockWebSocket(1, sent);
            const strategy = new WebSocketUpdateStrategy(() => mockWebSocket);
            const context: IWebSocketContext = createWebSocketContext(mockWebSocket);

            await strategy.subscribe(
                {context, subscriptions: {}, setContext, setSubscriptions: noop},
                request);

            expect(sent).toEqual([JSON.stringify({
                type: MessageType.subscribed,
                id: request.id,
            })]);
        });
    });

    describe('server-side messages', () => {
        let sent: string[];
        let mockWebSocket: WebSocket;
        let strategy: WebSocketUpdateStrategy;
        let context: IWebSocketContext;

        beforeEach(() => {
            sent = [];
            mockWebSocket = createMockWebSocket(1, sent);
            strategy = new WebSocketUpdateStrategy(null!);
            context = createWebSocketContext(mockWebSocket);
        });

        function message(data: any, type: string = 'message'): MessageEvent<any> {
            return {
                type,
                data: data.length ? data : JSON.stringify(data),
            } as any;
        }

        it('ignores non-message events', async () => {
            strategy.refresh({context, subscriptions: {}, setContext, setSubscriptions: noop});
            let log: string | undefined;
            console.log = (msg: string) => log = msg;

            await mockWebSocket.onmessage!(message('data', 'anything'));

            expect(log).toEqual(`Unhandled message: ${JSON.stringify({
                type: 'anything',
                data: 'data',
            })}`);
        });

        it('publishes Update messages to all subscribers', async () => {
            let updates: { data: object, id: string }[] = [];
            const subscriptions: ISubscriptions = {
                '1234': {
                    type: LiveDataType.sayg,
                    id: '1234',
                    method: WebSocketMode.socket,
                    errorHandler: () => {},
                    updateHandler: (data) => {
                        updates.push({
                            data,
                            id: '1234',
                        });
                    },
                },
                '5678': {
                    type: LiveDataType.sayg,
                    id: '1234',
                    method: WebSocketMode.socket,
                    errorHandler: () => {},
                    updateHandler: (data) => {
                        updates.push({
                            data,
                            id: '5678',
                        });
                    },
                }
            };
            strategy.refresh({context, subscriptions, setContext, setSubscriptions: noop});
            const data = {
                type: 'updated-data',
            };

            await mockWebSocket.onmessage!(message({
                type: MessageType.update,
                id: null,
                data
            }));

            expect(updates).toEqual([{
                id: '1234', data
            }, {
                id: '5678', data
            }]);
        });

        it('publishes Update message to identified subscription', async () => {
            let updates: { data: object, id: string }[] = [];
            const subscriptions: ISubscriptions = {
                '1234': {
                    type: LiveDataType.sayg,
                    id: '1234',
                    method: WebSocketMode.socket,
                    errorHandler: () => {},
                    updateHandler: (data) => {
                        updates.push({
                            data,
                            id: '1234',
                        });
                    },
                },
                '5678': {
                    type: LiveDataType.sayg,
                    id: '1234',
                    method: WebSocketMode.socket,
                    errorHandler: () => {},
                    updateHandler: (data) => {
                        updates.push({
                            data,
                            id: '5678',
                        });
                    },
                }
            };
            strategy.refresh({context, subscriptions, setContext, setSubscriptions: noop});
            const data = {
                type: 'updated-data',
            };

            await mockWebSocket.onmessage!(message({
                type: MessageType.update,
                id: '1234',
                data
            }));

            expect(updates).toEqual([{
                id: '1234', data
            }]);
        });

        it('responds with polo to Marco messages', async () => {
            strategy.refresh({context, subscriptions: {}, setContext, setSubscriptions: noop});

            await mockWebSocket.onmessage!(message({
                type: MessageType.marco,
            }));

            expect(sent).toEqual([JSON.stringify({
                type: MessageType.polo
            })]);
        });

        it('does nothing when Polo message received', async () => {
            strategy.refresh({context, subscriptions: {}, setContext, setSubscriptions: noop});

            await mockWebSocket.onmessage!(message({
                type: MessageType.polo,
            }));

            expect(sent).toEqual([]);
        });

        it('publishes Error messages to all subscribers', async () => {
            let errors: { error: string, id: string }[] = [];
            const subscriptions: ISubscriptions = {
                '1234': {
                    type: LiveDataType.sayg,
                    id: '1234',
                    method: WebSocketMode.socket,
                    errorHandler: (error) => {
                        errors.push({
                            error,
                            id: '1234',
                        });
                    },
                    updateHandler: () => {},
                },
                '5678': {
                    type: LiveDataType.sayg,
                    id: '1234',
                    method: WebSocketMode.socket,
                    errorHandler: (error) => {
                        errors.push({
                            error,
                            id: '5678',
                        });
                    },
                    updateHandler: () => {},
                }
            };
            strategy.refresh({context, subscriptions, setContext, setSubscriptions: noop});
            console.error = noop;

            await mockWebSocket.onmessage!(message({
                type: MessageType.error,
                id: null,
                message: 'SOME ERROR'
            }));

            expect(errors).toEqual([{
                id: '1234', error: 'SOME ERROR'
            }, {
                id: '5678', error: 'SOME ERROR'
            }]);
        });

        it('publishes Error message to identified subscription', async () => {
            let errors: { error: string, id: string }[] = [];
            const subscriptions: ISubscriptions = {
                '1234': {
                    type: LiveDataType.sayg,
                    id: '1234',
                    method: WebSocketMode.socket,
                    errorHandler: (error) => {
                        errors.push({
                            error,
                            id: '1234',
                        });
                    },
                    updateHandler: () => {},
                },
                '5678': {
                    type: LiveDataType.sayg,
                    id: '1234',
                    method: WebSocketMode.socket,
                    errorHandler: (error) => {
                        errors.push({
                            error,
                            id: '5678',
                        });
                    },
                    updateHandler: () => {},
                }
            };
            strategy.refresh({context, subscriptions, setContext, setSubscriptions: noop});
            console.error = noop;

            await mockWebSocket.onmessage!(message({
                type: MessageType.error,
                id: '1234',
                message: 'SOME ERROR'
            }));

            expect(errors).toEqual([{
                id: '1234', error: 'SOME ERROR'
            }]);
        });

        it('handles unknown message type', async () => {
            strategy.refresh({context, subscriptions: {}, setContext, setSubscriptions: noop});
            let log: string | undefined;
            console.log = (msg: string) => log = msg;

            await mockWebSocket.onmessage!(message({
                type: 'foo',
            }));

            expect(log).toEqual(`Unhandled live message: ${JSON.stringify({type: 'foo'})}`);
        });

        it('removes webSocket from context', async () => {
            strategy.refresh({context, subscriptions: {}, setContext, setSubscriptions: noop});
            let error: string | undefined;
            console.error = (msg: string) => error = msg;

            await mockWebSocket.onclose!(new CloseEvent('close', {}));

            expect(error).toEqual('Socket disconnected');
            expect(newContext).toEqual({
                modes: [],
            });
        });
    })
});