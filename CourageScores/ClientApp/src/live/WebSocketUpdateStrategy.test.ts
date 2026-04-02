import { WebSocketUpdateStrategy } from './WebSocketUpdateStrategy';
import { IWebSocketContext } from './IWebSocketContext';
import { createTemporaryId } from '../helpers/projection';
import { ISubscriptions } from './ISubscriptions';
import { ISubscriptionRequest } from './ISubscriptionRequest';
import { WebSocketMode } from './WebSocketMode';
import { noop } from '../helpers/tests';
import { MessageType } from '../interfaces/models/dtos/MessageType';
import { LiveDataType } from '../interfaces/models/dtos/Live/LiveDataType';
import { IStrategyData } from './IStrategyData';
import { ISubscription } from './ISubscription';

describe('WebSocketUpdateStrategy', () => {
    let newContext: IWebSocketContext | null;

    const emptySubscription: ISubscription = {
        id: undefined!,
        type: LiveDataType.sayg,
        method: WebSocketMode.socket,
        errorHandler: noop,
        updateHandler: noop,
    };

    async function setContext(context: IWebSocketContext) {
        newContext = context;
    }

    function pushTo<T>(errors: { data: T; id: string }[], id: string) {
        return (data: T) => {
            errors.push({
                data,
                id,
            });
        };
    }

    beforeEach(() => {
        newContext = null;
    });

    function mockWebSocket(state: number, s?: string[], c?: () => void) {
        return {
            readyState: state,
            send: (data: string) => s?.push(data),
            close: () => c?.(),
        } as WebSocket;
    }

    function webSocketContext(ws?: WebSocket, ...modes: WebSocketMode[]) {
        return {
            webSocket: ws,
            modes,
        };
    }

    function props(c: IWebSocketContext, s?: ISubscriptions): IStrategyData {
        return {
            context: c,
            subscriptions: s ?? {},
            setContext,
            setSubscriptions: noop,
        };
    }

    describe('refresh', () => {
        it('accepts no websocket', async () => {
            const strategy = new WebSocketUpdateStrategy(null!);

            strategy.refresh(props(webSocketContext()));
        });

        it('binds websocket onmessage', async () => {
            const strategy = new WebSocketUpdateStrategy(null!);
            const context = webSocketContext(mockWebSocket(1));

            strategy.refresh(props(context));

            expect(context.webSocket?.onmessage).toBeTruthy();
        });

        it('binds websocket onclose', async () => {
            const strategy = new WebSocketUpdateStrategy(null!);
            const context = webSocketContext(mockWebSocket(1));

            strategy.refresh(props(context));

            expect(context.webSocket?.onclose).toBeTruthy();
        });
    });

    describe('publish', () => {
        const id = createTemporaryId();
        const disconnectedContext = webSocketContext();

        it('creates a socket if none exists', async () => {
            const ws = mockWebSocket(1);
            const strategy = new WebSocketUpdateStrategy(() => ws);

            const result = await strategy.publish(
                props(disconnectedContext),
                id,
                LiveDataType.sayg,
                'data',
            );

            expect(result).toBeTruthy();
            expect(result?.webSocket).toEqual(ws);
        });

        it('returns null if new socket is unable to connect', async () => {
            const ws = mockWebSocket(2);
            const strategy = new WebSocketUpdateStrategy(() => ws);

            const result = await strategy.publish(
                props(disconnectedContext),
                id,
                LiveDataType.sayg,
                'data',
            );

            expect(result).toBeNull();
        });

        it('sends update to new socket and returns true', async () => {
            const sent: string[] = [];
            const ws = mockWebSocket(1, sent);
            const strategy = new WebSocketUpdateStrategy(() => ws);

            await strategy.publish(
                props(disconnectedContext),
                id,
                LiveDataType.sayg,
                'data',
            );

            expect(sent).toEqual([
                JSON.stringify({
                    type: MessageType.update,
                    id,
                    data: 'data',
                    dataType: LiveDataType.sayg,
                }),
            ]);
        });

        it('sends update to existing socket and returns true', async () => {
            const sent: string[] = [];
            const ws = mockWebSocket(1, sent);
            const strategy = new WebSocketUpdateStrategy(null!);
            const context = webSocketContext(ws);

            await strategy.publish(
                props(context),
                id,
                LiveDataType.sayg,
                'data',
            );

            expect(sent).toEqual([
                JSON.stringify({
                    type: MessageType.update,
                    id,
                    data: 'data',
                    dataType: LiveDataType.sayg,
                }),
            ]);
        });
    });

    describe('unsubscribe', () => {
        const id = createTemporaryId();

        it('does nothing if no websocket', async () => {
            const strategy = new WebSocketUpdateStrategy(null!);
            const context = webSocketContext();

            const result = await strategy.unsubscribe(props(context), id);

            expect(result).toEqual(context);
        });

        it('sends unsubscribed if socket exists', async () => {
            const sent: string[] = [];
            const ws = mockWebSocket(1, sent);
            const strategy = new WebSocketUpdateStrategy(() => ws);
            const context = webSocketContext(ws);

            await strategy.unsubscribe(props(context), id);

            expect(sent).toEqual([
                JSON.stringify({
                    type: MessageType.unsubscribed,
                    id,
                }),
            ]);
        });

        it('closes websocket if no subscriptions', async () => {
            let closed: boolean = false;
            const ws = mockWebSocket(1, [], () => (closed = true));
            const strategy = new WebSocketUpdateStrategy(() => ws);
            const context = webSocketContext(ws);

            const result = await strategy.unsubscribe(props(context), id);

            expect(closed).toEqual(true);
            expect(result).toEqual({
                modes: [],
            });
        });

        it('leaves websocket open if subscriptions remain', async () => {
            let closed: boolean = false;
            const ws = mockWebSocket(1, [], () => (closed = true));
            const strategy = new WebSocketUpdateStrategy(() => ws);
            const context = webSocketContext(ws);
            const subscriptions: ISubscriptions = {
                anotherId: {
                    ...emptySubscription,
                    id: 'anotherId',
                },
            };

            const result = await strategy.unsubscribe(
                props(context, subscriptions),
                id,
            );

            expect(closed).toEqual(false);
            expect(result).toEqual({
                webSocket: ws,
                modes: [],
            });
        });
    });

    describe('subscribe', () => {
        const request: ISubscriptionRequest = {
            id: createTemporaryId(),
            type: LiveDataType.sayg,
        };

        it('creates a socket if none exists', async () => {
            const ws = mockWebSocket(1);
            const strategy = new WebSocketUpdateStrategy(() => ws);
            const context = webSocketContext();

            const result = await strategy.subscribe(props(context), request);

            expect(result).toBeTruthy();
            expect(result!.webSocket).toEqual(ws);
        });

        it('returns null if new socket is unable to connect', async () => {
            const ws = mockWebSocket(2);
            const strategy = new WebSocketUpdateStrategy(() => ws);
            const context = webSocketContext();

            const result = await strategy.subscribe(props(context), request);

            expect(result).toEqual(null);
        });

        it('sends subscribed to new socket and returns true', async () => {
            const sent: string[] = [];
            const ws = mockWebSocket(1, sent);
            const strategy = new WebSocketUpdateStrategy(() => ws);
            const context = webSocketContext();

            await strategy.subscribe(props(context), request);

            expect(sent).toEqual([
                JSON.stringify({
                    type: MessageType.subscribed,
                    id: request.id,
                }),
            ]);
        });

        it('sends subscribed to existing socket and returns true', async () => {
            const sent: string[] = [];
            const ws = mockWebSocket(1, sent);
            const strategy = new WebSocketUpdateStrategy(() => ws);
            const context = webSocketContext(ws);

            await strategy.subscribe(props(context), request);

            expect(sent).toEqual([
                JSON.stringify({
                    type: MessageType.subscribed,
                    id: request.id,
                }),
            ]);
        });
    });

    describe('server-side messages', () => {
        let sent: string[];
        let ws: WebSocket;
        let strategy: WebSocketUpdateStrategy;
        let context: IWebSocketContext;
        let error: string | undefined;
        let log: string | undefined;

        beforeEach(() => {
            sent = [];
            ws = mockWebSocket(1, sent);
            strategy = new WebSocketUpdateStrategy(null!);
            context = webSocketContext(ws);
            console.error = (msg: string) => (error = msg);
            console.log = (msg: string) => (log = msg);
        });

        function message(data: any, type: string = 'message') {
            return {
                type,
                data: data.length ? data : JSON.stringify(data),
            } as MessageEvent<any>;
        }

        it('ignores non-message events', async () => {
            strategy.refresh(props(context));

            await ws.onmessage!(message('data', 'anything'));

            expect(log).toEqual(
                `Unhandled message: ${JSON.stringify({
                    type: 'anything',
                    data: 'data',
                })}`,
            );
        });

        it('publishes Update messages to all subscribers', async () => {
            let updates: { data: object; id: string }[] = [];
            const subscriptions: ISubscriptions = {
                '1234': {
                    ...emptySubscription,
                    updateHandler: pushTo(updates, '1234'),
                },
                '5678': {
                    ...emptySubscription,
                    updateHandler: pushTo(updates, '5678'),
                },
            };
            strategy.refresh(props(context, subscriptions));
            const data = {
                type: 'updated-data',
            };

            await ws.onmessage!(
                message({
                    type: MessageType.update,
                    id: null,
                    data,
                }),
            );

            expect(updates.map((u) => u.id)).toEqual(['1234', '5678']);
            expect(updates.map((u) => u.data)).toEqual([data, data]);
        });

        it('publishes Update message to identified subscription', async () => {
            let updates: { data: object; id: string }[] = [];
            const subscriptions: ISubscriptions = {
                '1234': {
                    ...emptySubscription,
                    updateHandler: pushTo(updates, '1234'),
                },
                '5678': {
                    ...emptySubscription,
                    updateHandler: pushTo(updates, '5678'),
                },
            };
            strategy.refresh(props(context, subscriptions));
            const data = {
                type: 'updated-data',
            };

            await ws.onmessage!(
                message({
                    type: MessageType.update,
                    id: '1234',
                    data,
                }),
            );

            expect(updates.map((u) => u.id)).toEqual(['1234']);
            expect(updates.map((u) => u.data)).toEqual([data]);
        });

        it('responds with polo to Marco messages', async () => {
            strategy.refresh(props(context));

            await ws.onmessage!(
                message({
                    type: MessageType.marco,
                }),
            );

            expect(sent).toEqual([
                JSON.stringify({
                    type: MessageType.polo,
                }),
            ]);
        });

        it('does nothing when Polo message received', async () => {
            strategy.refresh(props(context));

            await ws.onmessage!(
                message({
                    type: MessageType.polo,
                }),
            );

            expect(sent).toEqual([]);
        });

        it('publishes Error messages to all subscribers', async () => {
            let errors: { data: string; id: string }[] = [];
            const subscriptions: ISubscriptions = {
                '1234': {
                    ...emptySubscription,
                    errorHandler: pushTo(errors, '1234'),
                },
                '5678': {
                    ...emptySubscription,
                    errorHandler: pushTo(errors, '5678'),
                },
            };
            strategy.refresh(props(context, subscriptions));

            await ws.onmessage!(
                message({
                    type: MessageType.error,
                    id: null,
                    message: 'SOME ERROR',
                }),
            );

            expect(errors).toEqual([
                {
                    id: '1234',
                    data: 'SOME ERROR',
                },
                {
                    id: '5678',
                    data: 'SOME ERROR',
                },
            ]);
        });

        it('publishes Error message to identified subscription', async () => {
            let errors: { data: string; id: string }[] = [];
            const subscriptions: ISubscriptions = {
                '1234': {
                    ...emptySubscription,
                    errorHandler: pushTo(errors, '1234'),
                },
                '5678': {
                    ...emptySubscription,
                    errorHandler: pushTo(errors, '5678'),
                },
            };
            strategy.refresh(props(context, subscriptions));

            await ws.onmessage!(
                message({
                    type: MessageType.error,
                    id: '1234',
                    message: 'SOME ERROR',
                }),
            );

            expect(errors).toEqual([
                {
                    id: '1234',
                    data: 'SOME ERROR',
                },
            ]);
        });

        it('handles unknown message type', async () => {
            strategy.refresh(props(context));

            await ws.onmessage!(
                message({
                    type: 'foo',
                }),
            );

            expect(log).toEqual(
                `Unhandled live message: ${JSON.stringify({ type: 'foo' })}`,
            );
        });

        it('removes webSocket from context', async () => {
            strategy.refresh(props(context));

            await ws.onclose!(new CloseEvent('close', {}));

            expect(error).toEqual('Socket disconnected');
            expect(newContext).toEqual({
                modes: [],
            });
        });
    });
});
