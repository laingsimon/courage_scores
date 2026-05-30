import {
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests.tsx';
import { ViewHealthCheck } from './ViewHealthCheck.tsx';
import { SeasonHealthCheckResultDto } from '../../interfaces/models/dtos/Health/SeasonHealthCheckResultDto.ts';

describe('ViewHealthCheck', () => {
    let context: TestContext;
    let reportedError: ErrorState;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function renderComponent(result: SeasonHealthCheckResultDto) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            <ViewHealthCheck result={result} />,
        );
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
                },
            },
        });

        reportedError.verifyNoError();
        const checkItems = context.all('ol li');
        expect(checkItems.length).toEqual(1);
        expect(checkItems[0].text()).toContain('✔ some description');
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
                },
            },
        });

        reportedError.verifyNoError();
        const checkItems = context.all('ol li');
        expect(checkItems.length).toEqual(1);
        expect(checkItems[0].text()).toContain('❌ some description');
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
                },
            },
        });

        reportedError.verifyNoError();
        const checkItems = context.all('ol li');
        expect(checkItems.length).toEqual(1);
        expect(checkItems[0].text()).toContain('some error');
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
                },
            },
        });

        reportedError.verifyNoError();
        const checkItems = context.all('ol li');
        expect(checkItems.length).toEqual(1);
        expect(checkItems[0].text()).toContain('some warning');
    });

    it('should render check messages', async () => {
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
                },
            },
        });

        reportedError.verifyNoError();
        const checkItems = context.all('ol li');
        expect(checkItems.length).toEqual(1);
        expect(checkItems[0].text()).toContain('some message');
    });
});
