import {
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    IComponent,
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
        selector?: (e: IComponent) => T,
        container?: IComponent,
    ): T[] {
        return (container ?? context)
            .all(`div[data-accolades="${name}"] div`)
            .map((c) => (selector ? selector(c) : (c.text() as T)));
    }

    function getPlayers(round: IComponent, name: string) {
        if (!round.optional(`div[data-accolades="${name}"]`)) {
            return null;
        }

        return {
            players: getAccolades(name, undefined, round),
        };
    }

    function getRounds() {
        return context.all('div[datatype^="round-"]').map((r) => {
            return {
                oneEighties: getPlayers(r, '180s'),
                hiChecks: getPlayers(r, 'hi-checks'),
                heading: r.required('[datatype="round-name"]').text(),
                matches: r
                    .all('div[datatype="match"]')
                    .map((match): ISideInfo => {
                        function set(
                            selector: string,
                            name: string,
                            g?: (element: IComponent) => any,
                        ) {
                            const e = match.optional(selector);
                            if (e) {
                                const v = g ? g(e) : e.text().trim();
                                if (v) {
                                    info[name] = v;
                                }
                            }
                        }

                        const info: ISideInfo = {
                            saygLink: match
                                .optional('a')
                                ?.element<HTMLAnchorElement>().href,
                        };

                        set(
                            'div[datatype="sideA"]',
                            'sideAwinner',
                            (e) => e.className().indexOf('bg-winner') !== -1,
                        );
                        set(
                            'div[datatype="sideB"]',
                            'sideBwinner',
                            (e) => e.className().indexOf('bg-winner') !== -1,
                        );
                        set('span[datatype="sideAname"]', 'sideAname');
                        set('span[datatype="sideBname"]', 'sideBname');
                        set('span[datatype="sideAmnemonic"]', 'sideAmnemonic');
                        set('span[datatype="sideBmnemonic"]', 'sideBmnemonic');
                        set('div[datatype="scoreA"]', 'scoreA');
                        set('div[datatype="scoreB"]', 'scoreB');

                        return info;
                    }),
            };
        });
    }

    function getWhoIsPlaying<T>(selector?: (e: IComponent) => T): T[] {
        return context.all('div[datatype="playing"] li').map((li) => {
            return selector ? selector(li) : (whoIsPlayingText(li) as T);
        });
    }

    function whoIsPlayingText(li: IComponent): string {
        return li.className().indexOf('text-decoration-line-through') !== -1
            ? '-' + li.text() + '-'
            : li.text();
    }

    function linkHref(container: IComponent): string | null {
        return (
            container.optional('a')?.element<HTMLAnchorElement>().href ?? null
        );
    }

    function getWinner(): { name: string; link?: string } {
        const element = context.required('[datatype="winner"]');

        return {
            name: element.required('span').text()!,
            link: element.optional('a')?.element<HTMLAnchorElement>().href,
        };
    }

    function find(
        dataType: string,
        container?: IComponent,
    ): IComponent | undefined {
        return (container ?? context).optional(`[datatype="${dataType}"]`);
    }

    function dialog(): IComponent {
        return context.required('div.modal-dialog');
    }

    async function setPlayerAndScore(side: string, score: string) {
        await dialog()
            .required('div.btn-group:nth-child(2) .dropdown-menu')
            .select(side);
        await dialog()
            .required('div.btn-group:nth-child(4) .dropdown-menu')
            .select(score);
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
        const sideA = createSide('a');
        const sideB = createSide('b');
        const sideC = createSide('c');
        const sideD = createSide('d');
        const sideE = createSide('e');
        const sideF = createSide('f');
        const sideG = createSide('g');
        const sideH = createSide('h');
        const sideI = createSide('i');
        const sideJ = createSide('j');
        const sideK = createSide('k');
        const sideL = createSide('l');
        const division = divisionBuilder('DIVISION').build();
        const season = seasonBuilder('SEASON').withDivision(division).build();
        const anotherSeason = seasonBuilder('SEASON').build();
        const matchOptionDefaults = matchOptionsBuilder().build();
        const player1 = playerBuilder('PLAYER 1').build();
        const player2 = playerBuilder('PLAYER 2').build();
        const player3 = playerBuilder('PLAYER 3').build();
        const player4 = playerBuilder('PLAYER 4').build();
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
        const singles = tournamentBuilder()
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

            const m = match('A', '1', 'B', '2', 'b');
            expect(getRounds()[0].matches).toEqual([m]);
        });

        it('renders tournament with sayg id', async () => {
            const saygId = createTemporaryId();
            oneRound2Sides.round!.matches![0].saygId = saygId;

            await render(props.withTournament(oneRound2Sides));

            const liveUrl = 'http://localhost/live/match/?id=' + saygId;
            const m = match('A', '1', 'B', '2', 'b', liveUrl);
            expect(getRounds()[0].matches).toEqual([m]);
        });

        it('renders incomplete tournament with six sides and one round', async () => {
            const tournamentData = tournamentBuilder()
                .round((r) => {
                    r = makeMatch(r, sideA, sideB, 0, 0);
                    r = makeMatch(r, sideC, sideD, 0, 0);
                    return makeMatch(r, sideE, sideF, 0, 0);
                })
                .withSide(sideA, sideB, sideC, sideD, sideE, sideF);

            await render(props.withTournament(tournamentData.build()));

            const rounds = getRounds();
            expect(rounds.length).toEqual(3);
            expect(rounds[0].matches).toEqual([
                match('a', '0', 'b', '0'),
                match('c', '0', 'd', '0'),
                match('e', '0', 'f', '0'),
            ]);
            expect(rounds[1].matches).toEqual([
                {},
                { sideAmnemonic: 'winner(M1)', sideBmnemonic: 'winner(M2)' },
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
            const tournamentData = tournamentBuilder()
                .round((r) => {
                    r = makeMatch(r, sideA, sideB, 1, 2);
                    r = makeMatch(r, sideC, sideD, 2, 1);
                    return r.round((r) => {
                        r = makeMatch(r, sideE, sideB, 2, 1);
                        return r.round((r) => makeMatch(r, sideC, sideE, 2, 1));
                    });
                })
                .withSide(sideA, sideB, sideC, sideD, sideE);

            await render(props.withTournament(tournamentData.build()));

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
            const tournamentData = tournamentBuilder()
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
                .withSide(sideH, sideI, sideJ, sideK, sideL);

            await render(props.withTournament(tournamentData.build()));

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
                { sideAmnemonic: 'b', sideBmnemonic: 'c' },
                { sideAmnemonic: 'e', sideBmnemonic: 'h' },
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
            const sideA = createSide('A', player1);
            const sideB = createSide('B', player2);
            const sideC = createSide('C', player3);
            const sideD = createSide('D', player4);
            const tournamentData = tournamentBuilder()
                .round((r) => {
                    r = makeMatch(r, sideA, sideB, 1, 3, 5);
                    return makeMatch(r, sideC, sideD, 0, 0, 5);
                })
                .withSide((b) => b.name('A').withPlayer(player1))
                .withSide((b) => b.name('B').withPlayer(player2))
                .withSide((b) => b.name('C').withPlayer('PLAYER 3'))
                .withSide((b) => b.name('D').withPlayer('PLAYER 4'))
                .withSide((b) => b.name('E').withPlayer('PLAYER 5'));

            await render(props.withTournament(tournamentData.build()), {
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

            const link = `http://localhost/division/${division.name}/player:${encodeURI(player2.name)}@TEAM/${season.name}`;
            expect(getWinner().name).toEqual('B');
            expect(getWinner().link).toEqual(link);
        });

        it('renders winner when cross-divisional', async () => {
            await render(props.withTournament(oneRound2Sides), {
                teams: [player2Team],
                divisions: [division],
            });

            const link = `http://localhost/division/${division.name}/player:${encodeURI(player2.name)}@TEAM/${season.name}`;
            expect(getWinner().name).toEqual('B');
            expect(getWinner().link).toEqual(link);
        });

        it('renders who is playing (singles)', async () => {
            await render(props.withTournament(singles), {
                teams: [player1Team],
                divisions: [division],
            });

            const link = `http://localhost/division/${division.name}/player:${encodeURI('PLAYER 1')}@TEAM/${season.name}`;
            expect(getWhoIsPlaying()).toEqual(['1 - A', '2 - B']);
            expect(getWhoIsPlaying(linkHref)).toEqual([link, null]);
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
                .withSide((b) => b.name('B').teamId(anotherTeam.id));

            await render(props.withTournament(tournamentData.build()), {
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
            const tournamentData = tournamentBuilder()
                .type('TYPE')
                .notes('NOTES')
                .address('ADDRESS')
                .date('2023-06-01');

            await render(props.withTournament(tournamentData.build()));

            const heading = `TYPE at ADDRESS on ${renderDate('2023-06-01')} - NOTES🔗🖨️`;
            expect(find('heading')!.text()).toEqual(heading);
        });

        it('renders 180s', async () => {
            oneRound2Sides.oneEighties!.push(player1, player2);
            oneRound2Sides.oneEighties!.push(player1, player1);
            await render(props.withTournament(oneRound2Sides), {
                teams: [player1Team],
                divisions: [division],
            });

            const names = getAccolades('180s');
            const link = `http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`;
            expect(names).toEqual(['PLAYER 1 x 3', 'PLAYER 2 x 1']);
            expect(getAccolades('180s', linkHref)).toEqual([link, null]);
        });

        it('renders 180s when cross-divisional', async () => {
            oneRound2Sides.oneEighties!.push(player1, player2);
            oneRound2Sides.oneEighties!.push(player1, player1);
            await render(props.withTournament(oneRound2Sides), {
                teams: [player1Team],
                divisions: [division],
            });

            const names = getAccolades('180s');
            const link = `http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`;
            expect(names).toEqual(['PLAYER 1 x 3', 'PLAYER 2 x 1']);
            expect(getAccolades('180s', linkHref)).toEqual([link, null]);
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
            const link = `http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`;
            expect(names).toEqual(['PLAYER 1 x 3', 'PLAYER 2 x 1']);
            expect(getAccolades('180s', linkHref)).toEqual([link, null]);
        });

        it('renders hi checks', async () => {
            oneRound2Sides.over100Checkouts!.push({ ...player1, score: 100 });
            oneRound2Sides.over100Checkouts!.push({ ...player2, score: 120 });

            await render(props.withTournament(oneRound2Sides), {
                teams: [player1Team],
                divisions: [division],
            });

            const names = getAccolades('hi-checks');
            const link = `http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`;
            expect(names).toEqual(['PLAYER 1 (100)', 'PLAYER 2 (120)']);
            expect(getAccolades('hi-checks', linkHref)).toEqual([link, null]);
        });

        it('renders hi checks when cross-divisional', async () => {
            oneRound2Sides.over100Checkouts!.push({ ...player1, score: 100 });
            oneRound2Sides.over100Checkouts!.push({ ...player2, score: 120 });

            await render(props.withTournament(oneRound2Sides), {
                teams: [player1Team],
                divisions: [division],
            });

            const names = getAccolades('hi-checks');
            const link = `http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`;
            expect(names).toEqual(['PLAYER 1 (100)', 'PLAYER 2 (120)']);
            expect(getAccolades('hi-checks', linkHref)).toEqual([link, null]);
        });

        it('cannot set match side a when not permitted', async () => {
            await render(props.withTournament(twoRounds4Sides));

            await find('sideA')!.click();

            expect(context.optional('div.modal-dialog')).toBeFalsy();
        });

        it('can edit match side a', async () => {
            twoRounds4Sides.sides!.push(sideE(sideBuilder()).build());
            await renderEditable(props.withTournament(twoRounds4Sides));

            await find('sideA')!.click();
            await setPlayerAndScore('e', '2');
            await dialog().button('Save').click();

            const matches = updatedTournament!.round!.matches!;
            expect(matches[0].sideA!.name).toEqual('e');
            expect(matches[0].scoreA).toEqual(2);
        });

        it('can remove match side a', async () => {
            await renderEditable(props.withTournament(twoRounds4Sides));
            await find('sideA')!.click();

            await context.button('Remove').click();

            expect(updatedTournament!.round!.matches![0].sideA!.id).toBeFalsy();
            expect(updatedTournament!.round!.matches![0].scoreA).toBeNull();
        });

        it('can edit match side b', async () => {
            twoRounds4Sides.sides!.push(sideE(sideBuilder()).build());
            await renderEditable(props.withTournament(twoRounds4Sides));

            await find('sideB')!.click();
            await setPlayerAndScore('e', '2');
            await dialog().button('Save').click();

            const matches = updatedTournament!.round!.matches!;
            expect(matches[0].sideB!.name).toEqual('e');
            expect(matches[0].scoreB).toEqual(2);
        });

        it('can remove match side b', async () => {
            await renderEditable(props.withTournament(twoRounds4Sides));
            await find('sideB')!.click();

            await context.button('Remove').click();

            expect(updatedTournament!.round!.matches![0].sideB!.id).toBeFalsy();
            expect(updatedTournament!.round!.matches![0].scoreB).toBeNull();
        });

        it('can edit 180s', async () => {
            await renderEditable(
                props.withTournament(twoRounds4Sides).withAllPlayers([player1]),
            );

            const s180s = 'div[data-accolades="180s"]';
            await context.required(s180s).click();
            await dialog().required('.dropdown-menu').select(player1.name);
            await dialog().button('➕').click();

            expect(updatedTournament!.oneEighties).toEqual([
                { id: player1.id, name: player1.name },
            ]);
        });

        it('can edit hi checks', async () => {
            await renderEditable(
                props.withTournament(twoRounds4Sides).withAllPlayers([player1]),
            );

            const hiChecks = 'div[data-accolades="hi-checks"]';
            await context.required(hiChecks).click();
            await dialog().required('.dropdown-menu').select(player1.name);
            await dialog().required('input').change('123');
            await dialog().button('➕').click();

            expect(updatedTournament!.over100Checkouts).toEqual([
                { id: player1.id, name: player1.name, score: 123 },
            ]);
        });

        it('can edit side', async () => {
            await renderEditable(
                props.withTournament(twoRounds4Sides).withAllPlayers([player1]),
                { account },
            );

            await find('playing')!.required('li').click();
            await dialog().input('name').change('NEW SIDE A');
            await dialog().button('Update').click();

            const names = updatedTournament!.sides!.map((s) => s.name);
            expect(names).toEqual(['b', 'c', 'd', 'NEW SIDE A']);
        });

        it('can close edit side dialog', async () => {
            await renderEditable(
                props.withTournament(twoRounds4Sides).withAllPlayers([player1]),
                { account },
            );

            await find('playing')!.required('li').click();
            await dialog().button('Close').click();

            expect(updatedTournament).toBeNull();
            expect(context.optional('div.modal-dialog')).toBeFalsy();
        });

        it('can add a side', async () => {
            const tournamentData = tournamentBuilder()
                .round((r) =>
                    r.withMatch((m) =>
                        m
                            .sideA(side('A', player1), 1)
                            .sideB(side('B', player2), 2),
                    ),
                )
                .withSide((b) => b.name('A').withPlayer(player1))
                .withSide((b) => b.name('B').withPlayer(player2));
            const player3 = playerBuilder('PLAYER 3').build();
            const player3Team = teamBuilder('TEAM')
                .forSeason(season, division, [player3])
                .build();
            await renderEditable(
                props
                    .withTournament(tournamentData.build())
                    .withAllPlayers([player1, player2, player3]),
                { account, teams: [player1Team, player2Team, player3Team] },
            );
            await find('add-side')!.click();

            await dialog().input('name').change('NEW SIDE');
            const selector = '.list-group li.list-group-item:not(.disabled)';
            await dialog().required(selector).click();
            await dialog().button('Add').click();

            const names = updatedTournament!.sides!.map((s) => s.name);
            expect(names).toEqual(['A', 'B', 'NEW SIDE']);
        });

        it('can remove a side', async () => {
            await renderEditable(props.withTournament(oneRound2Sides), {
                account,
            });
            const prompt = 'Are you sure you want to remove A?';
            context.prompts.respondToConfirm(prompt, true);

            await find('playing')!.required('li.list-group-item').click();
            await dialog().button('Delete side').click();

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
            const tournamentData = tournamentBuilder()
                .withSide((b) => b.name('A'))
                .withSide((b) => b.name('B'))
                .withSide((b) => b.name('NO SHOW').noShow());

            await render(props.withTournament(tournamentData.build()));

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
            const tournamentData = tournamentBuilder()
                .type('TYPE')
                .notes('NOTES')
                .address('ADDRESS')
                .date('2023-06-01');

            await render(props.withTournament(tournamentData.build()));

            const heading = `TYPE at ADDRESS on ${renderDate('2023-06-01')} - NOTES🔗🖨️`;
            expect(find('heading')!.text()).toEqual(heading);
        });

        it('can set match side a', async () => {
            await renderEditable(props.withTournament(sideAandB));

            await find('sideA')!.click();
            await setPlayerAndScore('A', '2');
            await dialog().button('Save').click();

            const matches = updatedTournament!.round!.matches!;
            expect(matches[0].sideA!.name).toEqual('A');
            expect(matches[0].scoreA).toEqual(2);
        });

        it('can set match side b', async () => {
            await renderEditable(props.withTournament(sideAandB));

            await find('sideB')!.click();
            await setPlayerAndScore('A', '2');
            await dialog().button('Save').click();

            const matches = updatedTournament!.round!.matches!;
            expect(matches[0].sideB!.name).toEqual('A');
            expect(matches[0].scoreB).toEqual(2);
        });

        it('cannot set match side to no-show side', async () => {
            const tournamentData = tournamentBuilder()
                .withSide((b) => b.name('A'))
                .withSide((b) => b.name('B'))
                .withSide((b) => b.name('NO SHOW').noShow());
            await renderEditable(props.withTournament(tournamentData.build()));

            await find('sideB')!.click();

            const selector =
                'div.btn-group:nth-child(2) .dropdown-menu .dropdown-item';
            const sides = dialog().all(selector);
            expect(sides.map((s) => s.text())).toEqual(['A', 'B']);
        });

        it('can add a side', async () => {
            await renderEditable(
                props.withTournament(emptyTournament).withAllPlayers([player1]),
                { teams: [player1Team], account },
            );

            await find('add-side')!.click();
            await dialog().input('name').change('NEW SIDE');
            const player = '.list-group li.list-group-item';
            await dialog().required(player).click();
            await dialog().button('Add').click();

            const names = updatedTournament!.sides!.map((s) => s.name);
            expect(names).toEqual(['NEW SIDE']);
        });

        it('can add sides from hint', async () => {
            await renderEditable(
                props.withTournament(emptyTournament).withAllPlayers([player1]),
                { teams: [player1Team], account },
            );

            const selector = 'div[datatype="add-sides-hint"] > span';
            await context.required(selector).click();

            expect(dialog()).toBeTruthy();
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

            await find('add-side')!.click();
            await dialog().button('Close').click();

            expect(updatedTournament).toBeNull();
            expect(context.optional('div.modal-dialog')).toBeFalsy();
        });

        it('can remove a side', async () => {
            await renderEditable(props.withTournament(sideAandB), {
                account,
            });
            const prompt = 'Are you sure you want to remove A?';
            context.prompts.respondToConfirm(prompt, true);

            await find('playing')!.required('li.list-group-item').click();
            await dialog().button('Delete side').click();

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

            await find('heading')!.click();

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

            await find('heading')!.click();

            expect(editTournament).toEqual(null);
        });
    });
});
