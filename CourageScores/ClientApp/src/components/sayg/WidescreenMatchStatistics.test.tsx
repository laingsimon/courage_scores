import {
    api,
    appProps,
    brandingProps,
    cleanUp,
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

            const homeColumn = context.required('div[datatype="home-column"]');
            expect(
                homeColumn
                    .required('div[datatype="WidescreenSaygPlayerHeading"]')
                    .text(),
            ).toContain('HOME');
        });

        it('renders home player', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const homeColumn = context.required('div[datatype="home-column"]');
            expect(
                homeColumn
                    .required('div[datatype="WidescreenSaygPlayer"]')
                    .text(),
            ).toContain('401');
        });

        it('renders home player statistics', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const homeColumn = context.required('div[datatype="home-column"]');
            expect(
                homeColumn
                    .required('div[datatype="WidescreenSaygPlayerStatistic"]')
                    .text(),
            ).toContain('Darts3');
        });

        it('renders home match details', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const homeColumn = context.required('div[datatype="home-column"]');
            expect(
                homeColumn
                    .required('div[datatype="WidescreenSaygMatchDetails"]')
                    .text(),
            ).toContain('Best of 5');
        });

        it('does not render separator', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            expect(
                context.optional('div[datatype="separator-column"]'),
            ).toBeFalsy();
        });

        it('does not render away column', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            expect(context.optional('div[datatype="away-column"]')).toBeFalsy();
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

            const homeColumn = context.required('div[datatype="home-column"]');
            expect(
                homeColumn
                    .required('div[datatype="WidescreenSaygPlayerHeading"]')
                    .text(),
            ).toContain('HOME');
        });

        it('renders home player', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const homeColumn = context.required('div[datatype="home-column"]');
            expect(
                homeColumn
                    .required('div[datatype="WidescreenSaygPlayer"]')
                    .text(),
            ).toContain('401');
        });

        it('renders home player statistics', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const homeColumn = context.required('div[datatype="home-column"]');
            expect(
                homeColumn
                    .required('div[datatype="WidescreenSaygPlayerStatistic"]')
                    .text(),
            ).toContain('Darts3');
        });

        it('renders home match details', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const homeColumn = context.required('div[datatype="home-column"]');
            expect(
                homeColumn
                    .required('div[datatype="WidescreenSaygMatchDetails"]')
                    .text(),
            ).toContain('Best of 5');
        });

        it('renders separator', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            expect(
                context.optional('div[datatype="separator-column"]'),
            ).toBeTruthy();
        });

        it('renders away player heading', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const awayColumn = context.required('div[datatype="away-column"]');
            expect(
                awayColumn
                    .required('div[datatype="WidescreenSaygPlayerHeading"]')
                    .text(),
            ).toContain('AWAY');
        });

        it('renders away player', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const awayColumn = context.required('div[datatype="away-column"]');
            expect(
                awayColumn
                    .required('div[datatype="WidescreenSaygPlayer"]')
                    .text(),
            ).toContain('301');
        });

        it('renders away player statistics', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const awayColumn = context.required('div[datatype="away-column"]');
            expect(
                awayColumn
                    .required('div[datatype="WidescreenSaygPlayerStatistic"]')
                    .text(),
            ).toContain('Darts6');
        });

        it('renders away match details', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });

            const homeColumn = context.required('div[datatype="home-column"]');
            expect(
                homeColumn
                    .required('div[datatype="WidescreenSaygMatchDetails"]')
                    .text(),
            ).toContain('Best of 5');
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

            const homeColumn = context.required('div[datatype="home-column"]');
            expect(
                homeColumn
                    .required('div[datatype="WidescreenSaygPlayer"]')
                    .text(),
            ).toContain('🎉');
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

            const awayColumn = context.required('div[datatype="away-column"]');
            expect(
                awayColumn
                    .required('div[datatype="WidescreenSaygPlayer"]')
                    .text(),
            ).toContain('🎉');
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
            const homeColumn = context.required('div[datatype="home-column"]');
            const statisticsElement = homeColumn.required(
                'div[datatype="WidescreenSaygPlayerStatistic"]',
            );
            const sup = statisticsElement.required('sup');
            expect(sup.text()).toEqual('3');

            await sup.click();

            expect(statisticsElement.required('sup').text()).toEqual('1');
        });

        it('can switch to 1 dart average - via away', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });
            const awayColumn = context.required('div[datatype="away-column"]');
            const statisticsElement = awayColumn.required(
                'div[datatype="WidescreenSaygPlayerStatistic"]',
            );
            const sup = statisticsElement.required('sup');
            expect(sup.text()).toEqual('3');

            await sup.click();

            expect(statisticsElement.required('sup').text()).toEqual('1');
        });

        it('can switch to 3 dart average', async () => {
            await renderComponent({
                id: sayg.id,
                matchStatisticsOnly: true,
                liveOptions: {
                    canSubscribe: true,
                },
            });
            const homeColumn = context.required('div[datatype="home-column"]');
            const statisticsElement = homeColumn.required(
                'div[datatype="WidescreenSaygPlayerStatistic"]',
            );
            const sup = statisticsElement.required('sup');
            expect(sup.text()).toEqual('3');
            await sup.click();
            expect(sup.text()).toEqual('1');

            await sup.click();

            expect(statisticsElement.required('sup').text()).toEqual('3');
        });
    });
});
