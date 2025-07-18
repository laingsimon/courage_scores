import {
    cleanUp,
    renderApp,
    doClick,
    iocProps,
    brandingProps,
    appProps,
    TestContext,
} from '../../helpers/tests';
import {
    IWidescreenSaygPlayerStatisticProps,
    WidescreenSaygPlayerStatistic,
} from './WidescreenSaygPlayerStatistic';
import { saygBuilder } from '../../helpers/builders/sayg';
import { LegDto } from '../../interfaces/models/dtos/Game/Sayg/LegDto';

describe('WidescreenSaygPlayerStatistic', () => {
    let context: TestContext;
    let newOneDartAverage: boolean;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        newOneDartAverage = false;
    });

    async function setOneDartAverage(newValue: boolean) {
        newOneDartAverage = newValue;
    }

    async function renderComponent(props: IWidescreenSaygPlayerStatisticProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            <WidescreenSaygPlayerStatistic {...props} />,
        );
    }

    describe('renders', () => {
        let legs: { [legKey: number]: LegDto };

        beforeEach(() => {
            const sayg = saygBuilder()
                .withLeg(0, (l) =>
                    l
                        .home((c) => c.withThrow(100, 3))
                        .away((c) => c.withThrow(101, 4)),
                )
                .withLeg(1, (l) =>
                    l
                        .home((c) => c.withThrow(102, 5))
                        .away((c) => c.withThrow(103, 6)),
                )
                .build();

            legs = sayg.legs;
        });

        it('when no legs', async () => {
            await renderComponent({
                legs: {},
                player: 'home',
                oneDartAverage: true,
                setOneDartAverage,
            });

            expect(context.container.innerHTML).toContain('Not started');
        });

        it('No of darts', async () => {
            await renderComponent({
                legs,
                player: 'home',
                oneDartAverage: true,
                setOneDartAverage,
            });

            expect(context.container.textContent).toContain('Darts5');
        });

        it('NaN leg average', async () => {
            legs[1].home.noOfDarts = Number.NaN;

            await renderComponent({
                legs,
                player: 'home',
                oneDartAverage: true,
                setOneDartAverage,
            });

            expect(context.container.textContent).toContain('Leg Avg-');
        });

        it('3-dart leg average', async () => {
            await renderComponent({
                legs,
                player: 'home',
                oneDartAverage: false,
                setOneDartAverage,
            });

            expect(context.container.textContent).toContain('Leg Avg61.2');
            expect(context.container.querySelector('sup')!.textContent).toEqual(
                '3',
            );
        });

        it('1-dart leg average', async () => {
            await renderComponent({
                legs,
                player: 'home',
                oneDartAverage: true,
                setOneDartAverage,
            });

            expect(context.container.textContent).toContain('Leg Avg20.4');
            expect(context.container.querySelector('sup')!.textContent).toEqual(
                '1',
            );
        });

        it('NaN match average', async () => {
            legs[1].home.noOfDarts = Number.NaN;

            await renderComponent({
                legs,
                player: 'home',
                oneDartAverage: true,
                setOneDartAverage,
            });

            expect(context.container.textContent).toContain('Match Avg-');
        });

        it('3-dart match average', async () => {
            await renderComponent({
                legs,
                player: 'home',
                oneDartAverage: false,
                setOneDartAverage,
            });

            expect(context.container.textContent).toContain('Match Avg75.75');
            expect(context.container.querySelector('sup')!.textContent).toEqual(
                '3',
            );
        });

        it('1-dart match average', async () => {
            await renderComponent({
                legs,
                player: 'home',
                oneDartAverage: true,
                setOneDartAverage,
            });

            expect(context.container.textContent).toContain('Match Avg25.25');
            expect(context.container.querySelector('sup')!.textContent).toEqual(
                '1',
            );
        });
    });

    describe('interactivity', () => {
        const sayg = saygBuilder()
            .withLeg(0, (l) =>
                l
                    .home((c) => c.withThrow(100, 3))
                    .away((c) => c.withThrow(101, 4)),
            )
            .withLeg(1, (l) =>
                l
                    .home((c) => c.withThrow(102, 5))
                    .away((c) => c.withThrow(103, 6)),
            )
            .build();

        it('can change to 1 dart average', async () => {
            await renderComponent({
                legs: sayg.legs,
                player: 'home',
                oneDartAverage: false,
                setOneDartAverage,
            });
            expect(context.container.querySelector('sup')!.textContent).toEqual(
                '3',
            );

            await doClick(context.container.querySelector('div:nth-child(2)')!);

            expect(newOneDartAverage).toEqual(true);
        });

        it('can change to 3 dart average', async () => {
            await renderComponent({
                legs: sayg.legs,
                player: 'home',
                oneDartAverage: true,
                setOneDartAverage,
            });
            expect(context.container.querySelector('sup')!.textContent).toEqual(
                '1',
            );

            await doClick(context.container.querySelector('div:nth-child(3)')!);

            expect(newOneDartAverage).toEqual(false);
        });
    });
});
