import {
    appProps,
    brandingProps,
    cleanUp, doClick,
    ErrorState, findButton,
    iocProps,
    renderApp, TestContext
} from "../../helpers/tests";
import {INumberKeyboardProps, NumberKeyboard} from "./NumberKeyboard";
import {StringMapObject, toDictionary} from "../../helpers/collections";

describe('NumberKeyboard', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let newValue: string;

    async function onChange(value: string) {
        newValue = value;
    }

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        newValue = null;
    });

    async function renderComponent(props: INumberKeyboardProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({}, reportedError),
            (<NumberKeyboard {...props} />));
    }

    function assertEnabledButtons(buttonText: string[]) {
        const buttons: HTMLButtonElement[] = Array.from(context.container.querySelectorAll('button'));
        const buttonLookup: StringMapObject = toDictionary(buttons, (b: HTMLButtonElement) => b.textContent);

        buttonText.forEach((text: string) => {
            const button = buttonLookup[text];
            if (!button) {
                throw new Error(`Button not found: ${text}`);
            }

            expect(button.disabled).toEqual(false);
        });
    }

    function assertDisabledButtons(buttonText: string[]) {
        const buttons: HTMLButtonElement[] = Array.from(context.container.querySelectorAll('button'));
        const buttonLookup: StringMapObject = toDictionary(buttons, (b: HTMLButtonElement) => b.textContent);

        buttonText.forEach((text: string) => {
            const button = buttonLookup[text];
            if (!button) {
                throw new Error(`Button not found: ${text}`);
            }

            expect(button.disabled).toEqual(true);
        });
    }

    describe('renders', () => {
        const allNumbers: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
        const deleteButton: string = '←';

        it('when value is empty', async () => {
            await renderComponent({
                value: '',
                onChange,
            });

            assertEnabledButtons(allNumbers.filter((b: string) => b !== '0'));
            assertDisabledButtons([ deleteButton ]);
        });

        it('when value is 0', async () => {
            await renderComponent({
                value: '0',
                onChange,
            });

            assertEnabledButtons(allNumbers.filter((b: string) => b !== '0').concat([ deleteButton ]));
            assertDisabledButtons([ '0' ]);
        });

        it('when value is positive', async () => {
            await renderComponent({
                value: '10',
                onChange,
            });

            assertEnabledButtons(allNumbers.concat([ deleteButton ]));
        });

        it('when value is equal to max value', async () => {
            await renderComponent({
                value: '180',
                onChange,
                maxValue: 180,
            });

            assertEnabledButtons([ deleteButton ]);
            assertDisabledButtons(allNumbers);
        });

        it('when value is greater than max value', async () => {
            await renderComponent({
                value: '200',
                onChange,
                maxValue: 180,
            });

            assertEnabledButtons([ deleteButton ]);
            assertDisabledButtons(allNumbers);
        });

        it('when positive and 0 max value', async () => {
            await renderComponent({
                value: '10',
                onChange,
                maxValue: 0,
            });

            assertEnabledButtons(allNumbers.concat([ deleteButton ]));
        });

        it('given non-number value', async () => {
            await renderComponent({
                value: 'foo',
                onChange,
                maxValue: 0,
            });

            assertDisabledButtons(allNumbers);
            assertEnabledButtons([ deleteButton ]);
        });
    });

    describe('interactivity', () => {
        const deleteButton: string = '←';

        it('can delete last digit', async () => {
            await renderComponent({
                value: '10',
                onChange,
            });

            await doClick(findButton(context.container, deleteButton));

            expect(newValue).toEqual('1');
        });

        it('can add digit', async () => {
            await renderComponent({
                value: '10',
                onChange,
            });

            await doClick(findButton(context.container, '5'));

            expect(newValue).toEqual('105');
        });

        it('cannot delete when value is empty', async () => {
            await renderComponent({
                value: '',
                onChange,
            });

            const zeroButton: HTMLButtonElement = findButton(context.container, deleteButton);
            expect(zeroButton.disabled).toEqual(true);
        });

        it('can add 0 when value is empty', async () => {
            await renderComponent({
                value: '',
                onChange,
            });

            await doClick(findButton(context.container, '0'));

            expect(newValue).toEqual('0');
        });

        it('cannot add 0 when value is 0', async () => {
            await renderComponent({
                value: '0',
                onChange,
            });

            const zeroButton: HTMLButtonElement = findButton(context.container, '0');
            expect(zeroButton.disabled).toEqual(true);
        });

        it('can add 0 when preceded by other digits', async () => {
            await renderComponent({
                value: '5',
                onChange,
            });

            await doClick(findButton(context.container, '0'));

            expect(newValue).toEqual('50');
        });
    });
});