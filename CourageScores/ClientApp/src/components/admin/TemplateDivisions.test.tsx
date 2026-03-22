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
    ITemplateDivisionsProps,
    TemplateDivisions,
} from './TemplateDivisions';
import { DivisionTemplateDto } from '../../interfaces/models/dtos/Season/Creation/DivisionTemplateDto';

describe('TemplateDivisions', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let update: DivisionTemplateDto[] | null;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        update = null;
    });

    async function onUpdate(value: DivisionTemplateDto[]) {
        update = value;
    }

    async function setHighlight(_?: string) {}

    async function renderComponent(props: ITemplateDivisionsProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            <AdminContainer accounts={[]} tables={[]}>
                <TemplateDivisions {...props} />
            </AdminContainer>,
        );
    }

    describe('renders', () => {
        it('heading', async () => {
            await renderComponent({
                divisions: [],
                templateSharedAddresses: [],
                onUpdate,
                highlight: '',
                setHighlight,
            });

            const prefix = context.required('ul li:first-child');
            expect(prefix.text()).toEqual('Divisions');
        });

        it('when empty divisions', async () => {
            await renderComponent({
                divisions: [],
                templateSharedAddresses: [],
                onUpdate,
                highlight: '',
                setHighlight,
            });

            const divisionElements = context.all('ul li');
            expect(divisionElements.length).toEqual(1); // heading
        });

        it('existing divisions', async () => {
            await renderComponent({
                divisions: [
                    {
                        dates: [],
                        sharedAddresses: [],
                    },
                ],
                templateSharedAddresses: [],
                onUpdate,
                highlight: '',
                setHighlight,
            });

            const divisionElement = context.required('ul li:nth-child(2)');
            expect(divisionElement.text()).toContain(
                'Division 1 (click to collapse)',
            );
        });
    });

    describe('interactivity', () => {
        it('can add a division', async () => {
            await renderComponent({
                divisions: [],
                templateSharedAddresses: [],
                onUpdate,
                highlight: '',
                setHighlight,
            });

            await context.button('➕ Add another division').click();

            expect(update).toEqual([
                {
                    dates: [],
                    sharedAddresses: [],
                },
            ]);
        });

        it('can delete a division', async () => {
            await renderComponent({
                divisions: [
                    {
                        dates: [],
                        sharedAddresses: [],
                    },
                ],
                templateSharedAddresses: [],
                onUpdate,
                highlight: '',
                setHighlight,
            });

            await context.button('🗑️ Remove division').click();

            expect(update).toEqual([]);
        });

        it('can update a division', async () => {
            await renderComponent({
                divisions: [
                    {
                        dates: [],
                        sharedAddresses: [['A']],
                    },
                    {
                        dates: [],
                        sharedAddresses: [['B']],
                    },
                ],
                templateSharedAddresses: [],
                onUpdate,
                highlight: '',
                setHighlight,
            });

            await context
                .required('ul>li:nth-child(2)')
                .button('➕ Add a week')
                .click();

            expect(update).toEqual([
                {
                    dates: [
                        {
                            fixtures: [],
                        },
                    ],
                    sharedAddresses: [['A']],
                },
                {
                    dates: [],
                    sharedAddresses: [['B']],
                },
            ]);
        });

        it('can copy details between templates', async () => {
            await renderComponent({
                divisions: [
                    {
                        dates: [
                            {
                                fixtures: [{ home: 'A', away: 'B' }],
                            },
                        ],
                        sharedAddresses: [['A']],
                    },
                    {
                        dates: [
                            {
                                fixtures: [{ home: 'C', away: 'D' }],
                            },
                        ],
                        sharedAddresses: [['B']],
                    },
                ],
                templateSharedAddresses: [],
                onUpdate,
                highlight: '',
                setHighlight,
            });

            await context.button('Copy to division 2').click();

            expect(update).toEqual([
                {
                    dates: [
                        {
                            fixtures: [{ home: 'A', away: 'B' }],
                        },
                    ],
                    sharedAddresses: [['A']],
                },
                {
                    dates: [
                        {
                            fixtures: [{ home: '2A', away: '2B' }],
                        },
                    ],
                    sharedAddresses: [['2A']],
                },
            ]);
        });
    });
});
