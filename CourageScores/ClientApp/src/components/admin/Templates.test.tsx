import { AdminContainer } from './AdminContainer';
import { Templates } from './Templates';
import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    noop,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { createTemporaryId } from '../../helpers/projection';
import { TemplateDto } from '../../interfaces/models/dtos/Season/Creation/TemplateDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { SeasonHealthCheckResultDto } from '../../interfaces/models/dtos/Health/SeasonHealthCheckResultDto';
import { EditTemplateDto } from '../../interfaces/models/dtos/Season/Creation/EditTemplateDto';
import { ISeasonTemplateApi } from '../../interfaces/apis/ISeasonTemplateApi';

describe('Templates', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let templates: TemplateDto[];
    let apiResponse: IClientActionResultDto<any> | null;
    let deleted: string | null;
    let updated: EditTemplateDto | null;
    const templateApi = api<ISeasonTemplateApi>({
        getAll: async (): Promise<TemplateDto[]> => {
            return templates;
        },
        delete: async (
            id: string,
        ): Promise<IClientActionResultDto<TemplateDto>> => {
            deleted = id;
            return apiResponse || { success: true };
        },
        update: async (
            data: EditTemplateDto,
        ): Promise<IClientActionResultDto<TemplateDto>> => {
            updated = data;
            return apiResponse || { success: true };
        },
        health: async (): Promise<
            IClientActionResultDto<SeasonHealthCheckResultDto>
        > => {
            return (
                apiResponse || {
                    success: true,
                    result: {
                        checks: {},
                        errors: [],
                        warnings: [],
                        messages: [],
                    },
                }
            );
        },
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        templates = [];
        updated = null;
        deleted = null;
        apiResponse = null;
        reportedError = new ErrorState();
    });

    async function renderComponent(search?: string) {
        context = await renderApp(
            iocProps({ templateApi }),
            brandingProps(),
            appProps(
                {
                    account: {
                        name: '',
                        emailAddress: '',
                        givenName: '',
                    },
                },
                reportedError,
            ),
            <AdminContainer accounts={[]} tables={[]}>
                <Templates />
            </AdminContainer>,
            '/admin/templates/',
            '/admin/templates/' + (search || ''),
        );
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

            reportedError.verifyNoError();
            const templateItems = context.all(
                'ul[datatype="templates"] .list-group-item',
            );
            expect(
                templateItems.map((li) => li.required('label').text()),
            ).toEqual(['TEMPLATE']);
            expect(
                templateItems.map((li) => li.required('small').text()),
            ).toEqual(['DESCRIPTION']);
            expect(
                templateItems.map((li) =>
                    li.all('span.bg-danger').map((s) => s.text()),
                ),
            ).toEqual([[]]);
            expect(
                templateItems.map((li) =>
                    li.all('span.bg-warning').map((s) => s.text()),
                ),
            ).toEqual([[]]);
            expect(
                templateItems.map((li) =>
                    li.all('span.bg-success').map((s) => s.text()),
                ),
            ).toEqual([[]]);
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

            reportedError.verifyNoError();
            const templateItems = context.all(
                'ul[datatype="templates"] .list-group-item',
            );
            expect(
                templateItems.map(
                    (li) => li.className().indexOf('active') !== -1,
                ),
            ).toEqual([true]);
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

            reportedError.verifyNoError();
            const templateItems = context.all(
                'ul[datatype="templates"] .list-group-item',
            );
            expect(
                templateItems.map(
                    (li) => li.className().indexOf('active') !== -1,
                ),
            ).toEqual([true]);
        });

        it('renders templates without description', async () => {
            const template: TemplateDto = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
            };
            templates = [template];

            await renderComponent();

            reportedError.verifyNoError();
            const templateItems = context.all('.list-group .list-group-item');
            expect(
                templateItems.map((li) => li.required('label').text()),
            ).toEqual(['TEMPLATE']);
            expect(templateItems.map((li) => li.optional('small'))).toEqual([
                undefined,
            ]);
            expect(
                templateItems.map((li) =>
                    li.all('span.bg-danger').map((s) => s.text()),
                ),
            ).toEqual([[]]);
            expect(
                templateItems.map((li) =>
                    li.all('span.bg-warning').map((s) => s.text()),
                ),
            ).toEqual([[]]);
            expect(
                templateItems.map((li) =>
                    li.all('span.bg-success').map((s) => s.text()),
                ),
            ).toEqual([[]]);
        });

        it('template with some errors', async () => {
            const template: TemplateDto = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                templateHealth: {
                    errors: ['SOME ERROR'],
                    checks: {},
                },
            };
            templates = [template];

            await renderComponent();

            reportedError.verifyNoError();
            const templateItems = context.all('.list-group .list-group-item');
            expect(
                templateItems.map((li) => li.required('label').text()),
            ).toEqual(['TEMPLATE']);
            expect(
                templateItems.map((li) =>
                    li.all('span.bg-danger').map((s) => s.text()),
                ),
            ).toEqual([['1']]);
            expect(
                templateItems.map((li) =>
                    li.all('span.bg-warning').map((s) => s.text()),
                ),
            ).toEqual([[]]);
            expect(
                templateItems.map((li) =>
                    li.all('span.bg-success').map((s) => s.text()),
                ),
            ).toEqual([[]]);
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
                        },
                    },
                },
            };
            templates = [template];

            await renderComponent();

            reportedError.verifyNoError();
            const templateItems = context.all('.list-group .list-group-item');
            expect(
                templateItems.map((li) => li.required('label').text()),
            ).toEqual(['TEMPLATE']);
            expect(
                templateItems.map((li) =>
                    li.all('span.bg-danger').map((s) => s.text()),
                ),
            ).toEqual([['1']]);
            expect(
                templateItems.map((li) =>
                    li.all('span.bg-warning').map((s) => s.text()),
                ),
            ).toEqual([[]]);
            expect(
                templateItems.map((li) =>
                    li.all('span.bg-success').map((s) => s.text()),
                ),
            ).toEqual([[]]);
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
                        },
                    },
                },
            };
            templates = [template];

            await renderComponent();

            reportedError.verifyNoError();
            const templateItems = context.all('.list-group .list-group-item');
            expect(
                templateItems.map((li) => li.required('label').text()),
            ).toEqual(['TEMPLATE']);
            expect(
                templateItems.map((li) =>
                    li.all('span.bg-danger').map((s) => s.text()),
                ),
            ).toEqual([[]]);
            expect(
                templateItems.map((li) =>
                    li.all('span.bg-warning').map((s) => s.text()),
                ),
            ).toEqual([['1']]);
            expect(
                templateItems.map((li) =>
                    li.all('span.bg-success').map((s) => s.text()),
                ),
            ).toEqual([[]]);
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
                        },
                    },
                },
            };
            templates = [template];

            await renderComponent();

            reportedError.verifyNoError();
            const templateItems = context.all('.list-group .list-group-item');
            expect(
                templateItems.map((li) => li.required('label').text()),
            ).toEqual(['TEMPLATE']);
            expect(
                templateItems.map((li) =>
                    li.all('span.bg-danger').map((s) => s.text()),
                ),
            ).toEqual([[]]);
            expect(
                templateItems.map((li) =>
                    li.all('span.bg-warning').map((s) => s.text()),
                ),
            ).toEqual([[]]);
            expect(
                templateItems.map((li) =>
                    li.all('span.bg-success').map((s) => s.text()),
                ),
            ).toEqual([['1']]);
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
            reportedError.verifyNoError();

            await context
                .required('.list-group .list-group-item:first-child')
                .click();
            await context.input('editorFormat').click(); // switch to text editor

            reportedError.verifyNoError();
            const templateItems = context.all(
                'ul[datatype="templates"] .list-group-item',
            );
            expect(templateItems.map((li) => li.className())).toEqual([
                'list-group-item flex-column active',
            ]);
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
            reportedError.verifyNoError();

            await context
                .required('.list-group .list-group-item:first-child')
                .click();
            await context
                .required('.list-group .list-group-item:first-child')
                .click();

            reportedError.verifyNoError();
            const templateItems = context.all('.list-group .list-group-item');
            expect(templateItems.map((li) => li.className())).toEqual([
                'list-group-item flex-column',
            ]);
            expect(context.optional('textarea')).toBeFalsy();
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
            await context
                .required('.list-group .list-group-item:first-child')
                .click();

            await context.button('Save').click();

            reportedError.verifyNoError();
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
            await context
                .required('.list-group .list-group-item:first-child')
                .click();
            await context.input('editorFormat').click(); // switch to text editor

            await context.required('textarea').change('{}');

            reportedError.verifyNoError();
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
            await context
                .required('.list-group .list-group-item:first-child')
                .click();
            await context.input('editorFormat').click(); // switch to text editor
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

            await context.required('textarea').change('{}');

            reportedError.verifyNoError();
            const healthCheck = context.required(
                'div[datatype="view-health-check"]',
            );
            expect(healthCheck.text()).toContain('UPDATED HEALTH');
        });

        it('prevents saving an invalid template', async () => {
            console.error = noop;
            const template: TemplateDto = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                updated: '2023-08-01',
                sharedAddresses: [],
                divisions: [],
            };
            templates = [template];
            await renderComponent();
            await context
                .required('.list-group .list-group-item:first-child')
                .click();
            await context.input('editorFormat').click(); // switch to text editor

            await context.required('textarea').change('invalid json');

            reportedError.verifyNoError();
            expect(context.button('Save').enabled()).toEqual(false);
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
            await context
                .required('.list-group .list-group-item:first-child')
                .click();
            context.prompts.respondToConfirm(
                'Are you sure you want to delete this template?',
                false,
            );

            await context.button('Delete').click();

            reportedError.verifyNoError();
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
            await context
                .required('.list-group .list-group-item:first-child')
                .click();
            context.prompts.respondToConfirm(
                'Are you sure you want to delete this template?',
                true,
            );

            await context.button('Delete').click();

            reportedError.verifyNoError();
            context.prompts.confirmWasShown(
                'Are you sure you want to delete this template?',
            );
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

            await context.button('Add').click();
            await context.input('editorFormat').click(); // switch to text editor

            reportedError.verifyNoError();
            expect(JSON.parse(context.required('textarea').value())).toEqual({
                sharedAddresses: [],
                divisions: [],
            });
            expect(context.optional('button.bg-danger')).toBeFalsy();
        });

        it('can save new template', async () => {
            await renderComponent();
            await context.button('Add').click();

            await context.button('Save').click();

            reportedError.verifyNoError();
            expect(updated).toEqual({
                name: '',
                divisions: [],
                sharedAddresses: [],
            });
        });

        it('an empty template does not exit editing', async () => {
            console.error = noop;
            const template: TemplateDto = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: [],
            };
            templates = [template];
            await renderComponent();
            await context.button('Add').click();
            await context.input('editorFormat').click(); // switch to text editor

            await context.required('textarea').change('');

            reportedError.verifyNoError();
            expect(context.button('Save')).toBeTruthy();
        });

        it('handles error during save', async () => {
            await renderComponent();
            await context.button('Add').click();
            apiResponse = { success: false, errors: ['ERROR '] };

            await context.button('Save').click();

            reportedError.verifyNoError();
            expect(context.text()).toContain('Could not save template');
            expect(context.text()).toContain('ERROR');
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
            await context
                .required('.list-group .list-group-item:first-child')
                .click();
            context.prompts.respondToConfirm(
                'Are you sure you want to delete this template?',
                true,
            );
            apiResponse = { success: false, errors: ['ERROR '] };

            await context.button('Delete').click();

            expect(deleted).toEqual(template.id);
            reportedError.verifyNoError();
            expect(context.text()).toContain('Could not save template');
            expect(context.text()).toContain('ERROR');
        });

        it('can close error dialog after save failure', async () => {
            await renderComponent();
            await context.button('Add').click();
            apiResponse = { success: false, errors: ['ERROR '] };
            await context.button('Save').click();
            expect(context.text()).toContain('Could not save template');

            await context.button('Close').click();

            expect(context.text()).not.toContain('Could not save template');
        });
    });
});
