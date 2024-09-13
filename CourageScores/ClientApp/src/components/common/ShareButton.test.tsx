import {
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {IShareButtonProps, ShareButton} from "./ShareButton";

describe('ShareButton', () => {
    let context: TestContext;
    let shareData: ShareData;

    afterEach(async () => {
        await cleanUp(context);
    });

    async function renderComponent(props: IShareButtonProps, name?: string, currentPath?: string) {
        // noinspection JSValidateTypes
        (navigator as any).share = async (data: ShareData) => shareData = data;
        shareData = null;
        context = await renderApp(
            iocProps(),
            brandingProps({name}),
            appProps(),
            (<ShareButton {...props} />),
            null,
            currentPath);
    }

    describe('with get hash function', () => {
        it('shares page with given title and text', async () => {
            await renderComponent({
                title: 'TITLE',
                text: 'TEXT',
                getHash: async () => '#HASH',
            }, 'Courage Scores');

            await doClick(findButton(context.container, '🔗'));

            expect(shareData).toBeTruthy();
            expect(shareData.text).toEqual('TEXT');
            expect(shareData.title).toEqual('TITLE');
            expect(shareData.url).toContain('/test');
            expect(shareData.url).toContain('#HASH');
        });

        it('shares page with default title and text', async () => {
            await renderComponent({
                getHash: async () => '#HASH'
            }, 'Courage Scores');

            await doClick(findButton(context.container, '🔗'));

            expect(shareData).toBeTruthy();
            expect(shareData.text).toEqual('Courage Scores');
            expect(shareData.title).toEqual('Courage Scores');
            expect(shareData.url).toContain('/test');
            expect(shareData.url).toContain('#HASH');
        });

        it('shares page without any hash', async () => {
            await renderComponent({
                getHash: async () => '',
            }, 'Courage Scores');

            await doClick(findButton(context.container, '🔗'));

            expect(shareData).toBeTruthy();
            expect(shareData.text).toEqual('Courage Scores');
            expect(shareData.title).toEqual('Courage Scores');
            expect(shareData.url).toContain('/test');
        });

        it('does not share page with null hash', async () => {
            await renderComponent({
                getHash: async () => null,
            });

            await doClick(findButton(context.container, '🔗'));

            expect(shareData).toBeNull();
        });
    });

    describe('using location hash', () => {
        it('shares page with given title and text', async () => {
            await renderComponent({
                title: 'TITLE',
                text: 'TEXT'
            }, 'Courage Scores', '/test/#HASH');

            await doClick(findButton(context.container, '🔗'));

            expect(shareData).toBeTruthy();
            expect(shareData.text).toEqual('TEXT');
            expect(shareData.title).toEqual('TITLE');
            expect(shareData.url).toContain('/test');
            expect(shareData.url).toContain('#HASH');
        });

        it('shares page with default title and text', async () => {
            await renderComponent({}, 'Courage Scores', '/test/#HASH');

            await doClick(findButton(context.container, '🔗'));

            expect(shareData).toBeTruthy();
            expect(shareData.text).toEqual('Courage Scores');
            expect(shareData.title).toEqual('Courage Scores');
            expect(shareData.url).toContain('/test');
            expect(shareData.url).toContain('#HASH');
        });

        it('shares page without any hash', async () => {
            await renderComponent({
                getHash: async () => '',
            }, 'Courage Scores');

            await doClick(findButton(context.container, '🔗'));

            expect(shareData).toBeTruthy();
            expect(shareData.text).toEqual('Courage Scores');
            expect(shareData.title).toEqual('Courage Scores');
            expect(shareData.url).toContain('/test');
        });
    });
});