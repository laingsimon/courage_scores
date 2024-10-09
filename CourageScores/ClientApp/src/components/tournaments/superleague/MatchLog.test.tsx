import {
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext
} from "../../../helpers/tests";
import {IMatchLogProps, MatchLog} from "./MatchLog";
import {LegDto} from "../../../interfaces/models/dtos/Game/Sayg/LegDto";
import {ISuperleagueSaygMatchMapping} from "./ISuperleagueSaygMatchMapping";
import {ILegCompetitorScoreBuilder, legBuilder, saygBuilder} from "../../../helpers/builders/sayg";
import {tournamentMatchBuilder} from "../../../helpers/builders/tournaments";

describe('MatchLog', () => {
    let context: TestContext;
    let reportedError: ErrorState;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function renderComponent(props: IMatchLogProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            (<MatchLog {...props} />));
    }

    function createLeg(homeScore: number, awayScore: number): LegDto {
        return legBuilder()
            .home((c: ILegCompetitorScoreBuilder) => c.withThrow(homeScore, false, 3).noOfDarts(3))
            .away((c: ILegCompetitorScoreBuilder) => c.withThrow(awayScore, false, 3).noOfDarts(3))
            .startingScore(501)
            .build();
    }

    function rowContent(row: HTMLTableRowElement, tagName: string): string[] {
        return Array.from(row.querySelectorAll(tagName)).map(cell => cell.textContent);
    }

    function* after(iterable: string[], afterText: string) {
        let collect: boolean = false;

        for (const item of iterable) {
            if (item === afterText) {
                collect = true;
                continue;
            }

            if (collect) {
                yield item;
            }
        }
    }

    describe('renders', () => {
        it('when no sayg data', async () => {
            const saygMatch: ISuperleagueSaygMatchMapping = {
                match: tournamentMatchBuilder().sideA('A').sideB('B').build(),
                saygData: null,
            };

            await renderComponent({
                showWinner: false,
                noOfThrows: 5,
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: [saygMatch]
            });

            reportedError.verifyNoError();
            expect(context.container.textContent).toContain('⚠ No data available for the match between A and B');
        });

        it('when no sayg legs', async () => {
            const saygMatch: ISuperleagueSaygMatchMapping = {
                match: tournamentMatchBuilder().sideA('A').sideB('B').build(),
                saygData: {legs: null},
            };

            await renderComponent({
                showWinner: false,
                noOfThrows: 5,
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: [saygMatch]
            });

            reportedError.verifyNoError();
            expect(context.container.textContent).toContain('⚠ No data available for the match between A and B');
        });

        it('correct number of throw columns', async () => {
            const saygMatch: ISuperleagueSaygMatchMapping = {
                match: tournamentMatchBuilder().sideA('A').sideB('B').build(),
                saygData: saygBuilder()
                    .withLeg(0, createLeg(100, 50))
                    .build(),
            };

            await renderComponent({
                showWinner: false,
                noOfThrows: 5,
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: [saygMatch]
            });

            reportedError.verifyNoError();
            const table = Array.from(context.container.querySelectorAll('table.table'))[0];
            const rows = Array.from(table.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
            /* 2 heading rows, 3 data rows - repeated for home and away */
            const hostHeadings = rowContent(rows[1], 'th');
            expect([...after(hostHeadings, 'GD')]).toEqual(['1', '2', '3', '4', '5', '6']);
            const opponentHeadings = rowContent(rows[4], 'th');
            expect([...after(opponentHeadings, 'GD')]).toEqual(['1', '2', '3', '4', '5', '6']);
        });

        it('first match content for host', async () => {
            const saygMatch: ISuperleagueSaygMatchMapping = {
                match: tournamentMatchBuilder().sideA('A').sideB('B').build(),
                saygData: saygBuilder()
                    .withLeg(0, createLeg(100, 50))
                    .withLeg(1, createLeg(100, 50))
                    .withLeg(2, createLeg(100, 50))
                    .build(),
            };

            await renderComponent({
                showWinner: false,
                noOfThrows: 5,
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: [saygMatch]
            });

            reportedError.verifyNoError();
            const table = Array.from(context.container.querySelectorAll('table.table'))[0];
            const rows = Array.from(table.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
            /* 2 heading rows, 3 data rows - repeated for home and away */
            expect(rows.length).toEqual(2 + 3 + 2 + 3);
            expect(rowContent(rows[0], 'th')).toEqual(['HOST', 'Dart average', '', '']);
            expect(rowContent(rows[1], 'th')).toEqual(['Player', 'L', 'AD', 'GS', 'SL', '100+', '140+', '180', 'T', 'Player', 'Team', 'GD', '1', '2', '3', '4', '5', '6']);
            expect(rowContent(rows[2], 'td')).toEqual(['A', '1', '3', '', '401', '1', '0', '0', '1', '33.33', '33.33', '3', '100', '', '', '', '', '']);
            expect(rowContent(rows[3], 'td')).toEqual(['2', '3', '', '401', '1', '0', '0', '1', '3', '100', '', '', '', '', '']);
            expect(rowContent(rows[4], 'td')).toEqual(['3', '3', '', '401', '1', '0', '0', '1', '3', '100', '', '', '', '', '']);
        });

        it('first match content for opponent', async () => {
            const saygMatch: ISuperleagueSaygMatchMapping = {
                match: tournamentMatchBuilder().sideA('A').sideB('B').build(),
                saygData: saygBuilder()
                    .withLeg(0, createLeg(100, 50))
                    .withLeg(1, createLeg(100, 50))
                    .withLeg(2, createLeg(100, 50))
                    .build(),
            };

            await renderComponent({
                showWinner: false,
                noOfThrows: 5,
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: [saygMatch]
            });

            reportedError.verifyNoError();
            const table = context.container.querySelector('table.table');
            const rows = Array.from(table.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
            /* 2 heading rows, 3 data rows - repeated for home and away */
            expect(rows.length).toEqual(2 + 3 + 2 + 3);
            expect(rowContent(rows[5], 'th')).toEqual(['OPPONENT', 'Dart average', '', '']);
            expect(rowContent(rows[6], 'th')).toEqual(['Player', 'L', 'AD', 'GS', 'SL', '100+', '140+', '180', 'T', 'Player', 'Team', 'GD', '1', '2', '3', '4', '5', '6']);
            expect(rowContent(rows[7], 'td')).toEqual(['B', '1', '3', '', '451', '0', '0', '0', '0', '16.67', '16.67', '3', '50', '', '', '', '', '']);
            expect(rowContent(rows[8], 'td')).toEqual(['2', '3', '', '451', '0', '0', '0', '0', '3', '50', '', '', '', '', '']);
            expect(rowContent(rows[9], 'td')).toEqual(['3', '3', '', '451', '0', '0', '0', '0', '3', '50', '', '', '', '', '']);
        });

        it('second match content for host', async () => {
            const saygMatch1: ISuperleagueSaygMatchMapping = {
                match: tournamentMatchBuilder().sideA('A').sideB('B').build(),
                saygData: saygBuilder()
                    .withLeg(0, createLeg(50, 25))
                    .build(),
            };
            const saygMatch2: ISuperleagueSaygMatchMapping = {
                match: tournamentMatchBuilder().sideA('C').sideB('D').build(),
                saygData: saygBuilder()
                    .withLeg(0, createLeg(100, 50))
                    .build(),
            };

            await renderComponent({
                showWinner: false,
                noOfThrows: 5,
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: [saygMatch1, saygMatch2]
            });

            reportedError.verifyNoError();
            const firstMatchTable = Array.from(context.container.querySelectorAll('table.table'))[0];
            const secondMatchTable = Array.from(context.container.querySelectorAll('table.table'))[1];
            const firstMatchRows = Array.from(firstMatchTable.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
            const secondMatchRows = Array.from(secondMatchTable.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
            /* 2 heading rows, 3 data rows - repeated for home and away */
            expect(secondMatchRows.length).toEqual(2 + 1 + 2 + 1);
            expect(rowContent(secondMatchRows[0], 'th')).toEqual(['HOST', 'Dart average', '', '']);
            expect(rowContent(secondMatchRows[1], 'th')).toEqual(['Player', 'L', 'AD', 'GS', 'SL', '100+', '140+', '180', 'T', 'Player', 'Team', 'GD', '1', '2', '3', '4', '5', '6']);
            const firstMatchPlayerAverage = 16.67;
            const secondMatchPlayerAverage = 33.33;
            const overallMatchPlayerAverage = firstMatchPlayerAverage + secondMatchPlayerAverage;
            expect(rowContent(firstMatchRows[2], 'td')).toEqual(['A', '1', '3', '', '451', '0', '0', '0', '0', firstMatchPlayerAverage.toString(), firstMatchPlayerAverage.toString(), '3', '50', '', '', '', '', '']);
            expect(rowContent(secondMatchRows[2], 'td')).toEqual(['C', '1', '3', '', '401', '1', '0', '0', '1', secondMatchPlayerAverage.toString(), overallMatchPlayerAverage.toString(), '3', '100', '', '', '', '', '']);
        });

        it('second match content for opponent', async () => {
            const saygMatch1: ISuperleagueSaygMatchMapping = {
                match: tournamentMatchBuilder().sideA('A').sideB('B').build(),
                saygData: saygBuilder()
                    .withLeg(0, createLeg(50, 25))
                    .build(),
            };
            const saygMatch2: ISuperleagueSaygMatchMapping = {
                match: tournamentMatchBuilder().sideA('C').sideB('D').build(),
                saygData: saygBuilder()
                    .withLeg(0, createLeg(100, 50))
                    .build(),
            };

            await renderComponent({
                showWinner: false,
                noOfThrows: 5,
                host: 'HOST',
                opponent: 'OPPONENT',
                saygMatches: [saygMatch1, saygMatch2]
            });

            reportedError.verifyNoError();
            const firstMatchTable = Array.from(context.container.querySelectorAll('table.table'))[0];
            const secondMatchTable = Array.from(context.container.querySelectorAll('table.table'))[1];
            const firstMatchRows = Array.from(firstMatchTable.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
            const secondMatchRows = Array.from(secondMatchTable.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
            /* 2 heading rows, 3 data rows - repeated for home and away */
            expect(secondMatchRows.length).toEqual(2 + 1 + 2 + 1);
            expect(rowContent(secondMatchRows[3], 'th')).toEqual(['OPPONENT', 'Dart average', '', '']);
            expect(rowContent(secondMatchRows[4], 'th')).toEqual(['Player', 'L', 'AD', 'GS', 'SL', '100+', '140+', '180', 'T', 'Player', 'Team', 'GD', '1', '2', '3', '4', '5', '6']);
            const firstMatchPlayerAverage = 8.33;
            const secondMatchPlayerAverage = 16.67;
            const overallMatchPlayerAverage = firstMatchPlayerAverage + secondMatchPlayerAverage;
            expect(rowContent(firstMatchRows[5], 'td')).toEqual(['B', '1', '3', '', '476', '0', '0', '0', '0', firstMatchPlayerAverage.toString(), firstMatchPlayerAverage.toString(), '3', '25', '', '', '', '', '']);
            expect(rowContent(secondMatchRows[5], 'td')).toEqual(['D', '1', '3', '', '451', '0', '0', '0', '0', secondMatchPlayerAverage.toString(), overallMatchPlayerAverage.toString(), '3', '50', '', '', '', '', '']);
        });
    });
});