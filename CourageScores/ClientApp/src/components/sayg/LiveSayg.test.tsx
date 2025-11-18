import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick,
    ErrorState,
    findButton,
    iocProps,
    MockSocketFactory,
    noop,
    renderApp,
    TestContext,
    user,
} from '../../helpers/tests';
import { LiveSayg } from './LiveSayg';
import {
    ILegBuilder,
    ILegCompetitorScoreBuilder,
    saygBuilder,
} from '../../helpers/builders/sayg';
import { RecordedScoreAsYouGoDto } from '../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto';
import { ISaygApi } from '../../interfaces/apis/ISaygApi';
import { IAppContainerProps } from '../common/AppContainer';
import {
    roundBuilder,
    tournamentBuilder,
} from '../../helpers/builders/tournaments';
import { ITournamentGameApi } from '../../interfaces/apis/ITournamentGameApi';
import { TournamentGameDto } from '../../interfaces/models/dtos/Game/TournamentGameDto';
import { act } from '@testing-library/react';
import { MessageType } from '../../interfaces/models/dtos/MessageType';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';
import {
    divisionBuilder,
    divisionDataBuilder,
} from '../../helpers/builders/divisions';
import { IDivisionApi } from '../../interfaces/apis/IDivisionApi';
import { DivisionDataDto } from '../../interfaces/models/dtos/Division/DivisionDataDto';
import { renderDate } from '../../helpers/rendering';
import { createTemporaryId } from '../../helpers/projection';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { IFullScreen } from '../common/IFullScreen';
import { TeamPlayerDto } from '../../interfaces/models/dtos/Team/TeamPlayerDto';

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
    let divisionData: DivisionDataDto | null;
    let isFullScreen = false;
    const saygApi = api<ISaygApi>({
        get: async (id: string): Promise<RecordedScoreAsYouGoDto | null> => {
            requestedSaygId.push(id);
            return saygData[id];
        },
    });
    const tournamentApi = api<ITournamentGameApi>({
        async get(id: string): Promise<TournamentGameDto | null> {
            requestedTournamentId.push(id);
            return tournamentData[id];
        },
    });
    const divisionApi = api<IDivisionApi>({
        async data(): Promise<DivisionDataDto> {
            return divisionData!;
        },
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
        divisionData = null;
        isFullScreen = false;

        jest.resetAllMocks();
    });

    async function renderComponent(
        appProps: IAppContainerProps,
        currentPath: string,
        route?: string,
    ) {
        context = await renderApp(
            iocProps({
                saygApi,
                tournamentApi,
                divisionApi,
                socketFactory: socketFactory.createSocket,
            }),
            brandingProps(),
            appProps,
            <LiveSayg />,
            route || '/live/:type',
            currentPath,
        );

        reportedError.verifyNoError();
    }

    async function render(...tournaments: TournamentGameDto[]) {
        const query = tournaments.map((t) => `id=${t.id}`).join('&');

        await renderComponent(
            appPropsWithFullScreen(),
            '/live/superleague/?' + query,
        );
    }

    function fullScreenProps(
        customisations?: Partial<IFullScreen>,
    ): IFullScreen {
        return {
            isFullScreen: false,
            canGoFullScreen: false,
            enterFullScreen: noop,
            exitFullScreen: noop,
            toggleFullScreen: noop,
            ...customisations,
        };
    }

    function getLiveScores(tournament: TournamentGameDto) {
        return context.container.querySelector(
            `div[datatype="live-scores"][data-tournamentid="${tournament.id}"]`,
        )!;
    }

    function expectHomeLiveScore(tournament: TournamentGameDto, score: number) {
        const liveScores = getLiveScores(tournament);
        expect(liveScores).toBeTruthy();
        const homeScore = liveScores.querySelector(
            'div[datatype="scores"] span:nth-child(1)',
        )!;
        expect(homeScore.textContent).toContain(score.toString());
    }

    function expectAwayLiveScore(tournament: TournamentGameDto, score: number) {
        const liveScores = getLiveScores(tournament);
        expect(liveScores).toBeTruthy();
        const awayScore = liveScores.querySelector(
            'div[datatype="scores"] span:nth-child(2)',
        )!;
        expect(awayScore.textContent).toContain(score.toString());
    }

    function expectSubscriptions(...ids: string[]) {
        expect(Object.keys(socketFactory.subscriptions)).toEqual(ids);
    }

    function expectNavigateTo(url: string) {
        expect(mockedUsedNavigate).toHaveBeenCalledWith(url);
    }

    function expectNavigateWithReplace(url: string) {
        expect(mockedUsedNavigate).toHaveBeenCalledWith(url, { replace: true });
    }

    function throws(
        ...throws: number[]
    ): (c: ILegCompetitorScoreBuilder) => ILegCompetitorScoreBuilder {
        return (c) => throws.reduce((c, thr) => c.withThrow(thr), c);
    }

    function makeSayg(modifyLeg: (c: ILegBuilder) => ILegBuilder, id?: string) {
        return saygBuilder(id)
            .withLeg(0, (l) => modifyLeg(l.startingScore(501)))
            .addTo(saygData)
            .build();
    }

    function withLeg(h: number[], a: number[], s?: RecordedScoreAsYouGoDto) {
        return makeSayg((l) => l.home(throws(...h)).away(throws(...a)), s?.id);
    }

    function players(...names: string[]): TeamPlayerDto[] {
        return names.map((name) => ({ id: name, name }));
    }

    function roundWithMatch(a: string, b: string, s?: RecordedScoreAsYouGoDto) {
        return roundBuilder()
            .withMatch((m) =>
                m
                    .sideA(a, undefined, ...players(a))
                    .sideB(b, undefined, ...players(b))
                    .saygId(s?.id),
            )
            .build();
    }

    async function change(selector: string, text: string) {
        await doChange(context.container, selector, text, context.user);
    }

    function rows() {
        return Array.from(context.container.querySelectorAll('table tbody tr'));
    }

    function appPropsWithFullScreen(c?: Partial<IAppContainerProps>) {
        return appProps(
            {
                fullScreen: fullScreenProps({
                    enterFullScreen: async () => (isFullScreen = true),
                    exitFullScreen: async () => (isFullScreen = false),
                    toggleFullScreen: async () =>
                        (isFullScreen = !isFullScreen),
                    isFullScreen,
                }),
                ...c,
            },
            reportedError,
        );
    }

    describe('render', () => {
        it('requests match', async () => {
            const sayg = saygBuilder().addTo(saygData).build();

            await renderComponent(
                appPropsWithFullScreen(),
                '/live/match/?id=' + sayg.id,
            );

            expect(requestedSaygId).toEqual([sayg.id]);
        });

        it('does not render multiple matches', async () => {
            const sayg1 = saygBuilder().addTo(saygData).build();
            const sayg2 = saygBuilder().addTo(saygData).build();

            await renderComponent(
                appPropsWithFullScreen(),
                '/live/match/?id=' + sayg1.id + '&id=' + sayg2.id,
            );

            expect(requestedSaygId).toEqual([]);
        });

        it('requests single superleague tournament', async () => {
            const tournament = tournamentBuilder()
                .host('HOST')
                .opponent('OPPONENT')
                .type('BOARD 1')
                .addTo(tournamentData)
                .build();

            await render(tournament);

            expect(requestedTournamentId).toEqual([tournament.id]);
            expect(context.container.innerHTML).toContain('HOST');
            expect(context.container.innerHTML).toContain('OPPONENT');
            expect(context.container.innerHTML).toContain('BOARD 1');
        });

        it('renders player initial and last names', async () => {
            const tournament = tournamentBuilder()
                .host('HOST')
                .opponent('OPPONENT')
                .type('BOARD 1')
                .addTo(tournamentData)
                .build();
            tournament.round = roundWithMatch('A NOTHER PLAYER', 'BARNEY');

            await render(tournament);

            expect(context.container.innerHTML).toContain('A N PLAYER');
            expect(context.container.innerHTML).toContain('BARNEY');
        });

        it('requests multiple superleague tournaments', async () => {
            const tournament1 = tournamentBuilder()
                .host('HOST')
                .opponent('OPPONENT')
                .type('BOARD 1')
                .addTo(tournamentData)
                .build();
            const tournament2 = tournamentBuilder()
                .host('HOST')
                .opponent('OPPONENT')
                .type('BOARD 2')
                .addTo(tournamentData)
                .build();

            await render(tournament1, tournament2);

            expect(requestedTournamentId).toEqual([
                tournament1.id,
                tournament2.id,
            ]);
            expect(context.container.innerHTML).toContain('HOST');
            expect(context.container.innerHTML).toContain('OPPONENT');
            expect(context.container.innerHTML).toContain('BOARD 1');
            expect(context.container.innerHTML).toContain('BOARD 2');
        });

        it('renders match in full screen', async () => {
            const sayg = saygBuilder().addTo(saygData).build();

            isFullScreen = true;
            await renderComponent(
                appPropsWithFullScreen(),
                '/live/match/?id=' + sayg.id,
            );

            expect(requestedSaygId).toEqual([sayg.id]);
        });

        it('requests superleague tournament in full screen', async () => {
            const tournament = tournamentBuilder()
                .host('HOST')
                .opponent('OPPONENT')
                .type('BOARD 1')
                .addTo(tournamentData)
                .build();

            isFullScreen = true;
            await render(tournament);

            expect(requestedTournamentId).toEqual([tournament.id]);
            expect(context.container.innerHTML).toContain('HOST');
            expect(context.container.innerHTML).toContain('OPPONENT');
            expect(context.container.innerHTML).toContain('BOARD 1');
        });

        it('averages and scores for superleague tournaments (home winner)', async () => {
            const sayg = saygBuilder()
                .startingScore(501)
                .numberOfLegs(1)
                .withLeg(0, (l) => l.home(throws(100)).away(throws(50)))
                .addTo(saygData)
                .build();
            const tournament = tournamentBuilder()
                .host('HOST')
                .opponent('OPPONENT')
                .type('BOARD 1')
                .bestOf(5)
                .round((r) =>
                    r.withMatch((m) =>
                        m.sideA('home', 3).sideB('away', 1).saygId(sayg.id),
                    ),
                )
                .addTo(tournamentData)
                .build();

            isFullScreen = true;
            await render(tournament);

            expect(requestedTournamentId).toEqual([tournament.id]);
            expect(requestedSaygId).toEqual([sayg.id]);
            const firstMatchRow =
                context.container.querySelector('table tbody tr');
            const cells = Array.from(firstMatchRow!.querySelectorAll('td'));
            const cellValues = cells.map((c) =>
                c.className.includes('fw-bold')
                    ? `*${c.textContent}*`
                    : c.textContent!,
            );
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
                .withLeg(0, (l) => l.home(throws(75)).away(throws(120)))
                .addTo(saygData)
                .build();
            const tournament = tournamentBuilder()
                .host('HOST')
                .opponent('OPPONENT')
                .type('BOARD 1')
                .bestOf(5)
                .round((r) =>
                    r.withMatch((m) =>
                        m.sideA('home', 1).sideB('away', 3).saygId(sayg.id),
                    ),
                )
                .addTo(tournamentData)
                .build();

            isFullScreen = true;
            await render(tournament);

            expect(requestedTournamentId).toEqual([tournament.id]);
            expect(requestedSaygId).toEqual([sayg.id]);
            const firstMatchRow =
                context.container.querySelector('table tbody tr');
            const cells = Array.from(firstMatchRow!.querySelectorAll('td'));
            const cellValues = cells.map((c) =>
                c.className.includes('fw-bold')
                    ? `*${c.textContent}*`
                    : c.textContent!,
            );
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

        it('prompt for type if none in the path', async () => {
            await renderComponent(appPropsWithFullScreen(), '/live', '/live');

            const buttons = Array.from(
                context.container.querySelectorAll('.btn'),
            );
            expect(buttons.map((b) => b.textContent)).toContain('Superleague');
        });

        it('prompt for ids if type in the path is unknown', async () => {
            divisionData = divisionDataBuilder(
                divisionBuilder('ANOTHER DIVISION').build(),
            ).build();
            await renderComponent(
                appPropsWithFullScreen({
                    divisions: [divisionData as DivisionDto],
                }),
                '/live/unknown',
            );

            expect(context.container.innerHTML).toContain(
                'Specify the ids for the unknown',
            );
        });

        it('redirects to type', async () => {
            await renderComponent(appPropsWithFullScreen(), '/live', '/live');

            await doClick(findButton(context.container, 'Superleague'));

            reportedError.verifyNoError();
            expectNavigateTo('/live/superleague/');
        });

        it('redirects to type when url ends with a slash', async () => {
            await renderComponent(appPropsWithFullScreen(), '/live/', '/live');

            await doClick(findButton(context.container, 'Superleague'));

            reportedError.verifyNoError();
            expectNavigateTo('/live/superleague/');
        });

        it('renders note if no superleague divisions', async () => {
            divisionData = divisionDataBuilder(
                divisionBuilder('ANOTHER DIVISION').build(),
            ).build();
            await renderComponent(
                appPropsWithFullScreen({
                    divisions: [divisionData as DivisionDto],
                }),
                '/live/superleague/',
            );

            expect(context.container.innerHTML).toContain(
                'Could not find any superleague divisions',
            );
        });

        it('renders note if no superleague tournaments found today', async () => {
            divisionData = divisionBuilder('SUPER LEAGUE')
                .superleague()
                .build();
            const today = new Date();
            await renderComponent(
                appPropsWithFullScreen({
                    divisions: [divisionData as DivisionDto],
                }),
                '/live/superleague',
            );

            expect(context.container.innerHTML).toContain(
                `Could not find any superleague tournaments on ${renderDate(today.toString())}`,
            );
        });

        it('redirects to superleague tournaments today', async () => {
            const tournamentId = createTemporaryId();
            const division = divisionBuilder('SUPER LEAGUE').build();
            divisionData = divisionDataBuilder(division)
                .superleague()
                .withFixtureDate((d) =>
                    d.withTournament((t) => t, tournamentId),
                )
                .build();
            await renderComponent(
                appPropsWithFullScreen({
                    divisions: [divisionData as DivisionDto],
                }),
                '/live/superleague/',
            );

            expectNavigateWithReplace('/live/superleague/?id=' + tournamentId);
        });

        it('renders note if no superleague tournaments found on given date', async () => {
            divisionData = divisionBuilder('SUPER LEAGUE')
                .superleague()
                .build();
            await renderComponent(
                appPropsWithFullScreen({
                    divisions: [divisionData as DivisionDto],
                }),
                '/live/superleague/?date=2025-01-01',
            );

            expect(context.container.innerHTML).toContain(
                `Could not find any superleague tournaments on ${renderDate('2025-01-01')}`,
            );
        });

        it('redirects to superleague tournaments on given date', async () => {
            const tournamentId = createTemporaryId();
            const division = divisionBuilder('SUPER LEAGUE').build();
            divisionData = divisionDataBuilder(division)
                .superleague()
                .withFixtureDate((d) =>
                    d.withTournament((t) => t, tournamentId),
                )
                .build();
            await renderComponent(
                appPropsWithFullScreen({
                    divisions: [divisionData as DivisionDto],
                }),
                '/live/superleague/?date=2025-01-01',
            );

            expectNavigateWithReplace('/live/superleague/?id=' + tournamentId);
        });
    });

    describe('interactivity', () => {
        it('can enter full screen', async () => {
            const tournament = tournamentBuilder()
                .host('HOST')
                .opponent('OPPONENT')
                .type('BOARD 1')
                .addTo(tournamentData)
                .build();

            await render(tournament);

            await doClick(findButton(context.container, 'Full screen'));

            expect(isFullScreen).toEqual(true);
        });

        it('can refresh data when in full screen', async () => {
            const tournament = tournamentBuilder()
                .host('HOST')
                .opponent('OPPONENT')
                .type('BOARD 1')
                .addTo(tournamentData)
                .build();
            isFullScreen = true;
            await render(tournament);
            tournament.type = 'BOARD UPDATED';
            expect(context.container.textContent).toContain('BOARD 1');

            await doClick(findButton(context.container, 'Refresh'));

            expect(context.container.textContent).not.toContain('BOARD 1');
            expect(context.container.textContent).toContain('BOARD UPDATED');
        });

        it('can remove superleague tournaments', async () => {
            const tournament1 = tournamentBuilder()
                .host('HOST')
                .opponent('OPPONENT')
                .type('BOARD 1')
                .addTo(tournamentData)
                .build();
            const tournament2 = tournamentBuilder()
                .host('HOST')
                .opponent('OPPONENT')
                .type('BOARD 2')
                .addTo(tournamentData)
                .build();

            await render(tournament1, tournament2);

            const secondTournamentRemoveButton = Array.from(
                context.container.querySelectorAll('button.btn-secondary'),
            );
            await doClick(secondTournamentRemoveButton[1]);

            expectNavigateTo('/live/superleague/?id=' + tournament1.id);
        });

        it('can change date when no type specified', async () => {
            await renderComponent(appPropsWithFullScreen(), '/live', '/live');

            await change('input[name="liveDate"]', '2025-01-01');

            expectNavigateTo('/live?date=2025-01-01');
        });

        it('can change date when type specified', async () => {
            await renderComponent(
                appPropsWithFullScreen(),
                '/live/superleague',
                '/live/:type',
            );

            await change('input[name="liveDate"]', '2025-01-01');

            expectNavigateTo('/live/superleague/?date=2025-01-01');
        });

        it('removes date from query when setting date to today', async () => {
            await renderComponent(
                appPropsWithFullScreen(),
                '/live/?date=2025-01-01',
                '/live',
            );
            const today: string = new Date().toISOString().substring(0, 10);

            await change('input[name="liveDate"]', today);

            expectNavigateTo('/live');
        });
    });

    describe('updates', () => {
        let tournament1: TournamentGameDto;
        const account: UserDto = user({ useWebSockets: true });

        async function sendUpdate(update: { id: string }) {
            expect(socketFactory.socket).not.toBeNull();
            expect(Object.keys(socketFactory.subscriptions)).toContain(
                update.id,
            );

            await act(async () => {
                socketFactory.socket!.onmessage!({
                    type: 'message',
                    data: JSON.stringify({
                        type: MessageType.update,
                        id: update.id,
                        data: update,
                    }),
                } as MessageEvent<string>);
            });
        }

        async function render(...tournaments: TournamentGameDto[]) {
            const query = tournaments.map((t) => `id=${t.id}`).join('&');

            await renderComponent(
                appPropsWithFullScreen({ account }),
                '/live/superleague/?' + query,
            );
        }

        function buildTournament() {
            return tournamentBuilder()
                .host('HOST 1.0')
                .opponent('OPPONENT 1.0')
                .type('BOARD 1.0')
                .bestOf(3)
                .addTo(tournamentData)
                .build();
        }

        beforeEach(() => {
            tournament1 = buildTournament();
        });

        it('can apply live update for one tournament', async () => {
            const updatedTournament1 = tournamentBuilder(tournament1.id)
                .host('HOST 1.1')
                .opponent('OPPONENT 1.1')
                .type('BOARD 1.1');

            await render(tournament1);
            expect(context.container.innerHTML).toContain('BOARD 1.0');
            expect(context.container.innerHTML).toContain('HOST 1.0');
            expect(context.container.innerHTML).toContain('OPPONENT 1.0');

            await sendUpdate(updatedTournament1.build());

            expect(context.container.innerHTML).toContain('BOARD 1.1');
            expect(context.container.innerHTML).toContain('HOST 1.1');
            expect(context.container.innerHTML).toContain('OPPONENT 1.1');
        });

        it('can apply live update for one match', async () => {
            const sayg = saygBuilder()
                .withLeg(0, (l) =>
                    l
                        .startingScore(501)
                        .home(throws(10, 100))
                        .away(throws(5, 50)),
                )
                .addTo(saygData)
                .build();
            tournament1.round = roundBuilder()
                .withMatch((m) =>
                    m.sideA('SIDE A').sideB('SIDE B').saygId(sayg.id),
                )
                .build();

            await render(tournament1);
            expectHomeLiveScore(tournament1, 501 - (10 + 100));
            expectAwayLiveScore(tournament1, 501 - (5 + 50));

            const updatedSayg = saygBuilder(sayg.id)
                .withLeg(0, (l) =>
                    l
                        .startingScore(501)
                        .home(throws(10, 100, 11))
                        .away(throws(5, 50, 55)),
                )
                .addTo(saygData);
            await sendUpdate(updatedSayg.build());

            expectHomeLiveScore(tournament1, 501 - (10 + 100 + 11));
            expectAwayLiveScore(tournament1, 501 - (5 + 50 + 55));
        });

        it('hides live updates when match won', async () => {
            const sayg = saygBuilder()
                .withLeg(0, (l) =>
                    l
                        .startingScore(501)
                        .home(throws(10, 100))
                        .away(throws(5, 50)),
                )
                .addTo(saygData)
                .build();
            const matchId = createTemporaryId();
            tournament1.round = roundBuilder()
                .withMatch(
                    (m) => m.sideA('SIDE A').sideB('SIDE B').saygId(sayg.id),
                    matchId,
                )
                .build();

            await render(tournament1);
            expect(getLiveScores(tournament1)).toBeTruthy();

            const updatedTournament1 = tournamentBuilder(tournament1.id)
                .host('HOST 1.1')
                .opponent('OPPONENT 1.1')
                .bestOf(3)
                .type('BOARD 1.1')
                .build();
            updatedTournament1.round = roundBuilder()
                .withMatch(
                    (m) =>
                        m.sideA('SIDE A', 2).sideB('SIDE B', 0).saygId(sayg.id),
                    matchId,
                )
                .build();
            await sendUpdate(updatedTournament1);

            expect(getLiveScores(updatedTournament1)).toBeFalsy();
        });

        it('can apply alternating live updates', async () => {
            const updatedTournament1 = tournamentBuilder(tournament1.id)
                .host('HOST 1.1')
                .opponent('OPPONENT 1.1')
                .type('BOARD 1.1')
                .build();
            const tournament2 = tournamentBuilder()
                .host('HOST 2.0')
                .opponent('OPPONENT 2.0')
                .type('BOARD 2.0')
                .addTo(tournamentData)
                .build();
            const updatedTournament2 = tournamentBuilder(tournament2.id)
                .host('HOST 2.1')
                .opponent('OPPONENT 2.1')
                .type('BOARD 2.1');

            await render(tournament1, tournament2);
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

            await sendUpdate(updatedTournament2.build());

            expect(context.container.innerHTML).toContain('BOARD 1.1');
            expect(context.container.innerHTML).toContain('HOST 1.1');
            expect(context.container.innerHTML).toContain('OPPONENT 1.1');
            expect(context.container.innerHTML).toContain('BOARD 2.1');
            expect(context.container.innerHTML).toContain('HOST 2.1');
            expect(context.container.innerHTML).toContain('OPPONENT 2.1');
        });

        it('subscribes to sayg when it is added to a match', async () => {
            const sayg = saygBuilder().build();
            const matchId = createTemporaryId();
            const matchAdded = tournamentBuilder(tournament1.id)
                .round((r) =>
                    r.withMatch(
                        (m) => m.sideA('HOST PLAYER').sideB('OPPONENT PLAYER'),
                        matchId,
                    ),
                )
                .build();
            const matchSaygSet = tournamentBuilder(tournament1.id)
                .round((r) =>
                    r.withMatch(
                        (m) =>
                            m
                                .sideA('HOST PLAYER')
                                .sideB('OPPONENT PLAYER')
                                .saygId(sayg.id),
                        matchId,
                    ),
                )
                .build();

            await render(tournament1);
            expect(rows().length).toEqual(0);

            await sendUpdate(matchAdded);

            expect(rows().length).toEqual(1);
            expectSubscriptions(tournament1.id);

            await sendUpdate(matchSaygSet);

            expect(rows().length).toEqual(1);
            expectSubscriptions(tournament1.id, sayg.id);
        });

        it('resets live scores for second board when sequential updates are received', async () => {
            const sayg1 = withLeg([10, 100], [5, 50]);
            const sayg2 = withLeg([16, 106], [6, 56]);
            tournament1.round = roundWithMatch('SIDE A', 'SIDE B', sayg1);
            const tournament2 = buildTournament();
            tournament2.round = roundWithMatch('SIDE C', 'SIDE D', sayg2);

            await render(tournament1, tournament2);
            expectHomeLiveScore(tournament1, 501 - (10 + 100));
            expectAwayLiveScore(tournament1, 501 - (5 + 50));
            expectHomeLiveScore(tournament2, 501 - (16 + 106));
            expectAwayLiveScore(tournament2, 501 - (6 + 56));

            await sendUpdate(withLeg([10, 100, 11], [5, 50, 55], sayg1));
            await sendUpdate(withLeg([16, 106, 17], [6, 56, 65], sayg2));

            expectHomeLiveScore(tournament1, 501 - (10 + 100 + 11));
            expectAwayLiveScore(tournament1, 501 - (5 + 50 + 55));
            expectHomeLiveScore(tournament2, 501 - (16 + 106 + 17));
            expectAwayLiveScore(tournament2, 501 - (6 + 56 + 65));
        });
    });
});
