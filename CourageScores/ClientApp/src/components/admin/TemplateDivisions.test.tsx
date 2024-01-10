// noinspection JSUnresolvedFunction

import {AdminContainer} from "./AdminContainer";
import React from "react";
import {cleanUp, doClick, findButton, renderApp} from "../../helpers/tests";
import {TemplateDivisions} from "./TemplateDivisions";

describe('TemplateDivisions', () => {
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
                <TemplateDivisions {...props} onUpdate={onUpdate} />
            </AdminContainer>));
    }

    describe('renders', () => {
        it('heading', async () => {
            await renderComponent({
                divisions: [],
                templateSharedAddresses: [],
            });

            const prefix = context.container.querySelector('ul li:first-child');
            expect(prefix.textContent).toEqual('Divisions');
        });

        it('when empty divisions', async () => {
            await renderComponent({
                divisions: [],
                templateSharedAddresses: [],
            });

            const divisionElements = Array.from(context.container.querySelectorAll('ul li'));
            expect(divisionElements.length).toEqual(1); // heading
        });

        it('existing divisions', async () => {
            await renderComponent({
                divisions: [{
                    dates: [],
                    sharedAddresses: [],
                }],
                templateSharedAddresses: [],
            });

            const divisionElement = context.container.querySelector('ul li:nth-child(2)');
            expect(divisionElement.textContent).toContain('Division 1 (click to collapse)');
        });
    });

    describe('interactivity', () => {
        it('can add a division', async () => {
            await renderComponent({
                divisions: [],
                templateSharedAddresses: [],
            });

            await doClick(findButton(context.container, '➕ Add another division'));

            expect(update).toEqual([{
                dates: [],
                sharedAddresses: [],
            }]);
        });

        it('can delete a division', async () => {
            await renderComponent({
                divisions: [{
                    dates: [],
                    sharedAddresses: [],
                }],
                templateSharedAddresses: [],
            });

            await doClick(findButton(context.container, '🗑️ Remove division'));

            expect(update).toEqual([]);
        });

        it('can update a division', async () => {
            await renderComponent({
                divisions: [{
                    dates: [],
                    sharedAddresses: [ [ 'A' ] ],
                }, {
                    dates: [],
                    sharedAddresses: [ [ 'B' ] ],
                }],
                templateSharedAddresses: [],
            });

            await doClick(findButton(context.container.querySelector('ul>li:nth-child(2)'), '➕ Add a week'));

            expect(update).toEqual([{
                dates: [{
                    fixtures: [],
                }],
                sharedAddresses: [ [ 'A' ] ],
            }, {
                dates: [],
                sharedAddresses: [ [ 'B' ] ],
            }]);
        });
    });
});