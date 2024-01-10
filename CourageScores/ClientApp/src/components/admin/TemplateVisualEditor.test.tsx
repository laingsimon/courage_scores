// noinspection JSUnresolvedFunction

import {AdminContainer} from "./AdminContainer";
import React from "react";
import {cleanUp, doClick, findButton, renderApp} from "../../helpers/tests";
import {TemplateVisualEditor} from "./TemplateVisualEditor";

describe('TemplateVisualEditor', () => {
    let context;
    let reportedError;
    let update;

    afterEach(() => {
        cleanUp(context);
    });

    function onUpdate(value) {
        update = value;
    }

    async function renderComponent(props) {
        reportedError = null;
        update = null;
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
                <TemplateVisualEditor {...props} onUpdate={onUpdate} />
            </AdminContainer>));
    }

    describe('renders', () => {
        it('empty template', async () => {
            await renderComponent({
                template: {
                    sharedAddresses: [],
                    divisions: [],
                },
            });

            const sharedAddresses = context.container.querySelector('div > ul:nth-child(1)');
            expect(sharedAddresses.querySelectorAll('li').length).toEqual(1); // heading, no addresses
            const divisions = context.container.querySelector('div > ul:nth-child(2)');
            expect(divisions.querySelectorAll('li').length).toEqual(1); //heading, no divisions
        });

        it('template shared addresses', async () => {
            await renderComponent({
                template: {
                    sharedAddresses: [ [ 'A' ] ],
                    divisions: [],
                },
            });

            const sharedAddresses = context.container.querySelector('div > ul:nth-child(1)');
            expect(sharedAddresses.textContent).toContain('A ×');
        });

        it('template divisions', async () => {
            await renderComponent({
                template: {
                    sharedAddresses: [],
                    divisions: [{
                        sharedAddresses: [ [ 'B' ] ],
                        dates: [],
                    }],
                },
            });

            const divisions = context.container.querySelector('div > ul:nth-child(2)');
            expect(divisions.textContent).toContain('B ×');
        });
    });

    describe('interactivity', () => {
        it('can update template shared addresses', async () => {
            await renderComponent({
                template: {
                    sharedAddresses: [],
                    divisions: [],
                },
            });
            const sharedAddresses = context.container.querySelector('div > ul:nth-child(1)');

            await doClick(findButton(sharedAddresses, '➕ Add shared address'));

            expect(update).toEqual({
                sharedAddresses: [ [] ],
                divisions: [],
            });
        });

        it('can update divisions', async () => {
            await renderComponent({
                template: {
                    sharedAddresses: [],
                    divisions: [],
                },
            });
            const divisions = context.container.querySelector('div > ul:nth-child(2)');

            await doClick(findButton(divisions, '➕ Add another division'));

            expect(update).toEqual({
                sharedAddresses: [],
                divisions: [{
                    dates: [],
                    sharedAddresses: [],
                }],
            });
        });
    });
});