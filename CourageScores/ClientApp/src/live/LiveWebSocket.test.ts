import {LiveWebSocket} from "./LiveWebSocket";
import {createTemporaryId} from "../helpers/projection";
import {ISubscriptions} from "./ISubscriptions";
import {IWebSocketContext} from "./IWebSocketContext";
import {LiveDataType} from "./LiveDataType";

describe('LiveWebSocket', () => {
    describe('publish', () => {
        it('wont send data when banned', async () => {
            const id = createTemporaryId();
            let sent: string;
            const socket = new LiveWebSocket({
                socketContext: {
                    webSocket: {
                        send: (data: string) => {
                            sent = data;
                        },
                        readyState: 1,
                    } as any,
                    banned: true,
                },
                subscriptions: {},
                createSocket: () => new WebSocket(''),
                setSocketContext: async () => {},
                setSubscriptions: async () => {},
            });
            let exception = null;

            try {
                await socket.publish(id, 'data');
            } catch (e) {
                exception = e;
            }

            expect(sent).toBeFalsy();
            expect(exception).toEqual('banned');
        });

        it('will send data to socket', async () => {
            const id = createTemporaryId();
            let sent: string;
            const socket = new LiveWebSocket({
                socketContext: { webSocket: {
                    send: (data: string) => {
                        sent = data;
                    },
                    readyState: 1,
                } as any },
                subscriptions: {},
                createSocket: () => new WebSocket(''),
                setSocketContext: async () => {},
                setSubscriptions: async () => {},
            });

            await socket.publish(id, 'data');

            expect(sent!).toBeTruthy();
            expect(JSON.parse(sent!)).toEqual({
                type: 'update',
                id: id,
                data: 'data',
            });
        });

        it('will close the socket if unready', async () => {
            const id = createTemporaryId();
            let sent = null;
            let closed = true;
            const socket = new LiveWebSocket({
                socketContext: { webSocket: {
                    send: (data: any) => {
                        sent = data;
                    },
                    readyState: 2,
                    close: () => { closed = true },
                } as any },
                setSocketContext: async () => {},
                subscriptions: {},
                setSubscriptions: async () => {},
                createSocket: () => new WebSocket(''),
            });
            let exception: any;

            try {
                await socket.publish(id, 'data');
            } catch (e) {
                exception = e;
            }

            expect(sent).toBeNull();
            expect(closed).toEqual(true);
            expect(exception).toEqual('Socket did not connect');
        });

        it('will wait for the socket to be ready', async () => {
            class MockSocket {
                _context: any;
                constructor(context: any) {
                    this._context = context;
                }

                get readyState() {
                    this._context.readyStateRetrieved();
                    return Math.max(this._context.readyState, 0);
                }

                send(data: any) {
                    this._context.sent.push(data);
                }

                close() {
                    this._context.closed = true;
                }
            }

            const id = createTemporaryId();
            const emptyStringArray: string[] = [];
            // noinspection JSUnusedGlobalSymbols
            const socketInfo = {
                readyState: 1,
                sent: emptyStringArray,
                closed: false,
                readyStateRetrieved: () => {
                    socketInfo.readyState++;
                    if (socketInfo.readyState > 1) {
                        socketInfo.readyState = 1;
                    }
                },
            }
            const socket = new LiveWebSocket({
                socketContext: { webSocket: new MockSocket(socketInfo) as any },
                setSocketContext: async () => {},
                subscriptions: {},
                setSubscriptions: async () => {},
                createSocket: () => new WebSocket(''),
            });
            await socket.publish(id, 'first');
            socketInfo.readyState = -2;
            let exception = null;
            socketInfo.sent = [];

            try {
                await socket.publish(id, 'second');
            } catch (e) {
                exception = e;
            }

            expect(exception).toBeNull();
            expect(socketInfo.sent.map((sent) => JSON.parse(sent))).toEqual([{type:'update', id, data: 'second'}]);
            expect(socketInfo.closed).toEqual(false);
        });

        it('will close the socket when unready', async () => {
            class MockSocket {
                _context: any;
                constructor(context: any) {
                    this._context = context;
                }

                get readyState() {
                    this._context.readyStateRetrieved();
                    return this._context.readyState;
                }

                send(data: any) {
                    this._context.sent.push(data);
                }

                close() {
                    this._context.closed = true;
                }
            }

            const id = createTemporaryId();
            // noinspection JSUnusedGlobalSymbols
            const socketInfo = {
                readyState: 1,
                sent: [],
                closed: false,
                readyStateRetrieved: () => {},
            };
            const socket = new LiveWebSocket({
                socketContext: { webSocket: new MockSocket(socketInfo) as any },
                setSocketContext: async () => {},
                subscriptions: {},
                setSubscriptions: async () => {},
                createSocket: () => new WebSocket(''),
            });
            await socket.publish(id, 'first');
            socketInfo.readyState = 2;
            let exception = null;
            socketInfo.sent = [];

            try {
                await socket.publish(id, 'second');
            } catch (e) {
                exception = e;
            }

            expect(exception).toEqual('Socket did not connect');
            expect(socketInfo.sent).toEqual([]);
            expect(socketInfo.closed).toEqual(true);
        });

        it('will close the socket when unready after subscriptions', async () => {
            class MockSocket {
                _context: any;
                constructor(context: any) {
                    this._context = context;
                }

                get readyState() {
                    this._context.readyStateRetrieved();
                    return this._context.readyState;
                }

                send(data: any) {
                    this._context.sent.push(data);
                }

                close() {
                    this._context.closed = true;
                }
            }

            const id: string = createTemporaryId();
            // noinspection JSUnusedGlobalSymbols
            const socketInfo = {
                readyState: 1,
                sent: [],
                closed: false,
                readyStateRetrieved: () => {},
            }
            const socket = new LiveWebSocket({
                socketContext: { webSocket: new MockSocket(socketInfo) as any },
                setSocketContext: async () => {},
                subscriptions: {
                    anId: { id: 'anId', type: LiveDataType.sayg, errorHandler: () => {}, updateHandler: () => {} },
                },
                setSubscriptions: async () => {},
                createSocket: () => new WebSocket(''),
            });
            await socket.publish(id, 'first');
            socketInfo.readyState = 2;
            let exception = null;
            socketInfo.sent = [];

            try {
                await socket.publish(id, 'second');
            } catch (e) {
                exception = e;
            }

            expect(exception).toEqual('Socket was closed');
            expect(socketInfo.sent).toEqual([]);
            expect(socketInfo.closed).toEqual(true);
        });

        it('will throw if socket does not become ready', async () => {
            class MockSocket {
                _context: any;
                constructor(context: any) {
                    this._context = context;
                }

                get readyState() {
                    const readyState = this._context.readyStates.shift();
                    if (readyState < 0) {
                        throw new Error('ERROR');
                    }
                    return readyState;
                }

                send(data: any) {
                    this._context.sent.push(data);
                }

                close() {
                    this._context.closed = true;
                }
            }

            const id = createTemporaryId();
            const socketInfo = {
                sent: [],
                closed: false,
                readyStates: [
                    1,
                    0, -1
                ]
            }
            const socket = new LiveWebSocket({
                socketContext: { webSocket: new MockSocket(socketInfo) as any },
                setSocketContext: async () => {},
                subscriptions: {
                    anId: { id, type: LiveDataType.sayg, updateHandler: () => {}, errorHandler: () => {} },
                },
                setSubscriptions: async () => {},
                createSocket: () => new WebSocket(''),
            });
            await socket.publish(id, 'first');
            let exception = null;
            socketInfo.sent = [];
            console.error = () => {};

            try {
                await socket.publish(id, 'second');
            } catch (e) {
                exception = e;
            }

            expect(exception).toEqual('ERROR');
            expect(socketInfo.sent).toEqual([]);
        });
    });

    describe('unsubscribe', () => {
        it('will send unsubscribed', async () => {
            const id = createTemporaryId();
            let sent: string;
            const subscriptions: ISubscriptions = {};
            subscriptions[id] = { id, type: LiveDataType.sayg, updateHandler: () => {}, errorHandler: () => {} };
            const socket = new LiveWebSocket({
                socketContext: { webSocket: {
                    send: (value: string) => {
                        sent = value;
                    },
                    readyState: 1,
                    close: () => { },
                } as WebSocket },
                subscriptions,
                setSubscriptions: async () => {},
                setSocketContext: async () => {},
                createSocket: () => new WebSocket(''),
            });

            await socket.unsubscribe(id);

            expect(sent!).toBeTruthy();
            expect(JSON.parse(sent!)).toEqual({
                type: 'unsubscribed',
                id,
            });
        });

        it('will close the socket if no subscriptions left', async () => {
            const id = createTemporaryId();
            let closed = false;
            const socket = new LiveWebSocket({
                socketContext: { webSocket: {
                    send: () => {},
                    readyState: 1,
                    close: () => { closed = true },
                } as any },
                subscriptions: {},
                setSubscriptions: async () => {},
                setSocketContext: async () => {},
                createSocket: () => new WebSocket(''),
            });
            await socket.subscribe({ id, type: LiveDataType.sayg });

            await socket.unsubscribe(id);

            expect(closed).toEqual(true);
        });

        it('will not close the socket if subscriptions are left', async () => {
            const id1 = createTemporaryId();
            const id2 = createTemporaryId();
            let closed = false;
            let subscriptions: ISubscriptions = {};
            const socket = new LiveWebSocket({
                socketContext: { webSocket: {
                    send: (_: string) => {},
                    readyState: 1,
                    close: () => { closed = true },
                } as WebSocket },
                subscriptions,
                setSubscriptions: async (value) => {
                    // mutate the instance to save the need for a new LiveWebSocket to be created.

                    for (const key in subscriptions) {
                        delete subscriptions[key];
                    }
                    for (const key in value) {
                        subscriptions[key] = value[key];
                    }
                },
                setSocketContext: async () => {},
                createSocket: () => new WebSocket(''),
            });
            await socket.subscribe({ id: id1, type: LiveDataType.sayg });
            await socket.subscribe({ id: id2, type: LiveDataType.sayg });

            await socket.unsubscribe(id2);

            expect(closed).toEqual(false);
        });
    });

    describe('subscribe', () => {
        it('will send subscribed', async () => {
            const id = createTemporaryId();
            let sent: string;
            const socket = new LiveWebSocket({
                socketContext: { webSocket: {
                    send: (value: string) => {
                        sent = value;
                    },
                    readyState: 1,
                } as WebSocket },
                subscriptions: {},
                setSubscriptions: async () => {},
                setSocketContext: async () => {},
                createSocket: () => new WebSocket(''),
            });

            await socket.subscribe({ id, type: LiveDataType.sayg });

            expect(sent!).toBeTruthy();
            expect(JSON.parse(sent!)).toEqual({
                type: 'subscribed',
                id,
            });
        });

        it('will replace subscription', async () => {
            console.log = () => {};
            let mutable = 0;
            const id = createTemporaryId();
            const webSocket = {
                send: () => { },
                readyState: 1,
            } as any;
            let subscriptions: ISubscriptions = {};
            const socket = new LiveWebSocket({
                socketContext: { webSocket },
                subscriptions,
                setSubscriptions: async (value) => {
                    // mutate the instance to save the need for a new LiveWebSocket to be created.

                    for (const key in subscriptions) {
                        delete subscriptions[key];
                    }
                    for (const key in value) {
                        subscriptions[key] = value[key];
                    }
                },
                setSocketContext: async () => {},
                createSocket: () => new WebSocket(''),
            });
            await socket.subscribe({ id, type: LiveDataType.sayg }, () => mutable++);
            webSocket.onmessage!({
                type: 'message',
                data: JSON.stringify({
                    type: 'Update',
                    id,
                }),
            } as MessageEvent);
            expect(mutable).toEqual(1);

            await socket.subscribe({ id, type: LiveDataType.sayg }, () => mutable--);

            webSocket.onmessage!({
                type: 'message',
                data: JSON.stringify({
                    type: 'Update',
                    id,
                }),
            } as MessageEvent);
            expect(mutable).toEqual(0);
        });
    });

    describe('handleMessage', () => {
        const id = createTemporaryId();
        let webSocket: WebSocket;
        let socket: LiveWebSocket;
        let sent: any[];
        let subscriptions: ISubscriptions;

        beforeEach(() => {
            sent = [];
            webSocket = {
                send: (data: any) => {
                    sent.push(data);
                },
                readyState: 1,
            } as WebSocket;
            subscriptions = {};
            socket = new LiveWebSocket({
                socketContext: { webSocket },
                subscriptions,
                setSubscriptions: async (value) => {
                    // mutate the instance to save the need for a new LiveWebSocket to be created.

                    for (const key in subscriptions) {
                        delete subscriptions[key];
                    }
                    for (const key in value) {
                        subscriptions[key] = value[key];
                    }
                },
                setSocketContext: async () => {},
                createSocket: () => new WebSocket(''),
            });
        })

        it('handles unknown transport message type', () => {
            let logged: string;
            console.log = (msg: string) => { logged = msg };

            webSocket.onmessage!({
                type: 'unknown',
                data: '',
            } as MessageEvent);

            expect(logged).toContain('Unhandled message: ');
        });

        it('handles unknown live message type', () => {
            let logged: string;
            console.log = (msg: string) => { logged = msg };

            webSocket.onmessage!({
                type: 'message',
                data: JSON.stringify({ type: 'unknown' }),
            } as MessageEvent);

            expect(logged).toContain('Unhandled live message: ');
        });

        it('handles update live message type', () => {
            let received: object;
            socket.subscribe({ id, type: LiveDataType.sayg }, (data: object) => {
                received = data;
            });

            webSocket.onmessage!({
                type: 'message',
                data: JSON.stringify({
                    type: 'Update',
                    id,
                    data: {
                        age: 10,
                    },
                }),
            } as MessageEvent);

            expect(received!).toEqual({
                age: 10,
            });
        });

        it('handles update live message type when no handler set', () => {
            let logged: string;
            console.log = (msg: string) => { logged = msg };
            socket.subscribe({ id, type: LiveDataType.sayg });

            webSocket.onmessage!({
                type: 'message',
                data: JSON.stringify({
                    type: 'Update',
                    data: {
                        age: 10,
                    },
                }),
            } as MessageEvent);

            expect(logged).toEqual({
                age: 10,
            });
        });

        it('handles marco live message type', async () => {
            await webSocket.onmessage!({
                type: 'message',
                data: JSON.stringify({
                    type: 'Marco'
                }),
            } as MessageEvent);

            expect(JSON.parse(sent[0])).toEqual({
                type: 'polo',
            });
        });

        it('handles polo live message type', () => {
            webSocket.onmessage!({
                type: 'message',
                data: JSON.stringify({
                    type: 'Polo'
                }),
            } as MessageEvent);

            expect(sent).toEqual([]);
        });

        it('handles error live message type', () => {
            console.error = () => { };
            let error: string;
            socket.subscribe({ id, type: LiveDataType.sayg }, () => {}, (err: string) => {
                error = err;
            });

            webSocket.onmessage!({
                type: 'message',
                data: JSON.stringify({
                    type: 'Error',
                    message: 'ERROR'
                }),
            } as MessageEvent);

            expect(error!).toEqual('ERROR');
        });

        it('handles error live message type when no handler set', () => {
            let logged: string;
            console.error = (err: string) => { logged = err };
            socket.subscribe({ id, type: LiveDataType.sayg });

            webSocket.onmessage!({
                type: 'message',
                data: JSON.stringify({
                    type: 'Error',
                    message: 'ERROR'
                }),
            } as MessageEvent);

            expect(logged!).toEqual('ERROR');
        });
    });

    describe('handleClose', () => {
        let webSocket: WebSocket;
        let newSocket: IWebSocketContext | null;

        beforeEach(() => {
            webSocket = {
                send: () => {},
                readyState: 1,
            } as any;
            newSocket = null;
            new LiveWebSocket({
                socketContext: { webSocket },
                subscriptions: {},
                setSubscriptions: async () => {},
                setSocketContext: async (value) => newSocket = value,
                createSocket: () => new WebSocket(''),
            });
        })

        it('handles socket closure', () => {
            let logged: string;
            console.error = (msg: string) => { logged = msg };

            webSocket.onclose!(<CloseEvent>{});

            expect(logged).toContain('Socket closed');
            expect(newSocket).toEqual({
                webSocket: null,
                closures: 1,
            });
        });
    });
});