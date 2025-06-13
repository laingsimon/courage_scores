import {
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick,
    doSelectOption,
    ErrorState,
    findButton,
    iocProps,
    renderApp,
    TestContext,
    user,
} from '../../helpers/tests';
import {
    ITournamentContainerProps,
    TournamentContainer,
} from './TournamentContainer';
import { IPrintableSheetProps, PrintableSheet } from './PrintableSheet';
import { renderDate } from '../../helpers/rendering';
import { createTemporaryId } from '../../helpers/projection';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto';
import { TournamentGameDto } from '../../interfaces/models/dtos/Game/TournamentGameDto';
import { TeamPlayerDto } from '../../interfaces/models/dtos/Team/TeamPlayerDto';
import {
    ITournamentRoundBuilder,
    ITournamentSideBuilder,
    sideBuilder,
    tournamentBuilder,
} from '../../helpers/builders/tournaments';
import { matchOptionsBuilder } from '../../helpers/builders/games';
import { playerBuilder } from '../../helpers/builders/players';
import { teamBuilder } from '../../helpers/builders/teams';
import { seasonBuilder } from '../../helpers/builders/seasons';
import { divisionBuilder } from '../../helpers/builders/divisions';
import { IAppContainerProps } from '../common/AppContainer';
import { tournamentContainerPropsBuilder } from './tournamentContainerPropsBuilder';
import { BuilderParam } from '../../helpers/builders/builders';
import { TournamentSideDto } from '../../interfaces/models/dtos/Game/TournamentSideDto';

interface ISideInfo {
    sideAwinner?: boolean;
    sideBwinner?: boolean;
    sideAname?: string;
    sideAmnemonic?: string;
    sideBname?: string;
    sideBmnemonic?: string;
    scoreA?: string;
    scoreB?: string;
    saygLink?: string;
}

describe('PrintableSheet', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let updatedTournament: TournamentGameDto | null;
    let editTournament: boolean | null;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        updatedTournament = null;
        editTournament = null;
    });

    async function setTournamentData(update: TournamentGameDto) {
        updatedTournament = update;
    }

    async function setEditTournament(value: boolean) {
        editTournament = value;
    }

    async function renderComponent(
        containerProps: ITournamentContainerProps,
        props: IPrintableSheetProps,
        appProps: IAppContainerProps,
    ) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps,
            <TournamentContainer {...containerProps}>
                <PrintableSheet {...props} />
            </TournamentContainer>,
        );
    }

    function createSide(
        name: string,
        player?: TeamPlayerDto,
    ): BuilderParam<ITournamentSideBuilder> {
        return (builder) => {
            const side = builder.name(name);

            return player ? side.withPlayer(player) : side;
        };
    }

    function side(name: string, player: TeamPlayerDto) {
        return createSide(name, player)(sideBuilder()).build();
    }

    function getAccolades<T>(
        name: string,
        selector?: (e: Element) => T,
        container?: Element,
    ): T[] {
        container = container ?? context.container;
        return Array.from(
            container.querySelectorAll(`div[data-accolades="${name}"] div`),
        ).map(selector ?? ((e) => e.textContent! as T));
    }

    function getPlayers(round: Element, name: string) {
        const parent = round.querySelector(`div[data-accolades="${name}"]`);
        if (!parent) {
            return null;
        }

        return {
            players: getAccolades(name, undefined, round),
        };
    }

    function getRounds() {
        const round = 'div[datatype^="round-"]';
        return Array.from(context.container.querySelectorAll(round)).map(
            (r) => {
                return {
                    oneEighties: getPlayers(r, '180s'),
                    hiChecks: getPlayers(r, 'hi-checks'),
                    heading: find('round-name', r)!.textContent,
                    matches: Array.from(
                        r.querySelectorAll('div[datatype="match"]'),
                    ).map((match: Element): ISideInfo => {
                        function setInfo(
                            selector: string,
                            name: string,
                            getter: (element: Element) => any,
                        ) {
                            const element = match.querySelector(selector);
                            if (element) {
                                const value = getter(element);
                                if (value) {
                                    info[name] = value;
                                }
                            }
                        }

                        const info: ISideInfo = {
                            saygLink: match.querySelector('a')?.href,
                        };

                        setInfo(
                            'div[datatype="sideA"]',
                            'sideAwinner',
                            (e: Element) =>
                                e.className.indexOf('bg-winner') !== -1,
                        );
                        setInfo(
                            'div[datatype="sideB"]',
                            'sideBwinner',
                            (e: Element) =>
                                e.className.indexOf('bg-winner') !== -1,
                        );
                        setInfo(
                            'span[datatype="sideAname"]',
                            'sideAname',
                            (e: Element) => e.textContent!.trim(),
                        );
                        setInfo(
                            'span[datatype="sideBname"]',
                            'sideBname',
                            (e: Element) => e.textContent!.trim(),
                        );
                        setInfo(
                            'span[datatype="sideAmnemonic"]',
                            'sideAmnemonic',
                            (e: Element) => e.textContent!.trim(),
                        );
                        setInfo(
                            'span[datatype="sideBmnemonic"]',
                            'sideBmnemonic',
                            (e: Element) => e.textContent!.trim(),
                        );
                        setInfo(
                            'div[datatype="scoreA"]',
                            'scoreA',
                            (e: Element) => e.textContent!.trim(),
                        );
                        setInfo(
                            'div[datatype="scoreB"]',
                            'scoreB',
                            (e: Element) => e.textContent!.trim(),
                        );

                        return info;
                    }),
                };
            },
        );
    }

    function getWhoIsPlaying<T>(selector?: (e: Element) => T): T[] {
        const s = 'div[datatype="playing"] li';
        return Array.from(context.container.querySelectorAll(s)).map(
            selector ?? ((li) => whoIsPlayingText(li) as T),
        );
    }

    function whoIsPlayingText(li: Element): string {
        return li.className.indexOf('text-decoration-line-through') !== -1
            ? '-' + li.textContent + '-'
            : li.textContent!;
    }

    function linkHref(container: Element): string | null {
        return container.querySelector('a')?.href ?? null;
    }

    function getWinner(): { name: string; link?: string } {
        const winnerElement = find('winner')!;

        return {
            name: winnerElement.querySelector('span')!.textContent!,
            link: winnerElement.querySelector('a')?.href,
        };
    }

    function find(dataType: string, container?: Element) {
        return (context.container ?? container).querySelector(
            `[datatype="${dataType}"]`,
        );
    }

    function getDialog() {
        return context.container.querySelector('div.modal-dialog');
    }

    async function setPlayerAndScore(side: string, score: string) {
        const dialog = getDialog()!;
        const sideSelector = 'div.btn-group:nth-child(2) .dropdown-menu';
        const scoreSelector = 'div.btn-group:nth-child(4) .dropdown-menu';
        await doSelectOption(dialog.querySelector(sideSelector), side);
        await doSelectOption(dialog.querySelector(scoreSelector), score);
    }

    function match(
        sideA: string,
        scoreA: string,
        sideB: string,
        scoreB: string,
        winner?: string,
        saygLink?: string,
    ): ISideInfo {
        return {
            sideAname: sideA,
            sideBname: sideB,
            sideAwinner: winner === 'a' || undefined,
            sideBwinner: winner === 'b' || undefined,
            scoreA: scoreA,
            scoreB: scoreB,
            saygLink,
        };
    }

    async function render(
        containerProps: tournamentContainerPropsBuilder,
        app?: Partial<IAppContainerProps>,
        props?: IPrintableSheetProps,
    ) {
        await renderComponent(
            containerProps.build(),
            props ?? {},
            appProps(app ?? {}, reportedError),
        );
    }

    async function renderEditable(
        containerProps: tournamentContainerPropsBuilder,
        app?: Partial<IAppContainerProps>,
    ) {
        await render(containerProps, app, { editable: true });
    }

    function makeMatch(
        round: ITournamentRoundBuilder,
        sideA: BuilderParam<ITournamentSideBuilder> | TournamentSideDto,
        sideB: BuilderParam<ITournamentSideBuilder> | TournamentSideDto,
        scoreA: number,
        scoreB: number,
        numberOfLegs: number = 3,
    ) {
        return round
            .withMatch((m) => m.sideA(sideA, scoreA).sideB(sideB, scoreB))
            .withMatchOption((o) => o.numberOfLegs(numberOfLegs));
    }

    describe('played tournament', () => {
        const sideA: BuilderParam<ITournamentSideBuilder> = createSide('a');
        const sideB: BuilderParam<ITournamentSideBuilder> = createSide('b');
        const sideC: BuilderParam<ITournamentSideBuilder> = createSide('c');
        const sideD: BuilderParam<ITournamentSideBuilder> = createSide('d');
        const sideE: BuilderParam<ITournamentSideBuilder> = createSide('e');
        const sideF: BuilderParam<ITournamentSideBuilder> = createSide('f');
        const sideG: BuilderParam<ITournamentSideBuilder> = createSide('g');
        const sideH: BuilderParam<ITournamentSideBuilder> = createSide('h');
        const sideI: BuilderParam<ITournamentSideBuilder> = createSide('i');
        const sideJ: BuilderParam<ITournamentSideBuilder> = createSide('j');
        const sideK: BuilderParam<ITournamentSideBuilder> = createSide('k');
        const sideL: BuilderParam<ITournamentSideBuilder> = createSide('l');
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const season = seasonBuilder('SEASON').withDivision(division).build();
        const anotherSeason: SeasonDto = seasonBuilder('SEASON').build();
        const matchOptionDefaults = matchOptionsBuilder().build();
        const player1: TeamPlayerDto = playerBuilder('PLAYER 1').build();
        const player2: TeamPlayerDto = playerBuilder('PLAYER 2').build();
        const account = user({});
        const player1Team = teamBuilder('TEAM')
            .forSeason(season, division, [player1])
            .build();
        const player2Team = teamBuilder('TEAM')
            .forSeason(season, division, [player2])
            .build();
        const noPlayerTeam = teamBuilder('TEAM')
            .forSeason(season, division)
            .build();
        const singles: TournamentGameDto = tournamentBuilder()
            .withSide((b) => b.name('A').withPlayer(player1))
            .withSide((b) => b.name('B').withPlayer(player2))
            .build();
        let twoRounds4Sides: TournamentGameDto;
        let oneRound2Sides: TournamentGameDto;
        const props = new tournamentContainerPropsBuilder({
            season,
            division,
            matchOptionDefaults,
            setTournamentData,
            setEditTournament,
        });

        beforeEach(() => {
            twoRounds4Sides = tournamentBuilder()
                .round((r) => {
                    r = makeMatch(r, sideA, sideB, 1, 2);
                    r = makeMatch(r, sideC, sideD, 2, 1);
                    return r.round((r) => makeMatch(r, sideB, sideC, 2, 1));
                })
                .withSide(sideA, sideB, sideC, sideD)
                .build();

            oneRound2Sides = tournamentBuilder()
                .round((r) =>
                    makeMatch(r, side('A', player1), side('B', player2), 1, 2),
                )
                .withSide((b) => b.name('A').withPlayer(player1))
                .withSide((b) => b.name('B').withPlayer(player2))
                .build();
        });

        it('renders tournament with one round', async () => {
            await render(props.withTournament(oneRound2Sides));

            expect(getRounds()[0].matches).toEqual([
                match('A', '1', 'B', '2', 'b'),
            ]);
        });

        it('renders tournament with sayg id', async () => {
            const saygId = createTemporaryId();
            oneRound2Sides.round!.matches![0].saygId = saygId;

            await render(props.withTournament(oneRound2Sides));

            const liveUrl = 'http://localhost/live/match/?id=' + saygId;
            expect(getRounds()[0].matches).toEqual([
                match('A', '1', 'B', '2', 'b', liveUrl),
            ]);
        });

        it('renders incomplete tournament with six sides and one round', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round((r) => {
                    r = makeMatch(r, sideA, sideB, 0, 0);
                    r = makeMatch(r, sideC, sideD, 0, 0);
                    return makeMatch(r, sideE, sideF, 0, 0);
                })
                .withSide(sideA, sideB, sideC, sideD, sideE, sideF)
                .build();

            await render(props.withTournament(tournamentData));

            const rounds = getRounds();
            expect(rounds.length).toEqual(3);
            expect(rounds[0].matches).toEqual([
                match('a', '0', 'b', '0'),
                match('c', '0', 'd', '0'),
                match('e', '0', 'f', '0'),
            ]);
            expect(rounds[1].matches).toEqual([
                { sideBmnemonic: 'winner(M1)' },
                { sideBmnemonic: 'winner(M2)' },
            ]);
            expect(rounds[2].matches).toEqual([{}]);
        });

        it('renders tournament with 2 rounds', async () => {
            await render(props.withTournament(twoRounds4Sides));

            const rounds = getRounds();
            expect(rounds.length).toEqual(2);
            expect(rounds[0].matches).toEqual([
                match('a', '1', 'b', '2', 'b'),
                match('c', '2', 'd', '1', 'a'),
            ]);
            expect(rounds[1].matches).toEqual([match('b', '2', 'c', '1', 'a')]);
        });

        it('renders tournament with 3 rounds', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round((r) => {
                    r = makeMatch(r, sideA, sideB, 1, 2);
                    r = makeMatch(r, sideC, sideD, 2, 1);
                    return r.round((r) => {
                        r = makeMatch(r, sideE, sideB, 2, 1);
                        return r.round((r) => makeMatch(r, sideC, sideE, 2, 1));
                    });
                })
                .withSide(sideA, sideB, sideC, sideD, sideE)
                .build();

            await render(props.withTournament(tournamentData));

            const rounds = getRounds();
            expect(rounds.length).toEqual(3);
            expect(rounds[0].matches).toEqual([
                match('a', '1', 'b', '2', 'b'),
                match('c', '2', 'd', '1', 'a'),
            ]);
            expect(rounds[1].matches).toEqual([
                match('e', '2', 'b', '1', 'a'),
                { sideBmnemonic: 'b' },
            ]);
            expect(rounds[2].matches).toEqual([match('c', '2', 'e', '1', 'a')]);
        });

        it('renders tournament with 4 rounds', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round((r) => {
                    r = makeMatch(r, sideA, sideB, 1, 2);
                    r = makeMatch(r, sideC, sideD, 2, 1);
                    r = makeMatch(r, sideE, sideF, 2, 1);
                    r = makeMatch(r, sideG, sideH, 1, 2);
                    r = makeMatch(r, sideI, sideJ, 1, 2);
                    r = makeMatch(r, sideK, sideL, 1, 2);
                    return r.round((r) => {
                        r = makeMatch(r, sideB, sideC, 2, 1);
                        r = makeMatch(r, sideE, sideH, 2, 1);
                        return r.round((r) => {
                            r = makeMatch(r, sideB, sideE, 2, 1);
                            r = makeMatch(r, sideJ, sideL, 2, 1);
                            return r.round((r) =>
                                makeMatch(r, sideB, sideJ, 2, 1),
                            );
                        });
                    });
                })
                .withSide(sideA, sideB, sideC, sideD, sideE, sideF, sideG)
                .withSide(sideH, sideI, sideJ, sideK, sideL)
                .build();

            await render(props.withTournament(tournamentData));

            const rounds = getRounds();
            expect(rounds.length).toEqual(4);
            expect(rounds[0].matches).toEqual([
                match('a', '1', 'b', '2', 'b'),
                match('c', '2', 'd', '1', 'a'),
                match('e', '2', 'f', '1', 'a'),
                match('g', '1', 'h', '2', 'b'),
                match('i', '1', 'j', '2', 'b'),
                match('k', '1', 'l', '2', 'b'),
            ]);
            expect(rounds[1].matches).toEqual([
                match('b', '2', 'c', '1', 'a'),
                match('e', '2', 'h', '1', 'a'),
                { sideBmnemonic: 'e' },
                { sideBmnemonic: 'h' },
            ]);
            expect(rounds[2].matches).toEqual([
                match('b', '2', 'e', '1', 'a'),
                match('j', '2', 'l', '1', 'a'),
            ]);
            expect(rounds[3].matches).toEqual([match('b', '2', 'j', '1', 'a')]);
        });

        it('does not render winner when insufficient legs played', async () => {
            oneRound2Sides.round!.matchOptions![0].numberOfLegs = 5;

            await render(props.withTournament(oneRound2Sides), {
                teams: [player2Team],
                divisions: [division],
            });

            expect(getWinner().name).toEqual(' ');
        });

        it('does not render winner when 2 matches in final round (semi final is last round so far)', async () => {
            const sideCSinglePlayer: BuilderParam<ITournamentSideBuilder> =
                createSide('C', playerBuilder('PLAYER 3').build());
            const sideDSinglePlayer: BuilderParam<ITournamentSideBuilder> =
                createSide('D', playerBuilder('PLAYER 4').build());
            const tournamentData = tournamentBuilder()
                .round((r) => {
                    r = makeMatch(
                        r,
                        side('A', player1),
                        side('B', player2),
                        1,
                        3,
                        5,
                    );
                    return makeMatch(
                        r,
                        sideCSinglePlayer,
                        sideDSinglePlayer,
                        0,
                        0,
                        5,
                    );
                })
                .withSide((b) => b.name('A').withPlayer(player1))
                .withSide((b) => b.name('B').withPlayer(player2))
                .withSide((b) => b.name('C').withPlayer('PLAYER 3'))
                .withSide((b) => b.name('D').withPlayer('PLAYER 4'))
                .withSide((b) => b.name('E').withPlayer('PLAYER 5'))
                .build();

            await render(props.withTournament(tournamentData), {
                teams: [player2Team],
                divisions: [division],
            });

            expect(getWinner().name).toEqual(' ');
        });

        it('renders winner', async () => {
            await render(props.withTournament(oneRound2Sides), {
                teams: [player2Team],
                divisions: [division],
            });

            expect(getWinner().name).toEqual('B');
            expect(getWinner().link).toEqual(
                `http://localhost/division/${division.name}/player:${encodeURI(player2.name)}@TEAM/${season.name}`,
            );
        });

        it('renders winner when cross-divisional', async () => {
            await render(props.withTournament(oneRound2Sides), {
                teams: [player2Team],
                divisions: [division],
            });

            expect(getWinner().name).toEqual('B');
            expect(getWinner().link).toEqual(
                `http://localhost/division/${division.name}/player:${encodeURI(player2.name)}@TEAM/${season.name}`,
            );
        });

        it('renders who is playing (singles)', async () => {
            await render(props.withTournament(singles), {
                teams: [player1Team],
                divisions: [division],
            });

            expect(getWhoIsPlaying()).toEqual(['1 - A', '2 - B']);
            expect(getWhoIsPlaying(linkHref)).toEqual([
                `http://localhost/division/${division.name}/player:${encodeURI('PLAYER 1')}@TEAM/${season.name}`,
                null,
            ]);
        });

        it('renders who is playing without links when team season deleted', async () => {
            const team = teamBuilder('TEAM')
                .forSeason(season, division, [player1], true)
                .build();

            await render(props.withTournament(singles), {
                teams: [team],
                divisions: [division],
            });

            expect(getWhoIsPlaying()).toEqual(['1 - A', '2 - B']);
            expect(getWhoIsPlaying(linkHref)).toEqual([null, null]);
        });

        it('renders who is playing (teams)', async () => {
            const anotherTeam = teamBuilder('ANOTHER TEAM').build();
            const tournamentData = tournamentBuilder()
                .withSide((b) => b.name('A').teamId(noPlayerTeam.id))
                .withSide((b) => b.name('B').teamId(anotherTeam.id))
                .build();

            await render(props.withTournament(tournamentData), {
                teams: [noPlayerTeam],
                divisions: [division],
            });

            const whosPlaying = getWhoIsPlaying(whoIsPlayingText);
            expect(whosPlaying).toEqual(['1 - A', '2 - B']);
            expect(getWhoIsPlaying(linkHref)).toEqual([
                `http://localhost/division/${division.name}/team:TEAM/${season.name}`,
                `http://localhost/division/${division.name}/team:${anotherTeam.id}/${season.name}`,
            ]);
        });

        it('renders who is playing when cross-divisional', async () => {
            await render(props.withTournament(singles), {
                teams: [noPlayerTeam],
                divisions: [division],
            });

            expect(getWhoIsPlaying()).toEqual(['1 - A', '2 - B']);
            expect(getWhoIsPlaying(linkHref)).toEqual([null, null]);
        });

        it('renders who is playing when team not found', async () => {
            const team = teamBuilder('TEAM')
                .forSeason(anotherSeason, division, [player1, player2])
                .build();

            await render(props.withTournament(singles), {
                teams: [team],
                divisions: [division],
            });

            expect(getWhoIsPlaying()).toEqual(['1 - A', '2 - B']);
            expect(getWhoIsPlaying(linkHref)).toEqual([null, null]);
        });

        it('renders who is playing with no shows', async () => {
            oneRound2Sides.sides!.push(sideBuilder('C').noShow().build());

            await render(props.withTournament(oneRound2Sides), {
                teams: [],
                divisions: [division],
            });

            expect(getWhoIsPlaying()).toEqual(['1 - A', '2 - B', '-3 - C-']);
            expect(getWhoIsPlaying(linkHref)).toEqual([null, null, null]);
        });

        it('renders heading', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .type('TYPE')
                .notes('NOTES')
                .address('ADDRESS')
                .date('2023-06-01')
                .build();

            await render(props.withTournament(tournamentData));

            expect(find('heading')!.textContent).toEqual(
                `TYPE at ADDRESS on ${renderDate('2023-06-01')} - NOTES🔗🖨️`,
            );
        });

        it('renders 180s', async () => {
            oneRound2Sides.oneEighties!.push(player1, player2);
            oneRound2Sides.oneEighties!.push(player1, player1);
            await render(props.withTournament(oneRound2Sides), {
                teams: [player1Team],
                divisions: [division],
            });

            const names = getAccolades('180s');
            expect(names).toEqual(['PLAYER 1 x 3', 'PLAYER 2 x 1']);
            expect(getAccolades('180s', linkHref)).toEqual([
                `http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`,
                null,
            ]);
        });

        it('renders 180s when cross-divisional', async () => {
            oneRound2Sides.oneEighties!.push(player1, player2);
            oneRound2Sides.oneEighties!.push(player1, player1);
            await render(props.withTournament(oneRound2Sides), {
                teams: [player1Team],
                divisions: [division],
            });

            const names = getAccolades('180s');
            expect(names).toEqual(['PLAYER 1 x 3', 'PLAYER 2 x 1']);
            expect(getAccolades('180s', linkHref)).toEqual([
                `http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`,
                null,
            ]);
        });

        it('renders 180s where team division cannot be found', async () => {
            oneRound2Sides.oneEighties!.push(player1, player2);
            oneRound2Sides.oneEighties!.push(player1, player1);
            const team = teamBuilder('TEAM')
                .forSeason(season, null, [player1])
                .build();

            await render(props.withTournament(oneRound2Sides), {
                teams: [team],
                divisions: [division],
            });

            const names = getAccolades('180s');
            expect(names).toEqual(['PLAYER 1 x 3', 'PLAYER 2 x 1']);
            expect(getAccolades('180s', linkHref)).toEqual([
                `http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`,
                null,
            ]);
        });

        it('renders hi checks', async () => {
            oneRound2Sides.over100Checkouts!.push({ ...player1, score: 100 });
            oneRound2Sides.over100Checkouts!.push({ ...player2, score: 120 });

            await render(props.withTournament(oneRound2Sides), {
                teams: [player1Team],
                divisions: [division],
            });

            const names = getAccolades('hi-checks');
            expect(names).toEqual(['PLAYER 1 (100)', 'PLAYER 2 (120)']);
            expect(getAccolades('hi-checks', linkHref)).toEqual([
                `http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`,
                null,
            ]);
        });

        it('renders hi checks when cross-divisional', async () => {
            oneRound2Sides.over100Checkouts!.push({ ...player1, score: 100 });
            oneRound2Sides.over100Checkouts!.push({ ...player2, score: 120 });

            await render(props.withTournament(oneRound2Sides), {
                teams: [player1Team],
                divisions: [division],
            });

            const names = getAccolades('hi-checks');
            expect(names).toEqual(['PLAYER 1 (100)', 'PLAYER 2 (120)']);
            expect(getAccolades('hi-checks', linkHref)).toEqual([
                `http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`,
                null,
            ]);
        });

        it('cannot set match side a when not permitted', async () => {
            await render(props.withTournament(twoRounds4Sides));

            await doClick(find('sideA')!);

            expect(getDialog()).toBeFalsy();
        });

        it('can edit match side a', async () => {
            twoRounds4Sides.sides!.push(sideE(sideBuilder()).build());
            await renderEditable(props.withTournament(twoRounds4Sides));

            await doClick(find('sideA')!);
            await setPlayerAndScore('e', '2');
            await doClick(findButton(getDialog(), 'Save'));

            const matches = updatedTournament!.round!.matches!;
            expect(matches[0].sideA.name).toEqual('e');
            expect(matches[0].scoreA).toEqual(2);
        });

        it('can remove match side a', async () => {
            await renderEditable(props.withTournament(twoRounds4Sides));
            await doClick(find('sideA')!);

            await doClick(findButton(context.container, 'Remove'));

            expect(updatedTournament!.round!.matches![0].sideA.id).toBeFalsy();
            expect(updatedTournament!.round!.matches![0].scoreA).toBeNull();
        });

        it('can edit match side b', async () => {
            twoRounds4Sides.sides!.push(sideE(sideBuilder()).build());
            await renderEditable(props.withTournament(twoRounds4Sides));

            await doClick(find('sideB')!);
            await setPlayerAndScore('e', '2');
            await doClick(findButton(getDialog(), 'Save'));

            const matches = updatedTournament!.round!.matches!;
            expect(matches[0].sideB.name).toEqual('e');
            expect(matches[0].scoreB).toEqual(2);
        });

        it('can remove match side b', async () => {
            await renderEditable(props.withTournament(twoRounds4Sides));
            await doClick(find('sideB')!);

            await doClick(findButton(context.container, 'Remove'));

            expect(updatedTournament!.round!.matches![0].sideB.id).toBeFalsy();
            expect(updatedTournament!.round!.matches![0].scoreB).toBeNull();
        });

        it('can edit 180s', async () => {
            await renderEditable(
                props.withTournament(twoRounds4Sides).withAllPlayers([player1]),
            );

            const s180s = 'div[data-accolades="180s"]';
            await doClick(context.container.querySelector(s180s)!);
            await doSelectOption(
                getDialog()!.querySelector('.dropdown-menu'),
                player1.name,
            );
            await doClick(findButton(getDialog(), '➕'));

            expect(updatedTournament!.oneEighties).toEqual([
                { id: player1.id, name: player1.name },
            ]);
        });

        it('can edit hi checks', async () => {
            await renderEditable(
                props.withTournament(twoRounds4Sides).withAllPlayers([player1]),
            );

            const hiChecks = 'div[data-accolades="hi-checks"]';
            await doClick(context.container.querySelector(hiChecks)!);
            await doSelectOption(
                getDialog()!.querySelector('.dropdown-menu'),
                player1.name,
            );
            await doChange(getDialog()!, 'input', '123', context.user);
            await doClick(findButton(getDialog(), '➕'));

            expect(updatedTournament!.over100Checkouts).toEqual([
                { id: player1.id, name: player1.name, score: 123 },
            ]);
        });

        it('can edit side', async () => {
            await renderEditable(
                props.withTournament(twoRounds4Sides).withAllPlayers([player1]),
                { account },
            );

            await doClick(find('playing')!.querySelector('li')!);
            await doChange(
                getDialog()!,
                'input[name="name"]',
                'NEW SIDE A',
                context.user,
            );
            await doClick(findButton(getDialog(), 'Update'));

            const names = updatedTournament!.sides!.map((s) => s.name);
            expect(names).toEqual(['b', 'c', 'd', 'NEW SIDE A']);
        });

        it('can close edit side dialog', async () => {
            await renderEditable(
                props.withTournament(twoRounds4Sides).withAllPlayers([player1]),
                { account },
            );

            await doClick(find('playing')!.querySelector('li')!);
            await doClick(findButton(getDialog(), 'Close'));

            expect(updatedTournament).toBeNull();
            expect(getDialog()).toBeFalsy();
        });

        it('can add a side', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round((r) =>
                    r.withMatch((m) =>
                        m
                            .sideA(side('A', player1), 1)
                            .sideB(side('B', player2), 2),
                    ),
                )
                .withSide((b) => b.name('A').withPlayer(player1))
                .withSide((b) => b.name('B').withPlayer(player2))
                .build();
            const player3 = playerBuilder('PLAYER 3').build();
            const player3Team = teamBuilder('TEAM')
                .forSeason(season, division, [player3])
                .build();
            await renderEditable(
                props
                    .withTournament(tournamentData)
                    .withAllPlayers([player1, player2, player3]),
                { account, teams: [player1Team, player2Team, player3Team] },
            );
            await doClick(find('add-side')!);

            await doChange(
                getDialog()!,
                'input[name="name"]',
                'NEW SIDE',
                context.user,
            );
            const selector = '.list-group li.list-group-item:not(.disabled)';
            await doClick(getDialog()!.querySelector(selector)!); // select a player
            await doClick(findButton(getDialog(), 'Add'));

            const names = updatedTournament!.sides!.map((s) => s.name);
            expect(names).toEqual(['A', 'B', 'NEW SIDE']);
        });

        it('can remove a side', async () => {
            await renderEditable(props.withTournament(oneRound2Sides), {
                account,
            });
            context.prompts.respondToConfirm(
                'Are you sure you want to remove A?',
                true,
            );

            await doClick(
                find('playing')!.querySelector('li.list-group-item')!,
            );
            await doClick(findButton(getDialog(), 'Delete side'));

            expect(updatedTournament!.sides!.map((s) => s.name)).toEqual(['B']);
        });
    });

    describe('unplayed tournament', () => {
        const division = divisionBuilder('DIVISION').build();
        const season = seasonBuilder('SEASON').withDivision(division).build();
        const matchOptionDefaults = matchOptionsBuilder().build();
        const account = user({});
        const player1 = playerBuilder('PLAYER 1').build();
        const player1Team = teamBuilder('TEAM')
            .forSeason(season, division, [player1])
            .build();
        const emptyTournament: TournamentGameDto = tournamentBuilder().build();
        const sideAandB: TournamentGameDto = tournamentBuilder()
            .withSide((b) => b.name('A'))
            .withSide((b) => b.name('B'))
            .build();
        const props = new tournamentContainerPropsBuilder({
            season,
            division,
            matchOptionDefaults,
            setTournamentData,
            setEditTournament,
        });

        it('renders tournament with 2 sides', async () => {
            await render(props.withTournament(sideAandB));

            expect(getRounds()[0]).toEqual({
                heading: 'Final',
                hiChecks: { players: [] },
                oneEighties: { players: [] },
                matches: [{}],
            });
        });

        it('renders tournament with 2 sides and one no-show', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .withSide((b) => b.name('A'))
                .withSide((b) => b.name('B'))
                .withSide((b) => b.name('NO SHOW').noShow())
                .build();

            await render(props.withTournament(tournamentData));

            expect(getRounds()[0]).toEqual({
                heading: 'Final',
                hiChecks: { players: [] },
                oneEighties: { players: [] },
                matches: [{}],
            });
        });

        it('renders who is playing', async () => {
            await render(props.withTournament(sideAandB));

            expect(getWhoIsPlaying()).toEqual(['1 - A', '2 - B']);
        });

        it('renders who is playing when cross-divisional', async () => {
            await render(props.withTournament(sideAandB));

            expect(getWhoIsPlaying()).toEqual(['1 - A', '2 - B']);
        });

        it('renders heading', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .type('TYPE')
                .notes('NOTES')
                .address('ADDRESS')
                .date('2023-06-01')
                .build();

            await render(props.withTournament(tournamentData));

            expect(find('heading')!.textContent).toEqual(
                `TYPE at ADDRESS on ${renderDate('2023-06-01')} - NOTES🔗🖨️`,
            );
        });

        it('can set match side a', async () => {
            await renderEditable(props.withTournament(sideAandB));

            await doClick(find('sideA')!);
            await setPlayerAndScore('A', '2');
            await doClick(findButton(getDialog(), 'Save'));

            const matches = updatedTournament!.round!.matches!;
            expect(matches[0].sideA.name).toEqual('A');
            expect(matches[0].scoreA).toEqual(2);
        });

        it('can set match side b', async () => {
            await renderEditable(props.withTournament(sideAandB));

            await doClick(find('sideB')!);
            await setPlayerAndScore('A', '2');
            await doClick(findButton(getDialog(), 'Save'));

            const matches = updatedTournament!.round!.matches!;
            expect(matches[0].sideB.name).toEqual('A');
            expect(matches[0].scoreB).toEqual(2);
        });

        it('cannot set match side to no-show side', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .withSide((b) => b.name('A'))
                .withSide((b) => b.name('B'))
                .withSide((b) => b.name('NO SHOW').noShow())
                .build();
            await renderEditable(props.withTournament(tournamentData));

            await doClick(find('sideB')!);

            const selector =
                'div.btn-group:nth-child(2) .dropdown-menu .dropdown-item';
            const sides = Array.from(getDialog()!.querySelectorAll(selector));
            expect(sides.map((s) => s.textContent)).toEqual(['A', 'B']);
        });

        it('can add a side', async () => {
            await renderEditable(
                props.withTournament(emptyTournament).withAllPlayers([player1]),
                { teams: [player1Team], account },
            );

            await doClick(find('add-side')!);
            await doChange(
                getDialog()!,
                'input[name="name"]',
                'NEW SIDE',
                context.user,
            );
            const player = '.list-group li.list-group-item';
            await doClick(getDialog()!.querySelector(player)!); // select a player
            await doClick(findButton(getDialog(), 'Add'));

            const names = updatedTournament!.sides!.map((s) => s.name);
            expect(names).toEqual(['NEW SIDE']);
        });

        it('can add sides from hint', async () => {
            await renderEditable(
                props.withTournament(emptyTournament).withAllPlayers([player1]),
                { teams: [player1Team], account },
            );

            const selector = 'div[datatype="add-sides-hint"] > span';
            await doClick(context.container.querySelector(selector)!);

            expect(getDialog()).toBeTruthy();
        });

        it('does not show add sides hint when some sides', async () => {
            await renderEditable(
                props.withTournament(sideAandB).withAllPlayers([player1]),
                { teams: [player1Team], account },
            );

            expect(find('add-sides-hint')).toBeFalsy();
        });

        it('can close add a side dialog', async () => {
            await renderEditable(
                props.withTournament(emptyTournament).withAllPlayers([player1]),
                { teams: [player1Team], account },
            );

            await doClick(find('add-side')!);
            await doClick(findButton(getDialog(), 'Close'));

            expect(updatedTournament).toBeNull();
            expect(getDialog()).toBeFalsy();
        });

        it('can remove a side', async () => {
            await renderEditable(props.withTournament(sideAandB), {
                account,
            });
            context.prompts.respondToConfirm(
                'Are you sure you want to remove A?',
                true,
            );

            await doClick(
                find('playing')!.querySelector('li.list-group-item')!,
            );
            await doClick(findButton(getDialog(), 'Delete side'));

            expect(updatedTournament!.sides!.map((s) => s.name)).toEqual(['B']);
        });
    });

    describe('interactivity', () => {
        const division = divisionBuilder('DIVISION').build();
        const season = seasonBuilder('SEASON').withDivision(division).build();
        const matchOptionDefaults = matchOptionsBuilder().build();
        const tournamentData = tournamentBuilder().round().build();
        const containerProps = new tournamentContainerPropsBuilder({
            season,
            division,
            matchOptionDefaults,
            setTournamentData,
            setEditTournament,
        });

        it('can edit tournament when permitted', async () => {
            await renderEditable(containerProps.withTournament(tournamentData));

            await doClick(find('heading')!);

            expect(editTournament).toEqual(true);
        });

        it('cannot edit tournament when not permitted', async () => {
            const readonlyContainerProps = containerProps
                .withTournament(tournamentData)
                .build();
            readonlyContainerProps.setEditTournament = undefined;
            await renderComponent(
                readonlyContainerProps,
                { editable: true },
                appProps({}, reportedError),
            );

            await doClick(find('heading')!);

            expect(editTournament).toEqual(null);
        });
    });
});
