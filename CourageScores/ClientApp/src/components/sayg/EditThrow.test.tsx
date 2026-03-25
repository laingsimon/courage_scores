import {
    cleanUp,
    renderApp,
    iocProps,
    brandingProps,
    appProps,
    TestContext,
} from '../../helpers/tests';
import { EditThrow, IEditThrowProps } from './EditThrow';
import { valueChanged } from '../../helpers/events';
import { LegThrowDto } from '../../interfaces/models/dtos/Game/Sayg/LegThrowDto';
import React from 'react';

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
        await valueChanged({}, (v: {}) => (changed = v))(event);
    }

    async function renderComponent(props: IEditThrowProps) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            <EditThrow {...props} />,
        );
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

            expect(context.text()).toContain('Edit throw 4 for HOME');
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

            expect(context.text()).toContain('Edit throw 4 for AWAY');
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

            expect(context.input('score').value()).toEqual('1');
            expect(context.input('noOfDarts').value()).toEqual('2');
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

            expect(context.input('score').value()).toEqual('');
            expect(context.input('noOfDarts').value()).toEqual('');
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

            await context.button('Close').click();

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

            await context.button('Save changes').click();

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

            await context.input('score').change('100');

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

            await context.input('noOfDarts').change('3');

            expect(changed).toEqual({
                noOfDarts: 3,
            });
        });
    });
});
