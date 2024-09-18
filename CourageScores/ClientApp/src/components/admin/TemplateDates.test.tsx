import {AdminContainer} from "./AdminContainer";
import {
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    ErrorState,
    findButton,
    iocProps,
    renderApp, TestContext
} from "../../helpers/tests";
import {ITemplateDatesProps, TemplateDates} from "./TemplateDates";
import {DateTemplateDto} from "../../interfaces/models/dtos/Season/Creation/DateTemplateDto";

describe('TemplateDates', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let update: DateTemplateDto[];
    let copyToDivisionIndex: number;

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

    async function renderComponent(props: ITemplateDatesProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            (<AdminContainer accounts={[]} tables={[]}>
                <TemplateDates {...props} />
            </AdminContainer>));
    }

    describe('renders', () => {
        it('heading', async () => {
            await renderComponent({
                dates: [{
                    fixtures: []
                }],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                divisionCount: 1,
                divisionNo: 1,
                onCopyToDivision,
            });

            const prefix = context.container.querySelector('ul li:first-child');
            expect(prefix.textContent).toEqual('WeeksLeague fixtures (or byes) per-week');
        });

        it('no copy button when only division', async () => {
            await renderComponent({
                dates: [{
                    fixtures: []
                }],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                divisionCount: 1,
                divisionNo: 1,
                onCopyToDivision,
            });

            const prefix = context.container.querySelector('ul li:first-child');
            expect(Array.from(prefix.querySelectorAll('button'))).toEqual([]);
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
            });

            const prefix = context.container.querySelector('ul li:first-child');
            expect(Array.from(prefix.querySelectorAll('button'))).toEqual([]);
        });

        it('copy buttons for other divisions', async () => {
            await renderComponent({
                dates: [{
                    fixtures: []
                }],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                divisionCount: 3,
                divisionNo: 2,
                onCopyToDivision,
            });

            const prefix = context.container.querySelector('ul li:first-child');
            const copyButtons = Array.from(prefix.querySelectorAll('button'));
            expect(copyButtons.map(b => b.textContent)).toEqual([ 'Copy to division 1', 'Copy to division 3' ]);
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
            });

            const dateElements = Array.from(context.container.querySelectorAll('ul li')) as HTMLElement[];
            expect(dateElements.length).toEqual(1); // heading
        });

        it('existing dates', async () => {
            await renderComponent({
                dates: [{
                    fixtures: [{
                        home: 'A',
                        away: 'B',
                    }]
                }],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                divisionCount: 1,
                divisionNo: 1,
                onCopyToDivision,
            });

            const dateElement = context.container.querySelector('ul li:nth-child(2)');
            expect(dateElement.textContent).toContain('A - B ×');
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
            });

            await doClick(findButton(context.container, '➕ Add a week'));

            expect(update).toEqual([{
                fixtures: [],
            }]);
        });

        it('can delete a date/week', async () => {
            await renderComponent({
                dates: [{
                    fixtures: [{
                        home: 'A',
                        away: 'B',
                    }]
                }],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                divisionCount: 1,
                divisionNo: 1,
                onCopyToDivision,
            });

            await doClick(findButton(context.container, '🗑️'));

            expect(update).toEqual([]);
        });

        it('can move a date earlier', async () => {
            await renderComponent({
                dates: [{
                    fixtures: [{
                        home: 'A',
                        away: 'B',
                    }]
                }, {
                    fixtures: [{
                        home: 'C',
                        away: 'D',
                    }]
                }],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                divisionCount: 1,
                divisionNo: 1,
                onCopyToDivision,
            });
            const secondDate = context.container.querySelector('.list-group-item:nth-child(3)');

            await doClick(findButton(secondDate, '⬆'));

            expect(update).toEqual([{
                fixtures: [{
                    home: 'C',
                    away: 'D',
                }]
            }, {
                fixtures: [{
                    home: 'A',
                    away: 'B',
                }]
            }]);
        });

        it('can move a date later', async () => {
            await renderComponent({
                dates: [{
                    fixtures: [{
                        home: 'A',
                        away: 'B',
                    }]
                }, {
                    fixtures: [{
                        home: 'C',
                        away: 'D',
                    }]
                }],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                divisionCount: 1,
                divisionNo: 1,
                onCopyToDivision,
            });
            const firstDate = context.container.querySelector('.list-group-item:nth-child(2)');

            await doClick(findButton(firstDate, '⬇'));

            expect(update).toEqual([{
                fixtures: [{
                    home: 'C',
                    away: 'D',
                }]
            }, {
                fixtures: [{
                    home: 'A',
                    away: 'B',
                }]
            }]);
        });

        it('can update a date/week', async () => {
            await renderComponent({
                dates: [{
                    fixtures: [{
                        home: 'A',
                        away: 'B',
                    }]
                }, {
                    fixtures: [{
                        home: 'C',
                        away: 'D',
                    }]
                }],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
                onUpdate,
                divisionCount: 1,
                divisionNo: 1,
                onCopyToDivision,
            });

            await doClick(findButton(context.container, 'A - B ×'));

            expect(update).toEqual([{
                fixtures: []
            }, {
                fixtures: [{
                    home: 'C',
                    away: 'D',
                }]
            }]);
        });

        it('can copy to another division', async () => {
            await renderComponent({
                dates: [{
                    fixtures: [{
                        home: 'A',
                        away: 'B',
                    }]
                }, {
                    fixtures: [{
                        home: 'C',
                        away: 'D',
                    }]
                }],
                divisionSharedAddresses: [ 'A', 'C' ],
                templateSharedAddresses: [],
                onUpdate,
                divisionCount: 2,
                divisionNo: 1,
                onCopyToDivision,
            });

            await doClick(findButton(context.container, 'Copy to division 2'));

            expect(copyToDivisionIndex).toEqual(1);
        });
    });
});