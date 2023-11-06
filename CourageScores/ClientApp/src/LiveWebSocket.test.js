// noinspection JSUnresolvedReference

import {LiveWebSocket} from "./LiveWebSocket";
import {createTemporaryId} from "./helpers/projection";

describe('LiveWebSocket', () => {
    describe('publish', () => {
        it('will send data to socket', async () => {
            const id = createTemporaryId();
            let sent;
            const socket = new LiveWebSocket({
                socket: {
                    send: (data) => {
                        sent = data;
                    },
                    readyState: 1,
                },
            });

            await socket.publish(id, 'data');

            expect(JSON.parse(sent)).toEqual({
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
                socket: {
                    send: (data) => {
                        sent = data;
                    },
                    readyState: 2,
                    close: () => { closed = true },
                },
                setSocket: () => {},
                subscriptions: {},
                setSubscriptions: () => {},
            });
            let exception;

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
                _context;
                constructor(context) {
                    this._context = context;
                }

                get readyState() {
                    this._context.readyStateRetrieved();
                    return Math.max(this._context.readyState, 0);
                }

                send(data) {
                    this._context.sent.push(data);
                }

                close() {
                    this._context.closed = true;
                }
            }

            const id = createTemporaryId();
            const socketContext = {
                readyState: 1,
                sent: [],
                closed: false,
                readyStateRetrieved: () => {
                    socketContext.readyState++;
                    if (socketContext.readyState > 1) {
                        socketContext.readyState = 1;
                    }
                },
            }
            const socket = new LiveWebSocket({
                socket: new MockSocket(socketContext),
                setSocket: () => {},
                subscriptions: {},
                setSubscriptions: () => {},
            });
            await socket.publish(id, 'first');
            socketContext.readyState = -2;
            let exception = null;
            socketContext.sent = [];

            try {
                await socket.publish(id, 'second');
            } catch (e) {
                exception = e;
            }

            expect(exception).toBeNull();
            expect(socketContext.sent.map(JSON.parse)).toEqual([{type:'update', id, data: 'second'}]);
            expect(socketContext.closed).toEqual(false);
        });

        it('will close the socket when unready', async () => {
            class MockSocket {
                _context;
                constructor(context) {
                    this._context = context;
                }

                get readyState() {
                    this._context.readyStateRetrieved();
                    return this._context.readyState;
                }

                send(data) {
                    this._context.sent.push(data);
                }

                close() {
                    this._context.closed = true;
                }
            }

            const id = createTemporaryId();
            const socketContext = {
                readyState: 1,
                sent: [],
                closed: false,
                readyStateRetrieved: () => {

                },
            }
            const socket = new LiveWebSocket({
                socket: new MockSocket(socketContext),
                setSocket: () => {},
                subscriptions: {},
                setSubscriptions: () => {},
            });
            await socket.publish(id, 'first');
            socketContext.readyState = 2;
            let exception = null;
            socketContext.sent = [];

            try {
                await socket.publish(id, 'second');
            } catch (e) {
                exception = e;
            }

            expect(exception).toEqual('Socket did not connect');
            expect(socketContext.sent).toEqual([]);
            expect(socketContext.closed).toEqual(true);
        });

        it('will close the socket when unready after subscriptions', async () => {
            class MockSocket {
                _context;
                constructor(context) {
                    this._context = context;
                }

                get readyState() {
                    this._context.readyStateRetrieved();
                    return this._context.readyState;
                }

                send(data) {
                    this._context.sent.push(data);
                }

                close() {
                    this._context.closed = true;
                }
            }

            const id = createTemporaryId();
            const socketContext = {
                readyState: 1,
                sent: [],
                closed: false,
                readyStateRetrieved: () => {

                },
            }
            const socket = new LiveWebSocket({
                socket: new MockSocket(socketContext),
                setSocket: () => {},
                subscriptions: {
                    anId: {}
                },
                setSubscriptions: () => {},
            });
            await socket.publish(id, 'first');
            socketContext.readyState = 2;
            let exception = null;
            socketContext.sent = [];

            try {
                await socket.publish(id, 'second');
            } catch (e) {
                exception = e;
            }

            expect(exception).toEqual('Socket was closed');
            expect(socketContext.sent).toEqual([]);
            expect(socketContext.closed).toEqual(true);
        });

        it('will throw if socket does not become ready', async () => {
            class MockSocket {
                _context;
                constructor(context) {
                    this._context = context;
                }

                get readyState() {
                    const readyState = this._context.readyStates.shift();
                    if (readyState < 0) {
                        throw new Error('ERROR');
                    }
                    return readyState;
                }

                send(data) {
                    this._context.sent.push(data);
                }

                close() {
                    this._context.closed = true;
                }
            }

            const id = createTemporaryId();
            const socketContext = {
                sent: [],
                closed: false,
                readyStates: [
                    1,
                    0, -1
                ]
            }
            const socket = new LiveWebSocket({
                socket: new MockSocket(socketContext),
                setSocket: () => {},
                subscriptions: {
                    anId: {}
                },
                setSubscriptions: () => {},
            });
            await socket.publish(id, 'first');
            let exception = null;
            socketContext.sent = [];
            console.error = () => {};

            try {
                await socket.publish(id, 'second');
            } catch (e) {
                exception = e;
            }

            expect(exception).toEqual('ERROR');
            expect(socketContext.sent).toEqual([]);
        });
    });

    describe('unsubscribe', () => {
        it('will send unsubscribed', async () => {
            const id = createTemporaryId();
            let sent;
            const subscriptions = {};
            subscriptions[id] = {};
            const socket = new LiveWebSocket({
                socket: {
                    send: (value) => {
                        sent = value;
                    },
                    readyState: 1,
                    close: () => { },
                },
                subscriptions,
                setSubscriptions: () => {},
                setSocket: () => {},
            });

            await socket.unsubscribe(id);

            expect(sent).toBeTruthy();
            expect(JSON.parse(sent)).toEqual({
                type: 'unsubscribed',
                id,
            });
        });

        it('will close the socket if no subscriptions left', async () => {
            const id = createTemporaryId();
            let closed = false;
            let sent;
            const socket = new LiveWebSocket({
                socket: {
                    send: (value) => {
                        sent = value;
                    },
                    readyState: 1,
                    close: () => { closed = true },
                },
                subscriptions: {},
                setSubscriptions: () => {},
                setSocket: () => {},
            });
            socket.subscribe(id);

            await socket.unsubscribe(id);

            expect(closed).toEqual(true);
        });

        it('will not close the socket if subscriptions are left', async () => {
            const id1 = createTemporaryId();
            const id2 = createTemporaryId();
            let closed = false;
            let sent;
            let subscriptions = {};
            const socket = new LiveWebSocket({
                socket: {
                    send: (value) => {
                        sent = value;
                    },
                    readyState: 1,
                    close: () => { closed = true },
                },
                subscriptions,
                setSubscriptions: (value) => {
                    // mutate the instance to save the need for a new LiveWebSocket to be created.

                    for (const key in subscriptions) {
                        delete subscriptions[key];
                    }
                    for (const key in value) {
                        subscriptions[key] = value[key];
                    }
                },
                setSocket: () => {},
            });
            await socket.subscribe(id1);
            await socket.subscribe(id2);

            await socket.unsubscribe(id2);

            expect(closed).toEqual(false);
        });
    });

    describe('subscribe', () => {
        it('will send subscribed', async () => {
            const id = createTemporaryId();
            let sent;
            const api = {
                subscriptions: {},
            };
            api.setSubscriptions = (value) => {
                api.subscriptions = value;
            };
            const socket = new LiveWebSocket({
                socket: {
                    send: (value) => {
                        sent = value;
                    },
                    readyState: 1,
                },
                subscriptions: {},
                setSubscriptions: () => {},
                setSocket: () => {},
            });

            await socket.subscribe(id);

            expect(JSON.parse(sent)).toEqual({
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
            };
            let subscriptions = {};
            const socket = new LiveWebSocket({
                socket: webSocket,
                subscriptions,
                setSubscriptions: (value) => {
                    // mutate the instance to save the need for a new LiveWebSocket to be created.

                    for (const key in subscriptions) {
                        delete subscriptions[key];
                    }
                    for (const key in value) {
                        subscriptions[key] = value[key];
                    }
                },
                setSocket: () => {},
            });
            await socket.subscribe(id, () => mutable++);
            webSocket.onmessage({
                type: 'message',
                data: JSON.stringify({
                    type: 'Update',
                    id,
                }),
            });
            expect(mutable).toEqual(1);

            await socket.subscribe(id, () => mutable--);

            webSocket.onmessage({
                type: 'message',
                data: JSON.stringify({
                    type: 'Update',
                    id,
                }),
            });
            expect(mutable).toEqual(0);
        });
    });

    describe('handleMessage', () => {
        const id = createTemporaryId();
        let webSocket;
        let socket;
        let sent;
        let subscriptions;

        beforeEach(() => {
            sent = [];
            webSocket = {
                send: (data) => {
                    sent.push(data);
                },
                readyState: 1,
            };
            subscriptions = {};
            socket = new LiveWebSocket({
                socket: webSocket,
                subscriptions,
                setSubscriptions: (value) => {
                    // mutate the instance to save the need for a new LiveWebSocket to be created.

                    for (const key in subscriptions) {
                        delete subscriptions[key];
                    }
                    for (const key in value) {
                        subscriptions[key] = value[key];
                    }
                },
                setSocket: () => {},
            });
        })

        it('handles unknown transport message type', () => {
            let logged;
            console.log = (msg) => { logged = msg };

            webSocket.onmessage({
                type: 'unknown',
                data: '',
            });

            expect(logged).toContain('Unhandled message: ');
        });

        it('handles unknown live message type', () => {
            let logged;
            console.log = (msg) => { logged = msg };

            webSocket.onmessage({
                type: 'message',
                data: JSON.stringify({ type: 'unknown' }),
            });

            expect(logged).toContain('Unhandled live message: ');
        });

        it('handles update live message type', () => {
            let received;
            socket.subscribe(id, (data) => {
                received = data;
            });

            webSocket.onmessage({
                type: 'message',
                data: JSON.stringify({
                    type: 'Update',
                    id,
                    data: {
                        age: 10,
                    },
                }),
            });

            expect(received).toEqual({
                age: 10,
            });
        });

        it('handles update live message type when no handler set', () => {
            let logged;
            console.log = (msg) => { logged = msg };
            socket.subscribe(id);

            webSocket.onmessage({
                type: 'message',
                data: JSON.stringify({
                    type: 'Update',
                    data: {
                        age: 10,
                    },
                }),
            });

            expect(logged).toEqual({
                age: 10,
            });
        });

        it('handles marco live message type', async () => {
            await webSocket.onmessage({
                type: 'message',
                data: JSON.stringify({
                    type: 'Marco'
                }),
            });

            expect(JSON.parse(sent)).toEqual({
                type: 'polo',
            });
        });

        it('handles polo live message type', () => {
            webSocket.onmessage({
                type: 'message',
                data: JSON.stringify({
                    type: 'Polo'
                }),
            });

            expect(sent).toEqual([]);
        });

        it('handles error live message type', () => {
            console.error = () => { };
            let error;
            socket.subscribe(id, null, (err) => {
                error = err;
            });

            webSocket.onmessage({
                type: 'message',
                data: JSON.stringify({
                    type: 'Error',
                    message: 'ERROR'
                }),
            });

            expect(error).toEqual('ERROR');
        });

        it('handles error live message type when no handler set', () => {
            let logged;
            console.error = (err) => { logged = err };
            socket.subscribe(id);

            webSocket.onmessage({
                type: 'message',
                data: JSON.stringify({
                    type: 'Error',
                    message: 'ERROR'
                }),
            });

            expect(logged).toEqual('ERROR');
        });
    });

    describe('handleClose', () => {
        let webSocket;
        let socket;
        let newSocket;

        beforeEach(() => {
            webSocket = {
                send: () => {},
                readyState: 1,
            };
            socket = new LiveWebSocket({
                socket: webSocket,
                subscriptions: {},
                setSubscriptions: () => {},
                setSocket: (value) => {
                    newSocket = value;
                },
            });
        })

        it('handles socket closure', () => {
            let logged;
            console.error = (msg) => { logged = msg };

            webSocket.onclose();

            expect(logged).toContain('Socket closed');
            expect(newSocket).toEqual(null);
        });
    });
});