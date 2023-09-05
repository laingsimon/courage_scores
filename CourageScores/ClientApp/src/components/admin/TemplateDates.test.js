// noinspection JSUnresolvedFunction

import {AdminContainer} from "./AdminContainer";
import React from "react";
import {cleanUp, doClick, findButton, renderApp} from "../../helpers/tests";
import {TemplateDates} from "./TemplateDates";

describe('TemplateDates', () => {
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
                <TemplateDates {...props} onUpdate={onUpdate} />
            </AdminContainer>));
    }

    describe('renders', () => {
        it('heading', async () => {
            await renderComponent({
                dates: [{
                    fixtures: []
                }],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
            });

            const prefix = context.container.querySelector('ul li:first-child');
            expect(prefix.textContent).toEqual('WeeksLeague fixtures (or byes) per-week');
        });

        it('when empty dates', async () => {
            await renderComponent({
                dates: [],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
            });

            const dateElements = Array.from(context.container.querySelectorAll('ul li'));
            expect(dateElements.length).toEqual(1); // heading
        });

        it('existing dates', async () => {
            await renderComponent({
                dates: [{
                    fixtures: [{
                        home: 'A',
                        away: 'B',
                    }]
                }],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
            });

            const dateElement = context.container.querySelector('ul li:nth-child(2)');
            expect(dateElement.textContent).toContain('A - B ×');
        });
    });

    describe('interactivity', () => {
        it('can add a date/week', async () => {
            await renderComponent({
                dates: [],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
            });

            await doClick(findButton(context.container, '➕ Add a week'));

            expect(update).toEqual([{
                fixtures: [],
            }]);
        });

        it('can delete a date/week', async () => {
            await renderComponent({
                dates: [{
                    fixtures: [{
                        home: 'A',
                        away: 'B',
                    }]
                }],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
            });

            await doClick(findButton(context.container, '🗑️'));

            expect(update).toEqual([]);
        });

        it('can update a date/week', async () => {
            await renderComponent({
                dates: [{
                    fixtures: [{
                        home: 'A',
                        away: 'B',
                    }]
                }],
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
            });

            await doClick(findButton(context.container, 'A - B ×'));

            expect(update).toEqual([{
                fixtures: []
            }]);
        });
    });
});