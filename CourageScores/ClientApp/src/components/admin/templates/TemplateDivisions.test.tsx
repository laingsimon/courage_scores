import { AdminContainer } from '../AdminContainer.tsx';
import {
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    iocProps,
    renderApp,
    TestContext,
} from '../../../helpers/tests.tsx';
import {
    ITemplateDivisionsProps,
    TemplateDivisions,
} from './TemplateDivisions.tsx';
import { DivisionTemplateDto } from '../../../interfaces/models/dtos/Season/Creation/DivisionTemplateDto.ts';
import { NoteTemplateDto } from '../../../interfaces/models/dtos/Season/Creation/NoteTemplateDto';
import { createTemporaryId } from '../../../helpers/projection.ts';

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

    function formatNotes(context: TestContext, divisionNumber: number) {
        const division = context.required(
            `li[data-type="division"]:nth-child(${divisionNumber + 1})`,
        );

        return division
            .all('li')
            .filter((_, index) => index >= 2)
            .map((date) =>
                date
                    .all('span[data-type="notes"] button')
                    .map((note) => note.text().replaceAll(' ✏️', ''))
                    .filter((n) => n !== '➕')
                    .concat(
                        date
                            .all('span[data-type="note"]')
                            .map((n) => `_${n.text()}_`),
                    ),
            );
    }

    async function renderComponent(props: Partial<ITemplateDivisionsProps>) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            <AdminContainer accounts={[]} tables={[]}>
                <TemplateDivisions
                    {...{
                        divisions: [],
                        templateSharedAddresses: [],
                        onUpdate,
                        highlight: '',
                        setHighlight,
                        ...props,
                    }}
                />
            </AdminContainer>,
        );
    }

    describe('renders', () => {
        it('heading', async () => {
            await renderComponent({});

            const prefix = context.required('ul li:first-child');
            expect(prefix.text()).toEqual('Divisions');
        });

        it('when empty divisions', async () => {
            await renderComponent({});

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
            });

            const divisionElement = context.required('ul li:nth-child(2)');
            expect(divisionElement.text()).toContain(
                'Division 1 (click to collapse)',
            );
        });

        it('cross-divisional notes for the same date', async () => {
            const div1Note: NoteTemplateDto = {
                id: createTemporaryId(),
                note: 'DIV 1 NOTE',
                divisionNumber: 1,
            };
            const div1NoteXDivision: NoteTemplateDto = {
                id: createTemporaryId(),
                note: 'DIV 1 NOTE (x-divisional)',
            };
            const div2Note: NoteTemplateDto = {
                id: createTemporaryId(),
                note: 'DIV 2 NOTE',
                divisionNumber: 2,
            };
            const div2NoteXDivision: NoteTemplateDto = {
                id: createTemporaryId(),
                note: 'DIV 2 NOTE (x-divisional)',
            };
            const division1 = {
                dates: [{ notes: [div1Note, div1NoteXDivision] }, {}],
                sharedAddresses: [],
            };
            const division2 = {
                dates: [{ notes: [div2Note] }, { notes: [div2NoteXDivision] }],
                sharedAddresses: [],
            };
            await renderComponent({
                divisions: [division1, division2],
            });

            expect(formatNotes(context, 1)).toEqual([
                ['DIV 1 NOTE', 'DIV 1 NOTE (x-divisional)'],
                ['_DIV 2 NOTE (x-divisional)_'],
            ]);
            expect(formatNotes(context, 2)).toEqual([
                ['DIV 2 NOTE', '_DIV 1 NOTE (x-divisional)_'],
                ['DIV 2 NOTE (x-divisional)'],
            ]);
        });
    });

    describe('interactivity', () => {
        it('can add a division', async () => {
            await renderComponent({});

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
