import {
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext
} from "../../../../helpers/tests";
import {IMatchLogRowProps, MatchLogRow} from "./MatchLogRow";
import {ILegCompetitorScoreBuilder, legBuilder} from "../../../../helpers/builders/sayg";
import {LegDto} from "../../../../interfaces/models/dtos/Game/Sayg/LegDto";

describe('MatchLogRow', () => {
    let context: TestContext;
    let reportedError: ErrorState;

    afterEach(() => {
        cleanUp(context);
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

    describe('renders', () => {
        const homeWinningLeg: LegDto = legBuilder()
            .home((c: ILegCompetitorScoreBuilder) => c
                .withThrow(140, false, 3)
                .withThrow(60, false, 3)
                .withThrow(180, false, 3)
                .withThrow(20, false, 3)
                .withThrow(101, false, 2)
                .noOfDarts(14))
            .away((c: ILegCompetitorScoreBuilder) => c.noOfDarts(1))
            .startingScore(501)
            .build();

        it('null when no darts thrown', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home((c: ILegCompetitorScoreBuilder) => c.noOfDarts(0))
                    .away((c: ILegCompetitorScoreBuilder) => c.noOfDarts(0))
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

            expect(reportedError.hasError()).toEqual(false);
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

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            expect(cells.map(td => td.textContent)).toEqual(['PLAYER', '1', '14', '101', '', '1', '1', '1', '4', '12.34', '23.45', '2', '140', '60', '180', '20', '101', '']);
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

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            expect(cells.map(td => td.textContent)).toEqual(['2', '14', '101', '', '1', '1', '1', '4', '2', '140', '60', '180', '20', '101', '']);
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

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            expect(cells.map(td => td.textContent)).toEqual(['PLAYER', '1', '0', '', '', '0', '0', '0', '0', '12.34', '23.45', '', '', '', '', '', '', '']);
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

            expect(reportedError.hasError()).toEqual(false);
            const cells = Array.from(context.container.querySelectorAll('td'));
            expect(cells.map(td => td.textContent)).toEqual(['2', '0', '', '', '0', '0', '0', '0', '', '', '', '', '', '', '']);
            expect(context.container.querySelector('tr').className).toEqual('');
        });
    });
});