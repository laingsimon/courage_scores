import {
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext
} from "../../../helpers/tests";
import {IMatchReportRowProps, MatchReportRow} from "./MatchReportRow";
import {LegThrowDto} from "../../../interfaces/models/dtos/Game/Sayg/LegThrowDto";
import {LegDto} from "../../../interfaces/models/dtos/Game/Sayg/LegDto";
import {RecordedScoreAsYouGoDto} from "../../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto";
import {saygBuilder} from "../../../helpers/builders/sayg";

describe('MatchReportRow', () => {
    let context: TestContext;
    let reportedError: ErrorState;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function renderComponent(props: IMatchReportRowProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            (<MatchReportRow {...props} />),
            undefined,
            undefined,
            'tbody');
    }

    function getRowContent(row: HTMLTableRowElement): string[] {
        return Array.from(row.querySelectorAll('td')).map(th => th.textContent!);
    }

    function createLeg(homeWinner?: boolean, awayWinner?: boolean): LegDto {
        const winningThrows: LegThrowDto[] = [
            {score: 90, noOfDarts: 3},
            {score: 100, noOfDarts: 3},
            {score: 110, noOfDarts: 3},
            {score: 120, noOfDarts: 3},
            {score: 81, noOfDarts: 3},
        ];
        const notWinningThrows: LegThrowDto[] = [
            {score: 90, noOfDarts: 3},
            {score: 90, noOfDarts: 3},
            {score: 90, noOfDarts: 3},
            {score: 90, noOfDarts: 3},
            {score: 90, noOfDarts: 3},
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
        it('when no sayg data', async () => {
            await renderComponent({
                matchIndex: 1,
                saygData: null!,
                noOfThrows: 3,
                noOfLegs: 3,
                hostPlayerName: 'HOST',
                opponentPlayerName: 'OPPONENT',
            });

            reportedError.verifyNoError();
            const rows = Array.from(context.container.querySelectorAll('tr'));
            expect(rows.length).toEqual(0);
        });

        it('when no sayg legs', async () => {
            await renderComponent({
                matchIndex: 1,
                saygData: {legs: null!},
                noOfThrows: 3,
                noOfLegs: 3,
                hostPlayerName: 'HOST',
                opponentPlayerName: 'OPPONENT',
            });

            reportedError.verifyNoError();
            const rows = Array.from(context.container.querySelectorAll('tr'));
            expect(rows.length).toEqual(0);
        });

        it('for the given number of legs', async () => {
            const saygData: RecordedScoreAsYouGoDto = saygBuilder()
                .withLeg(0, createLeg())
                .withLeg(1, createLeg())
                .withLeg(2, createLeg())
                .build();

            await renderComponent({
                matchIndex: 1,
                saygData,
                noOfThrows: 3,
                noOfLegs: 3,
                hostPlayerName: 'HOST',
                opponentPlayerName: 'OPPONENT',
            });

            reportedError.verifyNoError();
            const rows = Array.from(context.container.querySelectorAll('tr'));
            expect(rows.length).toEqual(3);
        });

        it('first leg', async () => {
            const saygData: RecordedScoreAsYouGoDto = saygBuilder()
                .withLeg(0, createLeg(true, false))
                .build();

            await renderComponent({
                matchIndex: 0,
                saygData,
                noOfThrows: 3,
                noOfLegs: 1,
                hostPlayerName: 'HOST',
                opponentPlayerName: 'OPPONENT',
            });

            reportedError.verifyNoError();
            const rows = Array.from(context.container.querySelectorAll('tr'));
            expect(getRowContent(rows[0])).toEqual([
                'M1',
                '33.4', 'HOST', '1', '90', '100', '110', '120', '15', '81', '', '3',
                '30', 'OPPONENT', '90', '90', '90', '90', '15', '', '51', '0',
            ]);
        });

        it('second leg', async () => {
            const saygData: RecordedScoreAsYouGoDto = saygBuilder()
                .withLeg(0, createLeg(false, true))
                .withLeg(1, createLeg(false, true))
                .build();

            await renderComponent({
                matchIndex: 0,
                saygData,
                noOfThrows: 3,
                noOfLegs: 2,
                hostPlayerName: 'HOST',
                opponentPlayerName: 'OPPONENT',
            });

            reportedError.verifyNoError();
            const rows = Array.from(context.container.querySelectorAll('tr'));
            expect(getRowContent(rows[1])).toEqual([
                '2', '90', '90', '90', '90', '15', '', '51', '0',
                '90', '100', '110', '120', '15', '81', '', '3',
            ]);
        });

        it('highlights 100+ scores', async () => {
            const saygData: RecordedScoreAsYouGoDto = saygBuilder()
                .withLeg(0, createLeg(true, false))
                .build();
            saygData.legs[0].home.throws!.forEach((thr, index) => thr.score = 100 + (index * 10));
            saygData.legs[0].away.throws!.forEach(thr => thr.score = 99);

            await renderComponent({
                matchIndex: 0,
                saygData,
                noOfThrows: 3,
                noOfLegs: 2,
                hostPlayerName: 'HOST',
                opponentPlayerName: 'OPPONENT',
            });

            reportedError.verifyNoError();
            const rows = Array.from(context.container.querySelectorAll('tr'));
            const hostScoreCells = Array.from(rows[0].querySelectorAll('td')).filter((_, index) => index >= 4 && index < 8);
            const opponentScoreCells = Array.from(rows[0].querySelectorAll('td')).filter((_, index) => index >= 14 && index < 18);
            expect(hostScoreCells.map(td => td.className.trim())).toEqual(['text-danger', 'text-danger', 'text-danger', 'text-danger']);
            expect(opponentScoreCells.map(td => td.className.trim())).toEqual(['', '', '', '']);
        });

        it('highlights 180 scores', async () => {
            const saygData: RecordedScoreAsYouGoDto = saygBuilder()
                .withLeg(0, createLeg(true, false))
                .build();
            saygData.legs[0].home.throws!.forEach(thr => thr.score = 180);
            saygData.legs[0].away.throws!.forEach(thr => thr.score = 179);

            await renderComponent({
                matchIndex: 0,
                saygData,
                noOfThrows: 3,
                noOfLegs: 2,
                hostPlayerName: 'HOST',
                opponentPlayerName: 'OPPONENT',
            });

            reportedError.verifyNoError();
            const rows = Array.from(context.container.querySelectorAll('tr'));
            const hostScoreCells = Array.from(rows[0].querySelectorAll('td')).filter((_, index) => index >= 4 && index < 8);
            const opponentScoreCells = Array.from(rows[0].querySelectorAll('td')).filter((_, index) => index >= 14 && index < 18);
            expect(hostScoreCells.map(td => td.className.trim())).toEqual(['text-danger fw-bold', 'text-danger fw-bold', 'text-danger fw-bold', 'text-danger fw-bold']);
            expect(opponentScoreCells.map(td => td.className.trim())).toEqual(['text-danger', 'text-danger', 'text-danger', 'text-danger']);
        });

        it('shows non-180-tons correctly', async () => {
            const saygData: RecordedScoreAsYouGoDto = saygBuilder()
                .withLeg(0, createLeg(true, false))
                .build();
            saygData.legs[0].home.throws!.forEach(thr => thr.score = 120);
            saygData.legs[0].away.throws!.forEach(thr => thr.score = 130);

            await renderComponent({
                matchIndex: 0,
                saygData,
                noOfThrows: 3,
                noOfLegs: 2,
                hostPlayerName: 'HOST',
                opponentPlayerName: 'OPPONENT',
            });

            reportedError.verifyNoError();
            const rows = Array.from(context.container.querySelectorAll('tr'));
            const hostTons = Array.from(rows[0].querySelectorAll('td'))[11];
            const opponentTons = Array.from(rows[0].querySelectorAll('td'))[21];
            expect(hostTons.textContent).toEqual('5');
            expect(opponentTons.textContent).toEqual('5');
        });

        it('shows 180-tons correctly', async () => {
            const saygData: RecordedScoreAsYouGoDto = saygBuilder()
                .withLeg(0, createLeg(true, false))
                .build();
            saygData.legs[0].home.throws!.forEach(thr => thr.score = 180);
            saygData.legs[0].away.throws!.forEach(thr => thr.score = 180);

            await renderComponent({
                matchIndex: 0,
                saygData,
                noOfThrows: 3,
                noOfLegs: 2,
                hostPlayerName: 'HOST',
                opponentPlayerName: 'OPPONENT',
            });

            reportedError.verifyNoError();
            const rows = Array.from(context.container.querySelectorAll('tr'));
            const hostTons = Array.from(rows[0].querySelectorAll('td'))[11];
            const opponentTons = Array.from(rows[0].querySelectorAll('td'))[21];
            expect(hostTons.textContent).toEqual('5+5');
            expect(opponentTons.textContent).toEqual('5+5');
        });
    });
});