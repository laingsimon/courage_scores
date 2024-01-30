import {
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext
} from "../../../../helpers/tests";
import React from "react";
import {ISummaryDataRowProps, SummaryDataRow} from "./SummaryDataRow";
import {ILegDto} from "../../../../interfaces/models/dtos/Game/Sayg/ILegDto";
import {ILegThrowDto} from "../../../../interfaces/models/dtos/Game/Sayg/ILegThrowDto";
import {IScoreAsYouGoDto} from "../../../../interfaces/models/dtos/Game/Sayg/IScoreAsYouGoDto";
import {saygBuilder} from "../../../../helpers/builders/sayg";

describe('SummaryDataRow', () => {
    let context: TestContext;
    let reportedError: ErrorState;

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function renderComponent(props: ISummaryDataRowProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            (<SummaryDataRow {...props} />),
            null,
            null,
            'tbody');
    }

    function getRowContent(row: HTMLTableRowElement, tagName: string): string[] {
        return Array.from(row.querySelectorAll(tagName)).map(th => th.textContent);
    }

    function createLeg(homeWinner?: boolean, awayWinner?: boolean): ILegDto {
        const winningThrows: ILegThrowDto[] = [
            {score: 90, bust: false, noOfDarts: 3},
            {score: 100, bust: false, noOfDarts: 3},
            {score: 110, bust: false, noOfDarts: 3},
            {score: 120, bust: false, noOfDarts: 3},
            {score: 81, bust: false, noOfDarts: 3},
        ];
        const notWinningThrows: ILegThrowDto[] = [
            {score: 90, bust: false, noOfDarts: 3},
            {score: 90, bust: false, noOfDarts: 3},
            {score: 90, bust: false, noOfDarts: 3},
            {score: 90, bust: false, noOfDarts: 3},
            {score: 90, bust: false, noOfDarts: 3},
        ];

        return {
            home: {
                throws: homeWinner ? winningThrows : notWinningThrows
            },
            away: {
                throws: awayWinner ? winningThrows : notWinningThrows
            },
            startingScore: 501,
        };
    }

    describe('renders', () => {
        it('match data', async () => {
            const saygData: IScoreAsYouGoDto = saygBuilder()
                .withLeg(0, createLeg(true, false))
                .withLeg(1, createLeg(true, false))
                .build();

            await renderComponent({
                matchNo: 1,
                saygData,
                showWinner: false,
                hostScore: 2,
                opponentScore: 3,
                hostPlayerName: 'HOST',
                opponentPlayerName: 'OPPONENT',
            });

            expect(reportedError.hasError()).toEqual(false);
            const row = context.container.querySelector('tr');
            expect(getRowContent(row, 'td')).toEqual([
                '1', 'HOST', '2', '6', '6', '0', '0', '33.4',
                'OPPONENT', '3', '0', '0', '0', '0', '30',
            ]);
        });

        it('host winner', async () => {
            const saygData: IScoreAsYouGoDto = saygBuilder()
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

            expect(reportedError.hasError()).toEqual(false);
            const row = context.container.querySelector('tr');
            const cells = Array.from(row.querySelectorAll('td'));
            expect(cells[1].className).toEqual('bg-winner');
            expect(cells[8].className).toEqual('');
        });

        it('opponent winner', async () => {
            const saygData: IScoreAsYouGoDto = saygBuilder()
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

            expect(reportedError.hasError()).toEqual(false);
            const row = context.container.querySelector('tr');
            const cells = Array.from(row.querySelectorAll('td'));
            expect(cells[1].className).toEqual('');
            expect(cells[8].className).toEqual('bg-winner');
        });
    });
});