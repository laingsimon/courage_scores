import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps, MockSocketFactory, noop,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {LiveSayg} from "./LiveSayg";
import {saygBuilder} from "../../helpers/builders/sayg";
import {RecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto";
import {ISaygApi} from "../../interfaces/apis/ISaygApi";
import {IAppContainerProps} from "../common/AppContainer";
import {tournamentBuilder} from "../../helpers/builders/tournaments";
import {ITournamentGameApi} from "../../interfaces/apis/ITournamentGameApi";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";

describe('LiveSayg', () => {
    let context: TestContext;
    let requestedSaygId: string[];
    let saygData: { [id: string]: RecordedScoreAsYouGoDto };
    let requestedTournamentId: string[];
    let tournamentData: { [id: string]: TournamentGameDto };
    let reportedError: ErrorState;
    let socketFactory: MockSocketFactory;
    const saygApi = api<ISaygApi>({
        get: async (id: string): Promise<RecordedScoreAsYouGoDto | null> => {
            requestedSaygId.push(id);
            return saygData[id];
        }
    });
    const tournamentApi = api<ITournamentGameApi>({
        async get(id: string): Promise<TournamentGameDto | null> {
            requestedTournamentId.push(id);
            return tournamentData[id];
        }
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        saygData = {};
        requestedSaygId = [];
        tournamentData = {};
        requestedTournamentId = [];
        socketFactory = new MockSocketFactory();
    });

    async function renderComponent(appProps: IAppContainerProps, currentPath: string) {
        context = await renderApp(
            iocProps({saygApi, tournamentApi, socketFactory: socketFactory.createSocket }),
            brandingProps(),
            appProps,
            <LiveSayg />,
            '/live/:type',
            currentPath);
    }

    describe('render', () => {
        it('requests match', async () => {
            const sayg = saygBuilder().addTo(saygData).build();

            await renderComponent(
                appProps({
                    fullScreen: {
                        isFullScreen: false,
                        canGoFullScreen: false,
                        enterFullScreen: noop,
                        exitFullScreen: noop,
                        toggleFullScreen: noop,
                    },
                }, reportedError),
                '/live/match/?id=' + sayg.id);

            reportedError.verifyNoError();
            expect(requestedSaygId).toEqual([ sayg.id ]);
        });

        it('does not render multiple matches', async () => {
            const sayg1 = saygBuilder().addTo(saygData).build();
            const sayg2 = saygBuilder().addTo(saygData).build();

            await renderComponent(
                appProps({
                    fullScreen: {
                        isFullScreen: false,
                        canGoFullScreen: false,
                        enterFullScreen: noop,
                        exitFullScreen: noop,
                        toggleFullScreen: noop,
                    },
                }, reportedError),
                '/live/match/?id=' + sayg1.id + '&id=' + sayg2.id);

            reportedError.verifyNoError();
            expect(requestedSaygId).toEqual([ ]);
        });

        it('requests single superleague tournament', async () => {
            const tournament = tournamentBuilder()
                .host('HOST').opponent('OPPONENT')
                .notes('BOARD 1')
                .addTo(tournamentData).build();

            await renderComponent(
                appProps({
                    fullScreen: {
                        isFullScreen: false,
                        canGoFullScreen: false,
                        enterFullScreen: noop,
                        exitFullScreen: noop,
                        toggleFullScreen: noop,
                    },
                }, reportedError),
                '/live/superleague/?id=' + tournament.id);

            reportedError.verifyNoError();
            expect(requestedTournamentId).toEqual([ tournament.id ]);
            expect(context.container.innerHTML).toContain('HOST');
            expect(context.container.innerHTML).toContain('OPPONENT');
            expect(context.container.innerHTML).toContain('BOARD 1');
        });

        it('requests multiple superleague tournaments', async () => {
            const tournament1 = tournamentBuilder()
                .host('HOST').opponent('OPPONENT')
                .notes('BOARD 1')
                .addTo(tournamentData).build();
            const tournament2 = tournamentBuilder()
                .host('HOST').opponent('OPPONENT')
                .notes('BOARD 2')
                .addTo(tournamentData).build();

            await renderComponent(
                appProps({
                    fullScreen: {
                        isFullScreen: false,
                        canGoFullScreen: false,
                        enterFullScreen: noop,
                        exitFullScreen: noop,
                        toggleFullScreen: noop,
                    },
                }, reportedError),
                '/live/superleague/?id=' + tournament1.id + '&id=' + tournament2.id);

            reportedError.verifyNoError();
            expect(requestedTournamentId).toEqual([ tournament1.id, tournament2.id ]);
            expect(context.container.innerHTML).toContain('HOST');
            expect(context.container.innerHTML).toContain('OPPONENT');
            expect(context.container.innerHTML).toContain('BOARD 1');
            expect(context.container.innerHTML).toContain('BOARD 2');
        });

        it('renders match in full screen', async () => {
            const sayg = saygBuilder().addTo(saygData).build();

            await renderComponent(
                appProps({
                    fullScreen: {
                        isFullScreen: true,
                        canGoFullScreen: false,
                        enterFullScreen: noop,
                        exitFullScreen: noop,
                        toggleFullScreen: noop,
                    },
                }, reportedError),
                '/live/match/?id=' + sayg.id);

            reportedError.verifyNoError();
            expect(requestedSaygId).toEqual([ sayg.id ]);
        });

        it('requests superleague tournament in full screen', async () => {
            const tournament = tournamentBuilder()
                .host('HOST').opponent('OPPONENT')
                .notes('BOARD 1')
                .addTo(tournamentData).build();

            await renderComponent(
                appProps({
                    fullScreen: {
                        isFullScreen: true,
                        canGoFullScreen: false,
                        enterFullScreen: noop,
                        exitFullScreen: noop,
                        toggleFullScreen: noop,
                    },
                }, reportedError),
                '/live/superleague/?id=' + tournament.id);

            reportedError.verifyNoError();
            expect(requestedTournamentId).toEqual([ tournament.id ]);
            expect(context.container.innerHTML).toContain('HOST');
            expect(context.container.innerHTML).toContain('OPPONENT');
            expect(context.container.innerHTML).toContain('BOARD 1');
        });
    });

    describe('interactivity', () => {

    });
});