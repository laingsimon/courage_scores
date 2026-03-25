import {
    appProps,
    brandingProps,
    cleanUp,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { ErrorDisplay, IErrorDisplayProps } from './ErrorDisplay';

describe('ErrorDisplay', () => {
    let context: TestContext;
    let closed: boolean;
    let reportedClientSideException: Error | null;

    async function onClose() {
        closed = true;
    }

    afterEach(async () => {
        await cleanUp(context);
    });

    async function renderComponent(props: IErrorDisplayProps) {
        closed = false;
        reportedClientSideException = null;
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({
                reportClientSideException: (err: Error) => {
                    reportedClientSideException = err;
                },
            }),
            <ErrorDisplay {...props} />,
        );
    }

    describe('with client side exception', () => {
        it('reports error to API', async () => {
            await renderComponent({
                errors: [],
                messages: [],
                warnings: [],
                title: '',
                onClose,
            });

            expect(reportedClientSideException).not.toBeNull();
        });

        it('can close dialog', async () => {
            await renderComponent({
                errors: [],
                messages: [],
                warnings: [],
                title: '',
                onClose,
            });

            await context.button('Close').click();

            expect(closed).toEqual(true);
        });

        it('renders when null errors', async () => {
            await renderComponent({
                messages: ['message1'],
                warnings: ['warning1'],
                title: '',
                onClose,
            });

            const dialog = context.required('div.modal-dialog');
            expect(dialog.text()).toContain('message1');
            expect(dialog.text()).toContain('warning1');
        });

        it('renders when null warnings', async () => {
            await renderComponent({
                messages: ['message1'],
                errors: ['error1'],
                title: '',
                onClose,
            });

            const dialog = context.required('div.modal-dialog');
            expect(dialog.text()).toContain('message1');
            expect(dialog.text()).toContain('error1');
        });

        it('renders when null messages', async () => {
            await renderComponent({
                errors: ['error1'],
                warnings: ['warning1'],
                title: '',
                onClose,
            });

            const dialog = context.required('div.modal-dialog');
            expect(dialog.text()).toContain('error1');
            expect(dialog.text()).toContain('warning1');
        });
    });

    describe('server side validation errors', () => {
        it('reports error to API', async () => {
            await renderComponent({
                errors: {
                    property: ['some property error'],
                },
                warnings: [],
                messages: [],
                title: '',
                Exception: {
                    Type: 'dotnet type',
                    StackTrace: ['dotnet', 'stack', 'trace'],
                    Message: 'dotnet message',
                },
                onClose,
            });

            expect(reportedClientSideException).not.toBeNull();
        });

        it('renders correctly', async () => {
            await renderComponent({
                errors: {
                    property: ['some property error'],
                },
                warnings: [],
                messages: [],
                title: '',
                Exception: {
                    Type: 'dotnet type',
                    StackTrace: ['dotnet', 'stack', 'trace'],
                    Message: 'dotnet message',
                },
                onClose,
            });

            const dialog = context.required('div.modal-dialog');
            expect(dialog.text()).toContain('Server side error');
            expect(dialog.text()).toContain('dotnet type');
            expect(dialog.text()).toContain('dotnet message');
            expect(dialog.text()).toContain('dotnet\nstack\ntrace');
        });

        it('renders correctly with no stack trace', async () => {
            await renderComponent({
                errors: {
                    property: ['some property error'],
                },
                warnings: [],
                messages: [],
                title: '',
                Exception: {
                    Type: 'dotnet type',
                    Message: 'dotnet message',
                },
                onClose,
            });

            const dialog = context.required('div.modal-dialog');
            expect(dialog.text()).toContain('Server side error');
            expect(dialog.text()).toContain('dotnet type');
            expect(dialog.text()).toContain('dotnet message');
        });
    });

    describe('multiple server side exceptions', () => {
        it('renders validation errors', async () => {
            await renderComponent({
                errors: [
                    {
                        property: ['The property field is required'],
                    },
                ],
                messages: [],
                warnings: [],
                title: '',
                onClose,
            });

            const dialog = context.required('div.modal-dialog');
            expect(dialog.text()).toContain('The property field is required');
        });

        it('renders server-side errors', async () => {
            await renderComponent({
                errors: [
                    {
                        Exception: {
                            Type: 'System.NullReferenceException',
                            Message: 'Some message',
                        },
                    },
                ],
                messages: [],
                warnings: [],
                title: '',
                onClose,
            });

            const dialog = context.required('div.modal-dialog');
            expect(dialog.text()).toContain('System.NullReferenceException');
        });

        it('ignore null errors', async () => {
            await renderComponent({
                errors: [null!],
                messages: [],
                warnings: [],
                title: '',
                onClose,
            });

            const dialog = context.required('div.modal-dialog');
            expect(dialog.text()).toContain('There was an error');
        });
    });
});
