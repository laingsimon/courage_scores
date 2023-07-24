// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../helpers/tests";
import {renderDate} from "../../helpers/rendering";
import React from "react";
import {FilterFixtures} from "./FilterFixtures";
import {DivisionDataContainer} from "../DivisionDataContainer";

describe('FilterFixtures', () => {
    let context;
    let reportedError;
    let updatedFilter;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(filter, teams) {
        reportedError = null;
        updatedFilter = null;
        context = await renderApp(
            { },
            { name: 'Courage Scores' },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                }
            },
            (<DivisionDataContainer teams={teams}>
                <FilterFixtures filter={filter} setFilter={(newFilter) => updatedFilter = newFilter} />
            </DivisionDataContainer>));
    }

    describe('type', () => {
        it('when selected', async () => {
            await renderComponent({ type: 'league' }, []);

            const dropDown = context.container.querySelector('.btn-group:nth-child(1)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual('League fixtures');
        });

        it('when unrecognised', async () => {
            await renderComponent({ type: 'foo' }, []);

            const dropDown = context.container.querySelector('.btn-group:nth-child(1)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeFalsy();
        });

        it('when unselected', async () => {
            await renderComponent({ }, []);

            const dropDown = context.container.querySelector('.btn-group:nth-child(1)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual('All fixtures');
        });
    });

    describe('date', () => {
        it('when selected', async () => {
            await renderComponent({ date: 'past' }, []);

            const dropDown = context.container.querySelector('.btn-group:nth-child(2)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual('Past dates');
        });

        it('when specific 3-part date', async () => {
            const date = '2023-01-01';
            const expectedDate = renderDate(date);
            await renderComponent({ date }, []);

            const dropDown = context.container.querySelector('.btn-group:nth-child(2)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual(expectedDate);
        });

        it('when unrecognised', async () => {
            await renderComponent({ date: 'foo' }, []);

            const dropDown = context.container.querySelector('.btn-group:nth-child(2)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual('foo');
        });

        it('when unselected', async () => {
            await renderComponent({ }, []);

            const dropDown = context.container.querySelector('.btn-group:nth-child(2)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual('All dates');
        });
    });

    describe('teamId', () => {
        it('when selected', async () => {
            const team = {
                id: 'abcd',
                name: 'TEAM'
            };
            await renderComponent({ teamId: 'TEAM' }, [ team ]);

            const dropDown = context.container.querySelector('.btn-group:nth-child(3)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual('TEAM');
        });

        it('when unrecognised', async () => {
            const team = {
                id: 'abcd',
                name: 'TEAM'
            };
            await renderComponent({ teamId: '1234' }, [ team ]);

            const dropDown = context.container.querySelector('.btn-group:nth-child(3)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeFalsy();
        });

        it('when unselected', async () => {
            await renderComponent({ }, []);

            const dropDown = context.container.querySelector('.btn-group:nth-child(3)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual('All teams');
        });
    });
});