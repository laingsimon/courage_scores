import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    ErrorState,
    findButton,
    iocProps,
    MockSocketFactory,
    noop,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {act} from "@testing-library/react";
import {
    ILoadedScoreAsYouGoDto,
    ISaygLoadingContainerProps,
    SaygLoadingContainer,
    useSayg
} from "./SaygLoadingContainer";
import {any} from "../../helpers/collections";
import {ILegBuilder, ILegCompetitorScoreBuilder, legBuilder, saygBuilder} from "../../helpers/builders/sayg";
import {useLive} from "../../live/LiveContainer";
import {UpdateRecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto";
import {RecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {ISubscriptions} from "../../live/ISubscriptions";
import {ILiveOptions} from "../../live/ILiveOptions";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {IAppContainerProps} from "../common/AppContainer";
import {ISaygApi} from "../../interfaces/apis/ISaygApi";
import {ISubscriptionRequest} from "../../live/ISubscriptionRequest";
import {LiveDataType} from "../../interfaces/models/dtos/Live/LiveDataType";
import {MessageType} from "../../interfaces/models/dtos/MessageType";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

describe('SaygLoadingContainer', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let saved: ILoadedScoreAsYouGoDto | null;
    let loadError: string | null;
    let saygDataMap: { [id: string]: RecordedScoreAsYouGoDto };
    let apiResponse: IClientActionResultDto<RecordedScoreAsYouGoDto> | null;
    let socketFactory: MockSocketFactory;

    const saygApi = api<ISaygApi>({
        get: async (id: string): Promise<RecordedScoreAsYouGoDto | null> => {
            if (!any(Object.keys(saygDataMap), key => key === id)) {
                throw new Error('Unexpected request for sayg data');
            }

            return saygDataMap[id];
        },
        upsert: async (data: UpdateRecordedScoreAsYouGoDto): Promise<IClientActionResultDto<RecordedScoreAsYouGoDto>> => {
            return apiResponse || {
                success: true,
                result: Object.assign({id: 'NEW_ID', yourName: ''}, data),
            };
        },
    });

    beforeEach(() => {
        saygDataMap = {};
        apiResponse = null;
        socketFactory = new MockSocketFactory();
        reportedError = new ErrorState();
        saved = null;
        loadError = null;
    })

    afterEach(async () => {
        await cleanUp(context);
    });

    async function on180(_: string) {
    }

    async function onHiCheck(_: string, __: number) {
    }

    async function onScoreChange(_: number, __: number) {
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
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            });

            reportedError.verifyNoError();
            expect(containerProps!).toEqual({
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
                id: '',
                defaultData: saygBuilder()
                    .noId()
                    .yourName('HOME')
                    .withLeg(0, (l: ILegBuilder) => l
                        .home((c: ILegCompetitorScoreBuilder) => c)
                        .away((c: ILegCompetitorScoreBuilder) => c)
                        .startingScore(501))
                    .build(),
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            });

            reportedError.verifyNoError();
            expect(containerProps!).toEqual({
                subscriptions: {},
                liveOptions: expect.any(Object),
                enableLiveUpdates: expect.any(Function),
                sayg: {
                    legs: {
                        0: legBuilder()
                            .home((c: ILegCompetitorScoreBuilder) => c)
                            .away((c: ILegCompetitorScoreBuilder) => c)
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
            saygDataMap[id] = null!;
            await renderComponent({
                children: (<TestComponent onLoaded={noop}/>),
                id: id,
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            });

            reportedError.verifyNoError();
            expect(loadError).toEqual('Data not found');
        });

        it('reports load error if no legs in returned sayg data', async () => {
            const id = 'NO_LEGS_ID';
            saygDataMap[id] = {
                id,
                yourName: '',
                legs: null!,
            };
            await renderComponent({
                children: (<TestComponent onLoaded={noop} />),
                id: id,
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            });

            reportedError.verifyNoError();
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
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            });

            reportedError.verifyNoError();
            expect(sayg!.lastUpdated).toEqual('2023-07-21');
        });

        it('should be able to update sayg data', async () => {
            let containerProps: IExtractedProps;
            await renderComponent({
                children: (<TestComponent onLoaded={(data: IExtractedProps) => containerProps = data }/>),
                id: '',
                defaultData: saygBuilder()
                    .yourName('DEFAULT')
                    .withLeg(0, (l: ILegBuilder) => l
                        .home((c: ILegCompetitorScoreBuilder) => c)
                        .away((c: ILegCompetitorScoreBuilder) => c)
                        .startingScore(501))
                    .build(),
                autoSave: false,
                liveOptions: { },
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
            });
            expect(containerProps!.sayg.yourName).toEqual('DEFAULT');

            await act(async () => {
                await containerProps.setSayg(saygBuilder()
                    .yourName('HOME')
                    .withLeg(0, (l: ILegBuilder) => l
                        .home((c: ILegCompetitorScoreBuilder) => c.withThrow(1, 0))
                        .away((c: ILegCompetitorScoreBuilder) => c.withThrow(0, 1))
                        .startingScore(501))
                    .lastUpdated('2023-07-21')
                    .build());
            });

            reportedError.verifyNoError();
            expect(containerProps!.sayg.lastUpdated).toEqual('2023-07-21');
        });

        it('should be able to save data and get id', async () => {
            let containerProps: IExtractedProps;
            await renderComponent({
                children: (<TestComponent onLoaded={(data: IExtractedProps) => containerProps = data}/>),
                id: '',
                defaultData: saygBuilder()
                    .yourName('HOME')
                    .withLeg(0, (l: ILegBuilder) => l
                        .home((c: ILegCompetitorScoreBuilder) => c)
                        .away((c: ILegCompetitorScoreBuilder) => c)
                        .startingScore(501))
                    .build(),
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            });
            let result: string | undefined;

            await act(async () => {
                result = await containerProps.saveDataAndGetId();
            });

            expect(saved).not.toBeNull();
            expect(result!).toEqual('#' + saved!.id);
            expect(containerProps!.sayg).toEqual(saved);
        });

        it('should handle error during upsert', async () => {
            let containerProps: IExtractedProps;
            await renderComponent({
                children: (<TestComponent onLoaded={(data: IExtractedProps) => containerProps = data}/>),
                id: '',
                defaultData: saygBuilder()
                    .noId()
                    .yourName('HOME')
                    .withLeg(0, (l: ILegBuilder) => l
                        .home((c: ILegCompetitorScoreBuilder) => c)
                        .away((c: ILegCompetitorScoreBuilder) => c)
                        .startingScore(501))
                    .build(),
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            });
            apiResponse = {success: false, errors: ['SOME ERROR']};
            let result: string | undefined;

            await act(async () => {
                result = await containerProps.saveDataAndGetId();
            });

            expect(saved).toBeNull();
            expect(result).toBeUndefined();
            expect(containerProps!.sayg.id).toBeUndefined();
            expect(context.container.textContent).toContain('Could not save data');
            expect(context.container.textContent).toContain('SOME ERROR');
        });

        it('should be able to close error details after upsert failure', async () => {
            let containerProps: IExtractedProps;
            await renderComponent({
                children: (<TestComponent onLoaded={(data: IExtractedProps) => containerProps = data}/>),
                id: '',
                defaultData: saygBuilder()
                    .yourName('HOME')
                    .withLeg(0, (l: ILegBuilder) => l
                        .home((c: ILegCompetitorScoreBuilder) => c)
                        .away((c: ILegCompetitorScoreBuilder) => c)
                        .startingScore(501))
                    .build(),
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
                id: '',
                defaultData: saygBuilder()
                    .noId()
                    .yourName('HOME')
                    .withLeg(0, (l: ILegBuilder) => l
                        .home((c: ILegCompetitorScoreBuilder) => c)
                        .away((c: ILegCompetitorScoreBuilder) => c)
                        .startingScore(501))
                    .build(),
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            });
            apiResponse = {
                success: true,
                result: ('SOMETHING THAT WILL TRIGGER AN EXCEPTION' as unknown) as RecordedScoreAsYouGoDto,
            } as IClientActionResultDto<RecordedScoreAsYouGoDto>;
            let result: string | undefined;

            await act(async () => {
                result = await containerProps.saveDataAndGetId();
            });

            expect(saved).toBeNull();
            expect(result).toBeUndefined();
            expect(containerProps!.sayg.id).toBeUndefined();
            reportedError.verifyErrorEquals({
                message: 'Cannot create property \'lastUpdated\' on string \'SOMETHING THAT WILL TRIGGER AN EXCEPTION\'',
                stack: expect.any(String),
            });
        });
    });

    describe('live updates', () => {
        it('given sayg, when enabling, creates a socket', async () => {
            let enableLiveUpdates: (enabled: boolean, request: ISubscriptionRequest) => UntypedPromise;
            const saygData: RecordedScoreAsYouGoDto = saygBuilder()
                .withLeg(0, (l: ILegBuilder) => l
                    .startingScore(501)
                    .home((c: ILegCompetitorScoreBuilder) => c)
                    .away((c: ILegCompetitorScoreBuilder) => c))
                .addTo(saygDataMap)
                .build();
            const account: UserDto = {
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
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            }, appProps({ account }, reportedError));

            await act(async () => {
                await enableLiveUpdates(true, { id: saygData.id, type: LiveDataType.sayg });
            });

            expect(socketFactory.socketWasCreated()).toEqual(true);
            expect(Object.keys(socketFactory.subscriptions)).toEqual([saygData.id]);
        });

        it('given error live message type, shows error', async () => {
            let enableLiveUpdates: (enabled: boolean, request: ISubscriptionRequest) => UntypedPromise;
            const saygData: RecordedScoreAsYouGoDto = saygBuilder()
                .withLeg(0, (l: ILegBuilder) => l
                    .startingScore(501)
                    .home((c: ILegCompetitorScoreBuilder) => c)
                    .away((c: ILegCompetitorScoreBuilder) => c))
                .addTo(saygDataMap)
                .build();
            const account: UserDto = {
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
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            }, appProps({ account }, reportedError));

            await act(async () => {
                await enableLiveUpdates(true, { id: saygData.id, type: LiveDataType.sayg });
            });
            await act(async () => {
                console.error = () => {};

                expect(socketFactory.socketWasCreated()).toEqual(true);
                socketFactory.socket!.onmessage!({
                    type: 'message',
                    data: JSON.stringify({
                        type: 'Error',
                        message: 'Some error message'
                    })
                } as MessageEvent<string>);
            });

            expect(reportedError.error).toEqual('Some error message');
        });

        it('given update live message type, updates sayg data', async () => {
            let enableLiveUpdates: (enabled: boolean, request: ISubscriptionRequest) => UntypedPromise;
            let renderedData: UpdateRecordedScoreAsYouGoDto;
            const saygData: RecordedScoreAsYouGoDto = saygBuilder()
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
            const account: UserDto = {
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
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            }, appProps({ account }, reportedError));
            expect(renderedData!).toEqual(saygData);

            await act(async () => {
                await enableLiveUpdates(true, { id: saygData.id, type: LiveDataType.sayg });
            });
            await act(async () => {
                expect(socketFactory.socketWasCreated()).toEqual(true);
                socketFactory.socket!.onmessage!({
                    type: 'message',
                    data: JSON.stringify({
                        type: MessageType.update,
                        data: newSaygData,
                        id: newSaygData.id,
                    })
                } as MessageEvent<string>);
            });

            reportedError.verifyNoError();
            expect(renderedData!).toEqual(newSaygData);
        });

        it('given no socket, when disabling, does nothing', async () => {
            let enableLiveUpdates: (enabled: boolean, request: ISubscriptionRequest) => UntypedPromise;
            const saygData: RecordedScoreAsYouGoDto = saygBuilder()
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
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            });

            await act(async () => {
                await enableLiveUpdates(false, { id: saygData.id, type: LiveDataType.sayg });
            });

            expect(socketFactory.socketWasCreated()).toEqual(false);
        });

        it('given an open socket, when disabling, closes socket', async () => {
            let enableLiveUpdates: (enabled: boolean, request: ISubscriptionRequest) => UntypedPromise;
            const saygData: RecordedScoreAsYouGoDto = saygBuilder()
                .withLeg(0, (l: ILegBuilder) => l
                    .startingScore(501)
                    .home((c: ILegCompetitorScoreBuilder) => c)
                    .away((c: ILegCompetitorScoreBuilder) => c))
                .addTo(saygDataMap)
                .build();
            const account: UserDto = {
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
                autoSave: false,
                on180,
                onHiCheck,
                onScoreChange,
                onLoadError,
                onSaved,
                liveOptions: {},
            }, appProps({ account }, reportedError));
            await act(async () => {
                await enableLiveUpdates(true, { id: saygData.id, type: LiveDataType.sayg });
            });

            await act(async () => {
                // now close the socket
                await enableLiveUpdates(false, { id: saygData.id, type: LiveDataType.sayg });
            });

            expect(socketFactory.socketWasCreated()).toEqual(true);
            expect(socketFactory.subscriptions).toEqual({});
        });
    });

    interface IExtractedProps {
        sayg: ILoadedScoreAsYouGoDto,
        setSayg(newData: ILoadedScoreAsYouGoDto): Promise<ILoadedScoreAsYouGoDto>,
        saveDataAndGetId(useData?: ILoadedScoreAsYouGoDto): Promise<string | undefined>,
        enableLiveUpdates(enabled: boolean, request: ISubscriptionRequest): UntypedPromise,
        subscriptions: ISubscriptions,
        liveOptions: ILiveOptions
    }

    interface ITestComponentProps {
        onLoaded(props: IExtractedProps): void;
    }

    function TestComponent({onLoaded}: ITestComponentProps) {
        const {sayg, setSayg, saveDataAndGetId} = useSayg();
        const {subscriptions, enableLiveUpdates, liveOptions} = useLive();

        onLoaded({sayg, setSayg, saveDataAndGetId, enableLiveUpdates, subscriptions, liveOptions});

        return (<div>Loaded</div>)
    }
});