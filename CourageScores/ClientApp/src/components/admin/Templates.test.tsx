import {AdminContainer} from "./AdminContainer";
import React from "react";
import {Templates} from "./Templates";
import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick, ErrorState,
    findButton,
    iocProps,
    renderApp, TestContext
} from "../../helpers/tests";
import {createTemporaryId} from "../../helpers/projection";
import {TemplateDto} from "../../interfaces/models/dtos/Season/Creation/TemplateDto";
import {IClientActionResultDto} from "../../interfaces/IClientActionResultDto";
import {SeasonHealthCheckResultDto} from "../../interfaces/models/dtos/Health/SeasonHealthCheckResultDto";
import {EditTemplateDto} from "../../interfaces/models/dtos/Season/Creation/EditTemplateDto";
import {ISeasonTemplateApi} from "../../interfaces/apis/ISeasonTemplateApi";

describe('Templates', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let templates: TemplateDto[];
    let apiResponse: IClientActionResultDto<any>;
    let deleted: string;
    let updated: EditTemplateDto;
    const templateApi = api<ISeasonTemplateApi>({
        getAll: async (): Promise<TemplateDto[]> => {
            return templates;
        },
        delete: async (id: string): Promise<IClientActionResultDto<TemplateDto>> => {
            deleted = id;
            return apiResponse || {success: true};
        },
        update: async (data: EditTemplateDto): Promise<IClientActionResultDto<TemplateDto>> => {
            updated = data;
            return apiResponse || {success: true};
        },
        health: async (): Promise<IClientActionResultDto<SeasonHealthCheckResultDto>> => {
            return apiResponse || {success: true, result: { checks: {}, errors: [], warnings: [], messages: [] } };
        },
    });

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        templates = [];
        updated = null;
        deleted = null;
        apiResponse = null;
        reportedError = new ErrorState();
    })

    async function renderComponent(search?: string) {
        context = await renderApp(
            iocProps({templateApi}),
            brandingProps(),
            appProps({
                account: {},
            }, reportedError),
            (<AdminContainer accounts={[]} tables={[]}>
                <Templates/>
            </AdminContainer>),
            '/admin/templates/',
            '/admin/templates/' + (search || ''));
    }

    describe('renders', () => {
        it('renders templates', async () => {
            const template: TemplateDto = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                description: 'DESCRIPTION',
            };
            templates = [template];

            await renderComponent();

            expect(reportedError.hasError()).toEqual(false);
            const templateItems = Array.from(context.container.querySelectorAll('ul[datatype="templates"] .list-group-item'));
            expect(templateItems.map(li => li.querySelector('label').textContent)).toEqual(['TEMPLATE']);
            expect(templateItems.map(li => li.querySelector('small').textContent)).toEqual(['DESCRIPTION']);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-danger')).map(s => s.textContent))).toEqual([[]]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-warning')).map(s => s.textContent))).toEqual([[]]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-success')).map(s => s.textContent))).toEqual([[]]);
        });

        it('renders selected template by id', async () => {
            const template: TemplateDto = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                description: 'DESCRIPTION',
                sharedAddresses: [],
                divisions: [],
            };
            templates = [template];

            await renderComponent('?select=' + template.id);

            expect(reportedError.hasError()).toEqual(false);
            const templateItems = Array.from(context.container.querySelectorAll('ul[datatype="templates"] .list-group-item'));
            expect(templateItems.map(li => li.className.indexOf('active') !== -1)).toEqual([true]);
        });

        it('renders selected template by name', async () => {
            const template: TemplateDto = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                description: 'DESCRIPTION',
                sharedAddresses: [],
                divisions: [],
            };
            templates = [template];

            await renderComponent('?select=' + template.name);

            expect(reportedError.hasError()).toEqual(false);
            const templateItems = Array.from(context.container.querySelectorAll('ul[datatype="templates"] .list-group-item'));
            expect(templateItems.map(li => li.className.indexOf('active') !== -1)).toEqual([true]);
        });

        it('renders templates without description', async () => {
            const template: TemplateDto = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
            };
            templates = [template];

            await renderComponent();

            expect(reportedError.hasError()).toEqual(false);
            const templateItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(templateItems.map(li => li.querySelector('label').textContent)).toEqual(['TEMPLATE']);
            expect(templateItems.map(li => li.querySelector('small'))).toEqual([null]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-danger')).map(s => s.textContent))).toEqual([[]]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-warning')).map(s => s.textContent))).toEqual([[]]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-success')).map(s => s.textContent))).toEqual([[]]);
        });

        it('template with some errors', async () => {
            const template: TemplateDto = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                templateHealth: {
                    errors: ['SOME ERROR'],
                    checks: {}
                },
            };
            templates = [template];

            await renderComponent();

            expect(reportedError.hasError()).toEqual(false);
            const templateItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(templateItems.map(li => li.querySelector('label').textContent)).toEqual(['TEMPLATE']);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-danger')).map(s => s.textContent))).toEqual([['1']]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-warning')).map(s => s.textContent))).toEqual([[]]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-success')).map(s => s.textContent))).toEqual([[]]);
        });

        it('template with some check errors', async () => {
            const template: TemplateDto = {
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

            expect(reportedError.hasError()).toEqual(false);
            const templateItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(templateItems.map(li => li.querySelector('label').textContent)).toEqual(['TEMPLATE']);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-danger')).map(s => s.textContent))).toEqual([['1']]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-warning')).map(s => s.textContent))).toEqual([[]]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-success')).map(s => s.textContent))).toEqual([[]]);
        });

        it('template with an unsuccessful check', async () => {
            const template: TemplateDto = {
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

            expect(reportedError.hasError()).toEqual(false);
            const templateItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(templateItems.map(li => li.querySelector('label').textContent)).toEqual(['TEMPLATE']);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-danger')).map(s => s.textContent))).toEqual([[]]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-warning')).map(s => s.textContent))).toEqual([['1']]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-success')).map(s => s.textContent))).toEqual([[]]);
        });

        it('template with an successful check', async () => {
            const template: TemplateDto = {
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

            expect(reportedError.hasError()).toEqual(false);
            const templateItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(templateItems.map(li => li.querySelector('label').textContent)).toEqual(['TEMPLATE']);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-danger')).map(s => s.textContent))).toEqual([[]]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-warning')).map(s => s.textContent))).toEqual([[]]);
            expect(templateItems.map(li => Array.from(li.querySelectorAll('span.bg-success')).map(s => s.textContent))).toEqual([['1']]);
        });
    });

    describe('interactivity', () => {
        it('can select template', async () => {
            const template: TemplateDto = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: [],
            };
            templates = [template];
            await renderComponent();
            expect(reportedError.hasError()).toEqual(false);

            await doClick(context.container, '.list-group .list-group-item:first-child');
            await doClick(context.container, 'input[name="editorFormat"]'); // switch to text editor

            expect(reportedError.hasError()).toEqual(false);
            const templateItems = Array.from(context.container.querySelectorAll('ul[datatype="templates"] .list-group-item'));
            expect(templateItems.map(li => li.className)).toEqual(['list-group-item flex-column active']);
        });

        it('can deselect template', async () => {
            const template: TemplateDto = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: [],
            };
            templates = [template];
            await renderComponent();
            expect(reportedError.hasError()).toEqual(false);

            await doClick(context.container, '.list-group .list-group-item:first-child');
            await doClick(context.container, '.list-group .list-group-item:first-child');

            expect(reportedError.hasError()).toEqual(false);
            const templateItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(templateItems.map(li => li.className)).toEqual(['list-group-item flex-column']);
            expect(context.container.querySelector('textarea')).toBeFalsy();
        });

        it('can save template', async () => {
            const template: TemplateDto = {
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

            expect(reportedError.hasError()).toEqual(false);
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
            const template: TemplateDto = {
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

            expect(reportedError.hasError()).toEqual(false);
        });

        it('updates health as template changes', async () => {
            const template: TemplateDto = {
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
            const health: SeasonHealthCheckResultDto = {
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

            expect(reportedError.hasError()).toEqual(false);
            const healthCheck = context.container.querySelector('div[datatype="view-health-check"]');
            expect(healthCheck.textContent).toContain('UPDATED HEALTH');
        });

        it('prevents saving an invalid template', async () => {
            const template: TemplateDto = {
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

            expect(reportedError.hasError()).toEqual(false);
            expect(findButton(context.container, 'Save').disabled).toEqual(true);
        });

        it('does not delete template', async () => {
            const template: TemplateDto = {
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

            expect(reportedError.hasError()).toEqual(false);
        });

        it('can delete template', async () => {
            const template: TemplateDto = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: [],
            };
            templates = [template];
            await renderComponent();
            await doClick(context.container, '.list-group .list-group-item:first-child');
            let confirm: string;
            window.confirm = (msg) => {
                confirm = msg;
                return true;
            };

            await doClick(findButton(context.container, 'Delete'));

            expect(reportedError.hasError()).toEqual(false);
            expect(confirm).toEqual('Are you sure you want to delete this template?');
            expect(deleted).toEqual(template.id);
        });

        it('can add template', async () => {
            const template: TemplateDto = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: [],
            };
            templates = [template];
            await renderComponent();

            await doClick(findButton(context.container, 'Add'));
            await doClick(context.container, 'input[name="editorFormat"]'); // switch to text editor

            expect(reportedError.hasError()).toEqual(false);
            expect(JSON.parse(context.container.querySelector('textarea').value)).toEqual({ sharedAddresses: [], divisions: [] });
            expect(context.container.querySelector('button.bg-danger')).toBeFalsy();
        });

        it('can save new template', async () => {
            await renderComponent();
            await doClick(findButton(context.container, 'Add'));

            await doClick(findButton(context.container, 'Save'));

            expect(reportedError.hasError()).toEqual(false);
            expect(updated).toEqual({
                name: '',
                divisions: [],
                sharedAddresses: [],
                lastUpdated: undefined,
            });
        });

        it('an empty template does not exit editing', async () => {
            const template: TemplateDto = {
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

            expect(reportedError.hasError()).toEqual(false);
            expect(findButton(context.container, 'Save')).toBeTruthy();
        });

        it('handles error during save', async () => {
            await renderComponent();
            await doClick(findButton(context.container, 'Add'));
            apiResponse = {success: false, errors: ['ERROR ']};

            await doClick(findButton(context.container, 'Save'));

            expect(reportedError.hasError()).toEqual(false);
            expect(context.container.textContent).toContain('Could not save template');
            expect(context.container.textContent).toContain('ERROR');
        });

        it('handles error during delete', async () => {
            const template: TemplateDto = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: [],
            };
            templates = [template];
            await renderComponent();
            await doClick(context.container, '.list-group .list-group-item:first-child');
            window.confirm = () => {
                return true;
            };
            apiResponse = {success: false, errors: ['ERROR ']};

            await doClick(findButton(context.container, 'Delete'));

            expect(deleted).toEqual(template.id);
            expect(reportedError.hasError()).toEqual(false);
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