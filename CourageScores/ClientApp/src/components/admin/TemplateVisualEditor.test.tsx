import { AdminContainer } from './AdminContainer';
import {
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import {
    ITemplateVisualEditorProps,
    TemplateVisualEditor,
} from './TemplateVisualEditor';
import { TemplateDto } from '../../interfaces/models/dtos/Season/Creation/TemplateDto';
import { createTemporaryId } from '../../helpers/projection';

describe('TemplateVisualEditor', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let update: TemplateDto | null;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        update = null;
    });

    async function onUpdate(value: TemplateDto) {
        update = value;
    }

    async function renderComponent(props: ITemplateVisualEditorProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            <AdminContainer accounts={[]} tables={[]}>
                <TemplateVisualEditor {...props} />
            </AdminContainer>,
        );
    }

    describe('renders', () => {
        it('empty template', async () => {
            await renderComponent({
                template: {
                    id: createTemporaryId(),
                    name: '',
                    sharedAddresses: [],
                    divisions: [],
                },
                onUpdate,
            });

            const sharedAddresses = context.required('div > ul:nth-child(1)');
            expect(sharedAddresses.all('li').length).toEqual(1); // heading, no addresses
            const divisions = context.required('div > ul:nth-child(2)');
            expect(divisions.all('li').length).toEqual(1); //heading, no divisions
        });

        it('template shared addresses', async () => {
            await renderComponent({
                template: {
                    id: createTemporaryId(),
                    name: '',
                    sharedAddresses: [['A']],
                    divisions: [],
                },
                onUpdate,
            });

            const sharedAddresses = context.required('div > ul:nth-child(1)');
            expect(sharedAddresses.text()).toContain('A ×');
        });

        it('template divisions', async () => {
            await renderComponent({
                template: {
                    id: createTemporaryId(),
                    name: '',
                    sharedAddresses: [],
                    divisions: [
                        {
                            sharedAddresses: [['B']],
                            dates: [],
                        },
                    ],
                },
                onUpdate,
            });

            const divisions = context.required('div > ul:nth-child(2)');
            expect(divisions.text()).toContain('B ×');
        });
    });

    describe('interactivity', () => {
        it('can update template shared addresses', async () => {
            await renderComponent({
                template: {
                    id: createTemporaryId(),
                    name: '',
                    sharedAddresses: [],
                    divisions: [],
                },
                onUpdate,
            });
            const sharedAddresses = context.required('div > ul:nth-child(1)');

            await sharedAddresses.button('➕ Add shared address').click();

            expect(update).toEqual({
                id: expect.any(String),
                name: '',
                sharedAddresses: [[]],
                divisions: [],
            });
        });

        it('can update divisions', async () => {
            await renderComponent({
                template: {
                    id: createTemporaryId(),
                    name: '',
                    sharedAddresses: [],
                    divisions: [],
                },
                onUpdate,
            });
            const divisions = context.required('div > ul:nth-child(2)');

            await divisions.button('➕ Add another division').click();

            expect(update).toEqual({
                id: expect.any(String),
                sharedAddresses: [],
                name: '',
                divisions: [
                    {
                        dates: [],
                        sharedAddresses: [],
                    },
                ],
            });
        });
    });
});
