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
import {ITemplateDivisionProps, TemplateDivision} from "./TemplateDivision";
import {DivisionTemplateDto} from "../../interfaces/models/dtos/Season/Creation/DivisionTemplateDto";

describe('TemplateDivision', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let update: DivisionTemplateDto;
    let deleted: boolean;
    let copyToDivisionIndex: number;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        update = null;
        deleted = null;
        copyToDivisionIndex = null;
    });

    async function onUpdate(value: DivisionTemplateDto) {
        update = value;
    }

    async function onDelete() {
        deleted = true;
    }

    async function onCopyToDivision(destinationDivisionIndex: number) {
        copyToDivisionIndex = destinationDivisionIndex;
    }

    async function renderComponent(props: ITemplateDivisionProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            (<AdminContainer accounts={[]} tables={[]}>
                <TemplateDivision {...props} />
            </AdminContainer>));
    }

    describe('renders', () => {
        it('division heading', async () => {
            await renderComponent({
                divisionNo: 1,
                division: {
                    sharedAddresses: [],
                    dates: [],
                },
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                divisionCount: 1,
                onCopyToDivision,
            });

            const heading = context.container.querySelector('h6');
            expect(heading.textContent).toEqual('⬆️ Division 1 (click to collapse)');
        });

        it('division shared addresses', async () => {
            await renderComponent({
                divisionNo: 1,
                division: {
                    sharedAddresses: [ [ 'A' ] ],
                    dates: [],
                },
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                divisionCount: 1,
                onCopyToDivision,
            });

            const divisionSharedAddresses = context.container.querySelector('div > ul:nth-child(2)');
            expect(divisionSharedAddresses.textContent).toContain('A ×');
        });

        it('dates', async () => {
            await renderComponent({
                divisionNo: 1,
                division: {
                    sharedAddresses: [],
                    dates: [{
                        fixtures: [{
                            home: 'A',
                            away: 'B',
                        }],
                    }],
                },
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                divisionCount: 1,
                onCopyToDivision,
            });

            const dates = context.container.querySelector('div > ul:nth-child(3)');
            expect(dates.textContent).toContain('A - B ×');
        });
    });

    describe('interactivity', () => {
        it('can expand division', async () => {
            await renderComponent({
                divisionNo: 1,
                division: {
                    sharedAddresses: [],
                    dates: [],
                },
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                divisionCount: 1,
                onCopyToDivision,
            });
            const heading = context.container.querySelector('h6');

            await doClick(heading);

            expect(heading.textContent).toEqual('⬇️ Division 1 (click to expand)');
        });

        it('can collapse division', async () => {
            await renderComponent({
                divisionNo: 1,
                division: {
                    sharedAddresses: [],
                    dates: [],
                },
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                divisionCount: 1,
                onCopyToDivision,
            });
            const heading = context.container.querySelector('h6');

            await doClick(heading);
            await doClick(heading);

            expect(heading.textContent).toEqual('⬆️ Division 1 (click to collapse)');
        });

        it('can update shared addresses', async () => {
            await renderComponent({
                divisionNo: 1,
                division: {
                    sharedAddresses: [],
                    dates: [],
                },
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                divisionCount: 1,
                onCopyToDivision,
            });

            await doClick(findButton(context.container, '➕ Add shared address'));

            expect(update).toEqual({
                sharedAddresses: [ [] ],
                dates: [],
            });
        });

        it('can update dates', async () => {
            await renderComponent({
                divisionNo: 1,
                division: {
                    sharedAddresses: [],
                    dates: [],
                },
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                divisionCount: 1,
                onCopyToDivision,
            });

            await doClick(findButton(context.container, '➕ Add a week'));

            expect(update).toEqual({
                sharedAddresses: [],
                dates: [{
                    fixtures: [],
                }],
            });
        });

        it('can remove division', async () => {
            await renderComponent({
                divisionNo: 1,
                division: {
                    sharedAddresses: [],
                    dates: [],
                },
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                divisionCount: 1,
                onCopyToDivision,
            });

            await doClick(findButton(context.container, '🗑️ Remove division'));

            expect(deleted).toEqual(true);
        });

        it('can copy details to another division', async () => {
            await renderComponent({
                divisionNo: 1,
                division: {
                    sharedAddresses: [],
                    dates: [{
                        fixtures: [{
                            home: 'A',
                            away: 'B',
                        }],
                    }],
                },
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                divisionCount: 2,
                onCopyToDivision,
            });

            await doClick(findButton(context.container, 'Copy to division 2'));

            expect(copyToDivisionIndex).toEqual(1);
        });
    });
});