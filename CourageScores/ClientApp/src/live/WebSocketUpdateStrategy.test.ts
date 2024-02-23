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
    let newContext: IWebSocketContext;

    async function setContext(context: IWebSocketContext) {
        newContext = context;
    }

    beforeEach(() => {
        newContext = null;
    });

    describe('refresh', () => {
        it('accepts no websocket', async () => {
            const strategy = new WebSocketUpdateStrategy(null);
            const context: IWebSocketContext = {
                webSocket: null,
                modes: [],
            }

            strategy.refresh(context, {}, setContext);
        });

        it('binds websocket onmessage', async () => {
            const strategy = new WebSocketUpdateStrategy(null);
            const context: IWebSocketContext = {
                webSocket: {

                } as any,
                modes: [],
            }

            strategy.refresh(context, {}, setContext);

            expect(context.webSocket.onmessage).toBeTruthy();
        });

        it('binds websocket onclose', async () => {
            const strategy = new WebSocketUpdateStrategy(null);
            const context: IWebSocketContext = {
                webSocket: {

                } as any,
                modes: [],
            }

            strategy.refresh(context, {}, setContext);

            expect(context.webSocket.onclose).toBeTruthy();
        });
    });

    describe('publish', () => {
        it('creates a socket if none exists', async () => {
            const mockWebSocket = {
                readyState: 1,
                send: (_: any) => {},
            } as WebSocket;
            const strategy = new WebSocketUpdateStrategy(() => mockWebSocket);
            const context: IWebSocketContext = {
                webSocket: null,
                modes: [],
            };
            const id = createTemporaryId();

            const result: IWebSocketContext = await strategy.publish(context, {}, noop, id, 'data');

            expect(result).toBeTruthy();
            expect(result.webSocket).toEqual(mockWebSocket);
        });

        it('returns null if new socket is unable to connect', async () => {
            const mockWebSocket = {
                readyState: 2,
                send: (_: any) => {},
                close: () => {},
            } as WebSocket;
            const strategy = new WebSocketUpdateStrategy(() => mockWebSocket);
            const context: IWebSocketContext = {
                webSocket: null,
                modes: [],
            };
            const id = createTemporaryId();

            const result: IWebSocketContext = await strategy.publish(context, {}, noop, id, 'data');

            expect(result).toBeNull();
        });

        it('sends update to new socket and returns true', async () => {
            const sent: string[] = [];
            const mockWebSocket = {
                readyState: 1,
                send: (data: string) => {
                    sent.push(data);
                }
            } as WebSocket;
            const strategy = new WebSocketUpdateStrategy(() => mockWebSocket);
            const context: IWebSocketContext = {
                webSocket: null,
                modes: [],
            };
            const id = createTemporaryId();

            await strategy.publish(context, {}, noop, id, 'data');

            expect(sent).toEqual([JSON.stringify({
                type: MessageType.update,
                id,
                data: 'data'
            })]);
        });

        it('sends update to existing socket and returns true', async () => {
            const sent: string[] = [];
            const mockWebSocket = {
                readyState: 1,
                send: (data: string) => {
                    sent.push(data);
                }
            } as WebSocket;
            const strategy = new WebSocketUpdateStrategy(null);
            const context: IWebSocketContext = {
                webSocket: mockWebSocket,
                modes: [],
            };
            const id = createTemporaryId();

            await strategy.publish(context, {}, noop, id, 'data');

            expect(sent).toEqual([JSON.stringify({
                type: MessageType.update,
                id,
                data: 'data'
            })]);
        });
    });

    describe('unsubscribe', () => {
        it('does nothing if no websocket', async () => {
            const strategy = new WebSocketUpdateStrategy(null);
            const context: IWebSocketContext = {
                webSocket: null,
                modes: [],
            };
            const id = createTemporaryId();

            const result: IWebSocketContext = await strategy.unsubscribe(context, {}, id);

            expect(result).toEqual(context);
        });

        it('sends unsubscribed if socket exists', async () => {
            const sent: string[] = [];
            const mockWebSocket = {
                readyState: 1,
                send: (data: string) => {
                    sent.push(data);
                },
                close: () => {},
            } as WebSocket;
            const strategy = new WebSocketUpdateStrategy(null);
            const context: IWebSocketContext = {
                webSocket: mockWebSocket,
                modes: [],
            };
            const id = createTemporaryId();

            await strategy.unsubscribe(context, {}, id);

            expect(sent).toEqual([JSON.stringify({
                type: MessageType.unsubscribed,
                id,
            })]);
        });

        it('closes websocket if no subscriptions', async () => {
            let closed: boolean = false;
            const mockWebSocket = {
                readyState: 1,
                send: (_: string) => {
                },
                close: () => {
                    closed = true;
                },
            } as WebSocket;
            const strategy = new WebSocketUpdateStrategy(null);
            const context: IWebSocketContext = {
                webSocket: mockWebSocket,
                modes: [],
            };
            const id = createTemporaryId();

            const result = await strategy.unsubscribe(context, {}, id);

            expect(closed).toEqual(true);
            expect(result).toEqual({
                webSocket: null,
                modes: [],
            });
        });

        it('leaves websocket open if subscriptions remain', async () => {
            let closed: boolean = false;
            const mockWebSocket = {
                readyState: 1,
                send: (_: string) => {
                },
                close: () => {
                    closed = true;
                },
            } as WebSocket;
            const strategy = new WebSocketUpdateStrategy(null);
            const context: IWebSocketContext = {
                webSocket: mockWebSocket,
                modes: [],
            };
            const id = createTemporaryId();
            const subscriptions: ISubscriptions = {
                anotherId: {
                    type: LiveDataType.sayg,
                    id: 'anotherId',
                    errorHandler: null,
                    updateHandler: null,
                },
            };

            const result = await strategy.unsubscribe(context, subscriptions, id);

            expect(closed).toEqual(false);
            expect(result).toEqual({
                webSocket: mockWebSocket,
                modes: [],
            });
        });
    });

    describe('subscribe', () => {
        it('creates a socket if none exists', async () => {
            const mockWebSocket = {
                readyState: 1,
                send: (_: any) => {},
            } as WebSocket;
            const strategy = new WebSocketUpdateStrategy(() => mockWebSocket);
            const context: IWebSocketContext = {
                webSocket: null,
                modes: [],
            };
            const request: ISubscriptionRequest = {
                id: createTemporaryId(),
                type: LiveDataType.sayg
            };

            const result: IWebSocketContext = await strategy.subscribe(context, {}, noop, request);

            expect(result).toBeTruthy();
            expect(result.webSocket).toEqual(mockWebSocket);
        });

        it('returns null if new socket is unable to connect', async () => {
            const mockWebSocket = {
                readyState: 2,
                send: (_: any) => {},
                close: () => {},
            } as WebSocket;
            const strategy = new WebSocketUpdateStrategy(() => mockWebSocket);
            const context: IWebSocketContext = {
                webSocket: null,
                modes: [],
            };
            const request: ISubscriptionRequest = {
                id: createTemporaryId(),
                type: LiveDataType.sayg
            };

            const result: IWebSocketContext = await strategy.subscribe(context, {}, noop, request);

            expect(result).toEqual(null);
        });

        it('sends subscribed to new socket and returns true', async () => {
            const sent: string[] = [];
            const mockWebSocket = {
                readyState: 1,
                send: (data: string) => {
                    sent.push(data);
                },
                close: () => {},
            } as WebSocket;
            const strategy = new WebSocketUpdateStrategy(() => mockWebSocket);
            const context: IWebSocketContext = {
                webSocket: null,
                modes: [],
            };
            const request: ISubscriptionRequest = {
                id: createTemporaryId(),
                type: LiveDataType.sayg
            };

            await strategy.subscribe(context, {}, noop, request);

            expect(sent).toEqual([JSON.stringify({
                type: MessageType.subscribed,
                id: request.id,
            })]);
        });

        it('sends subscribed to existing socket and returns true', async () => {
            const sent: string[] = [];
            const mockWebSocket = {
                readyState: 1,
                send: (data: string) => {
                    sent.push(data);
                },
                close: () => {},
            } as WebSocket;
            const strategy = new WebSocketUpdateStrategy(null);
            const context: IWebSocketContext = {
                webSocket: mockWebSocket,
                modes: [],
            };
            const request: ISubscriptionRequest = {
                id: createTemporaryId(),
                type: LiveDataType.sayg
            };

            await strategy.subscribe(context, {}, noop, request);

            expect(sent).toEqual([JSON.stringify({
                type: MessageType.subscribed,
                id: request.id,
            })]);
        });
    });

    describe('server-side messages', () => {
        it('ignores non-message events', async () => {
            const mockWebSocket = {
                readyState: 1,
                send: (_: string) => {},
                close: () => {},
            } as WebSocket;
            const strategy = new WebSocketUpdateStrategy(null);
            const context: IWebSocketContext = {
                webSocket: mockWebSocket,
                modes: [],
            };
            const subscriptions: ISubscriptions = {};
            strategy.refresh(context, subscriptions, setContext);
            let log: string;
            console.log = (msg: string) => log = msg;

            await mockWebSocket.onmessage({
                type: 'anything',
                data: 'data',
            } as any);

            expect(log).toEqual(`Unhandled message: ${JSON.stringify({
                type: 'anything',
                data: 'data',
            })}`);
        });

        it('publishes Update messages to all subscribers', async () => {
            let updates: { data: object, id: string }[] = [];
            const mockWebSocket = {
                readyState: 1,
                send: (_: string) => {},
                close: () => {},
            } as WebSocket;
            const strategy = new WebSocketUpdateStrategy(null);
            const context: IWebSocketContext = {
                webSocket: mockWebSocket,
                modes: [],
            };
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
            strategy.refresh(context, subscriptions, setContext);
            const data = {
                type: 'updated-data',
            };

            await mockWebSocket.onmessage({
                type: 'message',
                data: JSON.stringify({
                    type: MessageType.update,
                    id: null,
                    data
                }),
            } as any);

            expect(updates).toEqual([{
                id: '1234', data
            }, {
                id: '5678', data
            }]);
        });

        it('publishes Update message to identified subscription', async () => {
            let updates: { data: object, id: string }[] = [];
            const mockWebSocket = {
                readyState: 1,
                send: (_: string) => {},
                close: () => {},
            } as WebSocket;
            const strategy = new WebSocketUpdateStrategy(null);
            const context: IWebSocketContext = {
                webSocket: mockWebSocket,
                modes: [],
            };
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
            strategy.refresh(context, subscriptions, setContext);
            const data = {
                type: 'updated-data',
            };

            await mockWebSocket.onmessage({
                type: 'message',
                data: JSON.stringify({
                    type: MessageType.update,
                    id: '1234',
                    data
                }),
            } as any);

            expect(updates).toEqual([{
                id: '1234', data
            }]);
        });

        it('responds with polo to Marco messages', async () => {
            const sent: string[] = [];
            const mockWebSocket = {
                readyState: 1,
                send: (data: string) => {
                    sent.push(data);
                },
                close: () => {},
            } as WebSocket;
            const strategy = new WebSocketUpdateStrategy(null);
            const context: IWebSocketContext = {
                webSocket: mockWebSocket,
                modes: [],
            };
            const subscriptions: ISubscriptions = {};
            strategy.refresh(context, subscriptions, setContext);

            await mockWebSocket.onmessage({
                type: 'message',
                data: JSON.stringify({
                    type: MessageType.marco,
                }),
            } as any);

            expect(sent).toEqual([JSON.stringify({
                type: MessageType.polo
            })]);
        });

        it('does nothing when Polo message received', async () => {
            const sent: string[] = [];
            const mockWebSocket = {
                readyState: 1,
                send: (data: string) => {
                    sent.push(data);
                },
                close: () => {},
            } as WebSocket;
            const strategy = new WebSocketUpdateStrategy(null);
            const context: IWebSocketContext = {
                webSocket: mockWebSocket,
                modes: [],
            };
            const subscriptions: ISubscriptions = {};
            strategy.refresh(context, subscriptions, setContext);

            await mockWebSocket.onmessage({
                type: 'message',
                data: JSON.stringify({
                    type: MessageType.polo,
                }),
            } as any);

            expect(sent).toEqual([]);
        });

        it('publishes Error messages to all subscribers', async () => {
            let errors: { error: string, id: string }[] = [];
            const mockWebSocket = {
                readyState: 1,
                send: (_: string) => {},
                close: () => {},
            } as WebSocket;
            const strategy = new WebSocketUpdateStrategy(null);
            const context: IWebSocketContext = {
                webSocket: mockWebSocket,
                modes: [],
            };
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
            strategy.refresh(context, subscriptions, setContext);
            console.error = noop;

            await mockWebSocket.onmessage({
                type: 'message',
                data: JSON.stringify({
                    type: MessageType.error,
                    id: null,
                    message: 'SOME ERROR'
                }),
            } as any);

            expect(errors).toEqual([{
                id: '1234', error: 'SOME ERROR'
            }, {
                id: '5678', error: 'SOME ERROR'
            }]);
        });

        it('publishes Error message to identified subscription', async () => {
            let errors: { error: string, id: string }[] = [];
            const mockWebSocket = {
                readyState: 1,
                send: (_: string) => {},
                close: () => {},
            } as WebSocket;
            const strategy = new WebSocketUpdateStrategy(null);
            const context: IWebSocketContext = {
                webSocket: mockWebSocket,
                modes: [],
            };
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
            strategy.refresh(context, subscriptions, setContext);
            console.error = noop;

            await mockWebSocket.onmessage({
                type: 'message',
                data: JSON.stringify({
                    type: MessageType.error,
                    id: '1234',
                    message: 'SOME ERROR'
                }),
            } as any);

            expect(errors).toEqual([{
                id: '1234', error: 'SOME ERROR'
            }]);
        });

        it('handles unknown message type', async () => {
            const mockWebSocket = {
                readyState: 1,
                send: (_: string) => {},
                close: () => {},
            } as WebSocket;
            const strategy = new WebSocketUpdateStrategy(null);
            const context: IWebSocketContext = {
                webSocket: mockWebSocket,
                modes: [],
            };
            const subscriptions: ISubscriptions = {};
            strategy.refresh(context, subscriptions, setContext);
            let log: string;
            console.log = (msg: string) => log = msg;

            await mockWebSocket.onmessage({
                type: 'message',
                data: JSON.stringify({
                    type: 'foo',
                }),
            } as any);

            expect(log).toEqual(`Unhandled live message: ${JSON.stringify({type: 'foo'})}`);
        });

        it('removes webSocket from context', async () => {
            const mockWebSocket = {
                readyState: 1,
                send: (_: string) => {},
                close: () => {},
            } as WebSocket;
            const strategy = new WebSocketUpdateStrategy(null);
            const context: IWebSocketContext = {
                webSocket: mockWebSocket,
                modes: [],
            };
            const subscriptions: ISubscriptions = {};
            strategy.refresh(context, subscriptions, setContext);
            let error: string;
            console.error = (msg: string) => error = msg;

            await mockWebSocket.onclose(null);

            expect(error).toEqual('Socket disconnected');
            expect(newContext).toEqual({
                webSocket: null,
                modes: [],
            });
        });
    })
});