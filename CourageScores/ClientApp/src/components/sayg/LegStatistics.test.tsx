import {
    cleanUp,
    doClick,
    findButton,
    renderApp,
    doChange,
    iocProps,
    brandingProps,
    appProps, TestContext
} from "../../helpers/tests";
import {ILegStatisticsProps, LegStatistics} from "./LegStatistics";
import {ILegCompetitorScoreBuilder, legBuilder} from "../../helpers/builders/sayg";
import {ILegDisplayOptions} from "./ILegDisplayOptions";
import {LegDto} from "../../interfaces/models/dtos/Game/Sayg/LegDto";

describe('LegStatistics', () => {
    let context: TestContext;
    let newLegDisplayOptions: ILegDisplayOptions | null;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        newLegDisplayOptions = null;
    });

    async function updateLegDisplayOptions(op: ILegDisplayOptions) {
        newLegDisplayOptions = op;
    }

    async function renderComponent(props: ILegStatisticsProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            <LegStatistics {...props} />,
            undefined,
            undefined,
            'tbody');
    }

    function getCellContent(tr: Element) {
        return Array.from(tr.querySelectorAll('td')).map(td => {
            let content = td.textContent;

            if (td.className.indexOf('fw-bold') !== -1) {
                content = '**' + content + '**';
            }
            if (td.className.indexOf('text-danger') !== -1) {
                content = '_' + content + '_';
            }

            return content;
        });
    }

    describe('renders', () => {
        it('when no darts thrown', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home((c: ILegCompetitorScoreBuilder) => c)
                    .away((c: ILegCompetitorScoreBuilder) => c)
                    .build(),
                legDisplayOptions: {
                    showThrows: false,
                    showAverage: false,
                },
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                updateLegDisplayOptions,
            });

            expect(context.container.innerHTML).toEqual('');
        });

        it('2 player match without winner', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(50))
                    .startingScore(501)
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: false,
                    showAverage: false,
                },
                updateLegDisplayOptions,
            });

            const cells = Array.from(context.container.querySelectorAll('tr td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual([
                'Leg: 1Details',
                'Average: 100 (3 darts)Remaining: 401',
                'Average: 50 (3 darts)Remaining: 451']);
        });

        it('2 player match with home winner', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(401).withThrow(100))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(50))
                    .startingScore(501)
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: false,
                    showAverage: false,
                },
                updateLegDisplayOptions,
            });

            const cells = Array.from(context.container.querySelectorAll('tr td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual([
                'Leg: 1Winner: HOMEDetails',
                'Average: 250.5 (6 darts)Checkout: 100',
                'Average: 50 (3 darts)Remaining: 451']);
        });

        it('2 player match with away winner', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(50))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(401).withThrow(100))
                    .startingScore(501)
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: false,
                    showAverage: false,
                },
                updateLegDisplayOptions,
            });

            const cells = Array.from(context.container.querySelectorAll('tr td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual([
                'Leg: 1Winner: AWAYDetails',
                'Average: 50 (3 darts)Remaining: 451',
                'Average: 250.5 (6 darts)Checkout: 100']);
        });

        it('single player match with winner', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(401).withThrow(100))
                    .away((c: ILegCompetitorScoreBuilder) => c)
                    .startingScore(501)
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: true,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: false,
                    showAverage: false,
                },
                updateLegDisplayOptions,
            });

            const cells = Array.from(context.container.querySelectorAll('tr td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual([
                'Leg: 1Details',
                'Average: 250.5 (6 darts)Checkout: 100']);
        });

        it('single player match without winner', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100))
                    .away((c: ILegCompetitorScoreBuilder) => c)
                    .startingScore(501)
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: true,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: false,
                    showAverage: false,
                },
                updateLegDisplayOptions,
            });

            const cells = Array.from(context.container.querySelectorAll('tr td'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual([
                'Leg: 1Details',
                'Average: 100 (3 darts)Remaining: 401']);
        });

        it('2 player throws', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(50))
                    .startingScore(100)
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: false,
                },
                updateLegDisplayOptions,
            });

            const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
            expect(homeThrows.map(getCellContent)).toEqual([['_100_', '0', '3']]);
            const awayThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(3) tbody tr'));
            expect(awayThrows.map(getCellContent)).toEqual([['50', '50', '3']]);
        });

        it('2 player match with 180s', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(180))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(50))
                    .startingScore(200)
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: false,
                },
                updateLegDisplayOptions,
            });

            const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
            expect(homeThrows.map(getCellContent)).toEqual([['_**180**_', '20', '3']]);
            const awayThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(3) tbody tr'));
            expect(awayThrows.map(getCellContent)).toEqual([['50', '150', '3']]);
        });

        it('single player throws', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100))
                    .away((c: ILegCompetitorScoreBuilder) => c)
                    .startingScore(501)
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: true,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: false,
                },
                updateLegDisplayOptions,
            });

            const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
            expect(homeThrows.map(getCellContent)).toEqual([['_100_', '401', '3']]);
        });

        it('averages', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(50))
                    .startingScore(501)
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: true,
                },
                updateLegDisplayOptions,
            });

            const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
            expect(homeThrows.map(getCellContent)).toEqual([['_100_', '401', '100']]);
            const awayThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(3) tbody tr'));
            expect(awayThrows.map(getCellContent)).toEqual([['50', '451', '50']]);
        });

        it('2 player averages when only home player has thrown', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100))
                    .away((c: ILegCompetitorScoreBuilder) => c)
                    .startingScore(501)
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: true,
                },
                updateLegDisplayOptions,
            });

            const cells = Array.from(context.container.querySelectorAll('tr td > span'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual([
                'Average: 100 (3 darts)Remaining: 401',
                'Average: - (0 darts)Remaining: 501']);
        });

        it('2 player averages when only away player has thrown', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home((c: ILegCompetitorScoreBuilder) => c)
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(100))
                    .startingScore(501)
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: true,
                },
                updateLegDisplayOptions,
            });

            const cells = Array.from(context.container.querySelectorAll('tr td > span'));
            const cellText = cells.map(td => td.textContent);
            expect(cellText).toEqual([
                'Average: - (0 darts)Remaining: 501',
                'Average: 100 (3 darts)Remaining: 401']);
        });

        it('no of darts', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(50))
                    .startingScore(501)
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: false,
                },
                updateLegDisplayOptions,
            });

            const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
            expect(homeThrows.map(getCellContent)).toEqual([['_100_', '401', '3']]);
            const awayThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(3) tbody tr'));
            expect(awayThrows.map(getCellContent)).toEqual([['50', '451', '3']]);
        });

        it('1-dart averages', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(50))
                    .startingScore(501)
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: true,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: true,
                },
                updateLegDisplayOptions,
            });

            const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
            expect(homeThrows.map(getCellContent)).toEqual([['_100_', '401', '33.33']]);
            const awayThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(3) tbody tr'));
            expect(awayThrows.map(getCellContent)).toEqual([['50', '451', '16.67']]);
        });
    });

    describe('interactivity', () => {
        it('can expand 2 player statistics', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(50))
                    .startingScore(100)
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: false,
                    showAverage: false,
                },
                updateLegDisplayOptions,
            });
            const firstCell = context.container.querySelector('tr td:first-child')!;

            await doClick(firstCell.querySelector('input[name="showThrows"]')!);

            expect(newLegDisplayOptions).toEqual({
                showThrows: true,
                showAverage: false,
            });
        });

        it('can toggle expanded statistics to show averages', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(50))
                    .startingScore(501)
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: false,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: false,
                },
                updateLegDisplayOptions,
            });
            const firstCell = context.container.querySelector('tr td:first-child');

            await doClick(findButton(firstCell, 'Click to show running average'));

            expect(newLegDisplayOptions).toEqual({
                showThrows: true,
                showAverage: true,
            });
        });

        it('can open change throw dialog', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(50))
                    .startingScore(501)
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: true,
                onChangeLeg: async () => {},
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: false,
                },
                updateLegDisplayOptions,
            });

            const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
            await doClick(homeThrows[0]);

            expect(context.container.textContent).toContain('Edit throw');
        });

        it('can close change throw dialog', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(50))
                    .startingScore(501)
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: true,
                onChangeLeg: async () => {},
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: false,
                },
                updateLegDisplayOptions,
            });
            const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
            await doClick(homeThrows[0]);
            expect(context.container.textContent).toContain('Edit throw');

            await doClick(findButton(context.container, 'Close'));

            expect(context.container.textContent).not.toContain('Edit throw');
        });

        it('can change throw', async () => {
            let newLeg: LegDto;
            await renderComponent({
                leg: legBuilder()
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(50))
                    .startingScore(501)
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: true,
                onChangeLeg: async (value: LegDto) => newLeg = value,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: false,
                },
                updateLegDisplayOptions,
            });
            const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
            await doClick(homeThrows[0]);

            await doChange(context.container, 'input[name="score"]', '105', context.user);
            await doChange(context.container, 'input[name="noOfDarts"]', '2', context.user);
            await doClick(findButton(context.container, 'Save changes'));

            expect(newLeg!.home).toEqual({
                noOfDarts: 2,
                score: 105,
                throws: [
                    { score: 105, noOfDarts: 2 },
                ],
            });
        });

        it('removes throw when noOfDarts set to 0', async () => {
            let newLeg: LegDto;
            await renderComponent({
                leg: legBuilder()
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(50))
                    .startingScore(501)
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: true,
                onChangeLeg: async (value: LegDto) => newLeg = value,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: false,
                },
                updateLegDisplayOptions,
            });
            const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
            await doClick(homeThrows[0]);

            await doChange(context.container, 'input[name="noOfDarts"]', '0', context.user);
            await doClick(findButton(context.container, 'Save changes'));

            expect(newLeg!.home).toEqual({
                noOfDarts: 0,
                score: 0,
                throws: [],
            });
        });

        it('cannot change throw when no handler', async () => {
            await renderComponent({
                leg: legBuilder()
                    .home((c: ILegCompetitorScoreBuilder) => c.withThrow(100))
                    .away((c: ILegCompetitorScoreBuilder) => c.withThrow(50))
                    .startingScore(501)
                    .build(),
                home: 'HOME',
                away: 'AWAY',
                legNumber: 1,
                singlePlayer: false,
                oneDartAverage: true,
                legDisplayOptions: {
                    showThrows: true,
                    showAverage: false,
                },
                updateLegDisplayOptions,
            });

            const homeThrows = Array.from(context.container.querySelectorAll('tr td:nth-child(2) tbody tr'));
            await doClick(homeThrows[0]);

            expect(context.container.textContent).not.toContain('Edit throw');
        });
    });
});