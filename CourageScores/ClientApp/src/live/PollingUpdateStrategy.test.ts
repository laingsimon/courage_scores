import { PollingUpdateStrategy } from './PollingUpdateStrategy';
import { IWebSocketContext } from './IWebSocketContext';
import { createTemporaryId } from '../helpers/projection';
import { IUpdateStrategy } from './IUpdateStrategy';
import { api, noop } from '../helpers/tests';
import { ILiveApi } from '../interfaces/apis/ILiveApi';
import { ISubscriptions } from './ISubscriptions';
import { ISubscriptionRequest } from './ISubscriptionRequest';
import { WebSocketMode } from './WebSocketMode';
import { IClientActionResultDto } from '../components/common/IClientActionResultDto';
import { LiveDataType } from '../interfaces/models/dtos/Live/LiveDataType';
import { UpdatedDataDto } from '../interfaces/models/dtos/Live/UpdatedDataDto';
import { IStrategyData } from './IStrategyData';
import { ISubscription } from './ISubscription';

describe('PollingUpdateStrategy', () => {
    let updateLookup: {
        [id: string]: () => IClientActionResultDto<UpdatedDataDto>;
    };
    let postedUpdates: { id: string; type: string; data: object }[];

    const liveApi = api<ILiveApi>({
        async getUpdate(
            id: string,
            _: string,
            __: string,
        ): Promise<IClientActionResultDto<UpdatedDataDto> | null> {
            return updateLookup[id]();
        },
        async postUpdate(
            id: string,
            type: string,
            data: object,
        ): Promise<void> {
            postedUpdates.push({ id, type, data });
        },
    });

    function createWebSocketContext(ph?: number, ...modes: WebSocketMode[]) {
        return {
            pollingHandle: ph,
            modes,
        };
    }

    beforeEach(() => {
        updateLookup = {};
        postedUpdates = [];
    });

    function props(
        c: IWebSocketContext,
        s?: ISubscriptions,
        customisations?: Partial<IStrategyData>,
    ): IStrategyData {
        return {
            context: c,
            subscriptions: s ?? {},
            setContext: noop,
            setSubscriptions: noop,
            ...customisations,
        };
    }

    describe('refresh', () => {
        it('should accept context and subscriptions', async () => {
            const strategy = new PollingUpdateStrategy(liveApi, 1, 2);
            const context = createWebSocketContext();

            strategy.refresh(props(context));
        });
    });

    describe('publish', () => {
        it('should publish update', async () => {
            const strategy: IUpdateStrategy = new PollingUpdateStrategy(
                liveApi,
                1,
                2,
            );
            const context: IWebSocketContext = createWebSocketContext();
            const id = createTemporaryId();

            const result = await strategy.publish(
                props(context),
                id,
                LiveDataType.sayg,
                'data',
            );

            expect(postedUpdates).toEqual([
                { id, type: LiveDataType.sayg, data: 'data' },
            ]);
            expect(result).toEqual(context);
        });
    });

    describe('unsubscribe', () => {
        const strategy: IUpdateStrategy = new PollingUpdateStrategy(
            liveApi,
            1,
            2,
        );

        it('should do nothing if subscriptions remain', async () => {
            const context: IWebSocketContext = createWebSocketContext(1);
            const subscriptions: ISubscriptions = {
                anotherId: {
                    id: 'anotherId',
                    type: LiveDataType.sayg,
                    errorHandler: noop,
                    updateHandler: noop,
                },
            };

            const result = await strategy.unsubscribe(
                props(context, subscriptions),
                createTemporaryId(),
            );

            expect(result).toEqual({
                pollingHandle: 1,
                modes: [],
            });
        });

        it('should do nothing if no subscriptions and no polling handle', async () => {
            const context: IWebSocketContext = createWebSocketContext();
            const subscriptions: ISubscriptions = {
                anotherId: {
                    id: 'anotherId',
                    type: LiveDataType.sayg,
                    errorHandler: noop,
                    updateHandler: noop,
                },
            };

            const result = await strategy.unsubscribe(
                props(context, subscriptions),
                createTemporaryId(),
            );

            expect(result).toEqual({
                modes: [],
            });
        });

        it('should clear timeout if no subscriptions and polling handle', async () => {
            let clearedTimeout: number;
            const context: IWebSocketContext = createWebSocketContext(1);
            window.clearTimeout = (id: number | any) => {
                clearedTimeout = id;
            };

            const result = await strategy.unsubscribe(
                props(context),
                createTemporaryId(),
            );

            expect(clearedTimeout!).toEqual(1);
            expect(result).toEqual({
                modes: [],
            });
        });
    });

    describe('subscribe', () => {
        const strategy = new PollingUpdateStrategy(liveApi, 1, 2);

        it('should return context if polling handle already defined', async () => {
            const context: IWebSocketContext = createWebSocketContext(1);
            const request: ISubscriptionRequest = {
                id: createTemporaryId(),
                type: LiveDataType.sayg,
            };

            const result = await strategy.subscribe(props(context), request);

            expect(result).toEqual({
                pollingHandle: 1,
                modes: [],
            });
        });

        it('should setup new timeout and return new context if polling handle not defined', async () => {
            const context: IWebSocketContext = createWebSocketContext();
            const request: ISubscriptionRequest = {
                id: createTemporaryId(),
                type: LiveDataType.sayg,
            };
            window.setTimeout = (() => {
                return 123;
            }) as any;

            const result = await strategy.subscribe(props(context), request);

            expect(result).toEqual({
                pollingHandle: 123,
                modes: [],
            });
        });
    });

    describe('polling interval', () => {
        const strategy = new PollingUpdateStrategy(liveApi, 1, 2);
        const context: IWebSocketContext = createWebSocketContext(
            0,
            WebSocketMode.polling,
        );

        let timerCallback: () => Promise<void>;
        let timerHandle: number;
        let newContext: IWebSocketContext | null;

        beforeEach(() => {
            timerHandle = 0;
            timerCallback = async () => {};
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

        function subscription(
            id: string,
            updateHandler?: (data: any) => void,
            errorHandler?: (data: any) => void,
            type: LiveDataType = LiveDataType.sayg,
            method: WebSocketMode = WebSocketMode.polling,
        ): ISubscription {
            return {
                type,
                method,
                id,
                updateHandler: updateHandler || noop,
                errorHandler: errorHandler || noop,
            };
        }

        it('should accept no refreshContext (refresh not called)', async () => {
            await strategy.subscribe(props(context));
            let log: string | undefined;
            console.log = (msg: string) => (log = msg);

            expect(timerCallback).toBeTruthy();
            await timerCallback();

            expect(log).toEqual(
                'No refresh context, unable to execute on polling iteration',
            );
        });

        it('should not re-create timeout if no subscriptions', async () => {
            const subscriptions: ISubscriptions = {};
            const p = props(context, subscriptions);
            strategy.refresh(p);
            await strategy.subscribe(p);
            expect(timerHandle).toEqual(1);

            expect(timerCallback).toBeTruthy();
            await timerCallback();

            expect(timerHandle).toEqual(1);
        });

        it('should not re-create timeout if all requests fail', async () => {
            const subscriptions: ISubscriptions = {
                '1234': subscription('1234'),
            };
            const p = props(context, subscriptions, { setContext });
            strategy.refresh(p);
            await strategy.subscribe(p);
            expect(timerHandle).toEqual(1);
            updateLookup['1234'] =
                (): IClientActionResultDto<UpdatedDataDto> => {
                    throw new Error('SOME ERROR 1234');
                };

            expect(timerCallback).toBeTruthy();
            await timerCallback();

            expect(timerHandle).toEqual(1);
            expect(newContext).toEqual({
                modes: [],
            });
        });

        it('should re-create timeout if some requests pass', async () => {
            const subscriptions: ISubscriptions = {
                '1234': subscription('1234'),
                '5678': subscription('5678'),
            };
            const p = props(context, subscriptions, { setContext });
            strategy.refresh(p);
            await strategy.subscribe(p);
            expect(timerHandle).toEqual(1);
            updateLookup['1234'] =
                (): IClientActionResultDto<UpdatedDataDto> => {
                    return {
                        success: false,
                    };
                };
            updateLookup['5678'] =
                (): IClientActionResultDto<UpdatedDataDto> => {
                    return {
                        success: true,
                        result: {
                            lastUpdate: '',
                        },
                    };
                };

            await timerCallback();

            expect(timerHandle).toEqual(2);
            expect(newContext).toEqual({
                modes: [WebSocketMode.polling],
                pollingHandle: 2,
            });

            await timerCallback();

            expect(timerHandle).toEqual(3);
            expect(newContext).toEqual({
                modes: [WebSocketMode.polling],
                pollingHandle: 3,
            });
        });

        it('should exclude polling strategy if all requests fail', async () => {
            const subscriptions: ISubscriptions = {
                '1234': subscription('1234'),
                '5678': subscription('5678'),
            };
            const p = props(context, subscriptions, { setContext });
            strategy.refresh(p);
            await strategy.subscribe(p);
            expect(timerHandle).toEqual(1);
            updateLookup['1234'] =
                (): IClientActionResultDto<UpdatedDataDto> => {
                    throw new Error('SOME ERROR 1234');
                };
            updateLookup['5678'] =
                (): IClientActionResultDto<UpdatedDataDto> => {
                    throw new Error('SOME ERROR 5678');
                };

            expect(timerCallback).toBeTruthy();
            await timerCallback();

            expect(newContext).toEqual({
                modes: [],
            });
        });

        it('should call updateHandler if request succeeds', async () => {
            let updatedData: any;
            const subscriptions: ISubscriptions = {
                '1234': subscription('1234', (data) => {
                    updatedData = data;
                }),
            };
            const data = {
                type: 'updated',
            };
            const p = props(context, subscriptions);
            strategy.refresh(p);
            await strategy.subscribe(p);
            expect(timerHandle).toEqual(1);
            updateLookup['1234'] =
                (): IClientActionResultDto<UpdatedDataDto> => {
                    return {
                        success: true,
                        result: {
                            data: data,
                            lastUpdate: 'LAST_UPDATE',
                        },
                    };
                };

            expect(timerCallback).toBeTruthy();
            await timerCallback();

            expect(updatedData).toEqual(data);
        });

        it('should not call updateHandler if result is null (no change)', async () => {
            let updatedData: any;
            const subscriptions: ISubscriptions = {
                '1234': subscription('1234', (data) => {
                    updatedData = data;
                }),
            };
            const p = props(context, subscriptions);
            strategy.refresh(p);
            await strategy.subscribe(p);
            expect(timerHandle).toEqual(1);
            updateLookup['1234'] =
                (): IClientActionResultDto<UpdatedDataDto> => {
                    return {
                        success: true,
                        result: {
                            lastUpdate: '2021-01-02',
                        },
                    };
                };

            expect(timerCallback).toBeTruthy();
            await timerCallback();

            expect(updatedData).toBeFalsy();
        });

        it('should unsubscribe if data is not live-tracked', async () => {
            let newSubscriptions: ISubscriptions;
            const subscriptions: ISubscriptions = {
                '1234': subscription('1234'),
            };
            const props: IStrategyData = {
                context,
                subscriptions,
                setContext,
                setSubscriptions: async (subs: ISubscriptions) =>
                    (newSubscriptions = subs),
            };
            strategy.refresh(props);
            await strategy.subscribe(props);
            expect(timerHandle).toEqual(1);
            updateLookup['1234'] =
                (): IClientActionResultDto<UpdatedDataDto> => {
                    return {
                        success: true,
                    };
                };

            expect(timerCallback).toBeTruthy();
            await timerCallback();

            expect(newSubscriptions!).toEqual({});
        });

        it('should call errorHandler if request fails', async () => {
            let errorData: any;
            const subscriptions: ISubscriptions = {
                '1234': subscription('1234', noop, (error) => {
                    errorData = error;
                }),
            };
            const p = props(context, subscriptions);
            strategy.refresh(p);
            await strategy.subscribe(p);
            expect(timerHandle).toEqual(1);
            updateLookup['1234'] =
                (): IClientActionResultDto<UpdatedDataDto> => {
                    return {
                        success: false,
                    };
                };

            expect(timerCallback).toBeTruthy();
            await timerCallback();

            expect(errorData).toEqual({
                message: 'Error polling for updates: 1234 (Sayg)',
            });
        });

        it('should unsubscribe if request fails', async () => {
            let newSubscriptions: ISubscriptions;
            const subscriptions: ISubscriptions = {
                '1234': subscription('1234'),
            };
            const props: IStrategyData = {
                context,
                subscriptions,
                setContext,
                setSubscriptions: async (subs: ISubscriptions) =>
                    (newSubscriptions = subs),
            };
            strategy.refresh(props);
            await strategy.subscribe(props);
            expect(timerHandle).toEqual(1);
            updateLookup['1234'] =
                (): IClientActionResultDto<UpdatedDataDto> => {
                    return {
                        success: false,
                    };
                };

            expect(timerCallback).toBeTruthy();
            await timerCallback();

            expect(newSubscriptions!).toEqual({});
        });

        it('should call errorHandler if exception thrown when sending request', async () => {
            let errorData: any;
            const subscriptions: ISubscriptions = {
                '1234': subscription('1234', noop, (error) => {
                    errorData = error;
                }),
            };
            const p = props(context, subscriptions);
            strategy.refresh(p);
            await strategy.subscribe(p);
            expect(timerHandle).toEqual(1);
            updateLookup['1234'] =
                (): IClientActionResultDto<UpdatedDataDto> => {
                    throw new Error('ERROR');
                };

            expect(timerCallback).toBeTruthy();
            await timerCallback();

            expect(errorData).toEqual({
                message: 'ERROR',
                stack: expect.any(String),
            });
        });
    });
});
