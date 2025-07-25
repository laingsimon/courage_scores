import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import {
    ISaygLoadingContainerProps,
    SaygLoadingContainer,
} from './SaygLoadingContainer';
import { saygBuilder } from '../../helpers/builders/sayg';
import { RecordedScoreAsYouGoDto } from '../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto';
import { ISaygApi } from '../../interfaces/apis/ISaygApi';

describe('WidescreenMatchStatistics', () => {
    let context: TestContext;
    let saygData: { [id: string]: RecordedScoreAsYouGoDto };
    const saygApi = api<ISaygApi>({
        get: async (id: string) => {
            return saygData[id];
        },
    });

    beforeEach(() => {
        saygData = {};
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    async function renderComponent(saygProps: ISaygLoadingContainerProps) {
        context = await renderApp(
            iocProps({ saygApi }),
            brandingProps(),
            appProps(),
            <SaygLoadingContainer {...saygProps} />,
            '/test',
            '/test?widescreen=true',
        );
    }

    describe('single player', () => {
        let sayg: RecordedScoreAsYouGoDto;

        beforeEach(() => {
            sayg = saygBuilder()
                .yourName('HOME')
                .opponentName()
                .scores(1, 2)
                .numberOfLegs(5)
                .withLeg(0, (l) =>
                    l.startingScore(501).home((c) => c.withThrow(100)),
                )
                .addTo(saygData)
                .build();
        });

        it('renders home player heading', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const homeColumn = context.container.querySelector(
                'div[datatype="home-column"]',
            )!;
            const headingElement = homeColumn.querySelector(
                'div[datatype="WidescreenSaygPlayerHeading"]',
            )!;
            expect(headingElement.textContent).toContain('HOME');
        });

        it('renders home player', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const homeColumn = context.container.querySelector(
                'div[datatype="home-column"]',
            )!;
            const playerElement = homeColumn.querySelector(
                'div[datatype="WidescreenSaygPlayer"]',
            )!;
            expect(playerElement.textContent).toContain('401');
        });

        it('renders home player statistics', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const homeColumn = context.container.querySelector(
                'div[datatype="home-column"]',
            )!;
            const statisticsElement = homeColumn.querySelector(
                'div[datatype="WidescreenSaygPlayerStatistic"]',
            )!;
            expect(statisticsElement.textContent).toContain('Darts3');
        });

        it('renders home match details', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const homeColumn = context.container.querySelector(
                'div[datatype="home-column"]',
            )!;
            const detailsElement = homeColumn.querySelector(
                'div[datatype="WidescreenSaygMatchDetails"]',
            )!;
            expect(detailsElement.textContent).toContain('Best of 5');
        });

        it('does not render separator', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const separatorColumn = context.container.querySelector(
                'div[datatype="separator-column"]',
            );
            expect(separatorColumn).toBeFalsy();
        });

        it('does not render away column', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const awayColumn = context.container.querySelector(
                'div[datatype="away-column"]',
            );
            expect(awayColumn).toBeFalsy();
        });
    });

    describe('multi player', () => {
        let sayg: RecordedScoreAsYouGoDto;

        beforeEach(() => {
            sayg = saygBuilder()
                .yourName('HOME')
                .opponentName('AWAY')
                .scores(1, 2)
                .numberOfLegs(5)
                .withLeg(0, (l) =>
                    l
                        .startingScore(501)
                        .home((c) => c.withThrow(100))
                        .away((c) => c.withThrow(100).withThrow(100)),
                )
                .addTo(saygData)
                .build();
        });

        it('renders home player heading', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const homeColumn = context.container.querySelector(
                'div[datatype="home-column"]',
            )!;
            const headingElement = homeColumn.querySelector(
                'div[datatype="WidescreenSaygPlayerHeading"]',
            )!;
            expect(headingElement.textContent).toContain('HOME');
        });

        it('renders home player', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const homeColumn = context.container.querySelector(
                'div[datatype="home-column"]',
            )!;
            const headingElement = homeColumn.querySelector(
                'div[datatype="WidescreenSaygPlayer"]',
            )!;
            expect(headingElement.textContent).toContain('401');
        });

        it('renders home player statistics', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const homeColumn = context.container.querySelector(
                'div[datatype="home-column"]',
            )!;
            const statisticsElement = homeColumn.querySelector(
                'div[datatype="WidescreenSaygPlayerStatistic"]',
            )!;
            expect(statisticsElement.textContent).toContain('Darts3');
        });

        it('renders home match details', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const homeColumn = context.container.querySelector(
                'div[datatype="home-column"]',
            )!;
            const detailsElement = homeColumn.querySelector(
                'div[datatype="WidescreenSaygMatchDetails"]',
            )!;
            expect(detailsElement.textContent).toContain('Best of 5');
        });

        it('renders separator', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const separatorColumn = context.container.querySelector(
                'div[datatype="separator-column"]',
            );
            expect(separatorColumn).toBeTruthy();
        });

        it('renders away player heading', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const awayColumn = context.container.querySelector(
                'div[datatype="away-column"]',
            )!;
            const headingElement = awayColumn.querySelector(
                'div[datatype="WidescreenSaygPlayerHeading"]',
            )!;
            expect(headingElement.textContent).toContain('AWAY');
        });

        it('renders away player', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const awayColumn = context.container.querySelector(
                'div[datatype="away-column"]',
            )!;
            const headingElement = awayColumn.querySelector(
                'div[datatype="WidescreenSaygPlayer"]',
            )!;
            expect(headingElement.textContent).toContain('301');
        });

        it('renders away player statistics', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const awayColumn = context.container.querySelector(
                'div[datatype="away-column"]',
            )!;
            const statisticsElement = awayColumn.querySelector(
                'div[datatype="WidescreenSaygPlayerStatistic"]',
            )!;
            expect(statisticsElement.textContent).toContain('Darts6');
        });

        it('renders away match details', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const homeColumn = context.container.querySelector(
                'div[datatype="home-column"]',
            )!;
            const detailsElement = homeColumn.querySelector(
                'div[datatype="WidescreenSaygMatchDetails"]',
            )!;
            expect(detailsElement.textContent).toContain('Best of 5');
        });
    });

    describe('when finished', () => {
        it('shows home winner', async () => {
            const sayg = saygBuilder()
                .yourName('HOME')
                .opponentName('AWAY')
                .scores(3, 2)
                .numberOfLegs(5)
                .withLeg(0, (l) =>
                    l
                        .startingScore(501)
                        .home((c) => c.withThrow(501))
                        .away((c) => c.withThrow(100).withThrow(100)),
                )
                .addTo(saygData)
                .build();

            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const homeColumn = context.container.querySelector(
                'div[datatype="home-column"]',
            )!;
            const playerElement = homeColumn.querySelector(
                'div[datatype="WidescreenSaygPlayer"]',
            )!;
            expect(playerElement.textContent).toContain('🎉');
        });

        it('shows away winner', async () => {
            const sayg = saygBuilder()
                .yourName('HOME')
                .opponentName('AWAY')
                .scores(1, 3)
                .numberOfLegs(5)
                .withLeg(0, (l) =>
                    l
                        .startingScore(501)
                        .home((c) => c.withThrow(100))
                        .away((c) => c.withThrow(401).withThrow(100)),
                )
                .addTo(saygData)
                .build();

            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const awayColumn = context.container.querySelector(
                'div[datatype="away-column"]',
            )!;
            const playerElement = awayColumn.querySelector(
                'div[datatype="WidescreenSaygPlayer"]',
            )!;
            expect(playerElement.textContent).toContain('🎉');
        });
    });

    describe('interactivity', () => {
        let sayg: RecordedScoreAsYouGoDto;

        beforeEach(() => {
            sayg = saygBuilder()
                .yourName('HOME')
                .opponentName('AWAY')
                .scores(1, 2)
                .numberOfLegs(5)
                .withLeg(0, (l) =>
                    l
                        .startingScore(501)
                        .home((c) => c.withThrow(100))
                        .away((c) => c.withThrow(100).withThrow(100)),
                )
                .addTo(saygData)
                .build();
        });

        it('can switch to 1 dart average - via home', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });
            const homeColumn = context.container.querySelector(
                'div[datatype="home-column"]',
            )!;
            const statisticsElement = homeColumn.querySelector(
                'div[datatype="WidescreenSaygPlayerStatistic"]',
            )!;
            const sup = statisticsElement.querySelector('sup')!;
            expect(sup.textContent).toEqual('3');

            await doClick(sup);

            expect(statisticsElement.querySelector('sup')!.textContent).toEqual(
                '1',
            );
        });

        it('can switch to 1 dart average - via away', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });
            const homeColumn = context.container.querySelector(
                'div[datatype="away-column"]',
            )!;
            const statisticsElement = homeColumn.querySelector(
                'div[datatype="WidescreenSaygPlayerStatistic"]',
            )!;
            const sup = statisticsElement.querySelector('sup')!;
            expect(sup.textContent).toEqual('3');

            await doClick(sup);

            expect(statisticsElement.querySelector('sup')!.textContent).toEqual(
                '1',
            );
        });

        it('can switch to 3 dart average', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });
            const homeColumn = context.container.querySelector(
                'div[datatype="home-column"]',
            )!;
            const statisticsElement = homeColumn.querySelector(
                'div[datatype="WidescreenSaygPlayerStatistic"]',
            )!;
            const sup = statisticsElement.querySelector('sup')!;
            expect(sup.textContent).toEqual('3');
            await doClick(sup);
            expect(sup.textContent).toEqual('1');

            await doClick(sup);

            expect(statisticsElement.querySelector('sup')!.textContent).toEqual(
                '3',
            );
        });
    });
});
