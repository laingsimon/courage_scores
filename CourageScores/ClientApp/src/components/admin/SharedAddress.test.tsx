// noinspection JSUnresolvedFunction

import {AdminContainer} from "./AdminContainer";
import React from "react";
import {cleanUp, doChange, doClick, findButton, renderApp} from "../../helpers/tests";
import {SharedAddress} from "./SharedAddress";

describe('SharedAddress', () => {
    let context;
    let reportedError;
    let updatedAddresses;
    let deleted;

    afterEach(() => {
        cleanUp(context);
    });

    function onUpdate(addresses) {
        updatedAddresses = addresses;
    }

    function onDelete() {
        deleted = true;
    }

    async function renderComponent(props) {
        reportedError = null;
        updatedAddresses = null;
        deleted = null;
        context = await renderApp(
            {},
            {name: 'Courage Scores'},
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                }
            },
            (<AdminContainer>
                <SharedAddress {...props} onUpdate={onUpdate} onDelete={onDelete} />
            </AdminContainer>));
    }

    describe('renders', () => {
        it('empty address list', async () => {
            await renderComponent({
                address: [],
                className: 'bg-warning',
            });

            const addressBadges = Array.from(context.container.querySelectorAll('button.badge'));
            expect(addressBadges).toEqual([]);
            const newAddressBadge = context.container.querySelector('span.badge');
            expect(newAddressBadge).toBeTruthy();
        });

        it('single address item', async () => {
            await renderComponent({
                address: [ 'A' ],
                className: 'bg-warning',
            });

            const addressBadges = Array.from(context.container.querySelectorAll('button.badge'));
            expect(addressBadges.map(b => b.textContent)).toEqual([ 'A ×' ]);
            const newAddressBadge = context.container.querySelector('span.badge');
            expect(newAddressBadge).toBeTruthy();
        });

        it('multiple address items', async () => {
            await renderComponent({
                address: [ 'A', 'B' ],
                className: 'bg-warning',
            });

            const addressBadges = Array.from(context.container.querySelectorAll('button.badge'));
            expect(addressBadges.map(b => b.textContent)).toEqual([ 'A ×', 'B ×' ]);
        });

        it('with correct className', async () => {
            await renderComponent({
                address: [ 'A' ],
                className: 'bg-warning',
            });

            const addressBadges = Array.from(context.container.querySelectorAll('button.badge'));
            expect(addressBadges.map(b => b.className.indexOf(' bg-warning') !== -1)).toEqual([ true ]);
            const newAddressBadge = context.container.querySelector('span.badge');
            expect(newAddressBadge.className).toContain(' bg-warning');
        });
    });

    describe('interactivity', () => {
        it('can add address', async () => {
            await renderComponent({
                address: [ 'A' ],
                className: 'bg-warning',
            });

            await doChange(context.container, 'input', 'B', context.user);
            await doClick(findButton(context.container, '➕'));

            expect(updatedAddresses).toEqual(['A', 'B']);
        });

        it('adds address when enter is pressed', async () => {
            await renderComponent({
                address: [ 'A' ],
                className: 'bg-warning',
            });

            await doChange(context.container, 'input', 'B', context.user);
            await context.user.type(context.container.querySelector('input'), '{Enter}');

            expect(updatedAddresses).toEqual(['A', 'B']);
        });

        it('new address code is reset to empty when address has been added', async () => {
            await renderComponent({
                address: [ 'A' ],
                className: 'bg-warning',
            });

            await doChange(context.container, 'input', 'B', context.user);
            await doClick(findButton(context.container, '➕'));

            expect(context.container.querySelector('input').value).toEqual('');
        });

        it('cannot add address with empty code (Button click)', async () => {
            await renderComponent({
                address: [ 'A' ],
                className: 'bg-warning',
            });
            let alert;
            window.alert = (msg) => alert = msg;

            await doChange(context.container, 'input', '', context.user);
            await doClick(findButton(context.container, '➕'));

            expect(alert).toEqual('Enter a code for the team');
        });

        it('cannot add address with empty code (Enter key press)', async () => {
            await renderComponent({
                address: [ 'A' ],
                className: 'bg-warning',
            });
            let alert;
            window.alert = (msg) => alert = msg;

            await doChange(context.container, 'input', '', context.user);
            await context.user.type(context.container.querySelector('input'), '{Enter}');

            expect(alert).toEqual('Enter a code for the team');
        });

        it('can remove address', async () => {
            await renderComponent({
                address: [ 'A', 'B' ],
                className: 'bg-warning',
            });

            await doClick(findButton(context.container, 'B ×'));

            expect(updatedAddresses).toEqual(['A']);
        });

        it('can remove last address', async () => {
            await renderComponent({
                address: [ 'A' ],
                className: 'bg-warning',
            });

            await doClick(findButton(context.container, 'A ×'));

            expect(updatedAddresses).toEqual([]);
        });

        it('can delete shared address', async () => {
            await renderComponent({
                address: [ 'A' ],
                className: 'bg-warning',
            });

            await doClick(findButton(context.container, '🗑️ Remove'));

            expect(deleted).toEqual(true);
        });
    });
});