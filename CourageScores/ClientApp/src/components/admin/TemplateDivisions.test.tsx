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
import {ITemplateDivisionsProps, TemplateDivisions} from "./TemplateDivisions";
import {DivisionTemplateDto} from "../../interfaces/models/dtos/Season/Creation/DivisionTemplateDto";

describe('TemplateDivisions', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let update: DivisionTemplateDto[];

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

    async function renderComponent(props: ITemplateDivisionsProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            (<AdminContainer accounts={[]} tables={[]}>
                <TemplateDivisions {...props} />
            </AdminContainer>));
    }

    describe('renders', () => {
        it('heading', async () => {
            await renderComponent({
                divisions: [],
                templateSharedAddresses: [],
                onUpdate,
            });

            const prefix = context.container.querySelector('ul li:first-child');
            expect(prefix.textContent).toEqual('Divisions');
        });

        it('when empty divisions', async () => {
            await renderComponent({
                divisions: [],
                templateSharedAddresses: [],
                onUpdate,
            });

            const divisionElements = Array.from(context.container.querySelectorAll('ul li'));
            expect(divisionElements.length).toEqual(1); // heading
        });

        it('existing divisions', async () => {
            await renderComponent({
                divisions: [{
                    dates: [],
                    sharedAddresses: [],
                }],
                templateSharedAddresses: [],
                onUpdate,
            });

            const divisionElement = context.container.querySelector('ul li:nth-child(2)');
            expect(divisionElement.textContent).toContain('Division 1 (click to collapse)');
        });
    });

    describe('interactivity', () => {
        it('can add a division', async () => {
            await renderComponent({
                divisions: [],
                templateSharedAddresses: [],
                onUpdate,
            });

            await doClick(findButton(context.container, '➕ Add another division'));

            expect(update).toEqual([{
                dates: [],
                sharedAddresses: [],
            }]);
        });

        it('can delete a division', async () => {
            await renderComponent({
                divisions: [{
                    dates: [],
                    sharedAddresses: [],
                }],
                templateSharedAddresses: [],
                onUpdate,
            });

            await doClick(findButton(context.container, '🗑️ Remove division'));

            expect(update).toEqual([]);
        });

        it('can update a division', async () => {
            await renderComponent({
                divisions: [{
                    dates: [],
                    sharedAddresses: [ [ 'A' ] ],
                }, {
                    dates: [],
                    sharedAddresses: [ [ 'B' ] ],
                }],
                templateSharedAddresses: [],
                onUpdate,
            });

            await doClick(findButton(context.container.querySelector('ul>li:nth-child(2)'), '➕ Add a week'));

            expect(update).toEqual([{
                dates: [{
                    fixtures: [],
                }],
                sharedAddresses: [ [ 'A' ] ],
            }, {
                dates: [],
                sharedAddresses: [ [ 'B' ] ],
            }]);
        });
    });
});