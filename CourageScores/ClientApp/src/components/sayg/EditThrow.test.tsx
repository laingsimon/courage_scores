import {
    cleanUp,
    doClick,
    findButton,
    renderApp,
    doChange,
    iocProps,
    brandingProps,
    appProps, TestContext
} from "../../helpers/tests";
import {EditThrow, IEditThrowProps} from "./EditThrow";
import {toDictionary} from "../../helpers/collections";
import {valueChanged} from "../../helpers/events";
import {LegThrowDto} from "../../interfaces/models/dtos/Game/Sayg/LegThrowDto";
import React from "react";

describe('EditThrow', () => {
    let context: TestContext;
    let closed: boolean;
    let changed: { [key: string]: LegThrowDto } | null;
    let saved: boolean;

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        closed = false;
        changed = null;
        saved = false;
    });

    async function onClose() {
        closed = true;
    }
    async function onSave() {
        saved = true;
    }

    async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
        await valueChanged({}, (v: { [key: string]: any }) => changed = v)(event);
    }

    async function renderComponent(props: IEditThrowProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            <EditThrow {...props} />);
    }

    describe('renders', () => {
        it('home competitor name in title', async () => {
            await renderComponent({
                score: 1,
                noOfDarts: 2,
                home: 'HOME',
                away: 'AWAY',
                competitor: 'home',
                index: 3,
                onChange,
                onSave,
                onClose,
            });

            expect(context.container.textContent).toContain('Edit throw 4 for HOME');
        });

        it('away competitor name in title', async () => {
            await renderComponent({
                score: 1,
                noOfDarts: 2,
                home: 'HOME',
                away: 'AWAY',
                competitor: 'away',
                index: 3,
                onChange,
                onSave,
                onClose,
            });

            expect(context.container.textContent).toContain('Edit throw 4 for AWAY');
        });

        it('throw details', async () => {
            await renderComponent({
                score: 1,
                noOfDarts: 2,
                home: 'HOME',
                away: 'AWAY',
                competitor: 'away',
                index: 3,
                onChange,
                onSave,
                onClose,
            });

            const inputs = Array.from(context.container.querySelectorAll('input'));
            const inputMap = toDictionary(inputs, i => i.getAttribute('name')!);
            expect(inputMap['score'].value).toEqual('1');
            expect(inputMap['noOfDarts'].value).toEqual('2');
        });

        it('null score and noOfDarts', async () => {
            await renderComponent({
                home: 'HOME',
                away: 'AWAY',
                competitor: 'away',
                index: 3,
                onChange,
                onSave,
                onClose,
            });

            const inputs = Array.from(context.container.querySelectorAll('input'));
            const inputMap = toDictionary(inputs, i => i.getAttribute('name')!);
            expect(inputMap['score'].value).toEqual('');
            expect(inputMap['noOfDarts'].value).toEqual('');
        });
    });

    describe('interactivity', () => {
        it('can close the dialog', async () => {
            await renderComponent({
                score: 1,
                noOfDarts: 2,
                home: 'HOME',
                away: 'AWAY',
                competitor: 'away',
                index: 3,
                onChange,
                onSave,
                onClose,
            });

            await doClick(findButton(context.container, 'Close'));

            expect(closed).toEqual(true);
        });

        it('can save the changes', async () => {
            await renderComponent({
                score: 1,
                noOfDarts: 2,
                home: 'HOME',
                away: 'AWAY',
                competitor: 'away',
                index: 3,
                onChange,
                onSave,
                onClose,
            });

            await doClick(findButton(context.container, 'Save changes'));

            expect(saved).toEqual(true);
        });

        it('can change the score', async () => {
            await renderComponent({
                score: 1,
                noOfDarts: 2,
                home: 'HOME',
                away: 'AWAY',
                competitor: 'away',
                index: 3,
                onChange,
                onSave,
                onClose,
            });

            await doChange(context.container, 'input[name="score"]', '100', context.user);

            expect(changed).toEqual({
                score: 100,
            });
        });

        it('can change the noOfDarts', async () => {
            await renderComponent({
                score: 1,
                noOfDarts: 2,
                home: 'HOME',
                away: 'AWAY',
                competitor: 'away',
                index: 3,
                onChange,
                onSave,
                onClose,
            });

            await doChange(context.container, 'input[name="noOfDarts"]', '3', context.user);

            expect(changed).toEqual({
                noOfDarts: 3,
            });
        });
    });
});