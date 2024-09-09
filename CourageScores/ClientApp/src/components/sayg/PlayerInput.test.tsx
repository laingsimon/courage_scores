import {appProps, brandingProps, cleanUp, ErrorState, iocProps, renderApp, TestContext} from "../../helpers/tests";
import {IPlayerInputProps, PlayerInput} from "./PlayerInput";

describe('PlayerInput', () => {
    let context: TestContext;
    let reportedError: ErrorState;

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    // @ts-ignore
    async function renderComponent(props: IPlayerInputProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            <PlayerInput {...props} />);
    }

    describe('renders', () => {
        it('something', async () => {
            expect(true).toEqual(true);
        });
    });
});
