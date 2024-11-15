import {
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext
} from "../../../helpers/tests";
import {IMatchReportProps, MatchReport} from "./MatchReport";
import {ISuperleagueSaygMatchMapping} from "./ISuperleagueSaygMatchMapping";
import {ILegCompetitorScoreBuilder, legBuilder, saygBuilder} from "../../../helpers/builders/sayg";
import {divisionBuilder} from "../../../helpers/builders/divisions";
import {tournamentMatchBuilder} from "../../../helpers/builders/tournaments";

describe('MatchReport', () => {
    let context: TestContext;
    let reportedError: ErrorState;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function renderComponent(props: IMatchReportProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            (<MatchReport {...props} />));
    }

    function getRowContent(row: HTMLTableRowElement, tagName: string): string[] {
        return Array.from(row.querySelectorAll(tagName)).map(th => th.textContent);
    }

    function createLeg(homeWinner: boolean, awayWinner: boolean) {
        function winningThrows(c: ILegCompetitorScoreBuilder) {
            return c
                .withThrow(90)
                .withThrow(100)
                .withThrow(110)
                .withThrow(120)
                .withThrow(81);
        }

        function notWinningThrows(c: ILegCompetitorScoreBuilder) {
            return c
                .withThrow(90)
                .withThrow(90)
                .withThrow(90)
                .withThrow(90)
                .withThrow(90);
        }

        return legBuilder()
            .home((c: ILegCompetitorScoreBuilder) => homeWinner ? winningThrows(c) : notWinningThrows(c))
            .away((c: ILegCompetitorScoreBuilder) => awayWinner ? winningThrows(c) : notWinningThrows(c))
            .startingScore(501)
            .build();
    }

    describe('renders', () => {
        it('correct headings', async () => {
            await renderComponent({
                division: divisionBuilder('DIVISION').build(),
                showWinner: false,
                noOfThrows: 3,
                noOfLegs: 3,
                gender: 'GENDER',
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: []
            });

            reportedError.verifyNoError();
            expect(context.container.querySelector('h2').textContent).toEqual('SOMERSET DARTS ORGANISATION');
            expect(context.container.querySelector('h3').textContent).toEqual('DIVISION (GENDER)');
        });

        it('correct heading rows', async () => {
            await renderComponent({
                division: divisionBuilder('DIVISION').build(),
                showWinner: false,
                noOfThrows: 3,
                noOfLegs: 3,
                gender: 'GENDER',
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: []
            });

            reportedError.verifyNoError();
            const rows = Array.from(context.container.querySelectorAll('thead tr')) as HTMLTableRowElement[];
            expect(rows.length).toEqual(3);
            expect(getRowContent(rows[0], 'th')).toEqual(['HOSTvOPPONENT']);
            expect(rows[0].querySelector('th').colSpan).toEqual(23);
            expect(getRowContent(rows[1], 'th')).toEqual(['', 'Scores', '', '', 'Scores', '']);
            expect(rows[1].querySelectorAll('th')[1].colSpan).toEqual(4);
            expect(rows[1].querySelectorAll('th')[4].colSpan).toEqual(4);
            expect(getRowContent(rows[2], 'th')).toEqual([
                'Set',
                'Ave', 'Players Name', 'Leg', '1', '2', '3', '4', 'AD', 'GS', 'SL', 'Tons',
                'Ave', 'Players Name', '1', '2', '3', '4', 'AD', 'GS', 'SL', 'Tons'
            ]);
        });

        it('sayg matches', async () => {
            const saygMatch: ISuperleagueSaygMatchMapping = {
                match: tournamentMatchBuilder().sideA('A').sideB('B').build(),
                saygData: saygBuilder()
                    .withLeg(0, createLeg(true, false))
                    .withLeg(1, createLeg(true, false))
                    .build()
            }

            await renderComponent({
                division: divisionBuilder('DIVISION').build(),
                showWinner: false,
                noOfThrows: 3,
                noOfLegs: 3,
                gender: 'GENDER',
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: [saygMatch],
            });

            reportedError.verifyNoError();
            const rows = Array.from(context.container.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
            expect(rows.length).toEqual(3);
            expect(getRowContent(rows[0], 'td')).toEqual([
                'M1', '33.4', 'A', '1', '90', '100', '110', '120', '15', '81', '', '3', '30',
                'B', '90', '90', '90', '90', '15', '', '51', '0'
            ]);
        });

        it('legs won', async () => {
            const saygMatch: ISuperleagueSaygMatchMapping = {
                match: tournamentMatchBuilder().sideA('A').sideB('B').build(),
                saygData: saygBuilder()
                    .withLeg(0, createLeg(true, false))
                    .withLeg(1, createLeg(true, false))
                    .build()
            }

            await renderComponent({
                division: divisionBuilder('DIVISION').build(),
                showWinner: false,
                noOfThrows: 3,
                noOfLegs: 3,
                gender: 'GENDER',
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: [saygMatch],
            });

            reportedError.verifyNoError();
            const legsWonContainer = context.container.querySelector('table.table + div');
            expect(legsWonContainer).toBeTruthy();
            const legsWon = Array.from(legsWonContainer.querySelectorAll('div'));
            expect(legsWon[0].textContent).toEqual('Legs won: 2');
            expect(legsWon[1].textContent).toEqual('Legs won: 0');
        });

        it('when no division', async () => {
            await renderComponent({
                division: null,
                showWinner: false,
                noOfThrows: 3,
                noOfLegs: 3,
                gender: 'GENDER',
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: []
            });

            reportedError.verifyNoError();
            expect(context.container.querySelector('h2').textContent).toEqual('SOMERSET DARTS ORGANISATION');
            expect(context.container.querySelector('h3').textContent).toEqual('(GENDER)');
        });
    });
});