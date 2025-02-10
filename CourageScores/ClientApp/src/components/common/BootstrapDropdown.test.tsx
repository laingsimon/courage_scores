import {appProps, brandingProps, cleanUp, doClick, iocProps, renderApp, TestContext} from "../../helpers/tests";
import {BootstrapDropdown, IBootstrapDropdownItem, IBootstrapDropdownProps} from "./BootstrapDropdown";
import {toDictionary} from "../../helpers/collections";

describe('BootstrapDropdown', () => {
    let context: TestContext;

    afterEach(async () => {
        await cleanUp(context);
    });

    async function renderComponent(props: IBootstrapDropdownProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            (<BootstrapDropdown {...props} />));
    }

    describe('renders', () => {
        const option1: IBootstrapDropdownItem = { text: 'TEXT 1', value: 'VALUE 1' };
        const option2: IBootstrapDropdownItem = { text: 'TEXT 2', value: 'VALUE 2' };

        it('when disabled and nothing selected', async () => {
            await renderComponent({
                options: [ option1, option2 ],
                disabled: true,
            });

            const button = context.container.querySelector('button')!;
            expect(button.disabled).toEqual(true);
            expect(button.className).toContain('dropdown-toggle');
            expect(button.textContent).toEqual('');
        });

        it('when disabled and something selected', async () => {
            await renderComponent({
                value: option2.value,
                options: [ option1, option2 ],
                disabled: true,
            });

            const button = context.container.querySelector('button')!;
            expect(button.disabled).toEqual(true);
            expect(button.className).toContain('dropdown-toggle');
            expect(button.textContent).toEqual(option2.text);
        });

        it('when disabled and something selected with collapsed text', async () => {
            const option3_collapsedText: IBootstrapDropdownItem = {
                value: 'VALUE 3',
                text: 'TEXT 3',
                collapsedText: '3',
            };
            await renderComponent({
                value: option3_collapsedText.value,
                options: [ option1, option2, option3_collapsedText ],
                disabled: true,
            });

            const button = context.container.querySelector('button')!;
            expect(button.disabled).toEqual(true);
            expect(button.className).toContain('dropdown-toggle');
            expect(button.textContent).toEqual(option3_collapsedText.collapsedText);
        });

        it('when options is null', async () => {
            await renderComponent({});

            const button = context.container.querySelector('button')!;
            expect(button.disabled).toEqual(true);
            expect(button.className).toContain('dropdown-toggle');
            expect(button.innerHTML).toEqual('&nbsp;');
        });

        it('when options is empty', async () => {
            await renderComponent({
                options: [],
            });

            const button = context.container.querySelector('button')!;
            expect(button.disabled).toEqual(true);
            expect(button.className).toContain('dropdown-toggle');
            expect(button.innerHTML).toEqual('&nbsp;');
        });

        it('with given className', async () => {
            await renderComponent({
                value: option2.value,
                options: [ option1, option2 ],
                className: 'some-class-name',
            });

            const buttonGroup = context.container.querySelector('div')!;
            expect(buttonGroup.className).toContain('some-class-name');
        });

        it('when no className provided', async () => {
            await renderComponent({
                value: option2.value,
                options: [ option1, option2 ],
            });

            const buttonGroup = context.container.querySelector('div')!;
            expect(buttonGroup.className).toEqual('btn-group');
        });

        it('when given a color', async () => {
            await renderComponent({
                value: option2.value,
                options: [ option1, option2 ],
                color: 'warning',
            });

            const toggle = context.container.querySelector('.dropdown-toggle')!;
            expect(toggle.className).toContain('btn-warning');
        });

        it('when no color provided', async () => {
            await renderComponent({
                value: option2.value,
                options: [ option1, option2 ],
            });

            const toggle = context.container.querySelector('.dropdown-toggle')!;
            expect(toggle.className).toContain('btn-outline-light');
        });

        it('when item selected', async () => {
            await renderComponent({
                value: option2.value,
                options: [ option1, option2 ],
            });

            const toggle = context.container.querySelector('.dropdown-toggle')!;
            const items = Array.from(context.container.querySelectorAll('.dropdown-item'));
            expect(toggle.textContent).toEqual(option2.text);
            const itemClassNameLookup = toDictionary(items, item => item.textContent!, item => item.className);
            expect(Object.keys(itemClassNameLookup)).toEqual([option1.text, option2.text]);
            expect(itemClassNameLookup[option1.text]).not.toContain('active');
            expect(itemClassNameLookup[option2.text]).toContain('active');
        });

        it('when item selected has no text', async () => {
            const option3_noText: IBootstrapDropdownItem = {
                value: 'VALUE 3',
            };
            await renderComponent({
                value: option3_noText.value,
                options: [ option1, option2, option3_noText ],
            });

            const toggle = context.container.querySelector('.dropdown-toggle')!;
            const items = Array.from(context.container.querySelectorAll('.dropdown-item'));
            expect(toggle.textContent).toEqual(option3_noText.value);
            const itemClassNameLookup = toDictionary(items, item => item.textContent!, item => item.className);
            expect(itemClassNameLookup[option1.text]).not.toContain('active');
            expect(itemClassNameLookup[option2.text]).not.toContain('active');
            expect(itemClassNameLookup[option3_noText.value]).toContain('active');
        });

        it('when nothing selected', async () => {
            await renderComponent({
                options: [ option1, option2 ],
            });

            const toggle = context.container.querySelector('.dropdown-toggle')!;
            const items = Array.from(context.container.querySelectorAll('.dropdown-item'));
            expect(toggle.textContent).toEqual('');
            const itemClassNameLookup = toDictionary(items, item => item.textContent!, item => item.className);
            expect(itemClassNameLookup[option1.text]).not.toContain('active');
            expect(itemClassNameLookup[option2.text]).not.toContain('active');
        });

        it('slim dropdown', async () => {
            await renderComponent({
                options: [ option1, option2 ],
                slim: true,
            });

            const toggle = context.container.querySelector('.dropdown-toggle > span')!;
            expect(toggle.className).not.toContain('dropdown-text-min-width');
        });

        it('not-slim dropdown', async () => {
            await renderComponent({
                options: [ option1, option2 ],
            });

            const toggle = context.container.querySelector('.dropdown-toggle > span')!;
            expect(toggle.className).toContain('dropdown-text-min-width');
        });

        it('with collapsed text', async () => {
            const option3_collapsedText: IBootstrapDropdownItem = {
                value: 'VALUE 3',
                text: 'TEXT 3',
                collapsedText: '3',
            };
            await renderComponent({
                value: option3_collapsedText.value,
                options: [ option1, option2, option3_collapsedText ],
            });

            const toggle = context.container.querySelector('.dropdown-toggle')!;
            const items = Array.from(context.container.querySelectorAll('.dropdown-item'));
            expect(toggle.textContent).toEqual(option3_collapsedText.collapsedText);
            const itemTextLookup = toDictionary(items, item => item.textContent!, item => item.textContent);
            expect(itemTextLookup[option1.text]).toEqual('TEXT 1');
            expect(itemTextLookup[option2.text]).toEqual('TEXT 2');
            expect(itemTextLookup[option3_collapsedText.text]).toEqual('TEXT 3');
        });
    });

    describe('interactivity', () => {
        const option1: IBootstrapDropdownItem = { text: 'TEXT 1', value: 'VALUE 1' };
        const option2: IBootstrapDropdownItem = { text: 'TEXT 2', value: 'VALUE 2' };

        it('when read only cannot open drop down', async () => {
            await renderComponent({
                options: [ option1, option2 ],
                readOnly: true,
            });

            await doClick(context.container, '.dropdown-toggle');

            const buttonGroup = context.container.querySelector('div.btn-group')!;
            expect(buttonGroup.className).not.toContain('show');
        });

        it('can open drop down', async () => {
            await renderComponent({
                options: [ option1, option2 ],
            });

            await doClick(context.container, '.dropdown-toggle');

            const buttonGroup = context.container.querySelector('div.btn-group')!;
            expect(buttonGroup.className).toContain('show');
        });

        it('can close drop down', async () => {
            await renderComponent({
                options: [ option1, option2 ],
            });

            await doClick(context.container, '.dropdown-toggle');
            await doClick(context.container, '.dropdown-toggle');

            const buttonGroup = context.container.querySelector('div.btn-group')!;
            expect(buttonGroup.className).not.toContain('show');
        });

        it('can select an item', async () => {
            let selected: string | undefined;
            await renderComponent({
                options: [ option1, option2 ],
                onChange: async (value: string) => selected = value,
            });

            await doClick(context.container, '.dropdown-toggle');
            await doClick(context.container, '.dropdown-item:first-child');

            const buttonGroup = context.container.querySelector('div.btn-group')!;
            expect(buttonGroup.className).not.toContain('show'); // closes the dropdown
            expect(selected).toEqual(option1.value);
        });

        it('can change a selection', async () => {
            let selected = option2.value;
            await renderComponent({
                value: selected,
                options: [ option1, option2 ],
                onChange: async (value: string) => selected = value,
            });

            await doClick(context.container, '.dropdown-toggle');
            await doClick(context.container, '.dropdown-item:first-child');

            const buttonGroup = context.container.querySelector('div.btn-group')!;
            expect(buttonGroup.className).not.toContain('show'); // closes the dropdown
            expect(selected).toEqual(option1.value);
        });

        it('can change a selection when no handler', async () => {
            await renderComponent({
                value: option2.value,
                options: [ option1, option2 ],
            });

            await doClick(context.container, '.dropdown-toggle');
            await doClick(context.container, '.dropdown-item:first-child');

            const buttonGroup = context.container.querySelector('div.btn-group')!;
            expect(buttonGroup.className).not.toContain('show'); // closes the dropdown
        });

        it('triggers onOpen callback when dropdown opened', async () => {
            let callbacks: boolean[] = [];
            await renderComponent({
                options: [ option1, option2 ],
                onOpen: async (willBeOpen: boolean) => callbacks.push(willBeOpen),
            });

            await doClick(context.container, '.dropdown-toggle');

            expect(callbacks).toEqual([true]);
        });

        it('does not trigger onOpen callback when dropdown closed', async () => {
            let callbacks: boolean[] = [];
            await renderComponent({
                options: [ option1, option2 ],
                onOpen: async (willBeOpen: boolean) => callbacks.push(willBeOpen),
            });
            await doClick(context.container, '.dropdown-toggle');
            expect(callbacks).toEqual([true]);

            await doClick(context.container, '.dropdown-toggle');

            expect(callbacks).toEqual([true, false]);
        });
    });
});