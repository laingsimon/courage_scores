import { AdminContainer } from './AdminContainer';
import {
    appProps,
    brandingProps,
    cleanUp,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { ISharedAddressesProps, SharedAddresses } from './SharedAddresses';

describe('SharedAddresses', () => {
    let context: TestContext;
    let updatedAddresses: string[][] | null;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        updatedAddresses = null;
    });

    async function onUpdate(addresses: string[][]) {
        updatedAddresses = addresses;
    }

    async function setHighlight(_?: string) {}

    async function renderComponent(props: ISharedAddressesProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            <AdminContainer tables={[]} accounts={[]}>
                <SharedAddresses {...props} />
            </AdminContainer>,
        );
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

            const heading = context.required(
                'ul li.list-group-item:first-child',
            );
            expect(heading.className()).toEqual(
                'list-group-item bg-warning text-light',
            );
        });

        it('with empty list of shared addresses', async () => {
            await renderComponent({
                addresses: [],
                className: 'bg-warning',
                onUpdate,
                highlight: '',
                setHighlight,
            });

            const items = context.all('ul li.list-group-item');
            expect(items.length).toEqual(1); // heading only
        });

        it('with list of shared addresses', async () => {
            await renderComponent({
                addresses: [['A']],
                className: 'bg-warning',
                onUpdate,
                highlight: '',
                setHighlight,
            });

            const items = context.all('ul li.list-group-item');
            items.shift(); // exclude the heading
            expect(items[0].text()).toContain('A ×');
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
            const addButton = context.button('➕ Add shared address');

            await addButton.click();

            expect(updatedAddresses).toEqual([[]]);
        });

        it('can delete shared address', async () => {
            await renderComponent({
                addresses: [[]],
                className: 'bg-warning',
                onUpdate,
                highlight: '',
                setHighlight,
            });

            await context.button('🗑️ Remove').click();

            expect(updatedAddresses).toEqual([]);
        });

        it('can update shared address', async () => {
            await renderComponent({
                addresses: [
                    ['A', 'B'],
                    ['C', 'D'],
                ],
                className: 'bg-warning',
                onUpdate,
                highlight: '',
                setHighlight,
            });

            await context.button('B ×').click();

            expect(updatedAddresses).toEqual([['A'], ['C', 'D']]);
        });

        it('can add suggested shared addresses', async () => {
            await renderComponent({
                addresses: [['A', 'B']],
                className: 'bg-warning',
                onUpdate,
                highlight: '',
                setHighlight,
                mnemonicsThatCanShareAddresses: [['C', 'D']],
            });

            await context
                .required('ul[datatype="shareable-addresses"] > li')
                .click();

            expect(updatedAddresses).toEqual([
                ['A', 'B'],
                ['C', 'D'],
            ]);
        });
    });
});
