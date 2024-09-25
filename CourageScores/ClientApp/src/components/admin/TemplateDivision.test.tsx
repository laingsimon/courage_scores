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
import {FixtureTemplateDto} from "../../interfaces/models/dtos/Season/Creation/FixtureTemplateDto";
import {DateTemplateDto} from "../../interfaces/models/dtos/Season/Creation/DateTemplateDto";

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

    async function setHighlight(_?: string) {
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
                highlight: '',
                setHighlight,
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
                highlight: '',
                setHighlight,
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
                highlight: '',
                setHighlight,
            });

            const dates = context.container.querySelector('div > ul:nth-child(3)');
            expect(dates.textContent).toContain('A - B ×');
        });

        it('sharable addresses', async () => {
            function fixture(spec: string): FixtureTemplateDto {
                const home: string = spec.split('v')[0];
                const away: string = spec.split('v')[1];
                return { home, away };
            }

            function fixtures(...specs: string[]): DateTemplateDto {
                return {
                    fixtures: specs.map(fixture),
                };
            }

            await renderComponent({
                divisionNo: 1,
                division: {
                    sharedAddresses: [],
                    dates: [
                        fixtures('1v8', '2v7', '3v6', '4v5'),
                        fixtures('8v5', '6v4', '7v3', '1v2'),
                        fixtures('2v8', '3v1', '4v7', '5v6'),
                        fixtures('8v6', '7v5', '1v4', '2v3'),
                        fixtures('3v8', '4v2', '5v1', '6v7'),
                        fixtures('8v7', '1v6', '2v5', '3v4'),
                        fixtures('4v8', '5v3', '6v2', '7v1'),
                    ],
                },
                templateSharedAddresses: [],
                onUpdate,
                onDelete,
                divisionCount: 1,
                onCopyToDivision,
                highlight: '',
                setHighlight,
            });

            const sharableAddresses: Element[] = Array.from(context.container.querySelectorAll('ul[datatype="shareable-addresses"] > li'));
            expect(sharableAddresses.map(d => d.textContent)).toEqual([ '1,5', '2,6', '3,7', '4,8' ]);
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
                highlight: '',
                setHighlight,
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
                highlight: '',
                setHighlight,
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
                highlight: '',
                setHighlight,
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
                highlight: '',
                setHighlight,
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
                highlight: '',
                setHighlight,
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
                highlight: '',
                setHighlight,
            });

            await doClick(findButton(context.container, 'Copy to division 2'));

            expect(copyToDivisionIndex).toEqual(1);
        });
    });
});