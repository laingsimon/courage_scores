import {AdminContainer} from "./AdminContainer";
import {
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {ISharedAddressesProps, SharedAddresses} from "./SharedAddresses";

describe('SharedAddresses', () => {
    let context: TestContext;
    let updatedAddresses: string[][];

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        updatedAddresses = null;
    });

    async function onUpdate(addresses: string[][]) {
        updatedAddresses = addresses;
    }

    async function setHighlight(_?: string) {
    }

    async function renderComponent(props: ISharedAddressesProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            (<AdminContainer tables={[]} accounts={[]}>
                <SharedAddresses {...props} />
            </AdminContainer>));
    }

    describe('renders', () => {
        it('with correct class name', async () => {
            await renderComponent({
                addresses: [],
                className: 'bg-warning',
                onUpdate,
                highlight: '',
                setHighlight,
            });

            const heading = context.container.querySelector('ul li.list-group-item:first-child');
            expect(heading.className).toEqual('list-group-item bg-warning text-light');
        });

        it('with empty list of shared addresses', async () => {
            await renderComponent({
                addresses: [],
                className: 'bg-warning',
                onUpdate,
                highlight: '',
                setHighlight,
            });

            const items = Array.from(context.container.querySelectorAll('ul li.list-group-item')) as HTMLElement[];
            expect(items.length).toEqual(1); // heading only
        });

        it('with list of shared addresses', async () => {
            await renderComponent({
                addresses: [ [ 'A' ] ],
                className: 'bg-warning',
                onUpdate,
                highlight: '',
                setHighlight,
            });

            const items = Array.from(context.container.querySelectorAll('ul li.list-group-item')) as HTMLElement[];
            items.shift(); // exclude the heading
            expect(items[0].textContent).toContain('A ×');
        });
    });

    describe('interactivity', () => {
        it('can add shared address', async () => {
            await renderComponent({
                addresses: [],
                className: 'bg-warning',
                onUpdate,
                highlight: '',
                setHighlight,
            });
            const addButton = findButton(context.container, '➕ Add shared address');
            expect(addButton).toBeTruthy();

            await doClick(addButton);

            expect(updatedAddresses).toEqual([ [] ]);
        });

        it('can delete shared address', async () => {
            await renderComponent({
                addresses: [ [] ],
                className: 'bg-warning',
                onUpdate,
                highlight: '',
                setHighlight,
            });

            await doClick(findButton(context.container, '🗑️ Remove'));

            expect(updatedAddresses).toEqual([ ]);
        });

        it('can update shared address', async () => {
            await renderComponent({
                addresses: [ [ 'A', 'B' ], [ 'C', 'D' ] ],
                className: 'bg-warning',
                onUpdate,
                highlight: '',
                setHighlight,
            });

            await doClick(findButton(context.container, 'B ×'));

            expect(updatedAddresses).toEqual([ [ 'A' ], [ 'C', 'D' ] ]);
        });
    });
});