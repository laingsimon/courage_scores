import {
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext,
} from '../../../helpers/tests';
import { ISummaryProps, Summary } from './Summary';
import {
    ILegBuilder,
    ILegCompetitorScoreBuilder,
    saygBuilder,
} from '../../../helpers/builders/sayg';
import { tournamentMatchBuilder } from '../../../helpers/builders/tournaments';
import { BuilderParam } from '../../../helpers/builders/builders';

describe('Summary', () => {
    let context: TestContext;
    let reportedError: ErrorState;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function renderComponent(props: ISummaryProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            <Summary {...props} />,
        );
    }

    function getRowContent(
        row: HTMLTableRowElement,
        tagName: string,
    ): string[] {
        return Array.from(row.querySelectorAll(tagName)).map(
            (th) => th.textContent!,
        );
    }

    function createLeg(
        homeWinner?: boolean,
        awayWinner?: boolean,
    ): BuilderParam<ILegBuilder> {
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

        return (b) =>
            b
                .home((c) =>
                    homeWinner ? winningThrows(c) : notWinningThrows(c),
                )
                .away((c) =>
                    awayWinner ? winningThrows(c) : notWinningThrows(c),
                )
                .startingScore(501);
    }

    describe('renders', () => {
        it('when no sayg matches', async () => {
            await renderComponent({
                saygMatches: [],
                noOfLegs: 3,
                host: 'HOST',
                opponent: 'OPPONENT',
            });

            reportedError.verifyNoError();
            expect(context.container.textContent).toContain('No matches');
        });

        it('correct row headings', async () => {
            const saygMatch = {
                match: tournamentMatchBuilder()
                    .sideA('A', 1)
                    .sideB('B', 2)
                    .build(),
                saygData: saygBuilder()
                    .withLeg(0, createLeg(true, false))
                    .withLeg(1, createLeg(true, false))
                    .build(),
            };

            await renderComponent({
                saygMatches: [saygMatch],
                noOfLegs: 3,
                host: 'HOST',
                opponent: 'OPPONENT',
            });

            reportedError.verifyNoError();
            const rows = Array.from(
                context.container.querySelectorAll('table thead tr'),
            ) as HTMLTableRowElement[];
            expect(rows.length).toEqual(1);
            expect(getRowContent(rows[0], 'th')).toEqual([
                'Match no',
                'HOSTPlayer',
                'Legs won',
                'Total tons',
                '100+',
                '140+',
                '180',
                'Player average',
                'OPPONENTPlayer',
                'Legs won',
                'Total tons',
                '100+',
                '140+',
                '180',
                'Player average',
            ]);
        });

        it('sayg matches', async () => {
            const saygMatch = {
                match: tournamentMatchBuilder()
                    .sideA('A', 1)
                    .sideB('B', 2)
                    .build(),
                saygData: saygBuilder()
                    .withLeg(0, createLeg(true, false))
                    .withLeg(1, createLeg(true, false))
                    .build(),
            };

            await renderComponent({
                saygMatches: [saygMatch],
                noOfLegs: 3,
                host: 'HOST',
                opponent: 'OPPONENT',
            });

            reportedError.verifyNoError();
            const rows = Array.from(
                context.container.querySelectorAll('table.table tbody tr'),
            ) as HTMLTableRowElement[];
            expect(rows.length).toEqual(1 + 1);
            expect(getRowContent(rows[0], 'td')).toEqual([
                '1',
                'A',
                '1',
                '6',
                '6',
                '0',
                '0',
                '33.4',
                'B',
                '2',
                '0',
                '0',
                '0',
                '0',
                '30',
            ]);
        });

        it('total row', async () => {
            const saygMatch = {
                match: tournamentMatchBuilder()
                    .sideA('A', 1)
                    .sideB('B', 2)
                    .build(),
                saygData: saygBuilder()
                    .withLeg(0, createLeg(true, false))
                    .withLeg(1, createLeg(true, false))
                    .build(),
            };

            await renderComponent({
                saygMatches: [saygMatch],
                noOfLegs: 3,
                host: 'HOST',
                opponent: 'OPPONENT',
            });

            reportedError.verifyNoError();
            const rows = Array.from(
                context.container.querySelectorAll('table.table tbody tr'),
            ) as HTMLTableRowElement[];
            expect(rows.length).toEqual(1 + 1);
            expect(getRowContent(rows[1], 'td')).toEqual([
                '',
                'Total',
                '1',
                '6',
                '6',
                '0',
                '0',
                '33.4',
                'Total',
                '2',
                '0',
                '0',
                '0',
                '0',
                '30',
            ]);
        });

        it('rounded average', async () => {
            const saygMatch = {
                match: tournamentMatchBuilder()
                    .sideA('A', 1)
                    .sideB('B', 2)
                    .build(),
                saygData: saygBuilder()
                    .withLeg(0, createLeg(true, false))
                    .withLeg(1, createLeg(true, false))
                    .build(),
            };

            await renderComponent({
                saygMatches: [saygMatch],
                noOfLegs: 3,
                host: 'HOST',
                opponent: 'OPPONENT',
            });

            reportedError.verifyNoError();
            const rows = Array.from(
                context.container.querySelectorAll('table.table tfoot tr'),
            ) as HTMLTableRowElement[];
            expect(rows.length).toEqual(2);
            expect(getRowContent(rows[0], 'td')).toEqual([
                '',
                'Rounded average',
                '11.13',
                '',
                'Rounded average',
                '10',
            ]);
        });

        it('darts for windows average', async () => {
            const saygMatch = {
                match: tournamentMatchBuilder()
                    .sideA('A', 1)
                    .sideB('B', 2)
                    .build(),
                saygData: saygBuilder()
                    .withLeg(0, createLeg(true, false))
                    .withLeg(1, createLeg(false, true))
                    .withLeg(2, createLeg(true, false))
                    .build(),
            };

            await renderComponent({
                saygMatches: [saygMatch],
                noOfLegs: 3,
                host: 'HOST',
                opponent: 'OPPONENT',
            });

            reportedError.verifyNoError();
            const rows = Array.from(
                context.container.querySelectorAll('table.table tfoot tr'),
            ) as HTMLTableRowElement[];
            expect(rows.length).toEqual(2);
            expect(getRowContent(rows[1], 'td')).toEqual([
                '',
                'Darts for windows average',
                '32.27',
                '',
                'Darts for windows average',
                '31.13',
            ]);
        });
    });
});
