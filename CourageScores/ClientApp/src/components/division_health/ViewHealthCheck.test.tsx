import {appProps, brandingProps, cleanUp, ErrorState, iocProps, renderApp, TestContext} from "../../helpers/tests";
import {ViewHealthCheck} from "./ViewHealthCheck";
import {SeasonHealthCheckResultDto} from "../../interfaces/models/dtos/Health/SeasonHealthCheckResultDto";

describe('DivisionHealth', () => {
    let context: TestContext;
    let reportedError: ErrorState;

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function renderComponent(result: SeasonHealthCheckResultDto) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            (<ViewHealthCheck result={result}/>));
    }

    it('should render successful check', async () => {
        await renderComponent({
            success: false,
            errors: [],
            warnings: [],
            messages: [],
            checks: {
                'some description': {
                    success: true,
                    errors: [],
                    warnings: [],
                    messages: [],
                }
            },
        });

        reportedError.verifyNoError();
        const checkItems = Array.from(context.container.querySelectorAll('ol li'));
        expect(checkItems.length).toEqual(1);
        expect(checkItems[0].textContent).toContain('✔ some description');
    });

    it('should render unsuccessful check', async () => {
        await renderComponent({
            success: false,
            errors: [],
            warnings: [],
            messages: [],
            checks: {
                'some description': {
                    success: false,
                    errors: [],
                    warnings: [],
                    messages: [],
                }
            },
        });

        reportedError.verifyNoError();
        const checkItems = Array.from(context.container.querySelectorAll('ol li'));
        expect(checkItems.length).toEqual(1);
        expect(checkItems[0].textContent).toContain('❌ some description');
    });

    it('should render check errors', async () => {
        await renderComponent({
            success: false,
            errors: [],
            warnings: [],
            messages: [],
            checks: {
                'some description': {
                    success: true,
                    errors: ['some error'],
                    warnings: [],
                    messages: [],
                }
            },
        });

        reportedError.verifyNoError();
        const checkItems = Array.from(context.container.querySelectorAll('ol li'));
        expect(checkItems.length).toEqual(1);
        expect(checkItems[0].textContent).toContain('some error');
    });

    it('should render check warnings', async () => {
        await renderComponent({
            success: false,
            errors: [],
            warnings: [],
            messages: [],
            checks: {
                'some description': {
                    success: true,
                    errors: [],
                    warnings: ['some warning'],
                    messages: [],
                }
            },
        });

        reportedError.verifyNoError();
        const checkItems = Array.from(context.container.querySelectorAll('ol li'));
        expect(checkItems.length).toEqual(1);
        expect(checkItems[0].textContent).toContain('some warning');
    });

    it('should render check warnings', async () => {
        await renderComponent({
            success: false,
            errors: [],
            warnings: [],
            messages: [],
            checks: {
                'some description': {
                    success: true,
                    errors: [],
                    warnings: [],
                    messages: ['some message'],
                }
            },
        });

        reportedError.verifyNoError();
        const checkItems = Array.from(context.container.querySelectorAll('ol li'));
        expect(checkItems.length).toEqual(1);
        expect(checkItems[0].textContent).toContain('some message');
    });
});