// noinspection JSUnresolvedFunction

import {AdminContainer} from "./AdminContainer";
import React from "react";
import {cleanUp, doClick, findButton, renderApp} from "../../helpers/tests";
import {SharedAddresses} from "./SharedAddresses";

describe('SharedAddresses', () => {
    let context;
    let reportedError;
    let updatedAddresses;

    afterEach(() => {
        cleanUp(context);
    });

    function onUpdate(addresses) {
        updatedAddresses = addresses;
    }

    async function renderComponent(props) {
        reportedError = null;
        updatedAddresses = null;
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
                <SharedAddresses {...props} onUpdate={onUpdate} />
            </AdminContainer>));
    }

    describe('renders', () => {
        it('with correct class name', async () => {
            await renderComponent({
                addresses: [],
                className: 'bg-warning',
            });

            const heading = context.container.querySelector('ul li.list-group-item:first-child');
            expect(heading.className).toEqual('list-group-item bg-warning text-light');
        });

        it('with empty list of shared addresses', async () => {
            await renderComponent({
                addresses: [],
                className: 'bg-warning',
            });

            const items = Array.from(context.container.querySelectorAll('ul li.list-group-item'));
            expect(items.length).toEqual(1); // heading only
        });

        it('with list of shared addresses', async () => {
            await renderComponent({
                addresses: [ [ 'A' ] ],
                className: 'bg-warning',
            });

            const items = Array.from(context.container.querySelectorAll('ul li.list-group-item'));
            items.shift(); // exclude the heading
            expect(items[0].textContent).toContain('A ×');
        });
    });

    describe('interactivity', () => {
        it('can add shared address', async () => {
            await renderComponent({
                addresses: [],
                className: 'bg-warning',
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
            });

            await doClick(findButton(context.container, '🗑️ Remove'));

            expect(updatedAddresses).toEqual([ ]);
        });

        it('can update shared address', async () => {
            await renderComponent({
                addresses: [ [ 'A', 'B' ] ],
                className: 'bg-warning',
            });

            await doClick(findButton(context.container, 'B ×'));

            expect(updatedAddresses).toEqual([ [ 'A' ] ]);
        });
    });
});