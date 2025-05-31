import {
    appProps,
    brandingProps,
    cleanUp, doChange,
    doClick, doSelectOption,
    ErrorState, findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {ITournamentContainerProps, TournamentContainer} from "./TournamentContainer";
import {IPrintableSheetProps, PrintableSheet} from "./PrintableSheet";
import {renderDate} from "../../helpers/rendering";
import {createTemporaryId} from "../../helpers/projection";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {TeamPlayerDto} from "../../interfaces/models/dtos/Team/TeamPlayerDto";
import {ITournamentSideBuilder, sideBuilder, tournamentBuilder} from "../../helpers/builders/tournaments";
import {matchOptionsBuilder} from "../../helpers/builders/games";
import {playerBuilder} from "../../helpers/builders/players";
import {teamBuilder} from "../../helpers/builders/teams";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {divisionBuilder} from "../../helpers/builders/divisions";
import {IAppContainerProps} from "../common/AppContainer";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {tournamentContainerPropsBuilder} from "./tournamentContainerPropsBuilder";
import {BuilderParam} from "../../helpers/builders/builders";

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

    async function renderComponent(containerProps: ITournamentContainerProps, props: IPrintableSheetProps, appProps: IAppContainerProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps,
            (<TournamentContainer {...containerProps}>
                <PrintableSheet {...props} />
            </TournamentContainer>));
    }

    function createSide(name: string, players?: TeamPlayerDto[]): BuilderParam<ITournamentSideBuilder> {
        return (builder) => {
            const side = builder.name(name);

            if (players && players.length === 1) {
                return side.withPlayer(players[0]);
            }

            return side;
        }
    }

    function getRounds() {
        return Array.from(context.container.querySelectorAll('div[datatype^="round-"]'))
            .map(round => {
                return {
                    //element: round,
                    oneEighties: round.querySelector('div[data-accolades="180s"]') ? {
                        //element: round.querySelector('div[data-accolades="180s"]'),
                        players: Array.from(round.querySelectorAll('div[data-accolades="180s"] div')).map(e => e.textContent),
                    } : null,
                    hiChecks: round.querySelector('div[data-accolades="hi-checks"]') ? {
                        //element: round.querySelector('div[data-accolades="hi-checks"]'),
                        players: Array.from(round.querySelectorAll('div[data-accolades="180s"] div')).map(e => e.textContent),
                    } : null,
                    heading: round.querySelector('h5[datatype="round-name"]')!.textContent,
                    matches: Array.from(round.querySelectorAll('div[datatype="match"]'))
                        .map((match: Element): ISideInfo => {
                            function setInfo(selector: string, name: string, getter: (element: Element) => any) {
                                const element = match.querySelector(selector);
                                if (element) {
                                    const value = getter(element);
                                    if (value) {
                                        info[name] = value;
                                    }
                                }
                            }

                            const info: ISideInfo = {
                                saygLink: match.querySelector('a')
                                    ? match.querySelector('a')!.href
                                    : undefined,
                            };

                            setInfo(
                                'div[datatype="sideA"]',
                                'sideAwinner',
                                (e: Element) => e.className.indexOf('bg-winner') !== -1);
                            setInfo(
                                'div[datatype="sideB"]',
                                'sideBwinner',
                                (e: Element) => e.className.indexOf('bg-winner') !== -1);
                            setInfo(
                                'span[datatype="sideAname"]',
                                'sideAname',
                                (e: Element) => e.textContent!.trim());
                            setInfo(
                                'span[datatype="sideBname"]',
                                'sideBname',
                                (e: Element) => e.textContent!.trim());
                            setInfo(
                                'span[datatype="sideAmnemonic"]',
                                'sideAmnemonic',
                                (e: Element) => e.textContent!.trim());
                            setInfo(
                                'span[datatype="sideBmnemonic"]',
                                'sideBmnemonic',
                                (e: Element) => e.textContent!.trim());
                            setInfo(
                                'div[datatype="scoreA"]',
                                'scoreA',
                                (e: Element) => e.textContent!.trim());
                            setInfo(
                                'div[datatype="scoreB"]',
                                'scoreB',
                                (e: Element) => e.textContent!.trim());

                            return info;
                        }),
                }
            });
    }

    function getWhoIsPlaying<T>(selector: (e: Element) => T): T[] {
        return Array.from(context.container.querySelectorAll('div[datatype="playing"] li'))
            .map(selector);
    }

    function whoIsPlayingText(li: Element): string {
        return li.className.indexOf('text-decoration-line-through') !== -1
            ? '-' + li.textContent + '-'
            : li.textContent!;
    }

    function linkHref(container: Element): string | null {
        const link = container.querySelector('a');
        return link ? link.href : null;
    }

    function getAccolades<T>(name: string, selector: (e: Element) => T): T[] {
        return Array.from(context.container.querySelectorAll('div[data-accolades="' + name + '"] div'))
            .map(selector);
    }

    function getWinner(): { name: string, link?: string } {
        const winnerElement = context.container.querySelector('div[datatype="winner"]')!;

        return {
            name: winnerElement.querySelector('span')!.textContent!,
            link: winnerElement.querySelector('a')
                ? winnerElement.querySelector('a')!.href
                : undefined,
        };
    }

    function match(sideA: string, scoreA: string, sideB: string, scoreB: string, winner?: string, saygLink?: string): ISideInfo {
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
        const season: SeasonDto = seasonBuilder('SEASON').withDivision(division).build();
        const anotherSeason: SeasonDto = seasonBuilder('SEASON').build();
        const matchOptionDefaults = matchOptionsBuilder().build();
        const player1: TeamPlayerDto = playerBuilder('PLAYER 1').build();
        const player2: TeamPlayerDto = playerBuilder('PLAYER 2').build();
        const account: UserDto = {
            name: '',
            givenName: '',
            emailAddress: '',
            access: {}
        };
        const player1Team: TeamDto = teamBuilder('TEAM')
            .forSeason(season, division, [player1])
            .build();
        const player2Team: TeamDto = teamBuilder('TEAM')
            .forSeason(season, division, [player2])
            .build();
        const noPlayerTeam: TeamDto = teamBuilder('TEAM')
            .forSeason(season, division)
            .build();
        const singlePlayerTournament: TournamentGameDto = tournamentBuilder()
            .withSide(b => b.name('A').withPlayer(player1))
            .withSide(b => b.name('B').withPlayer(player2))
            .build();
        let twoRoundTournament4Sides: TournamentGameDto;
        let oneRoundTournament2Sides: TournamentGameDto;
        const containerProps = new tournamentContainerPropsBuilder({
            season,
            division,
            matchOptionDefaults,
            setTournamentData,
            setEditTournament,
        });

        beforeEach(() => {
            twoRoundTournament4Sides = tournamentBuilder()
                .round(r => r
                    .withMatch(m => m.sideA(sideA, 1).sideB(sideB, 2))
                    .withMatch(m => m.sideA(sideC, 2).sideB(sideD, 1))
                    .withMatchOption(o => o.numberOfLegs(3))
                    .withMatchOption(o => o.numberOfLegs(3))
                    .round(r => r
                        .withMatch(m => m.sideA(sideB, 2).sideB(sideC, 1))
                        .withMatchOption(o => o.numberOfLegs(3))))
                .withSide(sideA).withSide(sideB).withSide(sideC).withSide(sideD)
                .build();

            oneRoundTournament2Sides = tournamentBuilder()
                .round(r => r
                    .withMatch(m => m
                        .sideA(sideBuilder('A').withPlayer(player1).build(), 1)
                        .sideB(sideBuilder('B').withPlayer(player2).build(), 2))
                    .withMatchOption(o => o.numberOfLegs(3)))
                .withSide(b => b.name('A').withPlayer(player1))
                .withSide(b => b.name('B').withPlayer(player2))
                .build();
        });

        it('renders tournament with one round', async () => {
            await renderComponent(
                containerProps.withTournament(oneRoundTournament2Sides).build(),
                {},
                appProps({}, reportedError));

            const rounds = getRounds();
            expect(rounds.length).toEqual(1);
            expect(rounds[0].matches).toEqual([
                match('A', '1', 'B', '2', 'b'),
            ]);
        });

        it('renders tournament with sayg id', async () => {
            const saygId = createTemporaryId();
            oneRoundTournament2Sides.round!.matches![0].saygId = saygId;

            await renderComponent(
                containerProps.withTournament(oneRoundTournament2Sides).build(),
                {},
                appProps({}, reportedError));

            const rounds = getRounds();
            expect(rounds.length).toEqual(1);
            expect(rounds[0].matches).toEqual([
                match('A', '1', 'B', '2', 'b', 'http://localhost/live/match/?id=' + saygId),
            ]);
        });

        it('renders incomplete tournament with six sides and one round', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round(r => r
                    .withMatch(m => m.sideA(sideA, 0).sideB(sideB, 0))
                    .withMatch(m => m.sideA(sideC, 0).sideB(sideD, 0))
                    .withMatch(m => m.sideA(sideE, 0).sideB(sideF, 0))
                    .withMatchOption(o => o.numberOfLegs(3))
                    .withMatchOption(o => o.numberOfLegs(3))
                    .withMatchOption(o => o.numberOfLegs(3)))
                .withSide(sideA).withSide(sideB).withSide(sideC).withSide(sideD).withSide(sideE).withSide(sideF)
                .build();

            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                {},
                appProps({}, reportedError));

            const rounds = getRounds();
            expect(rounds.length).toEqual(3);
            expect(rounds[0].matches).toEqual([
                match('a', '0', 'b', '0'),
                match('c', '0', 'd', '0'),
                match('e', '0', 'f', '0'),
            ]);
            expect(rounds[1].matches).toEqual([
                { sideBmnemonic: 'winner(M1)', },
                { sideBmnemonic: 'winner(M2)', },
            ]);
            expect(rounds[2].matches).toEqual([{}]);
        });

        it('renders tournament with 2 rounds', async () => {
            await renderComponent(
                containerProps.withTournament(twoRoundTournament4Sides).build(),
                {},
                appProps({}, reportedError));

            const rounds = getRounds();
            expect(rounds.length).toEqual(2);
            expect(rounds[0].matches).toEqual([
                match('a', '1', 'b', '2', 'b'),
                match('c', '2', 'd', '1', 'a'),
            ]);
            expect(rounds[1].matches).toEqual([
                match('b', '2', 'c', '1', 'a'),
            ]);
        });

        it('renders tournament with 3 rounds', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round(r => r
                    .withMatch(m => m.sideA(sideA, 1).sideB(sideB, 2))
                    .withMatch(m => m.sideA(sideC, 2).sideB(sideD, 1))
                    .withMatchOption(o => o.numberOfLegs(3))
                    .withMatchOption(o => o.numberOfLegs(3))
                    .round(r => r
                        .withMatch(m => m.sideA(sideE, 2).sideB(sideB, 1))
                        .withMatchOption(o => o.numberOfLegs(3))
                        .round(r => r
                            .withMatch(m => m.sideA(sideC, 2).sideB(sideE, 1))
                            .withMatchOption(o => o.numberOfLegs(3)))))
                .withSide(sideA).withSide(sideB).withSide(sideC).withSide(sideD).withSide(sideE)
                .build();

            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                {},
                appProps({}, reportedError));

            const rounds = getRounds();
            expect(rounds.length).toEqual(3);
            expect(rounds[0].matches).toEqual([
                match('a', '1', 'b', '2', 'b'),
                match('c', '2', 'd', '1', 'a'),
            ]);
            expect(rounds[1].matches).toEqual([
                match('e', '2', 'b', '1', 'a'),
                { sideBmnemonic: 'b', },
            ]);
            expect(rounds[2].matches).toEqual([
                match('c', '2', 'e', '1', 'a'),
            ]);
        });

        it('renders tournament with 4 rounds', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round(r => r
                    .withMatch(m => m.sideA(sideA, 1).sideB(sideB, 2))
                    .withMatch(m => m.sideA(sideC, 2).sideB(sideD, 1))
                    .withMatch(m => m.sideA(sideE, 2).sideB(sideF, 1))
                    .withMatch(m => m.sideA(sideG, 1).sideB(sideH, 2))
                    .withMatch(m => m.sideA(sideI, 1).sideB(sideJ, 2))
                    .withMatch(m => m.sideA(sideK, 1).sideB(sideL, 2))
                    .withMatchOption(o => o.numberOfLegs(3))
                    .withMatchOption(o => o.numberOfLegs(3))
                    .withMatchOption(o => o.numberOfLegs(3))
                    .withMatchOption(o => o.numberOfLegs(3))
                    .withMatchOption(o => o.numberOfLegs(3))
                    .withMatchOption(o => o.numberOfLegs(3))
                    .round(r => r
                        .withMatch(m => m.sideA(sideB, 2).sideB(sideC, 1))
                        .withMatch(m => m.sideA(sideE, 2).sideB(sideH, 1))
                        .withMatchOption(o => o.numberOfLegs(3))
                        .withMatchOption(o => o.numberOfLegs(3))
                        .round(r => r
                            .withMatch(m => m.sideA(sideB, 2).sideB(sideE, 1))
                            .withMatch(m => m.sideA(sideJ, 2).sideB(sideL, 1))
                            .withMatchOption(o => o.numberOfLegs(3))
                            .withMatchOption(o => o.numberOfLegs(3))
                            .round(r => r
                                .withMatch(m => m.sideA(sideB, 2).sideB(sideJ, 1))
                                .withMatchOption(o => o.numberOfLegs(3))))))
                .withSide(sideA).withSide(sideB).withSide(sideC).withSide(sideD).withSide(sideE).withSide(sideF)
                .withSide(sideG).withSide(sideH).withSide(sideI).withSide(sideJ).withSide(sideK).withSide(sideL)
                .build();

            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                {},
                appProps({}, reportedError));

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
                { sideBmnemonic: 'e', },
                { sideBmnemonic: 'h', },
            ]);
            expect(rounds[2].matches).toEqual([
                match('b', '2', 'e', '1', 'a'),
                match('j', '2', 'l', '1', 'a'),
            ]);
            expect(rounds[3].matches).toEqual([
                match('b', '2', 'j', '1', 'a'),
            ]);
        });

        it('does not render winner when insufficient legs played', async () => {
            oneRoundTournament2Sides.round!.matchOptions![0].numberOfLegs = 5;

            await renderComponent(
                containerProps.withTournament(oneRoundTournament2Sides).build(),
                {},
                appProps({ teams: [player2Team], divisions: [division] }, reportedError));

            const winner = getWinner();
            expect(winner).toEqual({
                name: ' ',
            });
        });

        it('does not render winner when 2 matches in final round (semi final is last round so far)', async () => {
            const sideCSinglePlayer: BuilderParam<ITournamentSideBuilder> = createSide('C', [playerBuilder('PLAYER 3').build()]);
            const sideDSinglePlayer: BuilderParam<ITournamentSideBuilder> = createSide('D', [playerBuilder('PLAYER 4').build()]);
            const tournamentData = tournamentBuilder()
                .round(r => r
                    .withMatch(m => m
                        .sideA(sideBuilder('A').withPlayer(player1).build(), 1)
                        .sideB(sideBuilder('B').withPlayer(player2).build(), 3))
                    .withMatch(m => m
                        .sideA(sideCSinglePlayer, 0)
                        .sideB(sideDSinglePlayer, 0))
                    .withMatchOption(o => o.numberOfLegs(5))
                    .withMatchOption(o => o.numberOfLegs(5)))
                .withSide(b => b.name('A').withPlayer(player1))
                .withSide(b => b.name('B').withPlayer(player2))
                .withSide(b => b.name('C').withPlayer('PLAYER 3'))
                .withSide(b => b.name('D').withPlayer('PLAYER 4'))
                .withSide(b => b.name('E').withPlayer('PLAYER 5'))
                .build();

            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                {},
                appProps({teams: [player2Team], divisions: [division]}, reportedError));

            expect(getWinner()).toEqual({
                name: ' ',
            });
        });

        it('renders winner', async () => {
            await renderComponent(
                containerProps.withTournament(oneRoundTournament2Sides).build(),
                {},
                appProps({ teams: [player2Team], divisions: [division] }, reportedError));

            const winner = getWinner();
            expect(winner.name).toEqual('B');
            expect(winner.link).toEqual(`http://localhost/division/${division.name}/player:${encodeURI(player2.name)}@TEAM/${season.name}`);
        });

        it('renders winner when cross-divisional', async () => {
            await renderComponent(
                containerProps.withTournament(oneRoundTournament2Sides).build(),
                {},
                appProps({ teams: [player2Team], divisions: [division] }, reportedError));

            const winner = getWinner();
            expect(winner.name).toEqual('B');
            expect(winner.link).toEqual(`http://localhost/division/${division.name}/player:${encodeURI(player2.name)}@TEAM/${season.name}`);
        });

        it('renders who is playing (singles)', async () => {
            await renderComponent(
                containerProps.withTournament(singlePlayerTournament).build(),
                {},
                appProps({ teams: [player1Team], divisions: [division] }, reportedError));

            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual(['1 - A', '2 - B']);
            expect(getWhoIsPlaying(linkHref)).toEqual([`http://localhost/division/${division.name}/player:${encodeURI('PLAYER 1')}@TEAM/${season.name}`, null]);
        });

        it('renders who is playing without links when team season deleted', async () => {
            const team: TeamDto = teamBuilder('TEAM')
                .forSeason(season, division, [player1], true)
                .build();

            await renderComponent(
                containerProps.withTournament(singlePlayerTournament).build(),
                {},
                appProps({ teams: [team], divisions: [division] }, reportedError));

            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual(['1 - A', '2 - B']);
            expect(getWhoIsPlaying(linkHref)).toEqual([null, null]);
        });

        it('renders who is playing (teams)', async () => {
            const anotherTeam: TeamDto = teamBuilder('ANOTHER TEAM').build();
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .withSide(b => b.name('A').teamId(noPlayerTeam.id))
                .withSide(b => b.name('B').teamId(anotherTeam.id))
                .build();

            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                {},
                appProps({ teams: [noPlayerTeam], divisions: [division] }, reportedError));

            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual(['1 - A', '2 - B']);
            expect(getWhoIsPlaying(linkHref)).toEqual([
                `http://localhost/division/${division.name}/team:TEAM/${season.name}`,
                `http://localhost/division/${division.name}/team:${anotherTeam.id}/${season.name}`]);
        });

        it('renders who is playing when cross-divisional', async () => {
            await renderComponent(
                containerProps.withTournament(singlePlayerTournament).build(),
                {},
                appProps({ teams: [noPlayerTeam], divisions: [division] }, reportedError));

            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual(['1 - A', '2 - B']);
            expect(getWhoIsPlaying(linkHref)).toEqual([null, null]);
        });

        it('renders who is playing when team not found', async () => {
            const team: TeamDto = teamBuilder('TEAM')
                .forSeason(anotherSeason, division, [ player1, player2 ])
                .build();

            await renderComponent(
                containerProps.withTournament(singlePlayerTournament).build(),
                {},
                appProps({ teams: [team], divisions: [division] }, reportedError));

            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual(['1 - A', '2 - B']);
            expect(getWhoIsPlaying(linkHref)).toEqual([null, null]);
        });

        it('renders who is playing with no shows', async () => {
            oneRoundTournament2Sides.sides!.push(sideBuilder('C').noShow().build());

            await renderComponent(
                containerProps.withTournament(oneRoundTournament2Sides).build(),
                {},
                appProps({ teams: [], divisions: [division] }, reportedError));

            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual(['1 - A', '2 - B', '-3 - C-']);
            expect(getWhoIsPlaying(linkHref)).toEqual([null, null, null]);
        });

        it('renders heading', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .type('TYPE')
                .notes('NOTES')
                .address('ADDRESS')
                .date('2023-06-01')
                .build();

            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                {},
                appProps({}, reportedError));

            const heading = context.container.querySelector('div[datatype="heading"]')!;
            expect(heading.textContent).toEqual(`TYPE at ADDRESS on ${renderDate('2023-06-01')} - NOTES🔗🖨️`);
        });

        it('renders 180s', async () => {
            oneRoundTournament2Sides.oneEighties!.push(player1, player2, player1, player1);
            await renderComponent(
                containerProps.withTournament(oneRoundTournament2Sides).build(),
                {},
                appProps({ teams: [player1Team], divisions: [division] }, reportedError));

            expect(getAccolades('180s', d => d.textContent)).toEqual(['PLAYER 1 x 3', 'PLAYER 2 x 1']);
            expect(getAccolades('180s', linkHref))
                .toEqual([`http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`, null]);
        });

        it('renders 180s when cross-divisional', async () => {
            oneRoundTournament2Sides.oneEighties!.push(player1, player2, player1, player1);
            await renderComponent(
                containerProps.withTournament(oneRoundTournament2Sides).build(),
                {},
                appProps({ teams: [player1Team], divisions: [division] }, reportedError));

            expect(getAccolades('180s', d => d.textContent)).toEqual(['PLAYER 1 x 3', 'PLAYER 2 x 1']);
            expect(getAccolades('180s', linkHref)).toEqual([`http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`, null]);
        });

        it('renders 180s where team division cannot be found', async () => {
            oneRoundTournament2Sides.oneEighties!.push(player1, player2, player1, player1);
            const team: TeamDto = teamBuilder('TEAM')
                .forSeason(season, null, [player1])
                .build();

            await renderComponent(
                containerProps.withTournament(oneRoundTournament2Sides).build(),
                {},
                appProps({ teams: [team], divisions: [division] }, reportedError));

            expect(getAccolades('180s', d => d.textContent)).toEqual(['PLAYER 1 x 3', 'PLAYER 2 x 1']);
            expect(getAccolades('180s', linkHref))
                .toEqual([`http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`, null]);
        });

        it('renders hi checks', async () => {
            oneRoundTournament2Sides.over100Checkouts!.push(Object.assign({}, player1, {score: 100}));
            oneRoundTournament2Sides.over100Checkouts!.push(Object.assign({}, player2, {score: 120}));

            await renderComponent(
                containerProps.withTournament(oneRoundTournament2Sides).build(),
                {},
                appProps({ teams: [player1Team], divisions: [division] }, reportedError));

            expect(getAccolades('hi-checks', d => d.textContent)).toEqual(['PLAYER 1 (100)', 'PLAYER 2 (120)']);
            expect(getAccolades('hi-checks', linkHref))
                .toEqual([`http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`, null]);
        });

        it('renders hi checks when cross-divisional', async () => {
            oneRoundTournament2Sides.over100Checkouts!.push(Object.assign({}, player1, {score: 100}));
            oneRoundTournament2Sides.over100Checkouts!.push(Object.assign({}, player2, {score: 120}));

            await renderComponent(
                containerProps.withTournament(oneRoundTournament2Sides).build(),
                {},
                appProps({ teams: [player1Team], divisions: [division] }, reportedError));

            expect(getAccolades('hi-checks', d => d.textContent)).toEqual(['PLAYER 1 (100)', 'PLAYER 2 (120)']);
            expect(getAccolades('hi-checks', linkHref)).toEqual([`http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`, null]);
        });

        it('cannot set match side a when not permitted', async () => {
            await renderComponent(
                containerProps.withTournament(twoRoundTournament4Sides).build(),
                {editable: false},
                appProps({}, reportedError));

            await doClick(context.container.querySelector('div[datatype="sideA"]')!);

            expect(context.container.querySelector('div.modal-dialog')).toBeFalsy();
        });

        it('can edit match side a', async () => {
            twoRoundTournament4Sides.sides!.push(sideE(sideBuilder()).build());
            await renderComponent(
                containerProps.withTournament(twoRoundTournament4Sides).build(),
                {editable: true},
                appProps({}, reportedError));

            await doClick(context.container.querySelector('div[datatype="sideA"]')!);
            const dialog = context.container.querySelector('div.modal-dialog')!;
            await doSelectOption(dialog.querySelector('div.btn-group:nth-child(2) .dropdown-menu'), 'e'); // side
            await doSelectOption(dialog.querySelector('div.btn-group:nth-child(4) .dropdown-menu'), '2'); // score
            await doClick(findButton(dialog, 'Save'));

            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament!.round!.matches![0].sideA.name).toEqual('e');
            expect(updatedTournament!.round!.matches![0].scoreA).toEqual(2);
        });

        it('can remove match side a', async () => {
            await renderComponent(
                containerProps.withTournament(twoRoundTournament4Sides).build(),
                {editable: true},
                appProps({}, reportedError));
            await doClick(context.container.querySelector('div[datatype="sideA"]')!);

            await doClick(findButton(context.container, 'Remove'));

            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament!.round!.matches![0].sideA.id).toBeFalsy();
            expect(updatedTournament!.round!.matches![0].scoreA).toBeNull();
        });

        it('can edit match side b', async () => {
            twoRoundTournament4Sides.sides!.push(sideE(sideBuilder()).build());
            await renderComponent(
                containerProps.withTournament(twoRoundTournament4Sides).build(),
                {editable: true},
                appProps({}, reportedError));

            await doClick(context.container.querySelector('div[datatype="sideB"]')!);
            const dialog = context.container.querySelector('div.modal-dialog')!;
            await doSelectOption(dialog.querySelector('div.btn-group:nth-child(2) .dropdown-menu'), 'e'); // side
            await doSelectOption(dialog.querySelector('div.btn-group:nth-child(4) .dropdown-menu'), '2'); // score
            await doClick(findButton(dialog, 'Save'));

            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament!.round!.matches![0].sideB.name).toEqual('e');
            expect(updatedTournament!.round!.matches![0].scoreB).toEqual(2);
        });

        it('can remove match side b', async () => {
            await renderComponent(
                containerProps.withTournament(twoRoundTournament4Sides).build(),
                {editable: true},
                appProps({}, reportedError));
            await doClick(context.container.querySelector('div[datatype="sideB"]')!);

            await doClick(findButton(context.container, 'Remove'));

            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament!.round!.matches![0].sideB.id).toBeFalsy();
            expect(updatedTournament!.round!.matches![0].scoreB).toBeNull();
        });

        it('can edit 180s', async () => {
            await renderComponent(
                containerProps.withTournament(twoRoundTournament4Sides).withAllPlayers([player1]).build(),
                {editable: true},
                appProps({}, reportedError));

            await doClick(context.container.querySelector('div[data-accolades="180s"]')!);
            const dialog = context.container.querySelector('div.modal-dialog')!;
            await doSelectOption(dialog.querySelector('.dropdown-menu'), player1.name);
            await doClick(findButton(dialog, '➕'));

            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament!.oneEighties).toEqual([
                { id: player1.id, name: player1.name }
            ]);
        });

        it('can edit hi checks', async () => {
            await renderComponent(
                containerProps.withTournament(twoRoundTournament4Sides).withAllPlayers([player1]).build(),
                {editable: true},
                appProps({}, reportedError));

            await doClick(context.container.querySelector('div[data-accolades="hi-checks"]')!);
            const dialog = context.container.querySelector('div.modal-dialog')!;
            await doSelectOption(dialog.querySelector('.dropdown-menu'), player1.name);
            await doChange(dialog, 'input', '123', context.user);
            await doClick(findButton(dialog, '➕'));

            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament!.over100Checkouts).toEqual([
                { id: player1.id, name: player1.name, score: 123 }
            ]);
        });

        it('can edit side', async () => {
            await renderComponent(
                containerProps.withTournament(twoRoundTournament4Sides).withAllPlayers([player1]).build(),
                {editable: true},
                appProps({account}, reportedError));

            const playing = context.container.querySelector('div[datatype="playing"]')!;
            await doClick(playing.querySelector('li')!);
            const dialog = context.container.querySelector('div.modal-dialog')!;
            await doChange(dialog, 'input[name="name"]', 'NEW SIDE A', context.user);
            await doClick(findButton(dialog, 'Update'));

            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament!.sides!.map((s: TournamentSideDto) => s.name))
                .toEqual(['b', 'c', 'd', 'NEW SIDE A']);
        });

        it('can close edit side dialog', async () => {
            await renderComponent(
                containerProps.withTournament(twoRoundTournament4Sides).withAllPlayers([player1]).build(),
                {editable: true},
                appProps({account}, reportedError));

            const playing = context.container.querySelector('div[datatype="playing"]')!;
            await doClick(playing.querySelector('li')!);
            const dialog = context.container.querySelector('div.modal-dialog');
            await doClick(findButton(dialog, 'Close'));

            expect(updatedTournament).toBeNull();
            expect(context.container.querySelector('div.modal-dialog')).toBeFalsy();
        });

        it('can add a side', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round(r => r
                    .withMatch(m => m
                        .sideA(sideBuilder('A').withPlayer(player1).build(), 1)
                        .sideB(sideBuilder('B').withPlayer(player2).build(), 2)))
                .withSide(b => b.name('A').withPlayer(player1))
                .withSide(b => b.name('B').withPlayer(player2))
                .build();
            const player3: TeamPlayerDto = playerBuilder('PLAYER 3').build();
            const player3Team: TeamDto = teamBuilder('TEAM')
                .forSeason(season, division, [player3])
                .build();
            await renderComponent(
                containerProps.withTournament(tournamentData).withAllPlayers([player1, player2, player3]).withAlreadyPlaying({}).build(),
                {editable: true},
                appProps({account, teams: [player1Team, player2Team, player3Team]}, reportedError));
            await doClick(context.container.querySelector('li[datatype="add-side"]')!);

            const dialog = context.container.querySelector('div.modal-dialog')!;
            await doChange(dialog, 'input[name="name"]', 'NEW SIDE', context.user);
            await doClick(dialog.querySelector('.list-group li.list-group-item:not(.disabled)')!); // select a player
            await doClick(findButton(dialog, 'Add'));

            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament!.sides!.map((s: TournamentSideDto) => s.name))
                .toEqual(['A', 'B', 'NEW SIDE']);
        });

        it('can remove a side', async () => {
            await renderComponent(
                containerProps.withTournament(oneRoundTournament2Sides).withAlreadyPlaying({}).build(),
                {editable: true},
                appProps({account}, reportedError));
            context.prompts.respondToConfirm('Are you sure you want to remove A?', true);

            const playing = context.container.querySelector('div[datatype="playing"]')!;
            await doClick(playing.querySelector('li.list-group-item')!);
            const dialog = context.container.querySelector('div.modal-dialog')!;
            await doClick(findButton(dialog, 'Delete side'));

            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament!.sides!.map((s: TournamentSideDto) => s.name))
                .toEqual(['B']);
        });
    });

    describe('unplayed tournament', () => {
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const season: SeasonDto = seasonBuilder('SEASON')
            .withDivision(division)
            .build();
        const matchOptionDefaults = matchOptionsBuilder().build();
        const account: UserDto = {
            name: '',
            givenName: '',
            emailAddress: '',
            access: {}
        };
        const player1: TeamPlayerDto = playerBuilder('PLAYER 1').build();
        const player1Team: TeamDto = teamBuilder('TEAM')
            .forSeason(season, division, [player1])
            .build();
        const emptyTournament: TournamentGameDto = tournamentBuilder().build();
        const sideAandBTournament: TournamentGameDto = tournamentBuilder()
            .withSide(b => b.name('A'))
            .withSide(b => b.name('B'))
            .build();
        const containerProps = new tournamentContainerPropsBuilder({
            season,
            division,
            matchOptionDefaults,
            setTournamentData,
            setEditTournament,
        });

        it('renders tournament with 2 sides', async () => {
            await renderComponent(
                containerProps.withTournament(sideAandBTournament).withAlreadyPlaying({}).build(),
                {},
                appProps({}, reportedError));

            const rounds = getRounds();
            expect(rounds.length).toEqual(1);
            expect(rounds[0]).toEqual({
                heading: 'Final',
                hiChecks: {players: []},
                oneEighties: {players: []},
                matches: [{}],
            });
        });

        it('renders tournament with 2 sides and one no-show', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .withSide(b => b.name('A'))
                .withSide(b => b.name('B'))
                .withSide(b => b.name('NO SHOW').noShow())
                .build();

            await renderComponent(
                containerProps.withTournament(tournamentData).withAlreadyPlaying({}).build(),
                {},
                appProps({}, reportedError));

            const rounds = getRounds();
            expect(rounds.length).toEqual(1);
            expect(rounds[0]).toEqual({
                heading: 'Final',
                hiChecks: {players: []},
                oneEighties: {players: []},
                matches: [{}],
            });
        });

        it('renders who is playing', async () => {
            await renderComponent(
                containerProps.withTournament(sideAandBTournament).build(),
                {},
                appProps({}, reportedError));

            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual(['1 - A', '2 - B']);
        });

        it('renders who is playing when cross-divisional', async () => {
            await renderComponent(
                containerProps.withTournament(sideAandBTournament).build(),
                {},
                appProps({}, reportedError));

            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual(['1 - A', '2 - B']);
        });

        it('renders heading', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .type('TYPE')
                .notes('NOTES')
                .address('ADDRESS')
                .date('2023-06-01')
                .build();

            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                {},
                appProps({}, reportedError));

            const heading = context.container.querySelector('div[datatype="heading"]')!;
            expect(heading.textContent).toEqual(`TYPE at ADDRESS on ${renderDate('2023-06-01')} - NOTES🔗🖨️`);
        });

        it('can set match side a', async () => {
            await renderComponent(
                containerProps.withTournament(sideAandBTournament).build(),
                {editable: true},
                appProps({}, reportedError));

            await doClick(context.container.querySelector('div[datatype="sideA"]')!);
            const dialog = context.container.querySelector('div.modal-dialog')!;
            await doSelectOption(dialog.querySelector('div.btn-group:nth-child(2) .dropdown-menu'), 'A'); // side
            await doSelectOption(dialog.querySelector('div.btn-group:nth-child(4) .dropdown-menu'), '2'); // score
            await doClick(findButton(dialog, 'Save'));

            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament!.round!.matches![0].sideA.name).toEqual('A');
            expect(updatedTournament!.round!.matches![0].scoreA).toEqual(2);
        });

        it('can set match side b', async () => {
            await renderComponent(
                containerProps.withTournament(sideAandBTournament).build(),
                {editable: true},
                appProps({}, reportedError));

            await doClick(context.container.querySelector('div[datatype="sideB"]')!);
            const dialog = context.container.querySelector('div.modal-dialog')!;
            await doSelectOption(dialog.querySelector('div.btn-group:nth-child(2) .dropdown-menu'), 'A'); // side
            await doSelectOption(dialog.querySelector('div.btn-group:nth-child(4) .dropdown-menu'), '2'); // score
            await doClick(findButton(dialog, 'Save'));

            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament!.round!.matches![0].sideB.name).toEqual('A');
            expect(updatedTournament!.round!.matches![0].scoreB).toEqual(2);
        });

        it('cannot set match side to no-show side', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .withSide(b => b.name('A'))
                .withSide(b => b.name('B'))
                .withSide(b => b.name('NO SHOW').noShow())
                .build();
            await renderComponent(
                containerProps.withTournament(tournamentData).build(),
                {editable: true},
                appProps({}, reportedError));

            await doClick(context.container.querySelector('div[datatype="sideB"]')!);

            const dialog = context.container.querySelector('div.modal-dialog')!;
            const sides = Array.from(dialog.querySelectorAll('div.btn-group:nth-child(2) .dropdown-menu .dropdown-item'));
            expect(sides.map(s => s.textContent)).toEqual([ 'A', 'B' ]);
        });

        it('can add a side', async () => {
            await renderComponent(
                containerProps.withTournament(emptyTournament).withAlreadyPlaying({}).withAllPlayers([player1]).build(),
                {editable: true},
                appProps({teams: [player1Team], account}, reportedError));

            await doClick(context.container.querySelector('li[datatype="add-side"]')!);
            const dialog = context.container.querySelector('div.modal-dialog')!;
            await doChange(dialog, 'input[name="name"]', 'NEW SIDE', context.user);
            await doClick(dialog.querySelector('.list-group li.list-group-item')!); // select a player
            await doClick(findButton(dialog, 'Add'));

            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament!.sides!.map((s: TournamentSideDto) => s.name)).toEqual(['NEW SIDE']);
        });

        it('can add sides from hint', async () => {
            await renderComponent(
                containerProps.withTournament(emptyTournament).withAlreadyPlaying({}).withAllPlayers([player1]).build(),
                {editable: true},
                appProps({teams: [player1Team], account}, reportedError));

            await doClick(context.container.querySelector('div[datatype="add-sides-hint"] > span')!);

            expect(context.container.querySelector('div.modal-dialog')).toBeTruthy();
        });

        it('does not show add sides hint when some sides', async () => {
            await renderComponent(
                containerProps.withTournament(sideAandBTournament).withAlreadyPlaying({}).withAllPlayers([player1]).build(),
                {editable: true},
                appProps({teams: [player1Team], account}, reportedError));

            expect(context.container.querySelector('div[datatype="add-sides-hint"]')).toBeFalsy();
        });

        it('can close add a side dialog', async () => {
            await renderComponent(
                containerProps.withTournament(emptyTournament).withAlreadyPlaying({}).withAllPlayers([player1]).build(),
                {editable: true},
                appProps({teams: [player1Team], account}, reportedError));

            await doClick(context.container.querySelector('li[datatype="add-side"]')!);
            const dialog = context.container.querySelector('div.modal-dialog')!;
            await doClick(findButton(dialog, 'Close'));

            expect(updatedTournament).toBeNull();
            expect(context.container.querySelector('div.modal-dialog')).toBeFalsy();
        });

        it('can remove a side', async () => {
            await renderComponent(
                containerProps.withTournament(sideAandBTournament).build(),
                {editable: true},
                appProps({account}, reportedError));
            context.prompts.respondToConfirm('Are you sure you want to remove A?', true);

            const playing = context.container.querySelector('div[datatype="playing"]')!;
            await doClick(playing.querySelector('li.list-group-item')!);
            const dialog = context.container.querySelector('div.modal-dialog');
            await doClick(findButton(dialog, 'Delete side'));

            expect(updatedTournament).not.toBeNull();
            expect(updatedTournament!.sides!.map((s: TournamentSideDto) => s.name))
                .toEqual(['B']);
        });
    });

    describe('interactivity', () => {
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const season: SeasonDto = seasonBuilder('SEASON')
            .withDivision(division)
            .build();
        const matchOptionDefaults = matchOptionsBuilder().build();
        const tournamentData: TournamentGameDto = tournamentBuilder()
            .round(r => r)
            .build();
        const containerProps = new tournamentContainerPropsBuilder({
            season,
            division,
            matchOptionDefaults,
            setTournamentData,
            setEditTournament,
        });

        it('can edit tournament when permitted', async () => {
            await renderComponent(
                containerProps.withTournament(tournamentData).withAlreadyPlaying({}).build(),
                {editable: true},
                appProps({}, reportedError));

            await doClick(context.container.querySelector('div[datatype="heading"]')!);

            expect(editTournament).toEqual(true);
        });

        it('cannot edit tournament when not permitted', async () => {
            const readonlyContainerProps = containerProps.withTournament(tournamentData).withAlreadyPlaying({}).build();
            readonlyContainerProps.setEditTournament = undefined;
            await renderComponent(
                readonlyContainerProps,
                {editable: true},
                appProps({}, reportedError));

            await doClick(context.container.querySelector('div[datatype="heading"]')!);

            expect(editTournament).toEqual(null);
        });
    });
});