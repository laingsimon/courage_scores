import { AdminContainer } from './AdminContainer';
import {
    cleanUp,
    renderApp,
    iocProps,
    brandingProps,
    appProps,
    ErrorState,
    TestContext,
    noop,
} from '../../helpers/tests';
import {
    ITemplateTextEditorProps,
    TemplateTextEditor,
} from './TemplateTextEditor';
import { createTemporaryId } from '../../helpers/projection';
import { TemplateDto } from '../../interfaces/models/dtos/Season/Creation/TemplateDto';
import { EditTemplateDto } from '../../interfaces/models/dtos/Season/Creation/EditTemplateDto';

describe('TemplateTextEditor', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let update: TemplateDto | null;
    let valid: boolean | null;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        update = null;
        valid = null;
    });

    async function onUpdate(value: TemplateDto) {
        update = value;
    }
    async function setValid(value: boolean) {
        valid = value;
    }

    async function renderComponent(props: ITemplateTextEditorProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            <AdminContainer tables={[]} accounts={[]}>
                <TemplateTextEditor {...props} />
            </AdminContainer>,
        );
    }

    describe('interactivity', () => {
        it('renders empty template', async () => {
            await renderComponent({
                template: {
                    id: createTemporaryId(),
                    name: '',
                },
                onUpdate,
                setValid,
            });

            const textarea = context.required('textarea');
            expect(textarea.value()).toEqual('{}');
        });

        it('marks template as invalid when invalid json', async () => {
            await renderComponent({
                template: {
                    id: createTemporaryId(),
                    name: '',
                },
                onUpdate,
                setValid,
            });
            console.error = noop;

            await context.required('textarea').change('foo');

            expect(valid).toEqual(false);
            expect(update).toBeNull();
        });

        it('marks template as valid when json is valid again', async () => {
            await renderComponent({
                template: {
                    id: createTemporaryId(),
                    name: '',
                },
                onUpdate,
                setValid,
            });

            await context.required('textarea').change('foo');
            await context.required('textarea').change('{}');

            expect(valid).toEqual(true);
        });

        it('updates template when valid', async () => {
            await renderComponent({
                template: {
                    id: createTemporaryId(),
                    name: '',
                },
                onUpdate,
                setValid,
            });

            await context.required('textarea').change('foo');
            await context.required('textarea').change('{"a": "b"}');

            expect(valid).toEqual(true);
            expect(update).toEqual({
                id: expect.any(String),
                a: 'b',
                name: '',
            });
        });

        it('excludes non-editable properties', async () => {
            const template: EditTemplateDto = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                description: 'DESCRIPTION',
                updated: '2023-01-02',
                created: '2023-01-01',
                author: 'Simon',
                editor: 'Simon',
                templateHealth: {
                    checks: {},
                    success: true,
                    errors: [],
                    warnings: [],
                    messages: [],
                },
                sharedAddresses: [],
                divisions: [],
            };

            await renderComponent({
                template,
                onUpdate,
                setValid,
            });

            const editableTemplate = {
                sharedAddresses: [],
                divisions: [],
            };
            const textarea = context.required('textarea');
            expect(textarea.value()).toEqual(
                JSON.stringify(editableTemplate, null, '  '),
            );
        });

        it('does not transform single line excel whitespace input', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: [],
            };
            await renderComponent({
                template,
                onUpdate,
                setValid,
            });
            const input = '   ';

            await context
                .required('textarea[placeholder="Copy from excel"]')
                .change(input);

            const textareaOutput = context.required(
                'textarea[placeholder="Copy into template"]',
            );
            expect(textareaOutput.value()).toEqual('');
        });

        it('transforms single line excel fixture input correctly', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: [],
            };
            await renderComponent({
                template,
                onUpdate,
                setValid,
            });
            const input = 'A\tB\t\tC\t\D';

            await context
                .required('textarea[placeholder="Copy from excel"]')
                .change(input);

            const textareaOutput = context.required(
                'textarea[placeholder="Copy into template"]',
            );
            expect(JSON.parse(textareaOutput.value())).toEqual({
                fixtures: [
                    { home: 'A', away: 'B' },
                    { home: 'C', away: 'D' },
                ],
            });
        });

        it('transforms multi line excel fixture input correctly', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: [],
            };
            await renderComponent({
                template,
                onUpdate,
                setValid,
            });
            const input = 'A\tB\t\tC\t\D\n' + 'E\tF\t\tG\tH\n\n';

            await context
                .required('textarea[placeholder="Copy from excel"]')
                .change(input);

            const textareaOutput = context.required(
                'textarea[placeholder="Copy into template"]',
            );
            expect(JSON.parse('[' + textareaOutput.value() + ']')).toEqual([
                {
                    fixtures: [
                        { home: 'A', away: 'B' },
                        { home: 'C', away: 'D' },
                    ],
                },
                {
                    fixtures: [
                        { home: 'E', away: 'F' },
                        { home: 'G', away: 'H' },
                    ],
                },
            ]);
        });

        it('transforms single line excel bye fixture input correctly', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: [],
            };
            await renderComponent({
                template,
                onUpdate,
                setValid,
            });
            const input = 'A\t-\t\tC\t\D';

            await context
                .required('textarea[placeholder="Copy from excel"]')
                .change(input);

            const textareaOutput = context.required(
                'textarea[placeholder="Copy into template"]',
            );
            expect(JSON.parse(textareaOutput.value())).toEqual({
                fixtures: [{ home: 'A' }, { home: 'C', away: 'D' }],
            });
        });

        it('clears transformed output when input is cleared', async () => {
            const template = {
                id: createTemporaryId(),
                name: 'TEMPLATE',
                sharedAddresses: [],
                divisions: [],
            };
            await renderComponent({
                template,
                onUpdate,
                setValid,
            });
            const input = 'A\t-\t\tC\t\D';

            await context
                .required('textarea[placeholder="Copy from excel"]')
                .change(input);
            await context
                .required('textarea[placeholder="Copy from excel"]')
                .change('');

            const textareaOutput = context.required(
                'textarea[placeholder="Copy into template"]',
            );
            expect(textareaOutput.value()).toEqual('');
        });
    });
});
