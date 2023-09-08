// noinspection JSUnresolvedFunction

import {AdminContainer} from "./AdminContainer";
import React from "react";
import {Templates} from "./Templates";
import {cleanUp, doChange, doClick, findButton, noop, renderApp} from "../../helpers/tests";
import {createTemporaryId} from "../../helpers/projection";

describe('Templates', () => {
    let context;
    let reportedError;
    let templates;
    let apiResponse;
    let deleted;
    let updated;
    let healthRequestFor;
    const templateApi = {
        getAll: async () => {
            return templates;
        },
        delete: async (id) => {
            deleted = id;
            return apiResponse || {success: true};
        },
        update: async (data) => {
            updated = data;
            return apiResponse || {success: true};
        },
        health: async (template) => {
            healthRequestFor = template;
            return apiResponse || {success: true, result: { checks: {}, errors: [], warnings: [], messages: [] } };
        },
    };

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        templates = [];
        updated = null;
        deleted = null;
        apiResponse = null;
        healthRequestFor = null;
    })

    async function renderComponent() {
        reportedError = null;
        context = await renderApp(
            {templateApi},
            {name: 'Courage Scores'},
            {
                account: {},
                appLoading: false,
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                reportClientSideException: noop,
            },
            (<AdminContainer>
                <Templates/>
            </AdminContainer>));
    }

    describe('renders', () => {
        it('renders templates', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                description: 'DESCRIPTION',
            };
            templates = [template];

            await renderComponent();

            expect(reportedError).toBeNull();
            const templateItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(templateItems.map(li => li.querySelector('label').textContent)).toEqual(['TEMPLATE']);
            expect(templateItems.map(li => li.querySelector('small').textContent)).toEqual(['DESCRIPTION']);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-danger')).map(s => s.textContent))).toEqual([[]]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-warning')).map(s => s.textContent))).toEqual([[]]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-success')).map(s => s.textContent))).toEqual([[]]);
        });

        it('renders templates without description', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
            };
            templates = [template];

            await renderComponent();

            expect(reportedError).toBeNull();
            const templateItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(templateItems.map(li => li.querySelector('label').textContent)).toEqual(['TEMPLATE']);
            expect(templateItems.map(li => li.querySelector('small'))).toEqual([null]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-danger')).map(s => s.textContent))).toEqual([[]]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-warning')).map(s => s.textContent))).toEqual([[]]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-success')).map(s => s.textContent))).toEqual([[]]);
        });

        it('template with some errors', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                templateHealth: {
                    errors: ['SOME ERROR'],
                    checks: {}
                },
            };
            templates = [template];

            await renderComponent();

            expect(reportedError).toBeNull();
            const templateItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(templateItems.map(li => li.querySelector('label').textContent)).toEqual(['TEMPLATE']);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-danger')).map(s => s.textContent))).toEqual([['1']]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-warning')).map(s => s.textContent))).toEqual([[]]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-success')).map(s => s.textContent))).toEqual([[]]);
        });

        it('template with some check errors', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                templateHealth: {
                    errors: [],
                    checks: {
                        'a check': {
                            success: false,
                            errors: ['ERROR'],
                            warnings: [],
                        }
                    }
                },
            };
            templates = [template];

            await renderComponent();

            expect(reportedError).toBeNull();
            const templateItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(templateItems.map(li => li.querySelector('label').textContent)).toEqual(['TEMPLATE']);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-danger')).map(s => s.textContent))).toEqual([['1']]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-warning')).map(s => s.textContent))).toEqual([[]]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-success')).map(s => s.textContent))).toEqual([[]]);
        });

        it('template with an unsuccessful check', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                templateHealth: {
                    errors: [],
                    checks: {
                        'a check': {
                            success: false,
                            errors: [],
                            warnings: [],
                        }
                    }
                },
            };
            templates = [template];

            await renderComponent();

            expect(reportedError).toBeNull();
            const templateItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(templateItems.map(li => li.querySelector('label').textContent)).toEqual(['TEMPLATE']);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-danger')).map(s => s.textContent))).toEqual([[]]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-warning')).map(s => s.textContent))).toEqual([['1']]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-success')).map(s => s.textContent))).toEqual([[]]);
        });

        it('template with an successful check', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                templateHealth: {
                    errors: [],
                    checks: {
                        'a check': {
                            success: true,
                            errors: [],
                            warnings: [],
                        }
                    }
                },
            };
            templates = [template];

            await renderComponent();

            expect(reportedError).toBeNull();
            const templateItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(templateItems.map(li => li.querySelector('label').textContent)).toEqual(['TEMPLATE']);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-danger')).map(s => s.textContent))).toEqual([[]]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-warning')).map(s => s.textContent))).toEqual([[]]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-success')).map(s => s.textContent))).toEqual([['1']]);
        });
    });

    describe('interactivity', () => {
        it('can select template', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: [],
            };
            templates = [template];
            await renderComponent();
            expect(reportedError).toBeNull();

            await doClick(context.container, '.list-group .list-group-item:first-child');
            await doClick(context.container, 'input[name="editorFormat"]'); // switch to text editor

            expect(reportedError).toBeNull();
            const templateItems = Array.from(context.container.querySelectorAll('ul[datatype="templates"] .list-group-item'));
            expect(templateItems.map(li => li.className)).toEqual(['list-group-item flex-column active']);
        });

        it('can deselect template', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: [],
            };
            templates = [template];
            await renderComponent();
            expect(reportedError).toBeNull();

            await doClick(context.container, '.list-group .list-group-item:first-child');
            await doClick(context.container, '.list-group .list-group-item:first-child');

            expect(reportedError).toBeNull();
            const templateItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(templateItems.map(li => li.className)).toEqual(['list-group-item flex-column']);
            expect(context.container.querySelector('textarea')).toBeFalsy();
        });

        it('can save template', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                updated: '2023-08-01',
                sharedAddresses: [],
                divisions: [],
            };
            templates = [template];
            await renderComponent();
            await doClick(context.container, '.list-group .list-group-item:first-child');

            await doClick(findButton(context.container, 'Save'));

            expect(reportedError).toBeNull();
            expect(updated).toEqual({
                divisions: [],
                sharedAddresses: [],
                id: template.id,
                name: 'TEMPLATE',
                lastUpdated: '2023-08-01',
                updated: '2023-08-01',
            });
        });

        it('can update template', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                updated: '2023-08-01',
                sharedAddresses: [],
                divisions: [],
            };
            templates = [template];
            await renderComponent();
            await doClick(context.container, '.list-group .list-group-item:first-child');
            await doClick(context.container, 'input[name="editorFormat"]'); // switch to text editor

            await doChange(context.container, 'textarea', '{}', context.user);

            expect(reportedError).toBeNull();
        });

        it('updates health as template changes', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                updated: '2023-08-01',
                sharedAddresses: [],
                divisions: [],
            };
            templates = [template];
            await renderComponent();
            await doClick(context.container, '.list-group .list-group-item:first-child');
            await doClick(context.container, 'input[name="editorFormat"]'); // switch to text editor
            const health = {
                checks: {},
                errors: [],
                warnings: [],
                messages: ['UPDATED HEALTH'],
            };
            apiResponse = {
                success: true,
                result: health,
            };

            await doChange(context.container, 'textarea', '{}', context.user);

            expect(reportedError).toBeNull();
            const healthCheck = context.container.querySelector('div[datatype="view-health-check"]');
            expect(healthCheck.textContent).toContain('UPDATED HEALTH');
        });

        it('prevents saving an invalid template', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                updated: '2023-08-01',
                sharedAddresses: [],
                divisions: [],
            };
            templates = [template];
            await renderComponent();
            await doClick(context.container, '.list-group .list-group-item:first-child');
            await doClick(context.container, 'input[name="editorFormat"]'); // switch to text editor

            await doChange(context.container, 'textarea', 'invalid json', context.user);

            expect(reportedError).toBeNull();
            expect(findButton(context.container, 'Save').disabled).toEqual(true);
        });

        it('does not delete template', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: [],
            };
            templates = [template];
            await renderComponent();
            await doClick(context.container, '.list-group .list-group-item:first-child');
            window.confirm = () => false;

            await doClick(findButton(context.container, 'Delete'));

            expect(reportedError).toBeNull();
        });

        it('can delete template', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: [],
            };
            templates = [template];
            await renderComponent();
            await doClick(context.container, '.list-group .list-group-item:first-child');
            let confirm;
            window.confirm = (msg) => {
                confirm = msg;
                return true;
            };

            await doClick(findButton(context.container, 'Delete'));

            expect(reportedError).toBeNull();
            expect(confirm).toEqual('Are you sure you want to delete this template?');
            expect(deleted).toEqual(template.id);
        });

        it('can add template', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: [],
            };
            templates = [template];
            await renderComponent();

            await doClick(findButton(context.container, 'Add'));
            await doClick(context.container, 'input[name="editorFormat"]'); // switch to text editor

            expect(reportedError).toBeNull();
            expect(JSON.parse(context.container.querySelector('textarea').value)).toEqual({ sharedAddresses: [], divisions: [] });
            expect(context.container.querySelector('button.bg-danger')).toBeFalsy();
        });

        it('can save new template', async () => {
            await renderComponent();
            await doClick(findButton(context.container, 'Add'));

            await doClick(findButton(context.container, 'Save'));

            expect(reportedError).toBeNull();
            expect(updated).toEqual({
                divisions: [],
                sharedAddresses: [],
                lastUpdated: undefined,
            });
        });

        it('an empty template does not exit editing', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: [],
            };
            templates = [template];
            await renderComponent();
            await doClick(findButton(context.container, 'Add'));
            await doClick(context.container, 'input[name="editorFormat"]'); // switch to text editor

            await doChange(context.container, 'textarea', '', context.user);

            expect(reportedError).toBeNull();
            expect(findButton(context.container, 'Save')).toBeTruthy();
        });

        it('handles error during save', async () => {
            await renderComponent();
            await doClick(findButton(context.container, 'Add'));
            apiResponse = {success: false, errors: ['ERROR ']};

            await doClick(findButton(context.container, 'Save'));

            expect(reportedError).toBeNull();
            expect(context.container.textContent).toContain('Could not save template');
            expect(context.container.textContent).toContain('ERROR');
        });

        it('handles error during delete', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: [],
            };
            templates = [template];
            await renderComponent();
            await doClick(context.container, '.list-group .list-group-item:first-child');
            let confirm;
            window.confirm = (msg) => {
                confirm = msg;
                return true;
            };
            apiResponse = {success: false, errors: ['ERROR ']};

            await doClick(findButton(context.container, 'Delete'));

            expect(deleted).toEqual(template.id);
            expect(reportedError).toBeNull();
            expect(context.container.textContent).toContain('Could not save template');
            expect(context.container.textContent).toContain('ERROR');
        });

        it('can close error dialog after save failure', async () => {
            await renderComponent();
            await doClick(findButton(context.container, 'Add'));
            apiResponse = {success: false, errors: ['ERROR ']};
            await doClick(findButton(context.container, 'Save'));
            expect(context.container.textContent).toContain('Could not save template');

            await doClick(findButton(context.container, 'Close'));

            expect(context.container.textContent).not.toContain('Could not save template');
        });
    });
});