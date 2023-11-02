// noinspection JSUnresolvedReference

import {LiveWebSocket} from "./LiveWebSocket";

describe('LiveWebSocket', () => {
    describe('send', () => {
        it('will send data to socket', () => {
            let sent;
            const socket = new LiveWebSocket({
                send: (data) => {
                    sent = data;
                }
            });

            socket.send('data');

            expect(sent).toEqual('data');
        });
    });

    describe('close', () => {
        it('will close the socket', () => {
            let closed;
            const socket = new LiveWebSocket({
                close: () => {
                    closed = true;
                }
            });

            socket.close();

            expect(closed).toEqual(true);
        });
    });

    describe('handleMessage', () => {
        let webSocket;
        let socket;
        let sent;

        beforeEach(() => {
            sent = [];
            webSocket = {
                send: (data) => {
                    sent.push(data);
                },
            };
            socket = new LiveWebSocket(webSocket);
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
            socket.updateHandler = (data) => {
                received = data;
            }

            webSocket.onmessage({
                type: 'message',
                data: JSON.stringify({
                    type: 'Update',
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

        it('handles marco live message type', () => {
            webSocket.onmessage({
                type: 'message',
                data: JSON.stringify({
                    type: 'Marco'
                }),
            });

            expect(sent).toEqual([{
                type: 'polo',
            }]);
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
            socket.errorHandler = (err) => {
                error = err;
            }

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
});