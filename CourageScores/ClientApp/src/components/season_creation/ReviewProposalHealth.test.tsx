import {appProps, brandingProps, cleanUp, iocProps, renderApp, TestContext} from "../../helpers/tests";
import {IReviewProposalHealthProps, ReviewProposalHealth} from "./ReviewProposalHealth";

describe('ReviewProposalHealth', () => {
    let context: TestContext;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props: IReviewProposalHealthProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            (<ReviewProposalHealth {...props} />));
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
                }
            });

            const heading = context.container.querySelector('h4');
            const alert = context.container.querySelector('.alert');
            expect(heading.textContent).toEqual('✔ Fixtures have been proposed');
            expect(alert.className).toContain('alert-success');
            expect(context.container.querySelector('div[datatype="view-health-check"]')).toBeTruthy();
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
                }
            });

            const heading = context.container.querySelector('h4');
            const alert = context.container.querySelector('.alert');
            expect(heading.textContent).toEqual('⚠ There was an issue proposing fixtures');
            expect(alert.className).toContain('alert-warning');
            expect(context.container.querySelector('div[datatype="view-health-check"]')).toBeFalsy();
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
                }
            });

            const alert = context.container.querySelector('.alert');
            const errors = Array.from(alert.querySelectorAll('ol:nth-child(1) li'));
            expect(errors.map(li => li.textContent)).toEqual(['ERROR']);
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
                }
            });

            const alert = context.container.querySelector('.alert');
            const warnings = Array.from(alert.querySelectorAll('ol:nth-child(1) li'));
            expect(warnings.map(li => li.textContent)).toEqual(['WARNING']);
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
                }
            });

            const alert = context.container.querySelector('.alert');
            const messages = Array.from(alert.querySelectorAll('ol:nth-child(1) li'));
            expect(messages.map(li => li.textContent)).toEqual(['MESSAGE']);
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
                }
            });

            const messageLists = Array.from(context.container.querySelectorAll('.alert > ol'));
            expect(messageLists.length).toEqual(0);
        });
    });
});