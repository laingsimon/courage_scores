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
import { ITemplateDatesProps, TemplateDates } from './TemplateDates';
import { DateTemplateDto } from '../../interfaces/models/dtos/Season/Creation/DateTemplateDto';

describe('TemplateDates', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let update: DateTemplateDto[] | null;
    let copyToDivisionIndex: number | null;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        update = null;
        copyToDivisionIndex = null;
    });

    async function onUpdate(value: DateTemplateDto[]) {
        update = value;
    }

    async function onCopyToDivision(destinationDivisionIndex: number) {
        copyToDivisionIndex = destinationDivisionIndex;
    }

    async function setHighlight(_?: string) {}

    async function renderComponent(props: ITemplateDatesProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            <AdminContainer accounts={[]} tables={[]}>
                <TemplateDates {...props} />
            </AdminContainer>,
        );
    }

    describe('renders', () => {
        it('heading', async () => {
            await renderComponent({
                dates: [
                    {
                        fixtures: [],
                    },
                ],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                divisionCount: 1,
                divisionNo: 1,
                onCopyToDivision,
                highlight: '',
                setHighlight,
            });

            const prefix = context.required('ul li:first-child');
            expect(prefix.text()).toEqual(
                'WeeksLeague fixtures (or byes) per-week',
            );
        });

        it('no copy button when only division', async () => {
            await renderComponent({
                dates: [
                    {
                        fixtures: [],
                    },
                ],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                divisionCount: 1,
                divisionNo: 1,
                onCopyToDivision,
                highlight: '',
                setHighlight,
            });

            const prefix = context.required('ul li:first-child');
            expect(prefix.all('button')).toEqual([]);
        });

        it('no copy button when no dates', async () => {
            await renderComponent({
                dates: [],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                divisionCount: 3,
                divisionNo: 2,
                onCopyToDivision,
                highlight: '',
                setHighlight,
            });

            const prefix = context.required('ul li:first-child');
            expect(prefix.all('button')).toEqual([]);
        });

        it('copy buttons for other divisions', async () => {
            await renderComponent({
                dates: [
                    {
                        fixtures: [],
                    },
                ],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                divisionCount: 3,
                divisionNo: 2,
                onCopyToDivision,
                highlight: '',
                setHighlight,
            });

            const prefix = context.required('ul li:first-child');
            const copyButtons = prefix.all('button');
            expect(copyButtons.map((b) => b.text())).toEqual([
                'Copy to division 1',
                'Copy to division 3',
            ]);
        });

        it('when empty dates', async () => {
            await renderComponent({
                dates: [],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                divisionCount: 1,
                divisionNo: 1,
                onCopyToDivision,
                highlight: '',
                setHighlight,
            });

            const dateElements = context.all('ul li');
            expect(dateElements.length).toEqual(1); // heading
        });

        it('existing dates', async () => {
            await renderComponent({
                dates: [
                    {
                        fixtures: [
                            {
                                home: 'A',
                                away: 'B',
                            },
                        ],
                    },
                ],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                divisionCount: 1,
                divisionNo: 1,
                onCopyToDivision,
                highlight: '',
                setHighlight,
            });

            const dateElement = context.required('ul li:nth-child(2)');
            expect(dateElement.text()).toContain('A - B ×');
        });
    });

    describe('interactivity', () => {
        it('can add a date/week', async () => {
            await renderComponent({
                dates: [],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                divisionCount: 1,
                divisionNo: 1,
                onCopyToDivision,
                highlight: '',
                setHighlight,
            });

            await context.button('➕ Add a week').click();

            expect(update).toEqual([
                {
                    fixtures: [],
                },
            ]);
        });

        it('can delete a date/week', async () => {
            await renderComponent({
                dates: [
                    {
                        fixtures: [
                            {
                                home: 'A',
                                away: 'B',
                            },
                        ],
                    },
                ],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                divisionCount: 1,
                divisionNo: 1,
                onCopyToDivision,
                highlight: '',
                setHighlight,
            });

            await context.button('🗑️').click();

            expect(update).toEqual([]);
        });

        it('can move a date earlier', async () => {
            await renderComponent({
                dates: [
                    {
                        fixtures: [
                            {
                                home: 'A',
                                away: 'B',
                            },
                        ],
                    },
                    {
                        fixtures: [
                            {
                                home: 'C',
                                away: 'D',
                            },
                        ],
                    },
                ],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                divisionCount: 1,
                divisionNo: 1,
                onCopyToDivision,
                highlight: '',
                setHighlight,
            });
            const secondDate = context.required(
                '.list-group-item:nth-child(3)',
            );

            await secondDate.button('⬆').click();

            expect(update).toEqual([
                {
                    fixtures: [
                        {
                            home: 'C',
                            away: 'D',
                        },
                    ],
                },
                {
                    fixtures: [
                        {
                            home: 'A',
                            away: 'B',
                        },
                    ],
                },
            ]);
        });

        it('can move a date later', async () => {
            await renderComponent({
                dates: [
                    {
                        fixtures: [
                            {
                                home: 'A',
                                away: 'B',
                            },
                        ],
                    },
                    {
                        fixtures: [
                            {
                                home: 'C',
                                away: 'D',
                            },
                        ],
                    },
                ],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                divisionCount: 1,
                divisionNo: 1,
                onCopyToDivision,
                highlight: '',
                setHighlight,
            });
            const firstDate = context.required('.list-group-item:nth-child(2)');

            await firstDate.button('⬇').click();

            expect(update).toEqual([
                {
                    fixtures: [
                        {
                            home: 'C',
                            away: 'D',
                        },
                    ],
                },
                {
                    fixtures: [
                        {
                            home: 'A',
                            away: 'B',
                        },
                    ],
                },
            ]);
        });

        it('can update a date/week', async () => {
            await renderComponent({
                dates: [
                    {
                        fixtures: [
                            {
                                home: 'A',
                                away: 'B',
                            },
                        ],
                    },
                    {
                        fixtures: [
                            {
                                home: 'C',
                                away: 'D',
                            },
                        ],
                    },
                ],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                divisionCount: 1,
                divisionNo: 1,
                onCopyToDivision,
                highlight: '',
                setHighlight,
            });

            await context.button('A - B ×').click();

            expect(update).toEqual([
                {
                    fixtures: [],
                },
                {
                    fixtures: [
                        {
                            home: 'C',
                            away: 'D',
                        },
                    ],
                },
            ]);
        });

        it('can copy to another division', async () => {
            await renderComponent({
                dates: [
                    {
                        fixtures: [
                            {
                                home: 'A',
                                away: 'B',
                            },
                        ],
                    },
                    {
                        fixtures: [
                            {
                                home: 'C',
                                away: 'D',
                            },
                        ],
                    },
                ],
                divisionSharedAddresses: ['A', 'C'],
                templateSharedAddresses: [],
                onUpdate,
                divisionCount: 2,
                divisionNo: 1,
                onCopyToDivision,
                highlight: '',
                setHighlight,
            });

            await context.button('Copy to division 2').click();

            expect(copyToDivisionIndex).toEqual(1);
        });

        it('can delete all fixtures for a given mnemonic', async () => {
            await renderComponent({
                dates: [
                    {
                        fixtures: [
                            {
                                home: 'A',
                                away: 'C',
                            },
                            {
                                home: 'A',
                                away: 'B',
                            },
                        ],
                    },
                    {
                        fixtures: [
                            {
                                home: 'C',
                                away: 'D',
                            },
                            {
                                home: 'B',
                                away: 'A',
                            },
                        ],
                    },
                ],
                divisionSharedAddresses: ['A', 'C'],
                templateSharedAddresses: [],
                onUpdate,
                divisionCount: 2,
                divisionNo: 1,
                onCopyToDivision,
                highlight: 'C',
                setHighlight,
            });
            context.prompts.respondToConfirm(
                'Are you sure you want to delete all fixtures where C are playing?',
                true,
            );

            await context.button('A - C ×').click();

            expect(update).toEqual([
                {
                    fixtures: [
                        {
                            home: 'A',
                            away: 'B',
                        },
                    ],
                },
                {
                    fixtures: [
                        {
                            home: 'B',
                            away: 'A',
                        },
                    ],
                },
            ]);
        });
    });
});
