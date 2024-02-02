import {appProps, brandingProps, cleanUp, ErrorState, iocProps, renderApp, TestContext} from "../../../helpers/tests";
import {ITournamentContainerProps, TournamentContainer} from "./TournamentContainer";
import {IPrintableSheetProps, PrintableSheet} from "./PrintableSheet";
import {renderDate} from "../../../helpers/rendering";
import {DataMap, toMap} from "../../../helpers/collections";
import {createTemporaryId} from "../../../helpers/projection";
import {TeamDto} from "../../../interfaces/models/dtos/Team/TeamDto";
import {DivisionDto} from "../../../interfaces/models/dtos/DivisionDto";
import {TournamentSideDto} from "../../../interfaces/models/dtos/Game/TournamentSideDto";
import {SeasonDto} from "../../../interfaces/models/dtos/Season/SeasonDto";
import {TournamentGameDto} from "../../../interfaces/models/dtos/Game/TournamentGameDto";
import {TeamPlayerDto} from "../../../interfaces/models/dtos/Team/TeamPlayerDto";
import {
    ITournamentMatchBuilder, ITournamentRoundBuilder,
    ITournamentSideBuilder,
    sideBuilder,
    tournamentBuilder
} from "../../../helpers/builders/tournaments";
import {IMatchOptionsBuilder, matchOptionsBuilder} from "../../../helpers/builders/games";
import {playerBuilder} from "../../../helpers/builders/players";
import {teamBuilder} from "../../../helpers/builders/teams";
import {seasonBuilder} from "../../../helpers/builders/seasons";
import {divisionBuilder} from "../../../helpers/builders/divisions";
import {NotableTournamentPlayerDto} from "../../../interfaces/models/dtos/Game/NotableTournamentPlayerDto";
import {TournamentPlayerDto} from "../../../interfaces/models/dtos/Game/TournamentPlayerDto";

interface ISideInfo {
    sideAwinner?: boolean;
    sideBwinner?: boolean;
    sideAname?: string;
    sideAmnemonic?: string;
    sideBname?: string;
    sideBmnemonic?: string;
    scoreA?: string;
    scoreB?: string;
    bye: boolean;
    saygLink?: string;
}

describe('PrintableSheet', () => {
    let context: TestContext;
    let reportedError: ErrorState;

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function renderComponent(containerProps: ITournamentContainerProps, props: IPrintableSheetProps, teams?: DataMap<TeamDto>, divisions?: DivisionDto[]) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({
                teams,
                divisions,
            }, reportedError),
            (<TournamentContainer {...containerProps}>
                <PrintableSheet {...props} />
            </TournamentContainer>));
    }

    function createSide(name: string, players?: TeamPlayerDto[]): TournamentSideDto {
        let side: ITournamentSideBuilder = sideBuilder(name);

        if (players && players.length === 1) {
            side = side.withPlayer(players[0]);
        }

        return side.build();
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
                    heading: round.querySelector('h5[datatype="round-name"]').textContent,
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
                                bye: match.textContent.indexOf('Bye') !== -1,
                                saygLink: match.querySelector('a')
                                    ? match.querySelector('a').href
                                    : null,
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
                                (e: Element) => e.textContent.trim());
                            setInfo(
                                'span[datatype="sideBname"]',
                                'sideBname',
                                (e: Element) => e.textContent.trim());
                            setInfo(
                                'span[datatype="sideAmnemonic"]',
                                'sideAmnemonic',
                                (e: Element) => e.textContent.trim());
                            setInfo(
                                'span[datatype="sideBmnemonic"]',
                                'sideBmnemonic',
                                (e: Element) => e.textContent.trim());
                            setInfo(
                                'div[datatype="scoreA"]',
                                'scoreA',
                                (e: Element) => e.textContent.trim());
                            setInfo(
                                'div[datatype="scoreB"]',
                                'scoreB',
                                (e: Element) => e.textContent.trim());

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
            : li.textContent;
    }

    function linkHref(container: Element): string {
        const link = container.querySelector('a');
        return link ? link.href : null;
    }

    function getAccolades<T>(name: string, selector: (e: Element) => T): T[] {
        return Array.from(context.container.querySelectorAll('div[data-accolades="' + name + '"] div'))
            .map(selector);
    }

    function getWinner(): { name: string, link?: string } {
        const winnerElement = context.container.querySelector('div[datatype="winner"]');

        return {
            name: winnerElement.querySelector('span').textContent,
            link: winnerElement.querySelector('a')
                ? winnerElement.querySelector('a').href
                : null,
        };
    }

    describe('played tournament', () => {
        const sideA: TournamentSideDto = createSide('a');
        const sideB: TournamentSideDto = createSide('b');
        const sideC: TournamentSideDto = createSide('c');
        const sideD: TournamentSideDto = createSide('d');
        const sideE: TournamentSideDto = createSide('e');
        const sideF: TournamentSideDto = createSide('f');
        const sideG: TournamentSideDto = createSide('g');
        const sideH: TournamentSideDto = createSide('h');
        const sideI: TournamentSideDto = createSide('i');
        const sideJ: TournamentSideDto = createSide('j');
        const sideK: TournamentSideDto = createSide('k');
        const sideL: TournamentSideDto = createSide('l');
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const season: SeasonDto = seasonBuilder('SEASON')
            .withDivision(division)
            .build();
        const matchOptionDefaults = matchOptionsBuilder().build();

        it('renders tournament with one round', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA, 1).sideB(sideB, 2))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3)))
                .withSide(sideA).withSide(sideB)
                .build();

            await renderComponent({tournamentData, season, division, matchOptionDefaults}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            const rounds = getRounds();
            expect(rounds.length).toEqual(1);
            expect(rounds[0]).toEqual({
                heading: 'Final',
                hiChecks: {players: []},
                oneEighties: {players: []},
                matches: [
                    {
                        sideAname: 'a',
                        sideBname: 'b',
                        sideBwinner: true,
                        scoreA: '1',
                        scoreB: '2',
                        bye: false,
                        saygLink: null,
                    },
                ],
            });
        });

        it('renders tournament with sayg id', async () => {
            const saygId = createTemporaryId();
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA, 1).sideB(sideB, 2).saygId(saygId))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3)))
                .withSide(sideA).withSide(sideB)
                .build();

            await renderComponent({tournamentData, season, division, matchOptionDefaults}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            const rounds = getRounds();
            expect(rounds.length).toEqual(1);
            expect(rounds[0]).toEqual({
                heading: 'Final',
                hiChecks: {players: []},
                oneEighties: {players: []},
                matches: [
                    {
                        sideAname: 'a',
                        sideBname: 'b',
                        sideBwinner: true,
                        scoreA: '1',
                        scoreB: '2',
                        bye: false,
                        saygLink: 'http://localhost/live/match/' + saygId,
                    },
                ],
            });
        });

        it('renders incomplete tournament with six sides and one round', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA, 0).sideB(sideB, 0))
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideC, 0).sideB(sideD, 0))
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideE, 0).sideB(sideF, 0))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3)))
                .withSide(sideA).withSide(sideB).withSide(sideC).withSide(sideD).withSide(sideE).withSide(sideF)
                .build();

            await renderComponent({tournamentData, season, division, matchOptionDefaults}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            const rounds = getRounds();
            expect(rounds.length).toEqual(3);
            expect(rounds[0]).toEqual({
                heading: 'Quarter-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    {
                        sideAname: 'a',
                        sideBname: 'b',
                        scoreA: '0',
                        scoreB: '0',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'c',
                        sideBname: 'd',
                        scoreA: '0',
                        scoreB: '0',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'e',
                        sideBname: 'f',
                        scoreA: '0',
                        scoreB: '0',
                        bye: false,
                        saygLink: null,
                    },
                ],
            });
            expect(rounds[1]).toEqual({
                heading: 'Semi-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    {
                        sideAmnemonic: 'winner(M1)',
                        sideBmnemonic: 'winner(M2)',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAmnemonic: 'winner(M3)',
                        bye: true,
                        saygLink: null,
                    },
                ],
            });
            expect(rounds[2]).toEqual({
                heading: 'Final',
                hiChecks: {players: []},
                oneEighties: {players: []},
                matches: [
                    {
                        sideAmnemonic: 'winner(M3)',
                        sideBmnemonic: 'winner(M1)',
                        bye: false,
                        saygLink: null,
                    },
                ],
            });
        });

        it('renders tournament with 2 rounds', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA, 1).sideB(sideB, 2))
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideC, 2).sideB(sideD, 1))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                    .round((r: ITournamentRoundBuilder) => r
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideB, 2).sideB(sideC, 1))
                        .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))))
                .withSide(sideA).withSide(sideB).withSide(sideC).withSide(sideD)
                .build();

            await renderComponent({tournamentData, season, division, matchOptionDefaults}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            const rounds = getRounds();
            expect(rounds.length).toEqual(2);
            expect(rounds[0]).toEqual({
                heading: 'Semi-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    {
                        sideAname: 'a',
                        sideBname: 'b',
                        sideBwinner: true,
                        scoreA: '1',
                        scoreB: '2',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'c',
                        sideBname: 'd',
                        sideAwinner: true,
                        scoreA: '2',
                        scoreB: '1',
                        bye: false,
                        saygLink: null,
                    },
                ],
            });
            expect(rounds[1]).toEqual({
                heading: 'Final',
                hiChecks: {players: []},
                oneEighties: {players: []},
                matches: [
                    {
                        sideAname: 'b',
                        sideBname: 'c',
                        sideAwinner: true,
                        scoreA: '2',
                        scoreB: '1',
                        bye: false,
                        saygLink: null,
                    },
                ],
            });
        });

        it('renders tournament with 3 rounds', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA, 1).sideB(sideB, 2))
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideC, 2).sideB(sideD, 1))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                    .round((r: ITournamentRoundBuilder) => r
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideE, 2).sideB(sideB, 1))
                        .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                        .round((r: ITournamentRoundBuilder) => r
                            .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideC, 2).sideB(sideE, 1))
                            .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3)))))
                .withSide(sideA).withSide(sideB).withSide(sideC).withSide(sideD).withSide(sideE)
                .build();

            await renderComponent({tournamentData, season, division, matchOptionDefaults}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            const rounds = getRounds();
            expect(rounds.length).toEqual(3);
            expect(rounds[0]).toEqual({
                heading: 'Quarter-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    {
                        sideAname: 'a',
                        sideBname: 'b',
                        sideBwinner: true,
                        scoreA: '1',
                        scoreB: '2',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'c',
                        sideBname: 'd',
                        sideAwinner: true,
                        scoreA: '2',
                        scoreB: '1',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAmnemonic: 'A',
                        bye: true,
                        saygLink: null,
                    },
                ],
            });
            expect(rounds[1]).toEqual({
                heading: 'Semi-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    {
                        sideAname: 'e',
                        sideBname: 'b',
                        sideAwinner: true,
                        scoreA: '2',
                        scoreB: '1',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAmnemonic: 'A',
                        bye: true,
                        saygLink: null,
                    },
                ],
            });
            expect(rounds[2]).toEqual({
                heading: 'Final',
                hiChecks: {players: []},
                oneEighties: {players: []},
                matches: [
                    {
                        sideAname: 'c',
                        sideBname: 'e',
                        sideAwinner: true,
                        scoreA: '2',
                        scoreB: '1',
                        bye: false,
                        saygLink: null,
                    },
                ],
            });
        });

        it('renders tournament with 4 rounds', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA, 1).sideB(sideB, 2))
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideC, 2).sideB(sideD, 1))
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideE, 2).sideB(sideF, 1))
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideG, 1).sideB(sideH, 2))
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideI, 1).sideB(sideJ, 2))
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideK, 1).sideB(sideL, 2))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                    .round((r: ITournamentRoundBuilder) => r
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideB, 2).sideB(sideC, 1))
                        .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideE, 2).sideB(sideH, 1))
                        .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                        .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                        .round((r: ITournamentRoundBuilder) => r
                            .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideB, 2).sideB(sideE, 1))
                            .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideJ, 2).sideB(sideL, 1))
                            .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                            .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                            .round((r: ITournamentRoundBuilder) => r
                                .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideB, 2).sideB(sideJ, 1))
                                .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))))))
                .withSide(sideA).withSide(sideB).withSide(sideC).withSide(sideD).withSide(sideE).withSide(sideF)
                .withSide(sideG).withSide(sideH).withSide(sideI).withSide(sideJ).withSide(sideK).withSide(sideL)
                .build();

            await renderComponent({tournamentData, season, division, matchOptionDefaults}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            const rounds = getRounds();
            expect(rounds.length).toEqual(4);
            expect(rounds[0]).toEqual({
                heading: 'Round 1',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    {
                        sideAname: 'a',
                        sideBname: 'b',
                        sideBwinner: true,
                        scoreA: '1',
                        scoreB: '2',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'c',
                        sideBname: 'd',
                        sideAwinner: true,
                        scoreA: '2',
                        scoreB: '1',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'e',
                        sideBname: 'f',
                        sideAwinner: true,
                        scoreA: '2',
                        scoreB: '1',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'g',
                        sideBname: 'h',
                        sideBwinner: true,
                        scoreA: '1',
                        scoreB: '2',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'i',
                        sideBname: 'j',
                        sideBwinner: true,
                        scoreA: '1',
                        scoreB: '2',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'k',
                        sideBname: 'l',
                        sideBwinner: true,
                        scoreA: '1',
                        scoreB: '2',
                        bye: false,
                        saygLink: null,
                    },
                ],
            });
            expect(rounds[1]).toEqual({
                heading: 'Quarter-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    {
                        sideAname: 'b',
                        sideBname: 'c',
                        sideAwinner: true,
                        scoreA: '2',
                        scoreB: '1',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'e',
                        sideBname: 'h',
                        sideAwinner: true,
                        scoreA: '2',
                        scoreB: '1',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAmnemonic: 'A',
                        sideBmnemonic: 'B',
                        bye: false,
                        saygLink: null,
                    },
                ],
            });
            expect(rounds[2]).toEqual({
                heading: 'Semi-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    {
                        sideAname: 'b',
                        sideBname: 'e',
                        sideAwinner: true,
                        scoreA: '2',
                        scoreB: '1',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'j',
                        sideBname: 'l',
                        sideAwinner: true,
                        scoreA: '2',
                        scoreB: '1',
                        bye: false,
                        saygLink: null,
                    },
                ],
            });
            expect(rounds[3]).toEqual({
                heading: 'Final',
                hiChecks: {players: []},
                oneEighties: {players: []},
                matches: [
                    {
                        sideAname: 'b',
                        sideBname: 'j',
                        sideAwinner: true,
                        scoreA: '2',
                        scoreB: '1',
                        bye: false,
                        saygLink: null,
                    },
                ],
            });
        });

        it('does not render winner when insufficient legs played', async () => {
            const player1: TeamPlayerDto = playerBuilder('PLAYER 1').build();
            const player2: TeamPlayerDto = playerBuilder('PLAYER 2').build();
            const sideASinglePlayer: TournamentSideDto = createSide('A', [player1]);
            const sideBSinglePlayer: TournamentSideDto = createSide('B', [player2]);
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m
                        .sideA(sideASinglePlayer, 1)
                        .sideB(sideBSinglePlayer, 2))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(5)))
                .withSide(sideASinglePlayer)
                .withSide(sideBSinglePlayer)
                .build();
            const teams: DataMap<TeamDto> = toMap<TeamDto>([
                teamBuilder('TEAM')
                    .forSeason(season, division, [player2])
                    .build()]);
            const divisions: DivisionDto[] = [division];

            await renderComponent({tournamentData, season, division, matchOptionDefaults}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            const winner = getWinner();
            expect(winner).toEqual({
                link: null,
                name: ' ',
            });
        });

        it('does not render winner when 2 matches in final round (semi final is last round so far)', async () => {
            const player1: TeamPlayerDto = playerBuilder('PLAYER 1').build();
            const player2: TeamPlayerDto = playerBuilder('PLAYER 2').build();
            const player3: TeamPlayerDto = playerBuilder('PLAYER 3').build();
            const player4: TeamPlayerDto = playerBuilder('PLAYER 4').build();
            const player5: TeamPlayerDto = playerBuilder('PLAYER 5').build();
            const sideASinglePlayer: TournamentSideDto = createSide('A', [player1]);
            const sideBSinglePlayer: TournamentSideDto = createSide('B', [player2]);
            const sideCSinglePlayer: TournamentSideDto = createSide('C', [player3]);
            const sideDSinglePlayer: TournamentSideDto = createSide('D', [player4]);
            const sideESinglePlayer: TournamentSideDto = createSide('E', [player5]);
            const tournamentData = tournamentBuilder()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m
                        .sideA(sideASinglePlayer, 1)
                        .sideB(sideBSinglePlayer, 3))
                    .withMatch((m: ITournamentMatchBuilder) => m
                        .sideA(sideCSinglePlayer, 0)
                        .sideB(sideDSinglePlayer, 0))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(5))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(5)))
                .withSide(sideASinglePlayer)
                .withSide(sideBSinglePlayer)
                .withSide(sideCSinglePlayer)
                .withSide(sideDSinglePlayer)
                .withSide(sideESinglePlayer)
                .build();
            const teams: DataMap<TeamDto> = toMap<TeamDto>([
                teamBuilder('TEAM')
                    .forSeason(season, division, [player2])
                    .build()]);
            const divisions: DivisionDto[] = [division];

            await renderComponent({tournamentData, season, division, matchOptionDefaults}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            const winner = getWinner();
            expect(winner).toEqual({
                link: null,
                name: ' ',
            });
        });

        it('renders winner', async () => {
            const player1: TeamPlayerDto = playerBuilder('PLAYER 1').build();
            const player2: TeamPlayerDto = playerBuilder('PLAYER 2').build();
            const sideASinglePlayer: TournamentSideDto = createSide('A', [player1]);
            const sideBSinglePlayer: TournamentSideDto = createSide('B', [player2]);
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m
                        .sideA(sideASinglePlayer, 1)
                        .sideB(sideBSinglePlayer, 2))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3)))
                .withSide(sideASinglePlayer)
                .withSide(sideBSinglePlayer)
                .build();
            const teams: DataMap<TeamDto> = toMap<TeamDto>([
                teamBuilder('TEAM')
                    .forSeason(season, division, [player2])
                    .build()]);
            const divisions: DivisionDto[] = [division];

            await renderComponent({tournamentData, season, division, matchOptionDefaults}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            const winner = getWinner();
            expect(winner.name).toEqual('B');
            expect(winner.link).toEqual(`http://localhost/division/${division.name}/player:${encodeURI(player2.name)}@TEAM/${season.name}`);
        });

        it('renders winner when cross-divisional', async () => {
            const player1: TeamPlayerDto = playerBuilder('PLAYER 1').build();
            const player2: TeamPlayerDto = playerBuilder('PLAYER 2').build();
            const sideASinglePlayer = createSide('A', [player1]);
            const sideBSinglePlayer = createSide('B', [player2]);
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideASinglePlayer, 1).sideB(sideBSinglePlayer, 2))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3)))
                .withSide(sideASinglePlayer).withSide(sideBSinglePlayer)
                .build();
            const teams: DataMap<TeamDto> = toMap<TeamDto>([
                teamBuilder('TEAM')
                    .forSeason(season, division, [player2])
                    .build()]);
            const divisions: DivisionDto[] = [division];

            await renderComponent({tournamentData, season, division: null, matchOptionDefaults}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            const winner = getWinner();
            expect(winner.name).toEqual('B');
            expect(winner.link).toEqual(`http://localhost/division/${division.name}/player:${encodeURI(player2.name)}@TEAM/${season.name}`);
        });

        it('renders who is playing (singles)', async () => {
            const player1: TeamPlayerDto = playerBuilder('PLAYER 1').build();
            const player2: TeamPlayerDto = playerBuilder('PLAYER 2').build();
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .withSide(createSide('A', [player1]))
                .withSide(createSide('B', [player2]))
                .build();
            const teams: DataMap<TeamDto> = toMap<TeamDto>([
                teamBuilder('TEAM')
                    .forSeason(season, division, [player1])
                    .build()]);
            const divisions: DivisionDto[] = [division];

            await renderComponent({tournamentData, season, division, matchOptionDefaults}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual(['1 - A', '2 - B']);
            expect(getWhoIsPlaying(linkHref)).toEqual([`http://localhost/division/${division.name}/player:${encodeURI('PLAYER 1')}@TEAM/${season.name}`, null]);
        });

        it('renders who is playing (teams)', async () => {
            const team: TeamDto = teamBuilder('TEAM')
                .forSeason(season, division)
                .build();
            const anotherTeam: TeamDto = teamBuilder('ANOTHER TEAM').build();
            const sideA: TournamentSideDto = createSide('A');
            sideA.teamId = team.id;
            const sideB: TournamentSideDto = createSide('B');
            sideB.teamId = anotherTeam.id;
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .withSide(sideA)
                .withSide(sideB)
                .build();
            const teams: DataMap<TeamDto> = toMap<TeamDto>([team]);
            const divisions: DivisionDto[] = [division];

            await renderComponent({tournamentData, season, division, matchOptionDefaults}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual(['1 - A', '2 - B']);
            expect(getWhoIsPlaying(linkHref)).toEqual([
                `http://localhost/division/${division.name}/team:TEAM/${season.name}`,
                `http://localhost/division/${division.name}/team:${sideB.teamId}/${season.name}`]);
        });

        it('renders who is playing when cross-divisional', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .withSide(sideA)
                .withSide(sideB)
                .build();
            const season: SeasonDto = seasonBuilder('SEASON').build();
            const teams: DataMap<TeamDto> = toMap([ teamBuilder('TEAM')
                .forSeason(season, division)
                .build()
            ]);
            const divisions: DivisionDto[] = [division];

            await renderComponent({tournamentData, season, division: null, matchOptionDefaults}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual(['1 - a', '2 - b']);
            expect(getWhoIsPlaying(linkHref)).toEqual([null, null]);
        });

        it('renders who is playing when team not found', async () => {
            const player1: TeamPlayerDto = playerBuilder('PLAYER 1').build();
            const player2: TeamPlayerDto = playerBuilder('PLAYER 2').build();
            const sideASinglePlayer: TournamentSideDto = createSide('a', [player1]);
            const sideBSinglePlayer: TournamentSideDto = createSide('b', [player2]);
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .withSide(sideASinglePlayer)
                .withSide(sideBSinglePlayer)
                .build();
            const anotherSeason: SeasonDto = seasonBuilder('SEASON').build();
            const teams: DataMap<TeamDto> = toMap([ teamBuilder('TEAM')
                .forSeason(anotherSeason, division, [ player1, player2 ])
                .build()
            ]);
            const divisions: DivisionDto[] = [division];

            await renderComponent({tournamentData, season, division: null, matchOptionDefaults}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual(['1 - a', '2 - b']);
            expect(getWhoIsPlaying(linkHref)).toEqual([null, null]);
        });

        it('renders who is playing with no shows', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .withSide(sideA)
                .withSide(sideB)
                .withSide(Object.assign({}, sideC, {noShow: true}))
                .build();
            const teams: DataMap<TeamDto> = toMap([]);
            const divisions: DivisionDto[] = [division];

            await renderComponent({tournamentData, season, division, matchOptionDefaults}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual(['1 - a', '2 - b', '-3 - c-']);
            expect(getWhoIsPlaying(linkHref)).toEqual([null, null, null]);
        });

        it('renders heading', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .type('TYPE')
                .notes('NOTES')
                .address('ADDRESS')
                .date('2023-06-01')
                .build();

            await renderComponent({tournamentData, season, division}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            const heading = context.container.querySelector('div[datatype="heading"]');
            expect(heading.textContent).toEqual(`TYPE at ADDRESS on ${renderDate('2023-06-01')} - NOTES🔗🖨️`);
        });

        it('renders 180s', async () => {
            const player1: TournamentPlayerDto = playerBuilder('PLAYER 1').build();
            const player2: TournamentPlayerDto = playerBuilder('PLAYER 2').build();
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .withSide(createSide('A', [player1]))
                .withSide(createSide('B', [player2]))
                .withOneEighty(player1)
                .withOneEighty(player2)
                .withOneEighty(player1)
                .withOneEighty(player1)
                .build();
            const teams: DataMap<TeamDto> = toMap([
                teamBuilder('TEAM')
                    .forSeason(season, division, [player1])
                    .build()
            ]);
            const divisions: DivisionDto[] = [division];

            await renderComponent({tournamentData, season, division, matchOptionDefaults}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            expect(getAccolades('180s', d => d.textContent)).toEqual(['PLAYER 1 x 3', 'PLAYER 2 x 1']);
            expect(getAccolades('180s', linkHref))
                .toEqual([`http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`, null]);
        });

        it('renders 180s when cross-divisional', async () => {
            const player1: TournamentPlayerDto = playerBuilder('PLAYER 1').build();
            const player2: TournamentPlayerDto = playerBuilder('PLAYER 2').build();
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .withSide(createSide('A', [player1]))
                .withSide(createSide('B', [player2]))
                .withOneEighty(player1)
                .withOneEighty(player2)
                .withOneEighty(player1)
                .withOneEighty(player1)
                .build();
            const teams: DataMap<TeamDto> = toMap([
                teamBuilder('TEAM')
                    .forSeason(season, division, [player1])
                    .build()
            ]);
            const divisions = [division];

            await renderComponent({tournamentData, season, division: null, matchOptionDefaults}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            expect(getAccolades('180s', d => d.textContent)).toEqual(['PLAYER 1 x 3', 'PLAYER 2 x 1']);
            expect(getAccolades('180s', linkHref)).toEqual([`http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`, null]);
        });

        it('renders hi checks', async () => {
            const player1: NotableTournamentPlayerDto = playerBuilder('PLAYER 1').build();
            const player2: NotableTournamentPlayerDto = playerBuilder('PLAYER 2').build();
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .withSide(createSide('A', [player1]))
                .withSide(createSide('B', [player2]))
                .withHiCheck(player1, 100)
                .withHiCheck(player2, 120)
                .build();
            const teams: DataMap<TeamDto> = toMap([
                teamBuilder('TEAM')
                    .forSeason(season, division, [player1])
                    .build()
            ]);
            const divisions = [division];

            await renderComponent({tournamentData, season, division, matchOptionDefaults}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            expect(getAccolades('hi-checks', d => d.textContent)).toEqual(['PLAYER 1 (100)', 'PLAYER 2 (120)']);
            expect(getAccolades('hi-checks', linkHref))
                .toEqual([`http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`, null]);
        });

        it('renders hi checks when cross-divisional', async () => {
            const player1: NotableTournamentPlayerDto = playerBuilder('PLAYER 1').build();
            const player2: NotableTournamentPlayerDto = playerBuilder('PLAYER 2').build();
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .withSide(createSide('A', [player1]))
                .withSide(createSide('B', [player2]))
                .withHiCheck(player1, 100)
                .withHiCheck(player2, 120)
                .build();
            const teams: DataMap<TeamDto> = toMap([
                teamBuilder('TEAM')
                    .forSeason(season, division, [player1])
                    .build()
            ]);
            const divisions = [division];

            await renderComponent({tournamentData, season, division: null, matchOptionDefaults}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            expect(getAccolades('hi-checks', d => d.textContent)).toEqual(['PLAYER 1 (100)', 'PLAYER 2 (120)']);
            expect(getAccolades('hi-checks', linkHref)).toEqual([`http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`, null]);
        });
    });

    describe('unplayed tournament', () => {
        const sideA: TournamentSideDto = createSide('A');
        const sideB: TournamentSideDto = createSide('B');
        const division: DivisionDto = divisionBuilder('DIVISION').build();
        const season: SeasonDto = seasonBuilder('SEASON')
            .withDivision(division)
            .build();
        const matchOptionDefaults = matchOptionsBuilder().build();

        it('renders tournament with 2 sides', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .withSide(sideA)
                .withSide(sideB)
                .build();

            await renderComponent({tournamentData, season, division, matchOptionDefaults}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            const rounds = getRounds();
            expect(rounds.length).toEqual(1);
            expect(rounds[0]).toEqual({
                heading: 'Final',
                hiChecks: {players: []},
                oneEighties: {players: []},
                matches: [
                    {
                        sideAmnemonic: 'A',
                        sideBmnemonic: 'B',
                        bye: false,
                        saygLink: null,
                    },
                ],
            });
        });

        it('renders who is playing', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .withSide(sideA)
                .withSide(sideB)
                .build();

            await renderComponent({tournamentData, season, division, matchOptionDefaults}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual(['1 - A', '2 - B']);
        });

        it('renders who is playing when cross-divisional', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .withSide(sideA)
                .withSide(sideB)
                .build();

            await renderComponent({tournamentData, season, division: null, matchOptionDefaults}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual(['1 - A', '2 - B']);
        });

        it('renders heading', async () => {
            const tournamentData: TournamentGameDto = tournamentBuilder()
                .type('TYPE')
                .notes('NOTES')
                .address('ADDRESS')
                .date('2023-06-01')
                .build();

            await renderComponent({tournamentData, season, division, matchOptionDefaults}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            const heading = context.container.querySelector('div[datatype="heading"]');
            expect(heading.textContent).toEqual(`TYPE at ADDRESS on ${renderDate('2023-06-01')} - NOTES🔗🖨️`);
        });
    });
});