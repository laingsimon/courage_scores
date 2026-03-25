import {
    appProps,
    brandingProps,
    cleanUp,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import {
    IWidescreenSaygPlayerHeadingProps,
    WidescreenSaygPlayerHeading,
} from './WidescreenSaygPlayerHeading';

describe('WidescreenSaygPlayerHeading', () => {
    let context: TestContext;

    afterEach(async () => {
        await cleanUp(context);
    });

    async function renderComponent(props: IWidescreenSaygPlayerHeadingProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            <WidescreenSaygPlayerHeading {...props} />,
        );
    }

    describe('score first', () => {
        it('renders score element first', async () => {
            await renderComponent({
                name: 'NAME',
                score: 123,
                scoreFirst: true,
            });

            expect(context.required('h1:nth-child(1)').text()).toEqual('123');
        });

        it('renders name element second', async () => {
            await renderComponent({
                name: 'NAME',
                score: 123,
                scoreFirst: true,
            });

            expect(context.required('h1:nth-child(2)').text()).toEqual('NAME');
        });

        it('renders nothing else', async () => {
            await renderComponent({
                name: 'NAME',
                score: 123,
                scoreFirst: true,
            });

            expect(context.container.childNodes[0].childNodes.length).toEqual(
                2,
            );
        });
    });

    describe('score second', () => {
        it('renders name element first', async () => {
            await renderComponent({
                name: 'NAME',
                score: 123,
                scoreFirst: false,
            });

            expect(context.required('h1:nth-child(1)').text()).toEqual('NAME');
        });

        it('renders score element second', async () => {
            await renderComponent({
                name: 'NAME',
                score: 123,
                scoreFirst: false,
            });

            expect(context.required('h1:nth-child(2)').text()).toEqual('123');
        });

        it('renders nothing else', async () => {
            await renderComponent({
                name: 'NAME',
                score: 123,
                scoreFirst: false,
            });

            expect(context.container.childNodes[0].childNodes.length).toEqual(
                2,
            );
        });
    });
});
