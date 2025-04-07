import {
    api,
    appProps,
    brandingProps,
    cleanUp, doClick,
    ErrorState, findButton,
    iocProps, MockSocketFactory, noop,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {LiveSayg} from "./LiveSayg";
import {ILegBuilder, ILegCompetitorScoreBuilder, saygBuilder} from "../../helpers/builders/sayg";
import {RecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto";
import {ISaygApi} from "../../interfaces/apis/ISaygApi";
import {IAppContainerProps} from "../common/AppContainer";
import {
    ITournamentMatchBuilder,
    ITournamentRoundBuilder,
    tournamentBuilder
} from "../../helpers/builders/tournaments";
import {ITournamentGameApi} from "../../interfaces/apis/ITournamentGameApi";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {act} from "@testing-library/react";
import {MessageType} from "../../interfaces/models/dtos/MessageType";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";

const mockedUsedNavigate = jest.fn();

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: () => mockedUsedNavigate,
}));

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
                .type('BOARD 1')
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
                .type('BOARD 1')
                .addTo(tournamentData).build();
            const tournament2 = tournamentBuilder()
                .host('HOST').opponent('OPPONENT')
                .type('BOARD 2')
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
                .type('BOARD 1')
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

        it('averages and scores for superleague tournaments (home winner)', async () => {
            const sayg = saygBuilder()
                .startingScore(501)
                .numberOfLegs(1)
                .withLeg(0, (l: ILegBuilder) => l
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(50)))
                .addTo(saygData)
                .build();
            const tournament = tournamentBuilder()
                .host('HOST').opponent('OPPONENT')
                .type('BOARD 1')
                .bestOf(5)
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA('home', 3).sideB('away', 1).saygId(sayg.id)))
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
            expect(requestedSaygId).toEqual([ sayg.id ]);
            const firstMatchRow = context.container.querySelector('table tbody tr');
            const cells = Array.from(firstMatchRow!.querySelectorAll('td'));
            const cellValues = cells.map(c => c.className.includes('fw-bold') ? `*${c.textContent}*` : c.textContent!);
            expect(cellValues).toEqual([
                '*33.33*', // average
                '*home*', // name
                '*3*', // score
                '-',
                '1', // score
                'away', // name
                '16.67', // average
            ]);
        });

        it('averages and scores for superleague tournaments (away winner)', async () => {
            const sayg = saygBuilder()
                .startingScore(501)
                .numberOfLegs(1)
                .withLeg(0, (l: ILegBuilder) => l
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(75))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(120)))
                .addTo(saygData)
                .build();
            const tournament = tournamentBuilder()
                .host('HOST').opponent('OPPONENT')
                .type('BOARD 1')
                .bestOf(5)
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA('home', 1).sideB('away', 3).saygId(sayg.id)))
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
            expect(requestedSaygId).toEqual([ sayg.id ]);
            const firstMatchRow = context.container.querySelector('table tbody tr');
            const cells = Array.from(firstMatchRow!.querySelectorAll('td'));
            const cellValues = cells.map(c => c.className.includes('fw-bold') ? `*${c.textContent}*` : c.textContent!);
            expect(cellValues).toEqual([
                '25.00', // average
                'home', // name
                '1', // score
                '-',
                '*3*', // score
                '*away*', // name
                '*40.00*', // average
            ]);
        });
    });

    describe('interactivity', () => {
        it('can enter full screen', async () => {
            const tournament = tournamentBuilder()
                .host('HOST').opponent('OPPONENT')
                .type('BOARD 1')
                .addTo(tournamentData).build();
            let isFullScreen = false;

            await renderComponent(
                appProps({
                    fullScreen: {
                        isFullScreen: false,
                        canGoFullScreen: false,
                        enterFullScreen: () => isFullScreen = true,
                        exitFullScreen: () => isFullScreen = false,
                        toggleFullScreen: () => isFullScreen = !isFullScreen,
                    },
                }, reportedError),
                '/live/superleague/?id=' + tournament.id);

            await doClick(findButton(context.container, 'Full screen'));

            expect(isFullScreen).toEqual(true);
        });

        it('can remove superleague tournaments', async () => {
            const tournament1 = tournamentBuilder()
                .host('HOST').opponent('OPPONENT')
                .type('BOARD 1')
                .addTo(tournamentData).build();
            const tournament2 = tournamentBuilder()
                .host('HOST').opponent('OPPONENT')
                .type('BOARD 2')
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

            const secondTournamentRemoveButton = Array.from(context.container.querySelectorAll('button.btn-secondary'));
            await doClick(secondTournamentRemoveButton[1]);

            expect(mockedUsedNavigate).toHaveBeenCalledWith('/live/superleague/?id=' + tournament1.id);
        });
    });

    describe('updates', () => {
        let tournament1: TournamentGameDto;
        const account: UserDto = {
            emailAddress: '',
            name: '',
            givenName: '',
            access: {
                useWebSockets: true,
            }
        };

        async function sendUpdate(tournament: TournamentGameDto) {
            expect(socketFactory.socket).not.toBeNull();
            expect(Object.keys(socketFactory.subscriptions)).toContain(tournament.id);

            await act(async () => {
                socketFactory.socket!.onmessage!({
                    type: 'message',
                    data: JSON.stringify({
                        type: MessageType.update,
                        id: tournament.id,
                        data: tournament
                    }),
                } as MessageEvent<string>);
            });
        }

        beforeEach(() => {
            tournament1 = tournamentBuilder()
                .host('HOST 1.0').opponent('OPPONENT 1.0')
                .type('BOARD 1.0')
                .addTo(tournamentData)
                .build();
        });

        it('can apply live update for one tournament', async () => {
            const updatedTournament1 = tournamentBuilder(tournament1.id)
                .host('HOST 1.1').opponent('OPPONENT 1.1')
                .type('BOARD 1.1').build();

            await renderComponent(
                appProps({
                    account,
                }, reportedError),
                '/live/superleague/?id=' + tournament1.id);
            expect(context.container.innerHTML).toContain('BOARD 1.0');
            expect(context.container.innerHTML).toContain('HOST 1.0');
            expect(context.container.innerHTML).toContain('OPPONENT 1.0');

            await sendUpdate(updatedTournament1);

            expect(context.container.innerHTML).toContain('BOARD 1.1');
            expect(context.container.innerHTML).toContain('HOST 1.1');
            expect(context.container.innerHTML).toContain('OPPONENT 1.1');
        });

        it('can apply alternating live updates', async () => {
            const updatedTournament1 = tournamentBuilder(tournament1.id)
                .host('HOST 1.1').opponent('OPPONENT 1.1')
                .type('BOARD 1.1').build();
            const tournament2 = tournamentBuilder()
                .host('HOST 2.0').opponent('OPPONENT 2.0')
                .type('BOARD 2.0')
                .addTo(tournamentData)
                .build();
            const updatedTournament2 = tournamentBuilder(tournament2.id)
                .host('HOST 2.1').opponent('OPPONENT 2.1')
                .type('BOARD 2.1').build();

            await renderComponent(
                appProps({
                    account,
                }, reportedError),
                '/live/superleague/?id=' + tournament1.id + '&id=' + tournament2.id);
            expect(context.container.innerHTML).toContain('BOARD 1.0');
            expect(context.container.innerHTML).toContain('HOST 1.0');
            expect(context.container.innerHTML).toContain('OPPONENT 1.0');
            expect(context.container.innerHTML).toContain('BOARD 2.0');
            expect(context.container.innerHTML).toContain('HOST 2.0');
            expect(context.container.innerHTML).toContain('OPPONENT 2.0');

            await sendUpdate(updatedTournament1);

            expect(context.container.innerHTML).toContain('BOARD 1.1');
            expect(context.container.innerHTML).toContain('HOST 1.1');
            expect(context.container.innerHTML).toContain('OPPONENT 1.1');
            expect(context.container.innerHTML).toContain('BOARD 2.0');
            expect(context.container.innerHTML).toContain('HOST 2.0');
            expect(context.container.innerHTML).toContain('OPPONENT 2.0');

            await sendUpdate(updatedTournament2);

            expect(context.container.innerHTML).toContain('BOARD 1.1');
            expect(context.container.innerHTML).toContain('HOST 1.1');
            expect(context.container.innerHTML).toContain('OPPONENT 1.1');
            expect(context.container.innerHTML).toContain('BOARD 2.1');
            expect(context.container.innerHTML).toContain('HOST 2.1');
            expect(context.container.innerHTML).toContain('OPPONENT 2.1');
        });
    })
});