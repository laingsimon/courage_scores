import {PollingUpdateStrategy} from "./PollingUpdateStrategy";
import {IWebSocketContext} from "./IWebSocketContext";
import {createTemporaryId} from "../helpers/projection";
import {IUpdateStrategy} from "./IUpdateStrategy";
import {api, noop} from "../helpers/tests";
import {ILiveApi} from "../interfaces/apis/ILiveApi";
import {ISubscriptions} from "./ISubscriptions";
import {ISubscriptionRequest} from "./ISubscriptionRequest";
import {WebSocketMode} from "./WebSocketMode";
import {IClientActionResultDto} from "../components/common/IClientActionResultDto";
import {LiveDataType} from "../interfaces/models/dtos/Live/LiveDataType";
import {UpdatedDataDto} from "../interfaces/models/dtos/Live/UpdatedDataDto";

describe('PollingUpdateStrategy', () => {
    let updateLookup: { [id: string]: () => IClientActionResultDto<object> };

    const liveApi = api<ILiveApi>({
        async getUpdate(id: string, _: string, __: string): Promise<IClientActionResultDto<object>> {
            return updateLookup[id]();
        }
    });

    beforeEach(() => {
        updateLookup = {};
    })

    describe('refresh', () => {
        it('should accept context and subscriptions', async () => {
            const strategy: IUpdateStrategy = new PollingUpdateStrategy(liveApi, 1, 2);
            const context: IWebSocketContext = { modes: [] };

            strategy.refresh(context, {}, async () => {});
        });
    });

    describe('publish', () => {
        it('should return null', async () => {
            const strategy: IUpdateStrategy = new PollingUpdateStrategy(liveApi, 1, 2);
            const context: IWebSocketContext = { modes: [] };

            const result = await strategy.publish(context, {}, noop, createTemporaryId(), 'data');

            expect(result).toBeNull();
        });
    });

    describe('unsubscribe', () => {
        it('should do nothing if subscriptions remain', async () => {
            const strategy = new PollingUpdateStrategy(liveApi, 1, 2);
            const context: IWebSocketContext = {
                pollingHandle: 1,
                modes: [],
            };
            const subscriptions: ISubscriptions = {
                anotherId: {
                    id: 'anotherId',
                    type: LiveDataType.sayg,
                    errorHandler: null,
                    updateHandler: null,
                },
            };

            const result = await strategy.unsubscribe(context, subscriptions, createTemporaryId());

            expect(result).toEqual({
                pollingHandle: 1,
                modes: [],
            });
        });

        it('should do nothing if no subscriptions and no polling handle', async () => {
            const strategy = new PollingUpdateStrategy(liveApi, 1, 2);
            const context: IWebSocketContext = { modes: [] };
            const subscriptions: ISubscriptions = {
                anotherId: {
                    id: 'anotherId',
                    type: LiveDataType.sayg,
                    errorHandler: null,
                    updateHandler: null,
                },
            };

            const result = await strategy.unsubscribe(context, subscriptions, createTemporaryId());

            expect(result).toEqual({
                modes: [],
            });
        });

        it('should clear timeout if no subscriptions and polling handle', async () => {
            let clearedTimeout: number;
            const strategy = new PollingUpdateStrategy(liveApi, 1, 2);
            const context: IWebSocketContext = {
                pollingHandle: 1,
                modes: [],
            };
            window.clearTimeout = (id: number) => {
                clearedTimeout = id;
            }

            const result = await strategy.unsubscribe(context, {}, createTemporaryId());

            expect(clearedTimeout).toEqual(1);
            expect(result).toEqual({
                pollingHandle: null,
                modes: [],
            });
        });
    });

    describe('subscribe', () => {
        it('should return context if polling handle already defined', async () => {
            const strategy = new PollingUpdateStrategy(liveApi, 1, 2);
            const context: IWebSocketContext = {
                pollingHandle: 1,
                modes: [],
            };
            const request: ISubscriptionRequest = {
                id: createTemporaryId(),
                type: LiveDataType.sayg,
            };

            const result = await strategy.subscribe(context, {}, noop, request);

            expect(result).toEqual({
                pollingHandle: 1,
                modes: [],
            });
        });

        it('should setup new timeout and return new context if polling handle not defined', async () => {
            const strategy = new PollingUpdateStrategy(liveApi, 1, 2);
            const context: IWebSocketContext = { modes: [] };
            const request: ISubscriptionRequest = {
                id: createTemporaryId(),
                type: LiveDataType.sayg,
            };
            window.setTimeout = (() => {
                return 123;
            }) as any;

            const result = await strategy.subscribe(context, {}, noop, request);

            expect(result).toEqual({
                pollingHandle: 123,
                modes: [],
            });
        });
    });

    describe('polling interval', () => {
        let timerCallback: () => Promise<void>;
        let timerHandle: number;
        let newContext: IWebSocketContext;

        beforeEach(() => {
            timerHandle = 0;
            timerCallback = null;
            newContext = null;
            window.setTimeout = ((handler: any) => {
                timerCallback = handler;
                timerHandle++;
                return timerHandle;
            }) as any;
        });

        async function setContext(context: IWebSocketContext) {
            newContext = context;
        }

        it('should accept no refreshContext (refresh not called)', async () => {
            const strategy = new PollingUpdateStrategy(liveApi, 1, 2);
            const context: IWebSocketContext = {
                modes: [ WebSocketMode.polling ]
            };
            await strategy.subscribe(context, {}, noop, null);
            let log: string;
            console.log = (msg: string) => log = msg;

            expect(timerCallback).toBeTruthy();
            await timerCallback();

            expect(log).toEqual('No refresh context, unable to execute on polling iteration');
        });

        it('should not re-create timeout if no subscriptions', async () => {
            const strategy = new PollingUpdateStrategy(liveApi, 1, 2);
            const context: IWebSocketContext = {
                modes: [ WebSocketMode.polling ]
            };
            const subscriptions: ISubscriptions = {
            };
            strategy.refresh(context, subscriptions, setContext);
            await strategy.subscribe(context, {}, noop, null);
            expect(timerHandle).toEqual(1);

            expect(timerCallback).toBeTruthy();
            await timerCallback();

            expect(timerHandle).toEqual(1);
        });

        it('should not re-create timeout if all requests fail', async () => {
            const strategy = new PollingUpdateStrategy(liveApi, 1, 2);
            const context: IWebSocketContext = {
                modes: [ WebSocketMode.polling ]
            };
            const subscriptions: ISubscriptions = {
                '1234': {
                    type: LiveDataType.sayg,
                    method: WebSocketMode.polling,
                    id: '1234',
                    updateHandler: () => {},
                    errorHandler: () => {},
                },
            };
            strategy.refresh(context, subscriptions, setContext);
            await strategy.subscribe(context, {}, noop, null);
            expect(timerHandle).toEqual(1);
            updateLookup['1234'] = (): IClientActionResultDto<any> => {
                return {
                    success: false,
                };
            };

            expect(timerCallback).toBeTruthy();
            await timerCallback();

            expect(timerHandle).toEqual(1);
            expect(newContext).toEqual({
                pollingHandle: null,
                modes: [],
            });
        });

        it('should re-create timeout if some requests pass', async () => {
            const strategy = new PollingUpdateStrategy(liveApi, 1, 2);
            const context: IWebSocketContext = {
                modes: [ WebSocketMode.polling ]
            };
            const subscriptions: ISubscriptions = {
                '1234': {
                    type: LiveDataType.sayg,
                    method: WebSocketMode.polling,
                    id: '1234',
                    updateHandler: () => {},
                    errorHandler: () => {},
                },
                '5678': {
                    type: LiveDataType.sayg,
                    method: WebSocketMode.polling,
                    id: '5678',
                    updateHandler: () => {},
                    errorHandler: () => {},
                },
            };
            strategy.refresh(context, subscriptions, setContext);
            await strategy.subscribe(context, {}, noop, null);
            expect(timerHandle).toEqual(1);
            updateLookup['1234'] = (): IClientActionResultDto<any> => {
                return {
                    success: false,
                };
            };
            updateLookup['5678'] = (): IClientActionResultDto<any> => {
                return {
                    success: true,
                };
            };

            await timerCallback();

            expect(timerHandle).toEqual(2);
            expect(newContext).toEqual({
                modes: [ WebSocketMode.polling ],
                pollingHandle: 2,
            });

            await timerCallback();

            expect(timerHandle).toEqual(3);
            expect(newContext).toEqual({
                modes: [ WebSocketMode.polling ],
                pollingHandle: 3,
            });
        });

        it('should exclude polling strategy if all requests fail', async () => {
            const strategy = new PollingUpdateStrategy(liveApi, 1, 2);
            const context: IWebSocketContext = {
                modes: [ WebSocketMode.polling ]
            };
            const subscriptions: ISubscriptions = {
                '1234': {
                    type: LiveDataType.sayg,
                    method: WebSocketMode.polling,
                    id: '1234',
                    updateHandler: () => {},
                    errorHandler: () => {},
                },
                '5678': {
                    type: LiveDataType.sayg,
                    method: WebSocketMode.polling,
                    id: '5678',
                    updateHandler: () => {},
                    errorHandler: () => {},
                },
            };
            strategy.refresh(context, subscriptions, setContext);
            await strategy.subscribe(context, {}, noop, null);
            expect(timerHandle).toEqual(1);
            updateLookup['1234'] = (): IClientActionResultDto<any> => {
                return {
                    success: false,
                };
            };
            updateLookup['5678'] = (): IClientActionResultDto<any> => {
                return {
                    success: false,
                };
            };

            expect(timerCallback).toBeTruthy();
            await timerCallback();

            expect(newContext).toEqual({
                modes: [],
                pollingHandle: null,
            });
        });

        it('should call updateHandler if request succeeds', async () => {
            const strategy = new PollingUpdateStrategy(liveApi, 1, 2);
            const context: IWebSocketContext = {
                modes: [ WebSocketMode.polling ]
            };
            let updatedData: any;
            const subscriptions: ISubscriptions = {
                '1234': {
                    type: LiveDataType.sayg,
                    method: WebSocketMode.polling,
                    id: '1234',
                    updateHandler: (data) => {
                        updatedData = data;
                    },
                    errorHandler: () => {},
                },
            };
            const data = {
                type: 'updated',
            };
            strategy.refresh(context, subscriptions, setContext);
            await strategy.subscribe(context, {}, noop, null);
            expect(timerHandle).toEqual(1);
            updateLookup['1234'] = (): IClientActionResultDto<UpdatedDataDto> => {
                return {
                    success: true,
                    result: {
                        data: data,
                        lastUpdate: 'LAST_UPDATE',
                    }
                };
            };

            expect(timerCallback).toBeTruthy();
            await timerCallback();

            expect(updatedData).toEqual(data);
        });

        it('should not call updateHandler if result is null (no change)', async () => {
            const strategy = new PollingUpdateStrategy(liveApi, 1, 2);
            const context: IWebSocketContext = {
                modes: [ WebSocketMode.polling ]
            };
            let updatedData: any;
            const subscriptions: ISubscriptions = {
                '1234': {
                    type: LiveDataType.sayg,
                    method: WebSocketMode.polling,
                    id: '1234',
                    updateHandler: (data) => {
                        updatedData = data;
                    },
                    errorHandler: () => {},
                },
            };
            strategy.refresh(context, subscriptions, setContext);
            await strategy.subscribe(context, {}, noop, null);
            expect(timerHandle).toEqual(1);
            updateLookup['1234'] = (): IClientActionResultDto<any> => {
                return {
                    success: true,
                    result: null
                };
            };

            expect(timerCallback).toBeTruthy();
            await timerCallback();

            expect(updatedData).toBeFalsy();
        });

        it('should call errorHandler if request fails', async () => {
            const strategy = new PollingUpdateStrategy(liveApi, 1, 2);
            const context: IWebSocketContext = {
                modes: [ WebSocketMode.polling ]
            };
            let errorData: any;
            const subscriptions: ISubscriptions = {
                '1234': {
                    type: LiveDataType.sayg,
                    method: WebSocketMode.polling,
                    id: '1234',
                    updateHandler: () => {},
                    errorHandler: (error) => {
                        errorData = error;
                    },
                },
            };
            strategy.refresh(context, subscriptions, setContext);
            await strategy.subscribe(context, {}, noop, null);
            expect(timerHandle).toEqual(1);
            updateLookup['1234'] = (): IClientActionResultDto<any> => {
                return {
                    success: false
                };
            };

            expect(timerCallback).toBeTruthy();
            await timerCallback();

            expect(errorData).toEqual({
                success: false
            });
        });

        it('should call errorHandler if exception thrown when sending request', async () => {
            const strategy = new PollingUpdateStrategy(liveApi, 1, 2);
            const context: IWebSocketContext = {
                modes: [ WebSocketMode.polling ]
            };
            let errorData: any;
            const subscriptions: ISubscriptions = {
                '1234': {
                    type: LiveDataType.sayg,
                    method: WebSocketMode.polling,
                    id: '1234',
                    updateHandler: () => {},
                    errorHandler: (error) => {
                        errorData = error;
                    },
                },
            };
            strategy.refresh(context, subscriptions, setContext);
            await strategy.subscribe(context, {}, noop, null);
            expect(timerHandle).toEqual(1);
            updateLookup['1234'] = (): IClientActionResultDto<any> => {
                throw new Error('ERROR');
            };

            expect(timerCallback).toBeTruthy();
            await timerCallback();

            expect(errorData).toEqual({
                message: 'ERROR',
                stack: expect.any(String),
            });
        });
    })
});