import {
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext
} from "../../../helpers/tests";
import {IMatchLogRowProps, MatchLogRow} from "./MatchLogRow";
import {ILegCompetitorScoreBuilder, legBuilder} from "../../../helpers/builders/sayg";
import {LegDto} from "../../../interfaces/models/dtos/Game/Sayg/LegDto";

describe('MatchLogRow', () => {
    let context: TestContext;
    let reportedError: ErrorState;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function renderComponent(props: IMatchLogRowProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            (<MatchLogRow {...props} />),
            null,
            null,
            'tbody');
    }

    function explainRow(cells: HTMLTableCellElement[], leg: number) {
        // see MatchLogTableHeading
        const headings = leg === 1 ? [
            'Player',
            'Leg',
            'AD',
            'GS',
            'SL',
            '100+',
            '140+',
            '180',
            'T',
            'PlayerAverage',
            'TeamAverage',
            'GD',
        ] : [
            'Leg',
            'AD',
            'GS',
            'SL',
            '100+',
            '140+',
            '180',
            'T',
            'GD',
        ];
        const detail = {};

        cells.forEach((cell, index) => {
            const name = index >= headings.length
                ? `T${(index - headings.length + 1)}`
                : headings[index];
            detail[name] = cell.textContent;
        });

        return detail;
    }

    describe('renders', () => {
        const homeWinningLeg: LegDto = legBuilder()
            .home((c: ILegCompetitorScoreBuilder) => c
                .withThrow(140)
                .withThrow(60)
                .withThrow(180)
                .withThrow(20)
                .withThrow(101, 2))
            .away((c: ILegCompetitorScoreBuilder) => c.withThrow(13, 3))
            .startingScore(501)
            .build();

        it('null when no darts thrown', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home((c: ILegCompetitorScoreBuilder) => c)
                    .away((c: ILegCompetitorScoreBuilder) => c)
                    .build(),
                legNo: 1,
                accumulatorName: 'home',
                player: 'PLAYER',
                noOfThrows: 5,
                playerOverallAverage: 12.34,
                noOfLegs: 3,
                showWinner: false,
                teamAverage: 23.45,
            });

            reportedError.verifyNoError();
            expect(context.container.querySelector('tr')).toBeFalsy();
        });

        it('when a winner - first leg', async () => {
            await renderComponent({
                leg: homeWinningLeg,
                legNo: 1,
                accumulatorName: 'home',
                player: 'PLAYER',
                noOfThrows: 5,
                playerOverallAverage: 12.34,
                noOfLegs: 3,
                showWinner: true,
                teamAverage: 23.45,
            });

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            expect(explainRow(cells, 1)).toEqual({
                'Player': 'PLAYER',
                'Leg': '1',
                'AD': '14',
                'GS': '101',
                'SL': '',
                '100+': '1',
                '140+': '1',
                '180': '1',
                'T': '4',
                'PlayerAverage': '12.34',
                'TeamAverage': '23.45',
                'GD': '2',
                'T1': '140',
                'T2': '60',
                'T3': '180',
                'T4': '20',
                'T5': '101',
                'T6': ''
            });
            expect(context.container.querySelector('tr').className).toEqual('bg-winner');
        });

        it('when a winner - second leg', async () => {
            await renderComponent({
                leg: homeWinningLeg,
                legNo: 2,
                accumulatorName: 'home',
                player: 'PLAYER',
                noOfThrows: 5,
                playerOverallAverage: 12.34,
                noOfLegs: 3,
                showWinner: false,
                teamAverage: 23.45,
            });

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            expect(explainRow(cells, 2)).toEqual({
                'Leg': '2',
                'AD': '14',
                'GS': '101',
                'SL': '',
                '100+': '1',
                '140+': '1',
                '180': '1',
                'T': '4',
                'GD': '2',
                'T1': '140',
                'T2': '60',
                'T3': '180',
                'T4': '20',
                'T5': '101',
                'T6': ''
            });
            expect(context.container.querySelector('tr').className).toEqual('');
        });

        it('when not a winner - first leg', async () => {
            await renderComponent({
                leg: homeWinningLeg,
                legNo: 1,
                accumulatorName: 'away',
                player: 'PLAYER',
                noOfThrows: 5,
                playerOverallAverage: 12.34,
                noOfLegs: 3,
                showWinner: true,
                teamAverage: 23.45,
            });

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            expect(explainRow(cells, 1)).toEqual({
                'Player': 'PLAYER',
                'Leg': '1',
                'AD': '3',
                'GS': '',
                'SL': '488',
                '100+': '0',
                '140+': '0',
                '180': '0',
                'T': '0',
                'PlayerAverage': '12.34',
                'TeamAverage': '23.45',
                'GD': '',
                'T1': '13',
                'T2': '',
                'T3': '',
                'T4': '',
                'T5': '',
                'T6': ''
            });
            expect(context.container.querySelector('tr').className).toEqual('');
        });

        it('when not a winner - second leg', async () => {
            await renderComponent({
                leg: homeWinningLeg,
                legNo: 2,
                accumulatorName: 'away',
                player: 'PLAYER',
                noOfThrows: 5,
                playerOverallAverage: 12.34,
                noOfLegs: 3,
                showWinner: false,
                teamAverage: 23.45,
            });

            reportedError.verifyNoError();
            const cells = Array.from(context.container.querySelectorAll('td'));
            expect(explainRow(cells, 2)).toEqual({
                'Leg': '2',
                'AD': '3',
                'GS': '',
                'SL': '488',
                '100+': '0',
                '140+': '0',
                '180': '0',
                'T': '0',
                'GD': '',
                'T1': '13',
                'T2': '',
                'T3': '',
                'T4': '',
                'T5': '',
                'T6': ''
            });
            expect(context.container.querySelector('tr').className).toEqual('');
        });
    });
});