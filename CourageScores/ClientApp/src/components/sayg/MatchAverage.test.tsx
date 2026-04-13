import {
    appProps,
    brandingProps,
    cleanUp,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { IMatchAverageProps, MatchAverage } from './MatchAverage';

describe('MatchAverage', () => {
    let context: TestContext;
    let oneDartAverage: boolean;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        oneDartAverage = false;
    });

    async function setOneDartAverage(newValue: boolean) {
        oneDartAverage = newValue;
    }

    async function renderComponent(props: IMatchAverageProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            <MatchAverage {...props} />,
            undefined,
            undefined,
            'tbody',
        );
    }

    it('renders nothing when no averages', async () => {
        await renderComponent({
            oneDartAverage: false,
            setOneDartAverage,
        });

        expect(context.html()).toEqual('');
    });

    it('renders 3 dart average', async () => {
        await renderComponent({
            homeAverage: 30.3333,
            awayAverage: 20.5555,
            oneDartAverage: false,
            setOneDartAverage,
        });

        const homeAverage = context.required('td:nth-child(2)');
        const awayAverage = context.required('td:nth-child(3)');
        expect(homeAverage.text()).toEqual('30.33');
        expect(awayAverage.text()).toEqual('20.56');
    });

    it('renders 1 dart average', async () => {
        await renderComponent({
            homeAverage: 30.3333,
            awayAverage: 20.5555,
            oneDartAverage: true,
            setOneDartAverage,
        });

        const homeAverage = context.required('td:nth-child(2)');
        const awayAverage = context.required('td:nth-child(3)');
        expect(homeAverage.text()).toEqual('10.11');
        expect(awayAverage.text()).toEqual('6.85');
    });

    it('renders single player average', async () => {
        await renderComponent({
            homeAverage: 30.3333,
            singlePlayer: true,
            oneDartAverage: false,
            setOneDartAverage,
        });

        const homeAverage = context.required('td:nth-child(2)');
        const awayAverage = context.optional('td:nth-child(3)');
        expect(homeAverage.text()).toEqual('30.33');
        expect(awayAverage).toBeFalsy();
    });

    it('renders away player average when no darts thrown', async () => {
        await renderComponent({
            homeAverage: 30.3333,
            awayAverage: Number.NaN,
            singlePlayer: false,
            oneDartAverage: false,
            setOneDartAverage,
        });

        const awayAverage = context.required('td:nth-child(3)');
        expect(awayAverage.text()).toEqual('-');
    });

    it('renders home average as winner', async () => {
        await renderComponent({
            homeAverage: 30.3333,
            awayAverage: 20.5555,
            oneDartAverage: false,
            setOneDartAverage,
        });

        const homeAverage = context.required('td:nth-child(2)');
        const awayAverage = context.required('td:nth-child(3)');
        expect(homeAverage.className()).toContain('bg-winner');
        expect(awayAverage.className()).not.toContain('bg-winner');
    });

    it('renders away average as winner', async () => {
        await renderComponent({
            homeAverage: 20.5555,
            awayAverage: 30.3333,
            oneDartAverage: false,
            setOneDartAverage,
        });

        const homeAverage = context.required('td:nth-child(2)');
        const awayAverage = context.required('td:nth-child(3)');
        expect(homeAverage.className()).not.toContain('bg-winner');
        expect(awayAverage.className()).toContain('bg-winner');
    });

    it('can change one dart average option', async () => {
        await renderComponent({
            homeAverage: 30.3333,
            awayAverage: 20.5555,
            oneDartAverage: true,
            setOneDartAverage,
        });
        const toggle = context.required('input#oneDartAverage');
        expect((toggle.element() as HTMLInputElement).checked).toEqual(true);

        await toggle.click();

        expect(oneDartAverage).toEqual(false);
    });
});
