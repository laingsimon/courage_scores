import {appProps, brandingProps, cleanUp, ErrorState, iocProps, renderApp, TestContext} from "../../../helpers/tests";
import React from "react";
import {ITournamentContainerProps, TournamentContainer} from "./TournamentContainer";
import {IPrintableSheetProps, PrintableSheet} from "./PrintableSheet";
import {renderDate} from "../../../helpers/rendering";
import {DataMap, toMap} from "../../../helpers/collections";
import {createTemporaryId} from "../../../helpers/projection";
import {ITeamDto} from "../../../interfaces/serverSide/Team/ITeamDto";
import {IDivisionDto} from "../../../interfaces/serverSide/IDivisionDto";
import {ITournamentSideDto} from "../../../interfaces/serverSide/Game/ITournamentSideDto";
import {ISeasonDto} from "../../../interfaces/serverSide/Season/ISeasonDto";
import {ITournamentGameDto} from "../../../interfaces/serverSide/Game/ITournamentGameDto";
import {ITeamPlayerDto} from "../../../interfaces/serverSide/Team/ITeamPlayerDto";
import {
    ITournamentMatchBuilder, ITournamentRoundBuilder,
    ITournamentSideBuilder,
    sideBuilder,
    tournamentBuilder
} from "../../../helpers/builders/tournaments";
import {IMatchOptionsBuilder} from "../../../helpers/builders/games";
import {playerBuilder} from "../../../helpers/builders/players";
import {teamBuilder} from "../../../helpers/builders/teams";
import {seasonBuilder} from "../../../helpers/builders/seasons";
import {divisionBuilder} from "../../../helpers/builders/divisions";

describe('PrintableSheet', () => {
    let context: TestContext;
    let reportedError: ErrorState;

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function renderComponent(containerProps: ITournamentContainerProps, props: IPrintableSheetProps, teams?: DataMap<ITeamDto>, divisions?: IDivisionDto[]) {
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

    function createSide(name: string, players?: ITeamPlayerDto[]): ITournamentSideDto {
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
                        .map(match => {
                            return {
                                //element: match,
                                sideAwinner: match.querySelector('div[datatype="sideA"]')
                                    ? match.querySelector('div[datatype="sideA"]').className.indexOf('bg-winner') !== -1
                                    : null,
                                sideBwinner: match.querySelector('div[datatype="sideB"]')
                                    ? match.querySelector('div[datatype="sideB"]').className.indexOf('bg-winner') !== -1
                                    : null,
                                sideAname: match.querySelector('div[datatype="sideAname"]')
                                    ? match.querySelector('div[datatype="sideAname"]').textContent.trim()
                                    : null,
                                sideBname: match.querySelector('div[datatype="sideBname"]')
                                    ? match.querySelector('div[datatype="sideBname"]').textContent.trim()
                                    : null,
                                scoreA: match.querySelector('div[datatype="scoreA"]')
                                    ? match.querySelector('div[datatype="scoreA"]').textContent.trim()
                                    : null,
                                scoreB: match.querySelector('div[datatype="scoreB"]')
                                    ? match.querySelector('div[datatype="scoreB"]').textContent.trim()
                                    : null,
                                bye: match.textContent.indexOf('Bye') !== -1,
                                saygLink: match.querySelector('a')
                                    ? match.querySelector('a').href
                                    : null,
                            };
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
        const sideA: ITournamentSideDto = createSide('A');
        const sideB: ITournamentSideDto = createSide('B');
        const sideC: ITournamentSideDto = createSide('C');
        const sideD: ITournamentSideDto = createSide('D');
        const sideE: ITournamentSideDto = createSide('E');
        const sideF: ITournamentSideDto = createSide('F');
        const sideG: ITournamentSideDto = createSide('G');
        const sideH: ITournamentSideDto = createSide('H');
        const sideI: ITournamentSideDto = createSide('I');
        const sideJ: ITournamentSideDto = createSide('J');
        const sideK: ITournamentSideDto = createSide('K');
        const sideL: ITournamentSideDto = createSide('L');
        const division: IDivisionDto = divisionBuilder('DIVISION').build();
        const season: ISeasonDto = seasonBuilder('SEASON')
            .withDivision(division)
            .build();

        it('renders tournament with one round', async () => {
            const tournamentData: ITournamentGameDto = tournamentBuilder()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA, 1).sideB(sideB, 2))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3)))
                .withSide(sideA).withSide(sideB)
                .build();

            await renderComponent({tournamentData, season, division}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            const rounds = getRounds();
            expect(rounds.length).toEqual(1);
            expect(rounds[0]).toEqual({
                heading: 'Final',
                hiChecks: {players: []},
                oneEighties: {players: []},
                matches: [
                    {
                        sideAname: 'A',
                        sideBname: 'B',
                        sideAwinner: false,
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
            const tournamentData: ITournamentGameDto = tournamentBuilder()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA, 1).sideB(sideB, 2).saygId(saygId))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3)))
                .withSide(sideA).withSide(sideB)
                .build();

            await renderComponent({tournamentData, season, division}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            const rounds = getRounds();
            expect(rounds.length).toEqual(1);
            expect(rounds[0]).toEqual({
                heading: 'Final',
                hiChecks: {players: []},
                oneEighties: {players: []},
                matches: [
                    {
                        sideAname: 'A',
                        sideBname: 'B',
                        sideAwinner: false,
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
            const tournamentData: ITournamentGameDto = tournamentBuilder()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideA, 0).sideB(sideB, 0))
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideC, 0).sideB(sideD, 0))
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideE, 0).sideB(sideF, 0))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3)))
                .withSide(sideA).withSide(sideB).withSide(sideC).withSide(sideD).withSide(sideE).withSide(sideF)
                .build();

            await renderComponent({tournamentData, season, division}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            const rounds = getRounds();
            expect(rounds.length).toEqual(3);
            expect(rounds[0]).toEqual({
                heading: 'Quarter-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    {
                        sideAname: 'A',
                        sideBname: 'B',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '0',
                        scoreB: '0',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'C',
                        sideBname: 'D',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '0',
                        scoreB: '0',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'E',
                        sideBname: 'F',
                        sideAwinner: false,
                        sideBwinner: false,
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
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: '',
                        sideBname: null,
                        sideAwinner: false,
                        sideBwinner: null,
                        scoreA: '',
                        scoreB: null,
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
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                ],
            });
        });

        it('renders tournament with 2 rounds', async () => {
            const tournamentData: ITournamentGameDto = tournamentBuilder()
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

            await renderComponent({tournamentData, season, division}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            const rounds = getRounds();
            expect(rounds.length).toEqual(2);
            expect(rounds[0]).toEqual({
                heading: 'Semi-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    {
                        sideAname: 'A',
                        sideBname: 'B',
                        sideAwinner: false,
                        sideBwinner: true,
                        scoreA: '1',
                        scoreB: '2',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'C',
                        sideBname: 'D',
                        sideAwinner: true,
                        sideBwinner: false,
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
                        sideAname: 'B',
                        sideBname: 'C',
                        sideAwinner: true,
                        sideBwinner: false,
                        scoreA: '2',
                        scoreB: '1',
                        bye: false,
                        saygLink: null,
                    },
                ],
            });
        });

        it('renders tournament with 3 rounds', async () => {
            const tournamentData: ITournamentGameDto = tournamentBuilder()
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

            await renderComponent({tournamentData, season, division}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            const rounds = getRounds();
            expect(rounds.length).toEqual(3);
            expect(rounds[0]).toEqual({
                heading: 'Quarter-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    {
                        sideAname: 'A',
                        sideBname: 'B',
                        sideAwinner: false,
                        sideBwinner: true,
                        scoreA: '1',
                        scoreB: '2',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'C',
                        sideBname: 'D',
                        sideAwinner: true,
                        sideBwinner: false,
                        scoreA: '2',
                        scoreB: '1',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'E',
                        sideBname: null,
                        sideAwinner: false,
                        sideBwinner: null,
                        scoreA: '',
                        scoreB: null,
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
                        sideAname: 'E',
                        sideBname: 'B',
                        sideAwinner: true,
                        sideBwinner: false,
                        scoreA: '2',
                        scoreB: '1',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'C',
                        sideBname: null,
                        sideAwinner: false,
                        sideBwinner: null,
                        scoreA: '',
                        scoreB: null,
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
                        sideAname: 'C',
                        sideBname: 'E',
                        sideAwinner: true,
                        sideBwinner: false,
                        scoreA: '2',
                        scoreB: '1',
                        bye: false,
                        saygLink: null,
                    },
                ],
            });
        });

        it('renders tournament with 4 rounds', async () => {
            const tournamentData: ITournamentGameDto = tournamentBuilder()
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

            await renderComponent({tournamentData, season, division}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            const rounds = getRounds();
            expect(rounds.length).toEqual(4);
            expect(rounds[0]).toEqual({
                heading: 'Round 1',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    {
                        sideAname: 'A',
                        sideBname: 'B',
                        sideAwinner: false,
                        sideBwinner: true,
                        scoreA: '1',
                        scoreB: '2',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'C',
                        sideBname: 'D',
                        sideAwinner: true,
                        sideBwinner: false,
                        scoreA: '2',
                        scoreB: '1',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'E',
                        sideBname: 'F',
                        sideAwinner: true,
                        sideBwinner: false,
                        scoreA: '2',
                        scoreB: '1',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'G',
                        sideBname: 'H',
                        sideAwinner: false,
                        sideBwinner: true,
                        scoreA: '1',
                        scoreB: '2',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'I',
                        sideBname: 'J',
                        sideAwinner: false,
                        sideBwinner: true,
                        scoreA: '1',
                        scoreB: '2',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'K',
                        sideBname: 'L',
                        sideAwinner: false,
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
                        sideAname: 'B',
                        sideBname: 'C',
                        sideAwinner: true,
                        sideBwinner: false,
                        scoreA: '2',
                        scoreB: '1',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'E',
                        sideBname: 'H',
                        sideAwinner: true,
                        sideBwinner: false,
                        scoreA: '2',
                        scoreB: '1',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'J',
                        sideBname: null,
                        sideAwinner: false,
                        sideBwinner: null,
                        scoreA: '',
                        scoreB: null,
                        bye: true,
                        saygLink: null,
                    },
                    {
                        sideAname: 'L',
                        sideBname: null,
                        sideAwinner: false,
                        sideBwinner: null,
                        scoreA: '',
                        scoreB: null,
                        bye: true,
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
                        sideAname: 'B',
                        sideBname: 'E',
                        sideAwinner: true,
                        sideBwinner: false,
                        scoreA: '2',
                        scoreB: '1',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: 'J',
                        sideBname: 'L',
                        sideAwinner: true,
                        sideBwinner: false,
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
                        sideAname: 'B',
                        sideBname: 'J',
                        sideAwinner: true,
                        sideBwinner: false,
                        scoreA: '2',
                        scoreB: '1',
                        bye: false,
                        saygLink: null,
                    },
                ],
            });
        });

        it('does not render winner when insufficient legs played', async () => {
            const player1: ITeamPlayerDto = playerBuilder('PLAYER 1').build();
            const player2: ITeamPlayerDto = playerBuilder('PLAYER 2').build();
            const sideASinglePlayer: ITournamentSideDto = createSide('A', [player1]);
            const sideBSinglePlayer: ITournamentSideDto = createSide('B', [player2]);
            const tournamentData: ITournamentGameDto = tournamentBuilder()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m
                        .sideA(sideASinglePlayer, 1)
                        .sideB(sideBSinglePlayer, 2))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(5)))
                .withSide(sideASinglePlayer)
                .withSide(sideBSinglePlayer)
                .build();
            const teams: DataMap<ITeamDto> = toMap<ITeamDto>([
                teamBuilder('TEAM')
                    .forSeason(season, division, [player2])
                    .build()]);
            const divisions: IDivisionDto[] = [division];

            await renderComponent({tournamentData, season, division}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            const winner = getWinner();
            expect(winner).toEqual({
                link: null,
                name: ' ',
            });
        });

        it('does not render winner when 2 matches in final round (semi final is last round so far)', async () => {
            const player1: ITeamPlayerDto = playerBuilder('PLAYER 1').build();
            const player2: ITeamPlayerDto = playerBuilder('PLAYER 2').build();
            const player3: ITeamPlayerDto = playerBuilder('PLAYER 3').build();
            const player4: ITeamPlayerDto = playerBuilder('PLAYER 4').build();
            const player5: ITeamPlayerDto = playerBuilder('PLAYER 5').build();
            const sideASinglePlayer: ITournamentSideDto = createSide('A', [player1]);
            const sideBSinglePlayer: ITournamentSideDto = createSide('B', [player2]);
            const sideCSinglePlayer: ITournamentSideDto = createSide('C', [player3]);
            const sideDSinglePlayer: ITournamentSideDto = createSide('D', [player4]);
            const sideESinglePlayer: ITournamentSideDto = createSide('E', [player5]);
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
            const teams: DataMap<ITeamDto> = toMap<ITeamDto>([
                teamBuilder('TEAM')
                    .forSeason(season, division, [player2])
                    .build()]);
            const divisions: IDivisionDto[] = [division];

            await renderComponent({tournamentData, season, division}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            const winner = getWinner();
            expect(winner).toEqual({
                link: null,
                name: ' ',
            });
        });

        it('renders winner', async () => {
            const player1: ITeamPlayerDto = playerBuilder('PLAYER 1').build();
            const player2: ITeamPlayerDto = playerBuilder('PLAYER 2').build();
            const sideASinglePlayer: ITournamentSideDto = createSide('A', [player1]);
            const sideBSinglePlayer: ITournamentSideDto = createSide('B', [player2]);
            const tournamentData: ITournamentGameDto = tournamentBuilder()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m
                        .sideA(sideASinglePlayer, 1)
                        .sideB(sideBSinglePlayer, 2))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3)))
                .withSide(sideASinglePlayer)
                .withSide(sideBSinglePlayer)
                .build();
            const teams: DataMap<ITeamDto> = toMap<ITeamDto>([
                teamBuilder('TEAM')
                    .forSeason(season, division, [player2])
                    .build()]);
            const divisions: IDivisionDto[] = [division];

            await renderComponent({tournamentData, season, division}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            const winner = getWinner();
            expect(winner.name).toEqual('B');
            expect(winner.link).toEqual(`http://localhost/division/${division.name}/player:${encodeURI(player2.name)}@TEAM/${season.name}`);
        });

        it('renders winner when cross-divisional', async () => {
            const player1: ITeamPlayerDto = playerBuilder('PLAYER 1').build();
            const player2: ITeamPlayerDto = playerBuilder('PLAYER 2').build();
            const sideASinglePlayer = createSide('A', [player1]);
            const sideBSinglePlayer = createSide('B', [player2]);
            const tournamentData: ITournamentGameDto = tournamentBuilder()
                .round((r: ITournamentRoundBuilder) => r
                    .withMatch((m: ITournamentMatchBuilder) => m.sideA(sideASinglePlayer, 1).sideB(sideBSinglePlayer, 2))
                    .withMatchOption((o: IMatchOptionsBuilder) => o.numberOfLegs(3)))
                .withSide(sideASinglePlayer).withSide(sideBSinglePlayer)
                .build();
            const teams: DataMap<ITeamDto> = toMap<ITeamDto>([
                teamBuilder('TEAM')
                    .forSeason(season, division, [player2])
                    .build()]);
            const divisions: IDivisionDto[] = [division];

            await renderComponent({tournamentData, season, division: null}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            const winner = getWinner();
            expect(winner.name).toEqual('B');
            expect(winner.link).toEqual(`http://localhost/division/${division.name}/player:${encodeURI(player2.name)}@TEAM/${season.name}`);
        });

        it('renders who is playing (singles)', async () => {
            const player1: ITeamPlayerDto = playerBuilder('PLAYER 1').build();
            const player2: ITeamPlayerDto = playerBuilder('PLAYER 2').build();
            const tournamentData: ITournamentGameDto = {
                round: null,
                sides: [createSide('A', [player1]), createSide('B', [player2])],
                oneEighties: [],
                over100Checkouts: [],
                address: '',
            };
            const teams: DataMap<ITeamDto> = toMap<ITeamDto>([
                teamBuilder('TEAM')
                    .forSeason(season, division, [player1])
                    .build()]);
            const divisions: IDivisionDto[] = [division];

            await renderComponent({tournamentData, season, division}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual(['1 - A', '2 - B']);
            expect(getWhoIsPlaying(linkHref)).toEqual([`http://localhost/division/${division.name}/player:${encodeURI('PLAYER 1')}@TEAM/${season.name}`, null]);
        });

        it('renders who is playing (teams)', async () => {
            const team: ITeamDto = teamBuilder('TEAM')
                .forSeason(season, division)
                .build();
            const anotherTeam: ITeamDto = teamBuilder('ANOTHER TEAM').build();
            const sideA: ITournamentSideDto = createSide('A');
            sideA.teamId = team.id;
            const sideB: ITournamentSideDto = createSide('B');
            sideB.teamId = anotherTeam.id;
            const tournamentData: ITournamentGameDto = {
                round: null,
                sides: [sideA, sideB],
                oneEighties: [],
                over100Checkouts: [],
                address: '',
            };
            const teams: DataMap<ITeamDto> = toMap<ITeamDto>([team]);
            const divisions: IDivisionDto[] = [division];

            await renderComponent({tournamentData, season, division}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual(['1 - A', '2 - B']);
            expect(getWhoIsPlaying(linkHref)).toEqual([
                `http://localhost/division/${division.name}/team:TEAM/${season.name}`,
                `http://localhost/division/${division.name}/team:${sideB.teamId}/${season.name}`]);
        });

        it('renders who is playing when cross-divisional', async () => {
            const tournamentData: ITournamentGameDto = {
                round: null,
                sides: [sideA, sideB],
                oneEighties: [],
                over100Checkouts: [],
                address: '',
            };
            const season: ISeasonDto = seasonBuilder('SEASON').build();
            const teams: DataMap<ITeamDto> = toMap([ teamBuilder('TEAM')
                .forSeason(season, division)
                .build()
            ]);
            const divisions: IDivisionDto[] = [division];

            await renderComponent({tournamentData, season, division: null}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual(['1 - A', '2 - B']);
            expect(getWhoIsPlaying(linkHref)).toEqual([null, null]);
        });

        it('renders who is playing when team not found', async () => {
            const player1: ITeamPlayerDto = playerBuilder('PLAYER 1').build();
            const player2: ITeamPlayerDto = playerBuilder('PLAYER 2').build();
            const sideASinglePlayer: ITournamentSideDto = createSide('A', [player1]);
            const sideBSinglePlayer: ITournamentSideDto = createSide('B', [player2]);
            const tournamentData: ITournamentGameDto = {
                round: null,
                sides: [sideASinglePlayer, sideBSinglePlayer],
                oneEighties: [],
                over100Checkouts: [],
                address: '',
            };
            const anotherSeason: ISeasonDto = seasonBuilder('SEASON').build();
            const teams: DataMap<ITeamDto> = toMap([ teamBuilder('TEAM')
                .forSeason(anotherSeason, division, [ player1, player2 ])
                .build()
            ]);
            const divisions: IDivisionDto[] = [division];

            await renderComponent({tournamentData, season, division: null}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual(['1 - A', '2 - B']);
            expect(getWhoIsPlaying(linkHref)).toEqual([null, null]);
        });

        it('renders who is playing with no shows', async () => {
            const tournamentData: ITournamentGameDto = {
                round: null,
                sides: [sideA, sideB, Object.assign({}, sideC, {noShow: true})],
                oneEighties: [],
                over100Checkouts: [],
                address: '',
            };
            const teams: DataMap<ITeamDto> = toMap([]);
            const divisions: IDivisionDto[] = [division];

            await renderComponent({tournamentData, season, division}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual(['1 - A', '2 - B', '-3 - C-']);
            expect(getWhoIsPlaying(linkHref)).toEqual([null, null, null]);
        });

        it('renders heading', async () => {
            const tournamentData: ITournamentGameDto = tournamentBuilder()
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
            const player1: ITeamPlayerDto = playerBuilder('PLAYER 1').build();
            const player2: ITeamPlayerDto = playerBuilder('PLAYER 2').build();
            const tournamentData: ITournamentGameDto = {
                round: null,
                sides: [createSide('A', [player1]), createSide('B', [player2])],
                oneEighties: [player1, player2, player1, player1],
                over100Checkouts: [],
                address: '',
            };
            const teams: DataMap<ITeamDto> = toMap([
                teamBuilder('TEAM')
                    .forSeason(season, division, [player1])
                    .build()
            ]);
            const divisions: IDivisionDto[] = [division];

            await renderComponent({tournamentData, season, division}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            expect(getAccolades('180s', d => d.textContent)).toEqual(['PLAYER 1 x 3', 'PLAYER 2 x 1']);
            expect(getAccolades('180s', linkHref))
                .toEqual([`http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`, null]);
        });

        it('renders 180s when cross-divisional', async () => {
            const player1: ITeamPlayerDto = playerBuilder('PLAYER 1').build();
            const player2: ITeamPlayerDto = playerBuilder('PLAYER 2').build();
            const tournamentData: ITournamentGameDto = {
                round: null,
                sides: [createSide('A', [player1]), createSide('B', [player2])],
                oneEighties: [player1, player2, player1, player1],
                over100Checkouts: [],
                address: '',
            };
            const teams: DataMap<ITeamDto> = toMap([
                teamBuilder('TEAM')
                    .forSeason(season, division, [player1])
                    .build()
            ]);
            const divisions = [division];

            await renderComponent({tournamentData, season, division: null}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            expect(getAccolades('180s', d => d.textContent)).toEqual(['PLAYER 1 x 3', 'PLAYER 2 x 1']);
            expect(getAccolades('180s', linkHref)).toEqual([`http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`, null]);
        });

        it('renders hi checks', async () => {
            const player1: ITeamPlayerDto = playerBuilder('PLAYER 1').notes('100').build();
            const player2: ITeamPlayerDto = playerBuilder('PLAYER 2').notes('120').build();
            const tournamentData: ITournamentGameDto = {
                round: null,
                sides: [createSide('A', [player1]), createSide('B', [player2])],
                oneEighties: [],
                over100Checkouts: [player1, player2],
                address: '',
            };
            const teams: DataMap<ITeamDto> = toMap([
                teamBuilder('TEAM')
                    .forSeason(season, division, [player1])
                    .build()
            ]);
            const divisions = [division];

            await renderComponent({tournamentData, season, division}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            expect(getAccolades('hi-checks', d => d.textContent)).toEqual(['PLAYER 1 (100)', 'PLAYER 2 (120)']);
            expect(getAccolades('hi-checks', linkHref))
                .toEqual([`http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`, null]);
        });

        it('renders hi checks when cross-divisional', async () => {
            const player1: ITeamPlayerDto = playerBuilder('PLAYER 1').notes('100').build();
            const player2: ITeamPlayerDto = playerBuilder('PLAYER 2').notes('120').build();
            const tournamentData: ITournamentGameDto = {
                round: null,
                sides: [createSide('A', [player1]), createSide('B', [player2])],
                oneEighties: [],
                over100Checkouts: [player1, player2],
                address: '',
            };
            const teams: DataMap<ITeamDto> = toMap([
                teamBuilder('TEAM')
                    .forSeason(season, division, [player1])
                    .build()
            ]);
            const divisions = [division];

            await renderComponent({tournamentData, season, division: null}, {printOnly: false}, teams, divisions);

            expect(reportedError.hasError()).toEqual(false);
            expect(getAccolades('hi-checks', d => d.textContent)).toEqual(['PLAYER 1 (100)', 'PLAYER 2 (120)']);
            expect(getAccolades('hi-checks', linkHref)).toEqual([`http://localhost/division/${division.name}/player:${encodeURI(player1.name)}@TEAM/${season.name}`, null]);
        });
    });

    describe('unplayed tournament', () => {
        const sideA: ITournamentSideDto = createSide('A');
        const sideB: ITournamentSideDto = createSide('B');
        const sideC: ITournamentSideDto = createSide('C');
        const sideD: ITournamentSideDto = createSide('D');
        const sideE: ITournamentSideDto = createSide('E');
        const sideF: ITournamentSideDto = createSide('F');
        const sideG: ITournamentSideDto = createSide('G');
        const sideH: ITournamentSideDto = createSide('H');
        const division: IDivisionDto = divisionBuilder('DIVISION').build();
        const season: ISeasonDto = seasonBuilder('SEASON')
            .withDivision(division)
            .build();

        it('renders tournament with 2 sides', async () => {
            const tournamentData: ITournamentGameDto = {
                round: null,
                sides: [sideA, sideB],
                oneEighties: [],
                over100Checkouts: [],
                address: '',
            };

            await renderComponent({tournamentData, season, division}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            const rounds = getRounds();
            expect(rounds.length).toEqual(1);
            expect(rounds[0]).toEqual({
                heading: 'Final',
                hiChecks: {players: []},
                oneEighties: {players: []},
                matches: [
                    {
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                ],
            });
        });

        it('renders tournament with 3 sides', async () => {
            const tournamentData: ITournamentGameDto = {
                round: null,
                sides: [sideA, sideB, sideC],
                oneEighties: [],
                over100Checkouts: [],
                address: '',
            };

            await renderComponent({tournamentData, season, division}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            const rounds = getRounds();
            expect(rounds.length).toEqual(2);
            expect(rounds[0]).toEqual({
                heading: 'Semi-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    {
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: '',
                        sideBname: null,
                        sideAwinner: false,
                        sideBwinner: null,
                        scoreA: '',
                        scoreB: null,
                        bye: true,
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
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                ],
            });
        });

        it('renders tournament with 4 sides', async () => {
            const tournamentData: ITournamentGameDto = {
                round: null,
                sides: [sideA, sideB, sideC, sideD],
                oneEighties: [],
                over100Checkouts: [],
                address: '',
            };

            await renderComponent({tournamentData, season, division}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            const rounds = getRounds();
            expect(rounds.length).toEqual(2);
            expect(rounds[0]).toEqual({
                heading: 'Semi-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    {
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
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
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                ],
            });
        });

        it('renders tournament with 5 sides', async () => {
            const tournamentData: ITournamentGameDto = {
                round: null,
                sides: [sideA, sideB, sideC, sideD, sideE],
                oneEighties: [],
                over100Checkouts: [],
                address: '',
            };

            await renderComponent({tournamentData, season, division}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            const rounds = getRounds();
            expect(rounds.length).toEqual(3);
            expect(rounds[0]).toEqual({
                heading: 'Quarter-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    {
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: '',
                        sideBname: null,
                        sideAwinner: false,
                        sideBwinner: null,
                        scoreA: '',
                        scoreB: null,
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
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: '',
                        sideBname: null,
                        sideAwinner: false,
                        sideBwinner: null,
                        scoreA: '',
                        scoreB: null,
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
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                ],
            });
        });

        it('renders tournament with 6 sides', async () => {
            const tournamentData: ITournamentGameDto = {
                round: null,
                sides: [sideA, sideB, sideC, sideD, sideE, sideF],
                oneEighties: [],
                over100Checkouts: [],
                address: '',
            };

            await renderComponent({tournamentData, season, division}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            const rounds = getRounds();
            expect(rounds.length).toEqual(3);
            expect(rounds[0]).toEqual({
                heading: 'Quarter-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    {
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
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
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: '',
                        sideBname: null,
                        sideAwinner: false,
                        sideBwinner: null,
                        scoreA: '',
                        scoreB: null,
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
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                ],
            });
        });

        it('renders tournament with 7 sides', async () => {
            const tournamentData: ITournamentGameDto = {
                round: null,
                sides: [sideA, sideB, sideC, sideD, sideE, sideF, sideG],
                oneEighties: [],
                over100Checkouts: [],
                address: '',
            };

            await renderComponent({tournamentData, season, division}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            const rounds = getRounds();
            expect(rounds.length).toEqual(3);
            expect(rounds[0]).toEqual({
                heading: 'Quarter-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    {
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: '',
                        sideBname: null,
                        sideAwinner: false,
                        sideBwinner: null,
                        scoreA: '',
                        scoreB: null,
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
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
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
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                ],
            });
        });

        it('renders tournament with 8 sides', async () => {
            const tournamentData: ITournamentGameDto = {
                round: null,
                sides: [sideA, sideB, sideC, sideD, sideE, sideF, sideG, sideH],
                oneEighties: [],
                over100Checkouts: [],
                address: '',
            };

            await renderComponent({tournamentData, season, division}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            const rounds = getRounds();
            expect(rounds.length).toEqual(3);
            expect(rounds[0]).toEqual({
                heading: 'Quarter-Final',
                hiChecks: null,
                oneEighties: null,
                matches: [
                    {
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
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
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                    {
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
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
                        sideAname: '',
                        sideBname: '',
                        sideAwinner: false,
                        sideBwinner: false,
                        scoreA: '',
                        scoreB: '',
                        bye: false,
                        saygLink: null,
                    },
                ],
            });
        });

        it('renders who is playing', async () => {
            const tournamentData: ITournamentGameDto = {
                round: null,
                sides: [sideA, sideB],
                oneEighties: [],
                over100Checkouts: [],
                address: '',
            };

            await renderComponent({tournamentData, season, division}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual(['1 - A', '2 - B']);
        });

        it('renders who is playing when cross-divisional', async () => {
            const tournamentData: ITournamentGameDto = {
                round: null,
                sides: [sideA, sideB],
                oneEighties: [],
                over100Checkouts: [],
                address: '',
            };

            await renderComponent({tournamentData, season, division: null}, {printOnly: false});

            expect(reportedError.hasError()).toEqual(false);
            expect(getWhoIsPlaying(whoIsPlayingText)).toEqual(['1 - A', '2 - B']);
        });

        it('renders heading', async () => {
            const tournamentData: ITournamentGameDto = tournamentBuilder()
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
    });
});