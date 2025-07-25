import {
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext,
} from '../../../helpers/tests';
import { ISummaryDataRowProps, SummaryDataRow } from './SummaryDataRow';
import { LegThrowDto } from '../../../interfaces/models/dtos/Game/Sayg/LegThrowDto';
import { ScoreAsYouGoDto } from '../../../interfaces/models/dtos/Game/Sayg/ScoreAsYouGoDto';
import {
    ILegBuilder,
    ILegCompetitorScoreBuilder,
    saygBuilder,
} from '../../../helpers/builders/sayg';
import { BuilderParam } from '../../../helpers/builders/builders';

describe('SummaryDataRow', () => {
    let context: TestContext;
    let reportedError: ErrorState;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function renderComponent(props: ISummaryDataRowProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            <SummaryDataRow {...props} />,
            undefined,
            undefined,
            'tbody',
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
        const winningThrows: LegThrowDto[] = [
            { score: 90, noOfDarts: 3 },
            { score: 100, noOfDarts: 3 },
            { score: 110, noOfDarts: 3 },
            { score: 120, noOfDarts: 3 },
            { score: 81, noOfDarts: 3 },
        ];
        const notWinningThrows: LegThrowDto[] = [
            { score: 90, noOfDarts: 3 },
            { score: 90, noOfDarts: 3 },
            { score: 90, noOfDarts: 3 },
            { score: 90, noOfDarts: 3 },
            { score: 90, noOfDarts: 3 },
        ];

        function addThrows(
            builder: ILegCompetitorScoreBuilder,
            throws: LegThrowDto[],
        ): ILegCompetitorScoreBuilder {
            for (const thr of throws) {
                builder = builder.withThrow(thr.score!, thr.noOfDarts);
            }

            return builder;
        }

        return (b) =>
            b
                .startingScore(501)
                .home((c) =>
                    addThrows(c, homeWinner ? winningThrows : notWinningThrows),
                )
                .away((c) =>
                    addThrows(c, awayWinner ? winningThrows : notWinningThrows),
                );
    }

    describe('renders', () => {
        it('match data', async () => {
            const saygData: ScoreAsYouGoDto = saygBuilder()
                .withLeg(0, createLeg(true, false))
                .withLeg(1, createLeg(true, false))
                .build();

            await renderComponent({
                matchNo: 1,
                saygData,
                hostScore: 2,
                opponentScore: 3,
                hostPlayerName: 'HOST',
                opponentPlayerName: 'OPPONENT',
            });

            reportedError.verifyNoError();
            const row = context.container.querySelector('tr')!;
            expect(getRowContent(row, 'td')).toEqual([
                '1',
                'HOST',
                '2',
                '6',
                '6',
                '0',
                '0',
                '33.4',
                'OPPONENT',
                '3',
                '0',
                '0',
                '0',
                '0',
                '30',
            ]);
        });

        it('host winner', async () => {
            const saygData: ScoreAsYouGoDto = saygBuilder()
                .withLeg(0, createLeg(true, false))
                .withLeg(1, createLeg(true, false))
                .build();

            await renderComponent({
                matchNo: 1,
                saygData,
                showWinner: true,
                hostScore: 3,
                opponentScore: 2,
                hostPlayerName: 'HOST',
                opponentPlayerName: 'OPPONENT',
            });

            reportedError.verifyNoError();
            const row = context.container.querySelector('tr')!;
            const cells = Array.from(row.querySelectorAll('td'));
            expect(cells[1].className).toEqual('bg-winner');
            expect(cells[8].className).toEqual('');
        });

        it('opponent winner', async () => {
            const saygData: ScoreAsYouGoDto = saygBuilder()
                .withLeg(0, createLeg(false, true))
                .withLeg(1, createLeg(false, true))
                .build();

            await renderComponent({
                matchNo: 1,
                saygData,
                showWinner: true,
                hostScore: 2,
                opponentScore: 3,
                hostPlayerName: 'HOST',
                opponentPlayerName: 'OPPONENT',
            });

            reportedError.verifyNoError();
            const row = context.container.querySelector('tr')!;
            const cells = Array.from(row.querySelectorAll('td'));
            expect(cells[1].className).toEqual('');
            expect(cells[8].className).toEqual('bg-winner');
        });
    });
});
