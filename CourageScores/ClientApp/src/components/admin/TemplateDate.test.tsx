// noinspection JSUnresolvedFunction

import {AdminContainer} from "./AdminContainer";
import React from "react";
import {cleanUp, doChange, doClick, findButton, renderApp} from "../../helpers/tests";
import {TemplateDate} from "./TemplateDate";

describe('TemplateDate', () => {
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
                <TemplateDate {...props} onUpdate={onUpdate} onDelete={onDelete} />
            </AdminContainer>));
    }

    describe('renders', () => {
        it('empty fixtures', async () => {
            await renderComponent({
                date: {
                    fixtures: []
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
            });

            const fixtures = Array.from(context.container.querySelectorAll('div > button'));
            expect(fixtures.map(f => f.textContent)).toEqual([ '🗑️',  '⬆', '⬇' ]);
        });

        it('existing fixture', async () => {
            const fixture = {
                home: 'A',
                away: 'B',
            };
            await renderComponent({
                date: {
                    fixtures: [fixture]
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
            });

            const fixtures = Array.from(context.container.querySelectorAll('div > button'));
            expect(fixtures.map(f => f.textContent)).toEqual([ 'A - B ×', '🗑️',  '⬆', '⬇' ]);
        });

        it('existing bye', async () => {
            const fixture = {
                home: 'A',
                away: null,
            };
            await renderComponent({
                date: {
                    fixtures: [fixture]
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
            });

            const fixtures = Array.from(context.container.querySelectorAll('div > button'));
            expect(fixtures.map(f => f.textContent)).toEqual([ 'A ×', '🗑️',  '⬆', '⬇' ]);
        });

        it('fixture with home template shared address', async () => {
            const fixture = {
                home: 'A',
                away: null,
            };
            await renderComponent({
                date: {
                    fixtures: [fixture]
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: ['A', 'B'],
            });

            const fixtures = Array.from(context.container.querySelectorAll('div > button'));
            const fixtureElement = fixtures[0].querySelector('span:first-child');
            expect(fixtureElement.className).toContain('bg-warning text-light');
        });

        it('fixture with home division shared address', async () => {
            const fixture = {
                home: 'A',
                away: null,
            };
            await renderComponent({
                date: {
                    fixtures: [fixture]
                },
                divisionSharedAddresses: ['A', 'B'],
                templateSharedAddresses: [],
            });

            const fixtures = Array.from(context.container.querySelectorAll('div > button'));
            const fixtureElement = fixtures[0].querySelector('span:first-child');
            expect(fixtureElement.className).toContain('bg-secondary text-light');
        });

        it('fixture with home division and template shared address', async () => {
            const fixture = {
                home: 'A',
                away: null,
            };
            await renderComponent({
                date: {
                    fixtures: [fixture]
                },
                divisionSharedAddresses: ['A', 'B'],
                templateSharedAddresses: ['A', 'B'],
            });

            const fixtures = Array.from(context.container.querySelectorAll('div > button'));
            const fixtureElement = fixtures[0].querySelector('span:first-child');
            expect(fixtureElement.className).toContain('bg-secondary text-light');
        });
    });

    describe('interactivity', () => {
        it('can add league fixture (Button press)', async () => {
            await renderComponent({
                date: {
                    fixtures: []
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
            });

            await doChange(context.container, 'input[name="home"]', 'A', context.user);
            await doChange(context.container, 'input[name="away"]', 'B', context.user);
            await doClick(findButton(context.container, '➕'));

            expect(update).toEqual({
                fixtures: [{
                    home: 'A',
                    away: 'B',
                }],
            });
        });

        it('can add league fixture (Enter key press)', async () => {
            await renderComponent({
                date: {
                    fixtures: []
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
            });

            await doChange(context.container, 'input[name="home"]', 'A', context.user);
            await doChange(context.container, 'input[name="away"]', 'B', context.user);
            await context.user.type(context.container.querySelector('input[name="away"]'), '{Enter}');

            expect(update).toEqual({
                fixtures: [{
                    home: 'A',
                    away: 'B',
                }],
            });
        });

        it('cannot add fixture without a home team (Button press)', async () => {
            await renderComponent({
                date: {
                    fixtures: []
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
            });
            let alert;
            window.alert = (msg) => alert = msg;

            await doChange(context.container, 'input[name="home"]', 'A', context.user);
            await doChange(context.container, 'input[name="home"]', '', context.user);
            await doChange(context.container, 'input[name="away"]', 'B', context.user);
            await doClick(findButton(context.container, '➕'));

            expect(alert).toEqual('Enter at least a home team');
            expect(update).toBeNull();
        });

        it('cannot add fixture without a home team (Enter key press)', async () => {
            await renderComponent({
                date: {
                    fixtures: []
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
            });
            let alert;
            window.alert = (msg) => alert = msg;

            await doChange(context.container, 'input[name="home"]', 'A', context.user);
            await doChange(context.container, 'input[name="home"]', '', context.user);
            await doChange(context.container, 'input[name="away"]', 'B', context.user);
            await context.user.type(context.container.querySelector('input[name="home"]'), '{Enter}');

            expect(alert).toEqual('Enter at least a home team');
            expect(update).toBeNull();
        });

        it('can add bye fixture', async () => {
            await renderComponent({
                date: {
                    fixtures: []
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
            });

            await doChange(context.container, 'input[name="home"]', 'A', context.user);
            await doClick(findButton(context.container, '➕'));

            expect(update).toEqual({
                fixtures: [{
                    home: 'A',
                    away: null,
                }],
            });
        });

        it('can delete league fixture', async () => {
            await renderComponent({
                date: {
                    fixtures: [{
                        home: 'A',
                        away: 'B',
                    }]
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
            });

            await doClick(findButton(context.container, 'A - B ×'));

            expect(update).toEqual({
                fixtures: [],
            });
        });

        it('can delete bye fixture', async () => {
            await renderComponent({
                date: {
                    fixtures: [{
                        home: 'A',
                        away: null,
                    }]
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
            });

            await doClick(findButton(context.container, 'A ×'));

            expect(update).toEqual({
                fixtures: [],
            });
        });

        it('can delete date with fixtures', async () => {
            await renderComponent({
                date: {
                    fixtures: [{
                        home: 'A',
                        away: 'B',
                    }]
                },
                divisionSharedAddresses: [],
                templateSharedAddresses: [],
            });

            await doClick(findButton(context.container, '🗑️'));

            expect(deleted).toEqual(true);
        });
    });
});