import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick, ErrorState,
    findButton,
    iocProps, MockSocketFactory, noop,
    renderApp, TestContext
} from "../../../helpers/tests";
import {act} from "@testing-library/react";
import React from "react";
import {
    ILoadedScoreAsYouGoDto,
    ISaygLoadingContainerProps,
    SaygLoadingContainer,
    useSayg
} from "./SaygLoadingContainer";
import {any} from "../../../helpers/collections";
import {ILegBuilder, ILegCompetitorScoreBuilder, legBuilder, saygBuilder} from "../../../helpers/builders/sayg";
import {useLive} from "../LiveContainer";
import {ISaygApi} from "../../../api/sayg";
import {IUpdateRecordedScoreAsYouGoDto} from "../../../interfaces/serverSide/Game/Sayg/IUpdateRecordedScoreAsYouGoDto";
import {IRecordedScoreAsYouGoDto} from "../../../interfaces/serverSide/Game/Sayg/IRecordedScoreAsYouGoDto";
import {IClientActionResultDto} from "../../../interfaces/IClientActionResultDto";
import {ISubscriptions} from "../../../interfaces/ISubscriptions";
import {ILiveOptions} from "../../../interfaces/ILiveOptions";
import {IUserDto} from "../../../interfaces/serverSide/Identity/IUserDto";
import {IAppContainerProps} from "../../../AppContainer";

describe('SaygLoadingContainer', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let changedScore: {homeScore: number, awayScore: number};
    let saved: ILoadedScoreAsYouGoDto;
    let loadError: string;
    let saygDataMap: { [id: string]: IRecordedScoreAsYouGoDto };
    let apiResponse: IClientActionResultDto<IRecordedScoreAsYouGoDto>;
    let upsertedData: IUpdateRecordedScoreAsYouGoDto;
    let socketFactory: MockSocketFactory;

    const saygApi = api<ISaygApi>({
        get: async (id: string) => {
            if (!any(Object.keys(saygDataMap), key => key === id)) {
                throw new Error('Unexpected request for sayg data');
            }

            return saygDataMap[id];
        },
        upsert: async (data: IUpdateRecordedScoreAsYouGoDto) => {
            upsertedData = data;
            return apiResponse || {
                success: true,
                result: Object.assign({id: 'NEW_ID'}, data),
            };
        },
    });

    beforeEach(() => {
        saygDataMap = {};
        apiResponse = null;
        upsertedData = null;
        socketFactory = new MockSocketFactory();
        reportedError = new ErrorState();
        changedScore = null;
        saved = null;
        loadError = null;
    })

    afterEach(() => {
        cleanUp(context);
    });

    async function on180(_: string) {
    }

    async function onHiCheck(_: string, __: number) {
    }

    async function onScoreChange(homeScore: number, awayScore: number) {
        changedScore = {homeScore, awayScore};
    }

    async function onSaved(data: ILoadedScoreAsYouGoDto) {
        saved = data;
    }

    async function onLoadError(error: string) {
        loadError = error;
    }

    async function renderComponent(props: ISaygLoadingContainerProps, appContainerProps?: IAppContainerProps) {
        context = await renderApp(
            iocProps({saygApi, socketFactory: socketFactory.createSocket}),
            brandingProps(),
            appContainerProps || appProps({}, reportedError),
            <SaygLoadingContainer {...props} />);
    }

    describe('loading and saving', () => {
        it('gets sayg data for given id', async () => {
            const saygData = saygBuilder()
                .withLeg(0, (l: ILegBuilder) => l
                    .startingScore(501)
                    .home((c: ILegCompetitorScoreBuilder) => c)
                    .away((c: ILegCompetitorScoreBuilder) => c))
                .addTo(saygDataMap)
                .build();
            let containerProps: IExtractedProps;
            await renderComponent({
                children: (<TestComponent onLoaded={(data: IExtractedProps) => containerProps = data}/>),
                id: saygData.id,
                defaultData: null,
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            });

            expect(reportedError.hasError()).toEqual(false);
            expect(containerProps).toEqual({
                subscriptions: {},
                enableLiveUpdates: expect.any(Function),
                sayg: saygDataMap[saygData.id],
                saveDataAndGetId: expect.any(Function),
                setSayg: expect.any(Function),
                liveOptions: expect.any(Object),
            });
        });

        it('uses default data if given no id', async () => {
            let containerProps: IExtractedProps;
            await renderComponent({
                children: (<TestComponent onLoaded={(data: IExtractedProps) => containerProps = data}/>),
                id: null,
                defaultData: {
                    legs: {
                        '0': legBuilder()
                            .home((c: ILegCompetitorScoreBuilder) => c.score(0).noOfDarts(0))
                            .away((c: ILegCompetitorScoreBuilder) => c.noOfDarts(0))
                            .startingScore(501)
                            .build(),
                    },
                    yourName: 'HOME',
                },
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            });

            expect(reportedError.hasError()).toEqual(false);
            expect(containerProps).toEqual({
                subscriptions: {},
                liveOptions: expect.any(Object),
                enableLiveUpdates: expect.any(Function),
                sayg: {
                    legs: {
                        '0': legBuilder()
                            .home((c: ILegCompetitorScoreBuilder) => c.score(0).noOfDarts(0))
                            .away((c: ILegCompetitorScoreBuilder) => c.noOfDarts(0))
                            .startingScore(501)
                            .build()
                    },
                    yourName: 'HOME',
                },
                saveDataAndGetId: expect.any(Function),
                setSayg: expect.any(Function),
            });
        });

        it('reports load error if no sayg data returned', async () => {
            const id = 'NO_DATA_ID';
            saygDataMap[id] = null;
            await renderComponent({
                children: (<TestComponent onLoaded={noop}/>),
                id: id,
                defaultData: null,
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            });

            expect(reportedError.hasError()).toEqual(false);
            expect(loadError).toEqual('Data not found');
        });

        it('reports load error if no legs in returned sayg data', async () => {
            const id = 'NO_LEGS_ID';
            saygDataMap[id] = {} as any;
            await renderComponent({
                children: (<TestComponent onLoaded={noop} />),
                id: id,
                defaultData: null,
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            });

            expect(reportedError.hasError()).toEqual(false);
            expect(loadError).toEqual('Data not found');
        });

        it('sets lastUpdated in sayg data', async () => {
            const saygData = saygBuilder()
                .withLeg(0, (l: ILegBuilder) => l
                    .startingScore(501)
                    .home((c: ILegCompetitorScoreBuilder) => c)
                    .away((c: ILegCompetitorScoreBuilder) => c))
                .updated('2023-07-21')
                .addTo(saygDataMap)
                .build();
            let sayg: ILoadedScoreAsYouGoDto;
            await renderComponent({
                children: (<TestComponent onLoaded={(data: IExtractedProps) => sayg = data.sayg }/>),
                id: saygData.id,
                defaultData: null,
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            });

            expect(reportedError.hasError()).toEqual(false);
            expect(sayg.lastUpdated).toEqual('2023-07-21');
        });

        it('should be able to update sayg data', async () => {
            let containerProps: IExtractedProps;
            await renderComponent({
                children: (<TestComponent onLoaded={(data: IExtractedProps) => containerProps = data }/>),
                id: null,
                defaultData: {
                    isDefault: true,
                    yourName: 'HOME',
                    legs: {
                        '0': legBuilder()
                            .startingScore(501)
                            .home((c: ILegCompetitorScoreBuilder) => c.score(0))
                            .away((c: ILegCompetitorScoreBuilder) => c.score(0))
                            .build()
                    },
                } as any,
                autoSave: false,
                liveOptions: { },
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
            });
            expect((containerProps.sayg as any).isDefault).toEqual(true);

            await act(async () => {
                await containerProps.setSayg({
                    yourName: 'HOME',
                    legs: {
                        '0': legBuilder()
                            .startingScore(501)
                            .home((c: ILegCompetitorScoreBuilder) => c.score(1))
                            .away((c: ILegCompetitorScoreBuilder) => c.score(1))
                            .build()
                    },
                    lastUpdated: '2023-07-21',
                });
            });

            expect(reportedError.hasError()).toEqual(false);
            expect(containerProps.sayg.lastUpdated).toEqual('2023-07-21');
        });

        it('should be able to save data and get id', async () => {
            let containerProps: IExtractedProps;
            await renderComponent({
                children: (<TestComponent onLoaded={(data: IExtractedProps) => containerProps = data}/>),
                id: null,
                defaultData: {
                    yourName: 'HOME',
                    legs: {
                        '0': legBuilder()
                            .startingScore(501)
                            .home((c: ILegCompetitorScoreBuilder) => c)
                            .away((c: ILegCompetitorScoreBuilder) => c)
                            .build()
                    },
                },
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            });
            let result: string;

            await act(async () => {
                result = await containerProps.saveDataAndGetId();
            });

            expect(saved).not.toBeNull();
            expect(result).toEqual('#' + saved.id);
            expect(containerProps.sayg).toEqual(saved);
        });

        it('should handle error during upsert', async () => {
            let containerProps: IExtractedProps;
            await renderComponent({
                children: (<TestComponent onLoaded={(data: IExtractedProps) => containerProps = data}/>),
                id: null,
                defaultData: {
                    yourName: 'HOME',
                    legs: {
                        '0': legBuilder()
                            .startingScore(501)
                            .home((c: ILegCompetitorScoreBuilder) => c)
                            .away((c: ILegCompetitorScoreBuilder) => c)
                            .build()
                    },
                },
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            });
            apiResponse = {success: false, errors: ['SOME ERROR']};
            let result: string;

            await act(async () => {
                result = await containerProps.saveDataAndGetId();
            });

            expect(saved).toBeNull();
            expect(result).toBeNull();
            expect(containerProps.sayg.id).toBeUndefined();
            expect(context.container.textContent).toContain('Could not save data');
            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('should be able to close error details after upsert failure', async () => {
            let containerProps: IExtractedProps;
            await renderComponent({
                children: (<TestComponent onLoaded={(data: IExtractedProps) => containerProps = data}/>),
                id: null,
                defaultData: {
                    yourName: 'HOME',
                    legs: {
                        '0': legBuilder()
                            .startingScore(501)
                            .home((c: ILegCompetitorScoreBuilder) => c)
                            .away((c: ILegCompetitorScoreBuilder) => c)
                            .build()
                    },
                },
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            });
            apiResponse = {success: false, errors: ['SOME ERROR']};
            await act(async () => {
                await containerProps.saveDataAndGetId();
            });
            expect(context.container.textContent).toContain('Could not save data');

            await doClick(findButton(context.container, 'Close'));

            expect(context.container.textContent).not.toContain('Could not save data');
        });

        it('should handle exception during upsert', async () => {
            let containerProps: IExtractedProps;
            await renderComponent({
                children: (<TestComponent onLoaded={(data: IExtractedProps) => containerProps = data}/>),
                id: null,
                defaultData: {
                    yourName: 'HOME',
                    legs: {
                        '0': legBuilder()
                            .startingScore(501)
                            .home((c: ILegCompetitorScoreBuilder) => c)
                            .away((c: ILegCompetitorScoreBuilder) => c)
                            .build()
                    },
                },
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            });
            apiResponse = {success: true, result: 'SOMETHING THAT WILL TRIGGER AN EXCEPTION'} as any;
            let result: string;

            await act(async () => {
                result = await containerProps.saveDataAndGetId();
            });

            expect(saved).toBeNull();
            expect(result).toBeNull();
            expect(containerProps.sayg.id).toBeUndefined();
            expect(reportedError.hasError()).toEqual(true);
        });

        it('should save data when score changes and auto save enabled', async () => {
            await renderComponent({
                id: null,
                defaultData: {
                    homeScore: 0,
                    awayScore: 0,
                    startingScore: 501,
                    numberOfLegs: 3,
                    yourName: 'HOME',
                    legs: {
                        '0': legBuilder()
                            .startingScore(501)
                            .currentThrow('home')
                            .playerSequence('home', 'away')
                            .home((c: ILegCompetitorScoreBuilder) => c.score(451))
                            .away((c: ILegCompetitorScoreBuilder) => c.score(200).withThrow(0))
                            .build()
                    },
                },
                autoSave: true,
                liveOptions: { },
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
            });

            await doChange(context.container, 'input[data-score-input="true"]', '50', context.user);
            await doClick(findButton(context.container, '📌📌'));

            expect(upsertedData).not.toBeNull();
            expect(saved).not.toBeNull();
            expect(changedScore).toEqual({homeScore: 1, awayScore: 0});
        });

        it('should save data when player sequence changes and auto save enabled', async () => {
            await renderComponent({
                id: null,
                defaultData: {
                    homeScore: 0,
                    awayScore: 0,
                    startingScore: 501,
                    numberOfLegs: 3,
                    yourName: 'HOME',
                    opponentName: 'AWAY',
                    legs: {
                        '0': legBuilder()
                            .startingScore(501)
                            .home((c: ILegCompetitorScoreBuilder) => c.score(0))
                            .away((c: ILegCompetitorScoreBuilder) => c.score(0))
                            .build()
                    },
                },
                autoSave: true,
                liveOptions: { },
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
            });

            await doClick(findButton(context.container, '🎯HOME'));

            expect(upsertedData).not.toBeNull();
            expect(saved).not.toBeNull();
        });

        it('should not save data when score changes and auto save disabled', async () => {
            await renderComponent({
                id: null,
                defaultData: {
                    homeScore: 0,
                    awayScore: 0,
                    startingScore: 501,
                    numberOfLegs: 3,
                    yourName: 'HOME',
                    legs: {
                        '0': legBuilder()
                            .startingScore(501)
                            .playerSequence('home', 'away')
                            .currentThrow('home')
                            .home((c: ILegCompetitorScoreBuilder) => c.score(451))
                            .away((c: ILegCompetitorScoreBuilder) => c.score(200).withThrow(0))
                            .build()
                    },
                },
                autoSave: false,
                liveOptions: { },
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
            });

            await doChange(context.container, 'input[data-score-input="true"]', '50', context.user);
            await doClick(findButton(context.container, '📌📌'));

            expect(upsertedData).toBeNull();
            expect(saved).toBeNull();
            expect(changedScore).toEqual({homeScore: 1, awayScore: 0});
        });
    });

    describe('live updates', () => {
        it('given sayg, when enabling, creates a socket', async () => {
            let enableLiveUpdates: (enabled: boolean, id: string) => Promise<any>;
            const saygData: IRecordedScoreAsYouGoDto = saygBuilder()
                .withLeg(0, (l: ILegBuilder) => l
                    .startingScore(501)
                    .home((c: ILegCompetitorScoreBuilder) => c)
                    .away((c: ILegCompetitorScoreBuilder) => c))
                .addTo(saygDataMap)
                .build();
            const account: IUserDto = {
                emailAddress: '',
                name: '',
                givenName: '',
                access: { useWebSockets: true },
            };
            await renderComponent({
                children: (<TestComponent onLoaded={(data: IExtractedProps) => {
                    enableLiveUpdates = data.enableLiveUpdates;
                }} />),
                id: saygData.id,
                defaultData: null,
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            }, appProps({ account }, reportedError));

            await act(async () => {
                await enableLiveUpdates(true, saygData.id);
            });

            expect(socketFactory.socketWasCreated()).toEqual(true);
            expect(Object.keys(socketFactory.subscriptions)).toEqual([saygData.id]);
        });

        it('given error live message type, shows error', async () => {
            let enableLiveUpdates: (enabled: boolean, id: string) => Promise<any>;
            const saygData: IRecordedScoreAsYouGoDto = saygBuilder()
                .withLeg(0, (l: ILegBuilder) => l
                    .startingScore(501)
                    .home((c: ILegCompetitorScoreBuilder) => c)
                    .away((c: ILegCompetitorScoreBuilder) => c))
                .addTo(saygDataMap)
                .build();
            const account: IUserDto = {
                givenName: '',
                name: '',
                emailAddress: '',
                access: { useWebSockets: true },
            };
            await renderComponent({
                children: (<TestComponent onLoaded={(data: IExtractedProps) => {
                    enableLiveUpdates = data.enableLiveUpdates;
                }} />),
                id: saygData.id,
                defaultData: null,
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            }, appProps({ account }, reportedError));

            await act(async () => {
                await enableLiveUpdates(true, saygData.id);
            });
            await act(async () => {
                console.error = () => {};

                expect(socketFactory.socketWasCreated()).toEqual(true);
                socketFactory.socket.onmessage({
                    type: 'message',
                    data: JSON.stringify({
                        type: 'Error',
                        message: 'Some error message'
                    })
                } as any);
            });

            expect(reportedError.error).toEqual('Some error message');
        });

        it('given update live message type, updates sayg data', async () => {
            let enableLiveUpdates: (enabled: boolean, id: string) => Promise<any>;
            let renderedData: IRecordedScoreAsYouGoDto;
            const saygData: IRecordedScoreAsYouGoDto = saygBuilder()
                .withLeg(0, (l: ILegBuilder) => l
                    .startingScore(501)
                    .home((c: ILegCompetitorScoreBuilder) => c)
                    .away((c: ILegCompetitorScoreBuilder) => c))
                .addTo(saygDataMap)
                .build();
            const newSaygData = saygBuilder(saygData.id)
                .withLeg(0, (l: ILegBuilder) => l
                    .startingScore(601)
                    .home((c: ILegCompetitorScoreBuilder) => c)
                    .away((c: ILegCompetitorScoreBuilder) => c))
                .build();
            const account: IUserDto = {
                emailAddress: '',
                name: '',
                givenName: '',
                access: { useWebSockets: true },
            };
            await renderComponent({
                children: (<TestComponent onLoaded={(data: IExtractedProps) => {
                    enableLiveUpdates = data.enableLiveUpdates;
                    renderedData = data.sayg;
                }} />),
                id: saygData.id,
                defaultData: null,
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            }, appProps({ account }, reportedError));
            expect(renderedData).toEqual(saygData);

            await act(async () => {
                await enableLiveUpdates(true, saygData.id);
            });
            await act(async () => {
                expect(socketFactory.socketWasCreated()).toEqual(true);
                socketFactory.socket.onmessage({
                    type: 'message',
                    data: JSON.stringify({
                        type: 'Update',
                        data: newSaygData,
                        id: newSaygData.id,
                    })
                } as any);
            });

            expect(reportedError.hasError()).toEqual(false);
            expect(renderedData).toEqual(newSaygData);
        });

        it('given no socket, when disabling, does nothing', async () => {
            let enableLiveUpdates: (enabled: boolean, id: string) => Promise<any>;
            const saygData: IRecordedScoreAsYouGoDto = saygBuilder()
                .withLeg(0, (l: ILegBuilder) => l
                    .startingScore(501)
                    .home((c: ILegCompetitorScoreBuilder) => c)
                    .away((c: ILegCompetitorScoreBuilder) => c))
                .addTo(saygDataMap)
                .build();
            await renderComponent({
                children: (<TestComponent onLoaded={(data: IExtractedProps) => {
                    enableLiveUpdates = data.enableLiveUpdates;
                }} />),
                id: saygData.id,
                defaultData: null,
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            });

            await act(async () => {
                await enableLiveUpdates(false, saygData.id);
            });

            expect(socketFactory.socketWasCreated()).toEqual(false);
        });

        it('given an open socket, when disabling, closes socket', async () => {
            let enableLiveUpdates: (enabled: boolean, id: string) => Promise<any>;
            const saygData: IRecordedScoreAsYouGoDto = saygBuilder()
                .withLeg(0, (l: ILegBuilder) => l
                    .startingScore(501)
                    .home((c: ILegCompetitorScoreBuilder) => c)
                    .away((c: ILegCompetitorScoreBuilder) => c))
                .addTo(saygDataMap)
                .build();
            const account: IUserDto = {
                emailAddress: '',
                name: '',
                givenName: '',
                access: { useWebSockets: true },
            };
            await renderComponent({
                children: (<TestComponent onLoaded={(data: IExtractedProps) => {
                    enableLiveUpdates = data.enableLiveUpdates;
                }} />),
                id: saygData.id,
                defaultData: null,
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            }, appProps({ account }, reportedError));
            await act(async () => {
                await enableLiveUpdates(true, saygData.id);
            });

            await act(async () => {
                // now close the socket
                await enableLiveUpdates(false, saygData.id);
            });

            expect(socketFactory.socketWasCreated()).toEqual(true);
            expect(socketFactory.subscriptions).toEqual({});
        });
    });

    interface IExtractedProps {
        sayg: ILoadedScoreAsYouGoDto,
        setSayg: (newData: ILoadedScoreAsYouGoDto) => Promise<ILoadedScoreAsYouGoDto>,
        saveDataAndGetId: (useData?: ILoadedScoreAsYouGoDto) => Promise<string>,
        enableLiveUpdates: (enabled: boolean, id: string) => Promise<any>,
        subscriptions: ISubscriptions,
        liveOptions: ILiveOptions
    }

    interface ITestComponentProps {
        onLoaded: (props: IExtractedProps) => void;
    }

    function TestComponent({onLoaded}: ITestComponentProps) {
        const {sayg, setSayg, saveDataAndGetId} = useSayg();
        const {subscriptions, enableLiveUpdates, liveOptions} = useLive();

        onLoaded({sayg, setSayg, saveDataAndGetId, enableLiveUpdates, subscriptions, liveOptions});

        return (<div>Loaded</div>)
    }
});