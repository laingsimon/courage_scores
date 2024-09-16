import {appProps, brandingProps, cleanUp, doChange, iocProps, renderApp, TestContext} from "../../helpers/tests";
import {BrandingContainer, useBranding} from "./BrandingContainer";
import {IBrandingData} from "./IBrandingData";

describe('BrandingContainer', () => {
    let context: TestContext;

    afterEach(async () => {
        await cleanUp(context);
    });

    async function renderComponent(props: IBrandingData) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            (<BrandingContainer {...props}>
                <ChangeTitle />
            </BrandingContainer>));
    }

    it('changes title to given text', async () => {
        const branding: IBrandingData = {
            name: 'BRAND NAME',
        };
        await renderComponent(branding);

        await doChange(context.container, 'input[name="title"]', 'TITLE', context.user);

        expect(document.title).toEqual('TITLE - BRAND NAME');
    });

    it('changes title to default text when empty', async () => {
        const branding: IBrandingData = {
            name: 'BRAND NAME',
        };
        await renderComponent(branding);

        await doChange(context.container, 'input[name="title"]', '', context.user);

        expect(document.title).toEqual('BRAND NAME');
    });

    function ChangeTitle() {
        const { setTitle } = useBranding();

        return (<>
            <input
                value="-unset-"
                name="title"
                onChange={(event) => setTitle(event.target.value)} />
        </>)
    }
});