import {
    appProps,
    brandingProps,
    cleanUp,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import {
    IReviewProposalHealthProps,
    ReviewProposalHealth,
} from './ReviewProposalHealth';

describe('ReviewProposalHealth', () => {
    let context: TestContext;

    afterEach(async () => {
        await cleanUp(context);
    });

    async function renderComponent(props: IReviewProposalHealthProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            <ReviewProposalHealth {...props} />,
        );
    }

    describe('renders', () => {
        it('when successful', async () => {
            await renderComponent({
                response: {
                    success: true,
                    errors: [],
                    warnings: [],
                    messages: [],
                    result: {
                        proposalHealth: {
                            errors: [],
                            warnings: [],
                            messages: [],
                            checks: {},
                        },
                    },
                },
            });

            const heading = context.required('h4');
            const alert = context.required('.alert');
            expect(heading.text()).toEqual('✔ Fixtures have been proposed');
            expect(alert.className()).toContain('alert-success');
            expect(
                context.optional('div[datatype="view-health-check"]'),
            ).toBeTruthy();
        });

        it('when unsuccessful', async () => {
            await renderComponent({
                response: {
                    success: false,
                    errors: [],
                    warnings: [],
                    messages: [],
                    result: {
                        proposalHealth: {
                            errors: [],
                            warnings: [],
                            messages: [],
                            checks: {},
                        },
                    },
                },
            });

            const heading = context.required('h4');
            const alert = context.required('.alert');
            expect(heading.text()).toEqual(
                '⚠ There was an issue proposing fixtures',
            );
            expect(alert.className()).toContain('alert-warning');
            expect(
                context.optional('div[datatype="view-health-check"]'),
            ).toBeFalsy();
        });

        it('errors only', async () => {
            await renderComponent({
                response: {
                    success: true,
                    errors: ['ERROR'],
                    warnings: [],
                    messages: [],
                    result: {
                        proposalHealth: {
                            errors: [],
                            warnings: [],
                            messages: [],
                            checks: {},
                        },
                    },
                },
            });

            const alert = context.required('.alert');
            const errors = alert.all('ol:nth-child(1) li');
            expect(errors.map((li) => li.text())).toEqual(['ERROR']);
        });

        it('warnings only', async () => {
            await renderComponent({
                response: {
                    success: true,
                    errors: [],
                    warnings: ['WARNING'],
                    messages: [],
                    result: {
                        proposalHealth: {
                            errors: [],
                            warnings: [],
                            messages: [],
                            checks: {},
                        },
                    },
                },
            });

            const alert = context.required('.alert');
            const warnings = alert.all('ol:nth-child(1) li');
            expect(warnings.map((li) => li.text())).toEqual(['WARNING']);
        });

        it('messages only', async () => {
            await renderComponent({
                response: {
                    success: true,
                    errors: [],
                    warnings: [],
                    messages: ['MESSAGE'],
                    result: {
                        proposalHealth: {
                            errors: [],
                            warnings: [],
                            messages: [],
                            checks: {},
                        },
                    },
                },
            });

            const alert = context.required('.alert');
            const messages = alert.all('ol:nth-child(1) li');
            expect(messages.map((li) => li.text())).toEqual(['MESSAGE']);
        });

        it('without errors, warnings, messages', async () => {
            await renderComponent({
                response: {
                    success: true,
                    errors: [],
                    warnings: [],
                    messages: [],
                    result: {
                        proposalHealth: {
                            errors: [],
                            warnings: [],
                            messages: [],
                            checks: {},
                        },
                    },
                },
            });

            expect(context.all('.alert > ol').length).toEqual(0);
        });
    });
});
