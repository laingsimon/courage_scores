// noinspection JSUnresolvedFunction

import {AdminContainer} from "./AdminContainer";
import React from "react";
import {Templates} from "./Templates";
import {renderApp, cleanUp, doClick, findButton, doChange} from "../../helpers/tests";
import {createTemporaryId} from "../../helpers/projection";

describe('Templates', () => {
    let context;
    let reportedError;
    let templates;
    let apiResponse;
    let deleted;
    let updated;
    const templateApi = {
        getAll: async () => {
            return templates;
        },
        delete: async (id) => {
            deleted = id;
            return apiResponse || { success: true };
        },
        update: async (data) => {
            updated = data;
            return apiResponse || { success: true };
        }
    };

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        templates = [];
        updated = null;
        deleted = null;
        apiResponse = null;
    })

    async function renderComponent() {
        reportedError = null;
        context = await renderApp(
            { templateApi },
            { name: 'Courage Scores' },
            {
                account: { },
                appLoading: false,
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                }
            },
            (<AdminContainer>
                <Templates />
            </AdminContainer>));
    }

    it('renders templates', async () => {
        const template = {
            id: createTemporaryId(),
            name: 'TEMPLATE',
        };
        templates = [ template ];

        await renderComponent();

        expect(reportedError).toBeNull();
        const templateItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
        expect(templateItems.map(li => li.querySelector('label').textContent)).toEqual([ 'TEMPLATE' ]);
        expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-danger')).map(s => s.textContent))).toEqual([ [ ] ]);
        expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-warning')).map(s => s.textContent))).toEqual([ [ ] ]);
        expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-success')).map(s => s.textContent))).toEqual([ [ ] ]);
    });

    it('renders template with some errors', async () => {
        const template = {
            id: createTemporaryId(),
            name: 'TEMPLATE',
            templateHealth: {
                errors: [ 'SOME ERROR' ],
                checks: {

                }
            },
        };
        templates = [ template ];

        await renderComponent();

        expect(reportedError).toBeNull();
        const templateItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
        expect(templateItems.map(li => li.querySelector('label').textContent)).toEqual([ 'TEMPLATE' ]);
        expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-danger')).map(s => s.textContent))).toEqual([ [ '1' ] ]);
        expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-warning')).map(s => s.textContent))).toEqual([ [ ] ]);
        expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-success')).map(s => s.textContent))).toEqual([ [ ] ]);
    });

    it('renders template with some check errors', async () => {
        const template = {
            id: createTemporaryId(),
            name: 'TEMPLATE',
            templateHealth: {
                errors: [ ],
                checks: {
                    'a check': {
                        success: false,
                        errors: [ 'ERROR' ],
                        warnings: [],
                    }
                }
            },
        };
        templates = [ template ];

        await renderComponent();

        expect(reportedError).toBeNull();
        const templateItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
        expect(templateItems.map(li => li.querySelector('label').textContent)).toEqual([ 'TEMPLATE' ]);
        expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-danger')).map(s => s.textContent))).toEqual([ [ '1' ] ]);
        expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-warning')).map(s => s.textContent))).toEqual([ [ ] ]);
        expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-success')).map(s => s.textContent))).toEqual([ [ ] ]);
    });

    it('renders template with an unsuccessful check', async () => {
        const template = {
            id: createTemporaryId(),
            name: 'TEMPLATE',
            templateHealth: {
                errors: [ ],
                checks: {
                    'a check': {
                        success: false,
                        errors: [],
                        warnings: [],
                    }
                }
            },
        };
        templates = [ template ];

        await renderComponent();

        expect(reportedError).toBeNull();
        const templateItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
        expect(templateItems.map(li => li.querySelector('label').textContent)).toEqual([ 'TEMPLATE' ]);
        expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-danger')).map(s => s.textContent))).toEqual([ [ ] ]);
        expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-warning')).map(s => s.textContent))).toEqual([ [ '1' ] ]);
        expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-success')).map(s => s.textContent))).toEqual([ [ ] ]);
    });

    it('renders template with an successful check', async () => {
        const template = {
            id: createTemporaryId(),
            name: 'TEMPLATE',
            templateHealth: {
                errors: [ ],
                checks: {
                    'a check': {
                        success: true,
                        errors: [],
                        warnings: [],
                    }
                }
            },
        };
        templates = [ template ];

        await renderComponent();

        expect(reportedError).toBeNull();
        const templateItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
        expect(templateItems.map(li => li.querySelector('label').textContent)).toEqual([ 'TEMPLATE' ]);
        expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-danger')).map(s => s.textContent))).toEqual([ [ ] ]);
        expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-warning')).map(s => s.textContent))).toEqual([ [ ] ]);
        expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-success')).map(s => s.textContent))).toEqual([ [ '1' ] ]);
    });

    it('can select template', async () => {
        const template = {
            id: createTemporaryId(),
            name: 'TEMPLATE',
            updated: '2023-01-02',
            created: '2023-01-01',
            author: 'Simon',
            editor: 'Simon',
            deleted: null,
            remover: null,
        };
        templates = [ template ];
        await renderComponent();
        expect(reportedError).toBeNull();

        await doClick(context.container, '.list-group .list-group-item:first-child');

        expect(reportedError).toBeNull();
        const templateItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
        expect(templateItems.map(li => li.className)).toEqual([ 'list-group-item d-flex justify-content-between align-items-center active' ]);
        const textarea = context.container.querySelector('textarea');
        expect(textarea).toBeTruthy();
        const editableTemplate = {
            id: template.id,
            name: template.name,
        }
        expect(textarea.value).toEqual(JSON.stringify(editableTemplate, null, '  '));
    });

    it('can deselect template', async () => {
        const template = {
            id: createTemporaryId(),
            name: 'TEMPLATE',
        };
        templates = [ template ];
        await renderComponent();
        expect(reportedError).toBeNull();

        await doClick(context.container, '.list-group .list-group-item:first-child');
        await doClick(context.container, '.list-group .list-group-item:first-child');

        expect(reportedError).toBeNull();
        const templateItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
        expect(templateItems.map(li => li.className)).toEqual([ 'list-group-item d-flex justify-content-between align-items-center' ]);
        expect(context.container.querySelector('textarea')).toBeFalsy();
    });

    it('can save template', async () => {
        const template = {
            id: createTemporaryId(),
            name: 'TEMPLATE',
            updated: '2023-08-01',
        };
        templates = [ template ];
        await renderComponent();
        await doClick(context.container, '.list-group .list-group-item:first-child');
        expect(findButton(context.container, 'Save').disabled).toEqual(false);

        await doClick(findButton(context.container, 'Save'));

        expect(reportedError).toBeNull();
        expect(updated).toEqual({
            id: template.id,
            name: 'TEMPLATE',
            lastUpdated: '2023-08-01',
        });
    });

    it('can update template', async () => {
        const template = {
            id: createTemporaryId(),
            name: 'TEMPLATE',
            updated: '2023-08-01',
        };
        templates = [ template ];
        await renderComponent();
        await doClick(context.container, '.list-group .list-group-item:first-child');
        expect(findButton(context.container, 'Save').disabled).toEqual(false);

        await doChange(context.container, 'textarea', '{}', context.user);

        expect(reportedError).toBeNull();
        expect(findButton(context.container, 'Save').disabled).toEqual(false);
    });

    it('prevents saving an invalid template', async () => {
        const template = {
            id: createTemporaryId(),
            name: 'TEMPLATE',
            updated: '2023-08-01',
        };
        templates = [ template ];
        await renderComponent();
        await doClick(context.container, '.list-group .list-group-item:first-child');
        expect(findButton(context.container, 'Save').disabled).toEqual(false);

        await doChange(context.container, 'textarea', 'invalid json', context.user);

        expect(reportedError).toBeNull();
        expect(findButton(context.container, 'Save').disabled).toEqual(true);
    });

    it('does not delete template', async () => {
        const template = {
            id: createTemporaryId(),
            name: 'TEMPLATE',
        };
        templates = [ template ];
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
        };
        templates = [ template ];
        await renderComponent();
        await doClick(context.container, '.list-group .list-group-item:first-child');
        let confirm;
        window.confirm = (msg) => { confirm = msg; return true; };

        await doClick(findButton(context.container, 'Delete'));

        expect(reportedError).toBeNull();
        expect(confirm).toEqual('Are you sure you want to delete this template?');
        expect(deleted).toEqual(template.id);
    });

    it('can add template', async () => {
        const template = {
            id: createTemporaryId(),
            name: 'TEMPLATE',
        };
        templates = [ template ];
        await renderComponent();

        await doClick(findButton(context.container, 'Add'));

        expect(reportedError).toBeNull();
        expect(context.container.querySelector('textarea').value).toEqual('{}');
    });

    it('can save new template', async () => {
        await renderComponent();
        await doClick(findButton(context.container, 'Add'));
        expect(findButton(context.container, 'Save').disabled).toEqual(false);

        await doClick(findButton(context.container, 'Save'));

        expect(reportedError).toBeNull();
        expect(updated).toEqual({
            lastUpdated: undefined,
        });
    });
});