import {appProps, brandingProps, cleanUp, iocProps, renderApp, TestContext} from "../../helpers/tests";
import {PreviousPlayerScore} from "./PreviousPlayerScore";

describe('PreviousPlayerScore', () => {
    let context: TestContext;

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
    });

    // @ts-ignore
    async function renderComponent(props: IPreviousPlayerScoreProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            <PreviousPlayerScore {...props} />);
    }

    describe('renders', () => {
        it('something', async () => {
            expect(true).toEqual(true);
        });
    });
});
