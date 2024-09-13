import {appProps, brandingProps, cleanUp, iocProps, renderApp, TestContext} from "../../helpers/tests";
import {IWidescreenSaygMatchDetailsProps, WidescreenSaygMatchDetails} from "./WidescreenSaygMatchDetails";
import {ILegBuilder, saygBuilder} from "../../helpers/builders/sayg";

describe('WidescreenSaygMatchDetails', () => {
    let context: TestContext;

    afterEach(async () => {
        await cleanUp(context);
    });

    async function renderComponent(props: IWidescreenSaygMatchDetailsProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            <WidescreenSaygMatchDetails {...props} />);
    }

    describe('renders', () => {
        const sayg = saygBuilder()
            .numberOfLegs(3)
            .withLeg(0, (l: ILegBuilder) => l.startingScore(301))
            .withLeg(1, (l: ILegBuilder) => l.startingScore(501))
            .build();

        it('when no legs', async () => {
            await renderComponent({
                legs: {},
                numberOfLegs: sayg.numberOfLegs,
            });

            expect(context.container.innerHTML).toEqual('');
        });

        it('best of', async () => {
            await renderComponent({
                legs: sayg.legs,
                numberOfLegs: sayg.numberOfLegs,
            });

            expect(context.container.querySelector('span:nth-child(1)').textContent).toEqual('Best of 3');
        });

        it('starting score', async () => {
            await renderComponent({
                legs: sayg.legs,
                numberOfLegs: sayg.numberOfLegs,
            });

            expect(context.container.querySelector('span:nth-child(2)').textContent).toEqual('from 501');
        });

        it('leg number', async () => {
            await renderComponent({
                legs: sayg.legs,
                numberOfLegs: sayg.numberOfLegs,
            });

            expect(context.container.querySelector('span:nth-child(3)').textContent).toEqual('Leg 2');
        });
    });
});