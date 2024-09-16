import {appProps, brandingProps, cleanUp, iocProps, renderApp, TestContext} from "../../helpers/tests";
import {Layout} from "./Layout";

describe('Layout', () => {
    let context: TestContext;

    afterEach(async () => {
        await cleanUp(context);
    });

    async function renderComponent(error: any, embed: boolean) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({
                error,
                embed,
                divisions: [],
            }),
            (<Layout/>));
    }

    describe('surround present', () => {
        it('when an error present', async () => {
            await renderComponent({message: 'some error', stack: 'stack'}, false);

            expect(context.container.querySelector('.heading')).toBeTruthy();
            expect(context.container.querySelector('header')).toBeTruthy();
            const content = context.container.querySelector('div.content-background');
            expect(content).toBeTruthy();
            expect(content.textContent).toContain('some error');
        });

        it('when no error present', async () => {
            await renderComponent(null, false);

            expect(context.container.querySelector('.heading')).toBeTruthy();
            expect(context.container.querySelector('header')).toBeTruthy();
            const content = context.container.querySelector('div.container');
            expect(content).toBeTruthy();
        });
    });

    describe('when embedded', () => {
        it('when an error present', async () => {
            await renderComponent({message: 'some error', stack: 'stack'}, true);

            expect(context.container.querySelector('.heading')).toBeFalsy();
            expect(context.container.querySelector('header')).toBeFalsy();
            const content = context.container.querySelector('div.content-background');
            expect(content).toBeTruthy();
            expect(content.textContent).toContain('some error');
        });

        it('when no error present', async () => {
            await renderComponent(null, true);

            expect(context.container.querySelector('.heading')).toBeFalsy();
            expect(context.container.querySelector('header')).toBeFalsy();
            const content = context.container.querySelector('div.container');
            expect(content).toBeTruthy();
        });
    });
});