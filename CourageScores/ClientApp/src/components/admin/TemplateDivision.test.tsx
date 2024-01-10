// noinspection JSUnresolvedFunction

import {AdminContainer} from "./AdminContainer";
import React from "react";
import {cleanUp, doClick, findButton, renderApp} from "../../helpers/tests";
import {TemplateDivision} from "./TemplateDivision";

describe('TemplateDivision', () => {
    let context;
    let reportedError;
    let update;
    let deleted;

    afterEach(() => {
        cleanUp(context);
    });

    function onUpdate(value) {
        update = value;
    }

    function onDelete() {
        deleted = true;
    }

    async function renderComponent(props) {
        reportedError = null;
        update = null;
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
                <TemplateDivision {...props} onUpdate={onUpdate} onDelete={onDelete} />
            </AdminContainer>));
    }

    describe('renders', () => {
        it('division heading', async () => {
            await renderComponent({
                divisionNo: 1,
                division: {
                    sharedAddresses: [],
                    dates: [],
                },
                templateSharedAddresses: [],
            });

            const heading = context.container.querySelector('h6');
            expect(heading.textContent).toEqual('⬆️ Division 1 (click to collapse)');
        });

        it('division shared addresses', async () => {
            await renderComponent({
                divisionNo: 1,
                division: {
                    sharedAddresses: [ [ 'A' ] ],
                    dates: [],
                },
                templateSharedAddresses: [],
            });

            const divisionSharedAddresses = context.container.querySelector('div > ul:nth-child(2)');
            expect(divisionSharedAddresses.textContent).toContain('A ×');
        });

        it('dates', async () => {
            await renderComponent({
                divisionNo: 1,
                division: {
                    sharedAddresses: [],
                    dates: [{
                        fixtures: [{
                            home: 'A',
                            away: 'B',
                        }],
                    }],
                },
                templateSharedAddresses: [],
            });

            const dates = context.container.querySelector('div > ul:nth-child(3)');
            expect(dates.textContent).toContain('A - B ×');
        });
    });

    describe('interactivity', () => {
        it('can expand division', async () => {
            await renderComponent({
                divisionNo: 1,
                division: {
                    sharedAddresses: [],
                    dates: [],
                },
                templateSharedAddresses: [],
            });
            const heading = context.container.querySelector('h6');

            await doClick(heading);

            expect(heading.textContent).toEqual('⬇️ Division 1 (click to expand)');
        });

        it('can collapse division', async () => {
            await renderComponent({
                divisionNo: 1,
                division: {
                    sharedAddresses: [],
                    dates: [],
                },
                templateSharedAddresses: [],
            });
            const heading = context.container.querySelector('h6');

            await doClick(heading);
            await doClick(heading);

            expect(heading.textContent).toEqual('⬆️ Division 1 (click to collapse)');
        });

        it('can update shared addresses', async () => {
            await renderComponent({
                divisionNo: 1,
                division: {
                    sharedAddresses: [],
                    dates: [],
                },
                templateSharedAddresses: [],
            });

            await doClick(findButton(context.container, '➕ Add shared address'));

            expect(update).toEqual({
                sharedAddresses: [ [] ],
                dates: [],
            });
        });

        it('can update dates', async () => {
            await renderComponent({
                divisionNo: 1,
                division: {
                    sharedAddresses: [],
                    dates: [],
                },
                templateSharedAddresses: [],
            });

            await doClick(findButton(context.container, '➕ Add a week'));

            expect(update).toEqual({
                sharedAddresses: [],
                dates: [{
                    fixtures: [],
                }],
            });
        });

        it('can remove division', async () => {
            await renderComponent({
                divisionNo: 1,
                division: {
                    sharedAddresses: [],
                    dates: [],
                },
                templateSharedAddresses: [],
            });

            await doClick(findButton(context.container, '🗑️ Remove division'));

            expect(deleted).toEqual(true);
        });
    });
});