// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doSelectOption} from "../../helpers/tests";
import {createTemporaryId} from "../../helpers/projection";
import React from "react";
import {CreateSeasonDialog} from "./CreateSeasonDialog";
import {DivisionDataContainer} from "../DivisionDataContainer";

describe('CreateSeasonDialog', () => {
    let context;
    let reportedError;
    let closed;
    let compatibilityResponses;
    let allDataReloaded;
    const templateApi = {
        getCompatibility: (seasonId) => {
            return compatibilityResponses[seasonId] || { success: false };
        }
    };
    const gameApi = {

    };

    function onClose() {
        closed = true;
    }

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        allDataReloaded = false;
        reportedError = null;
        compatibilityResponses = {};
        closed = false;
    });

    async function renderComponent(appProps, divisionDataProps, props) {
        context = await renderApp(
            { templateApi, gameApi },
            { name: 'Courage Scores' },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                reloadAll: () => {
                    allDataReloaded = true;
                },
                ...appProps
            },
            (<DivisionDataContainer {...divisionDataProps}>
                <CreateSeasonDialog {...props} onClose={onClose} />
            </DivisionDataContainer>));
    }

    describe('renders', () => {
        it('when no templates returned', async () => {
            const seasonId = createTemporaryId();
            compatibilityResponses[seasonId] = {
                success: true,
                result: []
            };
            await renderComponent({
                divisions: []
            }, null, {
                seasonId: seasonId,
            });

            expect(reportedError).toBeNull();
            const onlyMenuItem = context.container.querySelector('.dropdown-item');
            expect(onlyMenuItem).toBeFalsy();
        });

        it('compatible template in dropdown', async () => {
            const seasonId = createTemporaryId();
            compatibilityResponses[seasonId] = {
                success: true,
                result: [{
                    success: true,
                    result: {
                        id: createTemporaryId(),
                        name: 'TEMPLATE',
                        templateHealth: {},
                    }
                }]
            };
            await renderComponent({
                divisions: []
            }, null, {
                seasonId: seasonId,
            });

            expect(reportedError).toBeNull();
            const menu = context.container.querySelector('.dropdown-menu');
            const items = Array.from(menu.querySelectorAll('.dropdown-item'));
            expect(items.map(i => i.textContent)).toEqual([ 'TEMPLATE' ]);
        });

        it('incompatible template in dropdown', async () => {
            const seasonId = createTemporaryId();
            compatibilityResponses[seasonId] = {
                success: true,
                result: [{
                    success: false,
                    result: {
                        id: createTemporaryId(),
                        name: 'TEMPLATE',
                        templateHealth: {},
                    }
                }]
            };
            await renderComponent({
                divisions: []
            }, null, {
                seasonId: seasonId,
            });

            expect(reportedError).toBeNull();
            const menu = context.container.querySelector('.dropdown-menu');
            const items = Array.from(menu.querySelectorAll('.dropdown-item'));
            expect(items.map(i => i.textContent)).toEqual([ '🚫 TEMPLATE' ]);
        });
    });

    describe('interactivity', () => {
        it('shows details of incompatible template', async () => {
            const seasonId = createTemporaryId();
            compatibilityResponses[seasonId] = {
                success: true,
                result: [{
                    success: false,
                    result: {
                        id: createTemporaryId(),
                        name: 'TEMPLATE',
                        templateHealth: {},
                    },
                    errors: [ 'ERROR' ],
                    warnings: [ 'WARNING' ],
                    messages: [ 'MESSAGE' ],
                }]
            };
            await renderComponent({
                divisions: []
            }, null, {
                seasonId: seasonId,
            });

            await doSelectOption(context.container.querySelector('.dropdown-menu'), '🚫 TEMPLATE');

            expect(reportedError).toBeNull();
            expect(context.container.querySelector('h4').textContent).toEqual('🚫 Incompatible with this season');
            expect(Array.from(context.container.querySelectorAll('li.text-danger')).map(li => li.textContent)).toEqual([ 'ERROR' ]);
            expect(Array.from(context.container.querySelectorAll('li:not(.text-secondary):not(.text-danger)')).map(li => li.textContent)).toEqual([ 'WARNING' ]);
            expect(Array.from(context.container.querySelectorAll('li.text-secondary')).map(li => li.textContent)).toEqual([ 'MESSAGE' ]);
            expect(context.container.querySelector('div[datatype="view-health-check"]')).toBeFalsy();
        });

        it('shows details of compatible template', async () => {
            const seasonId = createTemporaryId();
            compatibilityResponses[seasonId] = {
                success: true,
                result: [{
                    success: true,
                    result: {
                        id: createTemporaryId(),
                        name: 'TEMPLATE',
                        templateHealth: {
                            checks: {},
                            errors: [],
                            warnings: [],
                            messages: [],
                        },
                    },
                    errors: [ 'ERROR' ],
                    warnings: [ 'WARNING' ],
                    messages: [ 'MESSAGE' ],
                }]
            };
            await renderComponent({
                divisions: []
            }, null, {
                seasonId: seasonId,
            });

            await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEMPLATE');

            expect(reportedError).toBeNull();
            expect(context.container.querySelector('h4').textContent).toEqual('✔ Compatible with this season');
            expect(Array.from(context.container.querySelectorAll('li.text-danger')).map(li => li.textContent)).toEqual([ 'ERROR' ]);
            expect(Array.from(context.container.querySelectorAll('li:not(.text-secondary):not(.text-danger)')).map(li => li.textContent)).toEqual([ 'WARNING' ]);
            expect(Array.from(context.container.querySelectorAll('li.text-secondary')).map(li => li.textContent)).toEqual([ 'MESSAGE' ]);
            expect(context.container.querySelector('div[datatype="view-health-check"]')).toBeTruthy();
        });
    });
});