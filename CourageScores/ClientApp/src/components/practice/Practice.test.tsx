import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick, ErrorState,
    findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {Practice} from "./Practice";
import {createTemporaryId} from "../../helpers/projection";
import {RecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto";
import {UpdateRecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {ILegBuilder, ILegCompetitorScoreBuilder, saygBuilder} from "../../helpers/builders/sayg";
import {ISaygApi} from "../../interfaces/apis/ISaygApi";
import {CHECKOUT_3_DART, ENTER_SCORE_BUTTON} from "../../helpers/constants";
import {checkoutWith, keyPad} from "../../helpers/sayg";

const mockedUsedNavigate = jest.fn();

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: () => mockedUsedNavigate,
}));

describe('Practice', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let saygData: { [key: string]: RecordedScoreAsYouGoDto };
    let shareData: ShareData | null;
    let apiResultFunc: ((data: UpdateRecordedScoreAsYouGoDto) => IClientActionResultDto<RecordedScoreAsYouGoDto>);
    let fullScreenState: { isFullScreen: boolean, canGoFullScreen: boolean };

    const saygApi = api<ISaygApi>({
        get: async (id: string): Promise<RecordedScoreAsYouGoDto | null> => {
            return saygData[id];
        },
        upsert: async (data: UpdateRecordedScoreAsYouGoDto): Promise<IClientActionResultDto<RecordedScoreAsYouGoDto>> => {
            if (!data.id) {
                data.id = createTemporaryId();
            }
            saygData[data.id] = data as RecordedScoreAsYouGoDto;
            return apiResultFunc(data);
        },
        delete: async (id: string): Promise<IClientActionResultDto<RecordedScoreAsYouGoDto>> => {
            delete saygData[id];
            return {
                success: true,
            };
        },
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        saygData = {};
        reportedError = new ErrorState();
        apiResultFunc = (data: UpdateRecordedScoreAsYouGoDto) => {
            return {
                result: data,
                success: true,
            } as IClientActionResultDto<RecordedScoreAsYouGoDto>
        };
        shareData = null;
        // noinspection JSValidateTypes
        (navigator as any).share = (data: ShareData) => shareData = data;

        fullScreenState = {
            isFullScreen: false,
            canGoFullScreen: true,
        };
    });

    async function renderComponent(account?: UserDto, hash?: string, appLoading?: boolean) {
        const fullScreen = {
            isFullScreen: fullScreenState.isFullScreen,
            canGoFullScreen: fullScreenState.canGoFullScreen,
            enterFullScreen: async () => {
                fullScreenState.isFullScreen = true;
            },
            toggleFullScreen: async () => {
                fullScreenState.isFullScreen = !fullScreenState.isFullScreen;
            },
            exitFullScreen: async () => {
                fullScreenState.isFullScreen = false;
            },
        };

        context = await renderApp(
            iocProps({saygApi}),
            brandingProps(),
            appProps({
                account: account,
                appLoading: appLoading || false,
                fullScreen: fullScreen,
            }, reportedError),
            (<Practice/>),
            '/practice',
            '/practice' + hash);
    }

    function assertNoDataError() {
        const dataError = context.container.querySelector('div[data-name="data-error"]') as HTMLElement;
        expect(dataError).toBeFalsy();
    }

    function assertDataError(error: string) {
        const dataError = context.container.querySelector('div[data-name="data-error"]') as HTMLElement;
        expect(dataError).toBeTruthy();
        expect(dataError.textContent).toContain(error);
    }

    function assertInputValue(name: string, value: string) {
        const input = context.container.querySelector(`input[name="${name}"]`) as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.value).toEqual(value);
    }

    describe('logged out', () => {
        const account: UserDto | undefined = undefined;

        it('renders when app is loading', async () => {
            await renderComponent(account, '', true);

            reportedError.verifyNoError();
            assertNoDataError();
            expect(context.container.querySelector('.loading-background')).not.toBeNull();
        });

        it('renders given no saved data', async () => {
            await renderComponent(account, '');

            reportedError.verifyNoError();
            assertNoDataError();
            assertInputValue('yourName', 'you');
            assertInputValue('startingScore', '501');
            assertInputValue('numberOfLegs', '3');
            assertInputValue('opponentName', '');
        });

        it('renders given empty saved data', async () => {
            await renderComponent(account, '#');

            reportedError.verifyNoError();
            assertNoDataError();
            assertInputValue('yourName', 'you');
            assertInputValue('startingScore', '501');
            assertInputValue('numberOfLegs', '3');
            assertInputValue('opponentName', '');
        });

        it('renders given not-found data', async () => {
            const data = '#not-found';

            await renderComponent(account, data);

            reportedError.verifyNoError();
            assertDataError('Data not found');
        });

        it('can close data error', async () => {
            const data = '#not-found';
            await renderComponent(account, data);
            reportedError.verifyNoError();
            assertDataError('Data not found');

            await doClick(findButton(context.container.querySelector('div[data-name="data-error"]'), 'Clear'));

            expect(mockedUsedNavigate).toHaveBeenCalledWith(`/practice`);
        });

        it('renders given valid unfinished json data', async () => {
            const jsonData: RecordedScoreAsYouGoDto = saygBuilder()
                .startingScore(123)
                .numberOfLegs(2)
                .withLeg(0, (l: ILegBuilder) => l
                    .home((c: ILegCompetitorScoreBuilder) => c)
                    .away((c: ILegCompetitorScoreBuilder) => c))
                .scores(1)
                .yourName('Simon')
                .addTo(saygData)
                .build();

            await renderComponent(account, '#' + jsonData.id);

            reportedError.verifyNoError();
            assertNoDataError();
            assertInputValue('yourName', 'Simon');
            assertInputValue('startingScore', '123');
            assertInputValue('numberOfLegs', '2');
            assertInputValue('opponentName', '');
        });

        it('renders given valid finished json data', async () => {
            const jsonData: RecordedScoreAsYouGoDto = {
                startingScore: 123,
                numberOfLegs: 1,
                legs: {},
                homeScore: 1,
                awayScore: 2,
                yourName: 'you',
                opponentName: 'them',
                id: createTemporaryId(),
            };
            saygData[jsonData.id] = jsonData;

            await renderComponent(account, '#' + jsonData.id);

            reportedError.verifyNoError();
            assertNoDataError();
            assertInputValue('yourName', 'you');
            assertInputValue('startingScore', '123');
            assertInputValue('numberOfLegs', '1');
            assertInputValue('opponentName', 'them');
            const matchStatistics = context.container.querySelector('h4')!;
            expect(matchStatistics).toBeTruthy();
            expect(matchStatistics.textContent).toEqual('Match statistics');
        });

        it('can save unfinished practice data', async () => {
            const jsonData: RecordedScoreAsYouGoDto = saygBuilder()
                .startingScore(123)
                .numberOfLegs(2)
                .withLeg(0, (l: ILegBuilder) => l
                    .home((c: ILegCompetitorScoreBuilder) => c)
                    .away((c: ILegCompetitorScoreBuilder) => c))
                .scores(1)
                .yourName('Simon')
                .addTo(saygData)
                .build();
            await renderComponent(account, '#' + jsonData.id);
            reportedError.verifyNoError();
            assertNoDataError();

            delete saygData[jsonData.id];
            await doClick(findButton(context.container, 'Save '));

            expect(Object.keys(saygData)).toContain(jsonData.id);
            expect(shareData).toEqual({
                text: 'Practice',
                title: 'Practice',
                url: `/practice#${jsonData.id}`
            });
        });

        it('can save finished practice data', async () => {
            const jsonData: RecordedScoreAsYouGoDto = {
                startingScore: 123,
                numberOfLegs: 1,
                legs: {},
                homeScore: 1,
                awayScore: 2,
                yourName: 'you',
                opponentName: 'them',
                id: createTemporaryId(),
            };
            saygData[jsonData.id] = jsonData;
            await renderComponent(account, '#' + jsonData.id);
            reportedError.verifyNoError();
            assertNoDataError();

            delete saygData[jsonData.id];
            await doClick(findButton(context.container, 'Save '));

            expect(Object.keys(saygData)).toContain(jsonData.id);
            expect(shareData).toEqual({
                text: 'Practice',
                title: 'Practice',
                url: `/practice#${jsonData.id}`
            });
        });

        it('can change your name', async () => {
            await renderComponent(account, '');
            reportedError.verifyNoError();
            assertNoDataError();

            await doChange(context.container, 'input[name="yourName"]', 'YOU', context.user);

            await doClick(findButton(context.container, 'Save '));
            const id = Object.keys(saygData)[0];
            expect(saygData[id].yourName).toEqual('YOU');
        });

        it('can clear opponent name', async () => {
            await renderComponent(account, '');
            reportedError.verifyNoError();
            assertNoDataError();
            await doChange(context.container, 'input[name="opponentName"]', 'THEM', context.user);
            await doClick(findButton(context.container, 'Save '));
            const id = Object.keys(saygData)[0];
            expect(saygData[id].opponentName).toEqual('THEM');

            await doChange(context.container, 'input[name="opponentName"]', '', context.user);

            await doClick(findButton(context.container, 'Save '));
            expect(saygData[id].opponentName).toEqual('');
        });

        it('handles save error correctly', async () => {
            await renderComponent(account, '');
            reportedError.verifyNoError();
            assertNoDataError();
            apiResultFunc = () => {
                throw new Error('some error');
            };

            await doClick(findButton(context.container, 'Save '));

            reportedError.verifyErrorEquals({
                message: 'some error',
                stack: expect.any(String),
            });
        });

        it('can restart practice', async () => {
            const jsonData: RecordedScoreAsYouGoDto = {
                startingScore: 123,
                numberOfLegs: 1,
                legs: {},
                homeScore: 1,
                awayScore: 2,
                yourName: 'you',
                opponentName: 'them',
                id: createTemporaryId(),
            };
            saygData[jsonData.id] = jsonData;
            await renderComponent(account, '#' + jsonData.id);
            reportedError.verifyNoError();
            assertNoDataError();

            await doClick(findButton(context.container, 'Restart...'));

            await doClick(findButton(context.container, 'Save '));
            expect(saygData[jsonData.id].startingScore).toEqual(jsonData.startingScore);
            expect(saygData[jsonData.id].numberOfLegs).toEqual(jsonData.numberOfLegs);
            expect(saygData[jsonData.id].yourName).toEqual(jsonData.yourName);
            expect(saygData[jsonData.id].opponentName).toEqual(jsonData.opponentName);
            expect(saygData[jsonData.id].homeScore).toEqual(0);
            expect(saygData[jsonData.id].awayScore).toEqual(0);
            expect(Object.keys(saygData[jsonData.id].legs)).toEqual(['0']);
        });

        it('can record scores as they are entered', async () => {
            await renderComponent(account, '');
            reportedError.verifyNoError();
            assertNoDataError();

            await keyPad(context, ['1','8','0', ENTER_SCORE_BUTTON]);

            await doClick(findButton(context.container, 'Save '));
            const id = Object.keys(saygData)[0];
            expect(saygData[id].legs[0].home).toEqual({
                noOfDarts: 3,
                score: 180,
                throws: [{
                    noOfDarts: 3,
                    score: 180,
                }],
            });
        });

        it('can complete a leg', async () => {
            await renderComponent(account, '');
            reportedError.verifyNoError();
            assertNoDataError();
            await doChange(context.container, 'input[name="startingScore"]', '501', context.user);
            await keyPad(context, ['1','8','0', ENTER_SCORE_BUTTON]);
            await keyPad(context, ['1','8','0', ENTER_SCORE_BUTTON]);
            await keyPad(context, ['1','4','1', ENTER_SCORE_BUTTON]);
            await checkoutWith(context, CHECKOUT_3_DART);

            await doClick(findButton(context.container, 'Save '));
            const id = Object.keys(saygData)[0];
            expect(saygData[id].homeScore).toEqual(1);
            expect(saygData[id].awayScore).toEqual(0);
        });
    });

    describe('logged in', () => {
        const account: UserDto = {
            givenName: 'GIVEN NAME',
            name: 'NAME',
            emailAddress: '',
            access: {
                useWebSockets: false,
            },
        };

        it('when no data loaded, sets your name to account givenName', async () => {
            await renderComponent(account, '');

            reportedError.verifyNoError();
            assertInputValue('yourName', 'GIVEN NAME');
        });

        it('renders given valid unfinished json data', async () => {
            const jsonData: RecordedScoreAsYouGoDto = saygBuilder()
                .startingScore(123)
                .numberOfLegs(2)
                .withLeg(0, (l: ILegBuilder) => l
                    .home((c: ILegCompetitorScoreBuilder) => c)
                    .away((c: ILegCompetitorScoreBuilder) => c))
                .scores(1)
                .yourName('Simon')
                .addTo(saygData)
                .build();

            await renderComponent(account, '#' + jsonData.id);

            reportedError.verifyNoError();
            assertNoDataError();
            assertInputValue('yourName', 'Simon');
            assertInputValue('startingScore', '123');
            assertInputValue('numberOfLegs', '2');
            assertInputValue('opponentName', '');
        });

        it('renders given valid completed json data', async () => {
            const jsonData: RecordedScoreAsYouGoDto = {
                startingScore: 123,
                numberOfLegs: 1,
                legs: {},
                homeScore: 1,
                awayScore: 2,
                yourName: 'you',
                opponentName: 'them',
                id: createTemporaryId(),
            };
            saygData[jsonData.id] = jsonData;

            await renderComponent(account, '#' + jsonData.id);

            reportedError.verifyNoError();
            assertNoDataError();
            assertInputValue('yourName', 'you');
            assertInputValue('startingScore', '123');
            assertInputValue('numberOfLegs', '1');
            assertInputValue('opponentName', 'them');
            const matchStatistics = context.container.querySelector('h4')!;
            expect(matchStatistics).toBeTruthy();
            expect(matchStatistics.textContent).toEqual('Match statistics');
        });

        it('can restart practice', async () => {
            const jsonData: RecordedScoreAsYouGoDto = {
                startingScore: 123,
                numberOfLegs: 1,
                legs: {},
                homeScore: 1,
                awayScore: 2,
                yourName: 'you',
                opponentName: 'them',
                id: createTemporaryId(),
            };
            saygData[jsonData.id] = jsonData;
            await renderComponent(account, '#' + jsonData.id);
            reportedError.verifyNoError();
            assertNoDataError();

            await doClick(findButton(context.container, 'Restart...'));

            await doClick(findButton(context.container, 'Save '));
            expect(saygData[jsonData.id].startingScore).toEqual(jsonData.startingScore);
            expect(saygData[jsonData.id].numberOfLegs).toEqual(jsonData.numberOfLegs);
            expect(saygData[jsonData.id].yourName).toEqual(jsonData.yourName);
            expect(saygData[jsonData.id].opponentName).toEqual(jsonData.opponentName);
            expect(saygData[jsonData.id].homeScore).toEqual(0);
            expect(saygData[jsonData.id].awayScore).toEqual(0);
            expect(Object.keys(saygData[jsonData.id].legs)).toEqual(['0']);
        });

        it('restarting practice does not enter full screen if not kiosk mode', async () => {
            const jsonData: RecordedScoreAsYouGoDto = {
                startingScore: 123,
                numberOfLegs: 1,
                legs: {},
                homeScore: 1,
                awayScore: 2,
                yourName: 'you',
                opponentName: 'them',
                id: createTemporaryId(),
            };
            saygData[jsonData.id] = jsonData;
            account.access!.kioskMode = false;
            await renderComponent(account, '#' + jsonData.id);
            reportedError.verifyNoError();
            assertNoDataError();

            await doClick(findButton(context.container, 'Restart...'));

            expect(fullScreenState.isFullScreen).toEqual(false);
        });

        it('restarting practice enters enter full screen if kiosk mode enabled', async () => {
            const jsonData: RecordedScoreAsYouGoDto = {
                startingScore: 123,
                numberOfLegs: 1,
                legs: {},
                homeScore: 1,
                awayScore: 2,
                yourName: 'you',
                opponentName: 'them',
                id: createTemporaryId(),
            };
            saygData[jsonData.id] = jsonData;
            account.access!.kioskMode = true;
            await renderComponent(account, '#' + jsonData.id);
            reportedError.verifyNoError();
            assertNoDataError();

            await doClick(findButton(context.container, 'Restart...'));

            expect(fullScreenState.isFullScreen).toEqual(true);
        });
    });
});