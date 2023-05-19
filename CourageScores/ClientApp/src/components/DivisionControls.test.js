// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick} from "../tests/helpers";
import React from "react";
import {DivisionControls} from "./DivisionControls";
import {createTemporaryId, renderDate} from "../Utilities";

const mockedUsedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedUsedNavigate,
}));

describe('DivisionControls', () => {
    let context;
    let reportedError;
    let changedDivisionOrSeason;
    let reloadSeasonsCalled;
    let reloadDivisionsCalled;
    let updatedSeason;
    let updatedDivision;
    const seasonApi = {
        update: (data) => {
            updatedSeason = data;
            return {
                success: true
            }
        }
    };
    const divisionApi = {
        update: (data) => {
            updatedDivision = data;
            return {
                success: true
            }
        }
    };

    afterEach(() => {
        cleanUp(context);
    });

    async function divisionOrSeasonChanged(x) {
        changedDivisionOrSeason = x;
    }

    async function renderComponent(props, account, seasons, divisions, route, currentPath) {
        reportedError = null;
        changedDivisionOrSeason = null;
        reloadDivisionsCalled = false;
        reloadSeasonsCalled = false;
        updatedSeason = null;
        updatedDivision = null;
        context = await renderApp(
            { seasonApi, divisionApi },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                account,
                divisions,
                seasons,
                reloadSeasons: () => {
                    reloadSeasonsCalled = true;
                    return seasons; },
                reloadDivisions: () => {
                    reloadDivisionsCalled = true;
                    return divisions; }
            },
            (<DivisionControls {...props} onDivisionOrSeasonChanged={divisionOrSeasonChanged} />),
            route,
            currentPath);
    }

    function getOptions(group) {
        const items = Array.from(group.querySelectorAll('div.dropdown-menu .dropdown-item'));
        return items.map(i => i.textContent);
    }

    function getOption(group, containingText) {
        const items = Array.from(group.querySelectorAll('div.dropdown-menu .dropdown-item'));
        const item = items.filter(i => i.textContent.indexOf(containingText) !== -1)[0];
        expect(item).toBeTruthy();
        return item;
    }

    function getSeasonButtonGroup() {
        return context.container.querySelector('div.btn-group > div.btn-group:nth-child(1)');
    }

    function getDivisionButtonGroup() {
        return context.container.querySelector('div.btn-group > div.btn-group:nth-child(2)');
    }

    function getDate(monthOffset) {
        let date = new Date();
        date.setMonth(date.getMonth() + (monthOffset || 0))
        return date.toISOString();
    }

    function seasonDates(season) {
        return `(${renderDate(season.startDate)} - ${renderDate(season.endDate)})`;
    }

    function getShownData(group) {
        const buttons = Array.from(group.querySelectorAll('button'));
        expect(buttons.length).toBeGreaterThanOrEqual(1);
        return buttons[0];
    }

    async function toggleDropdown(group) {
        const toggle = group.querySelector('.dropdown-toggle');
        expect(toggle).toBeTruthy();
        await doClick(toggle);
    }

    function assertDropdownOpen(group, expectOpen) {
        const menu = group.querySelector('.dropdown-menu');
        expect(menu).toBeTruthy();
        if (expectOpen) {
            expect(menu.className).toContain('show');
        } else {
            expect(menu.className).not.toContain('show');
        }
    }

    describe('when logged out', () => {
        const account = null;
        const division1 = {
            id: createTemporaryId(),
            name: 'Division 1',
        };
        const division2 = {
            id: createTemporaryId(),
            name: 'Division 2',
        };
        const season1 = {
            id: createTemporaryId(),
            startDate: getDate(-1),
            endDate: getDate(2),
            name: 'Season 1',
            divisions: [ division1, division2 ],
        };
        const season2 = {
            id: createTemporaryId(),
            startDate: getDate(2),
            endDate: getDate(4),
            name: 'Season 2',
            divisions: [ division1 ],
        };
        const seasons = [ season1, season2 ];
        const divisions = [ division1, division2 ];

        describe('when in season', () => {
            it('shows current season', async () => {
                await renderComponent({
                    originalSeasonData: season1,
                    originalDivisionData: division1,
                    overrideMode: null,
                }, account, seasons, divisions);

                expect(reportedError).toBeNull();
                const seasonButton = getShownData(getSeasonButtonGroup());
                expect(seasonButton.textContent).toContain('Season 1');
                expect(seasonButton.textContent).toContain(seasonDates(season1));
            });

            it('shows other seasons', async () => {
                await renderComponent({
                    originalSeasonData: season1,
                    originalDivisionData: division1,
                    overrideMode: null,
                }, account, seasons, divisions);

                expect(reportedError).toBeNull();
                expect(getOptions(getSeasonButtonGroup())).toEqual([
                    'Season 2 ' + seasonDates(season2),
                    'Season 1 ' + seasonDates(season1) ]);
            });

            it('shows current division', async () => {
                await renderComponent({
                    originalSeasonData: season1,
                    originalDivisionData: division1,
                    overrideMode: null,
                }, account, seasons, divisions);

                expect(reportedError).toBeNull();
                const divisionButton = getShownData(getDivisionButtonGroup());
                expect(divisionButton.textContent).toEqual('Division 1');
            });

            it('shows other divisions', async () => {
                await renderComponent({
                    originalSeasonData: season1,
                    originalDivisionData: division1,
                    overrideMode: null,
                }, account, seasons, divisions);

                expect(reportedError).toBeNull();
                expect(getOptions(getDivisionButtonGroup())).toEqual([
                    'Division 1',
                    'Division 2' ]);
            });
        });

        describe('when out of season', () => {
            it('prompts user to select a season', async () => {
                await renderComponent({
                    originalSeasonData: null,
                    originalDivisionData: division1,
                    overrideMode: null,
                }, account, seasons, divisions);

                expect(reportedError).toBeNull();
                const seasonButton = getShownData(getSeasonButtonGroup());
                expect(seasonButton.textContent).toEqual('Select a season');
                assertDropdownOpen(getSeasonButtonGroup(), true);
            });

            it('shows other seasons', async () => {
                await renderComponent({
                    originalSeasonData: null,
                    originalDivisionData: division1,
                    overrideMode: null,
                }, account, seasons, divisions);

                expect(reportedError).toBeNull();
                expect(getOptions(getSeasonButtonGroup())).toEqual([
                    'Season 2 ' + seasonDates(season2),
                    'Season 1 ' + seasonDates(season1) ]);
            });

            it('shows all divisions', async () => {
                await renderComponent({
                    originalSeasonData: null,
                    originalDivisionData: division1,
                    overrideMode: null,
                }, account, seasons, divisions);

                expect(reportedError).toBeNull();
                const divisionButton = getShownData(getDivisionButtonGroup());
                expect(divisionButton.textContent).toEqual('All divisions');
            });

            it('shows no divisions', async () => {
                await renderComponent({
                    originalSeasonData: null,
                    originalDivisionData: division1,
                    overrideMode: null,
                }, account, seasons, divisions);

                expect(reportedError).toBeNull();
                expect(getOptions(getDivisionButtonGroup())).toEqual([ ]);
            });
        });
    });

    describe('when logged in', () => {
        const account = {
            access: {
                manageDivisions: true,
                manageSeasons: true,
            }
        };
        const division3 = {
            id: createTemporaryId(),
            name: 'Division 3',
        };
        const division4 = {
            id: createTemporaryId(),
            name: 'Division 4',
        };
        const season3 = {
            id: createTemporaryId(),
            startDate: getDate(-1),
            endDate: getDate(2),
            name: 'Season 3',
            divisions: [ division3, division4 ],
        };
        const season4 = {
            id: createTemporaryId(),
            startDate: getDate(2),
            endDate: getDate(4),
            name: 'Season 4',
            divisions: [ division3 ],
        };
        const seasons = [ season3, season4 ];
        const divisions = [ division3, division4 ];

        describe('when in season', () => {
            it('shows current season', async () => {
                await renderComponent({
                    originalSeasonData: season3,
                    originalDivisionData: division3,
                    overrideMode: null,
                }, account, seasons, divisions);

                expect(reportedError).toBeNull();
                const seasonButton = getShownData(getSeasonButtonGroup());
                expect(seasonButton.textContent).toContain('Season 3');
                expect(seasonButton.textContent).toContain(seasonDates(season3));
                expect(seasonButton.textContent).toContain('✏');
            });

            it('shows other seasons', async () => {
                await renderComponent({
                    originalSeasonData: season3,
                    originalDivisionData: division3,
                    overrideMode: null,
                }, account, seasons, divisions);

                expect(reportedError).toBeNull();
                expect(getOptions(getSeasonButtonGroup())).toEqual([
                    'Season 4 ' + seasonDates(season4),
                    'Season 3 ' + seasonDates(season3),
                    '➕ New season' ]);
            });

            it('shows current division', async () => {
                await renderComponent({
                    originalSeasonData: season3,
                    originalDivisionData: division3,
                    overrideMode: null,
                }, account, seasons, divisions);

                expect(reportedError).toBeNull();
                const divisionButton = getShownData(getDivisionButtonGroup());
                expect(divisionButton.textContent).toEqual('Division 3✏');
            });

            it('shows other divisions', async () => {
                await renderComponent({
                    originalSeasonData: season3,
                    originalDivisionData: division3,
                    overrideMode: null,
                }, account, seasons, divisions);

                expect(reportedError).toBeNull();
                expect(getOptions(getDivisionButtonGroup())).toEqual([
                    'Division 3',
                    'Division 4',
                    '➕ New division' ]);
            });
        });

        describe('when out of season', () => {
            it('prompts user to select a season', async () => {
                await renderComponent({
                    originalSeasonData: null,
                    originalDivisionData: division3,
                    overrideMode: null,
                }, account, seasons, divisions);

                expect(reportedError).toBeNull();
                const seasonButton = getShownData(getSeasonButtonGroup());
                expect(seasonButton.textContent).toEqual('Select a season');
                assertDropdownOpen(getSeasonButtonGroup(), true);
            });

            it('shows other seasons', async () => {
                await renderComponent({
                    originalSeasonData: null,
                    originalDivisionData: division3,
                    overrideMode: null,
                }, account, seasons, divisions);

                expect(reportedError).toBeNull();
                expect(getOptions(getSeasonButtonGroup())).toEqual([
                    'Season 4 ' + seasonDates(season4),
                    'Season 3 ' + seasonDates(season3),
                    '➕ New season' ]);
            });

            it('shows all divisions', async () => {
                await renderComponent({
                    originalSeasonData: null,
                    originalDivisionData: division3,
                    overrideMode: null,
                }, account, seasons, divisions);

                expect(reportedError).toBeNull();
                const divisionButton = getShownData(getDivisionButtonGroup());
                expect(divisionButton.textContent).toEqual('All divisions');
            });

            it('shows no divisions', async () => {
                await renderComponent({
                    originalSeasonData: null,
                    originalDivisionData: division3,
                    overrideMode: null,
                }, account, seasons, divisions);

                expect(reportedError).toBeNull();
                expect(getOptions(getDivisionButtonGroup())).toEqual([ ]);
            });
        });
    });

    describe('interactivity', () => {
        const division5 = {
            id: createTemporaryId(),
            name: 'Division 5',
        };
        const division6 = {
            id: createTemporaryId(),
            name: 'Division 6',
        };
        const season5 = {
            id: createTemporaryId(),
            startDate: getDate(-1),
            endDate: getDate(2),
            name: 'Season 5',
            divisions: [ division5, division6 ],
        };
        const season6 = {
            id: createTemporaryId(),
            startDate: getDate(2),
            endDate: getDate(4),
            name: 'Season 6',
            divisions: [ division5 ],
        };
        const seasons = [ season5, season6 ];
        const divisions = [ division5, division6 ];

        describe('common', () => {
            const account = null;

            it('can open season drop down', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                    overrideMode: null,
                }, account, seasons, divisions);
                expect(reportedError).toBeNull();
                const group = getSeasonButtonGroup();
                assertDropdownOpen(group, false);

                await toggleDropdown(group);

                assertDropdownOpen(group, true);
            });

            it('can open division drop down', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                    overrideMode: null,
                }, account, seasons, divisions);
                expect(reportedError).toBeNull();
                const group = getDivisionButtonGroup();
                assertDropdownOpen(group, false);

                await toggleDropdown(group);

                assertDropdownOpen(group, true);
            });

            it('can close season drop down', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                    overrideMode: null,
                }, account, seasons, divisions);
                expect(reportedError).toBeNull();
                const group = getSeasonButtonGroup();
                assertDropdownOpen(group, false);

                await toggleDropdown(group);
                await toggleDropdown(group);

                assertDropdownOpen(group, false);
            });

            it('navigates correctly when mode overridden', async () => {
                const route = '/division/:divisionId/:mode/:seasonId';
                const currentPath = '/division/DIVISION_ID/team:TEAM_ID/SEASON_ID';

                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                    overrideMode: 'OVERRIDE',
                }, account, seasons, divisions, route, currentPath);

                const group = getSeasonButtonGroup();
                expect(reportedError).toBeNull();
                const option = getOption(group, 'Season 6');
                expect(option.href).toContain(`/division/${division5.id}/OVERRIDE/${season6.id}`);
                const shownButton = group.querySelector('button.btn-light') || group.querySelector('button.btn-info');
                expect(shownButton).toBeTruthy();

                await doClick(shownButton);

                expect(mockedUsedNavigate).toHaveBeenCalledWith(`/division/${division5.id}/OVERRIDE/${season5.id}`);
            });

            it('navigates correctly when on team overview page', async () => {
                const route = '/division/:divisionId/:mode/:seasonId';
                const currentPath = '/division/DIVISION_ID/team:TEAM_ID/SEASON_ID';

                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                    overrideMode: null,
                }, account, seasons, divisions, route, currentPath);

                const group = getSeasonButtonGroup();
                expect(reportedError).toBeNull();
                const option = getOption(group, 'Season 6');
                expect(option.href).toContain(`/division/${division5.id}/team:TEAM_ID/${season6.id}`);
                const shownButton = group.querySelector('button.btn-light') || group.querySelector('button.btn-info');
                expect(shownButton).toBeTruthy();

                await doClick(shownButton);

                expect(mockedUsedNavigate).toHaveBeenCalledWith(`/division/${division5.id}/teams/${season5.id}`);
            });

            it('navigates correctly when on player overview page', async () => {
                const route = '/division/:divisionId/:mode/:seasonId';
                const currentPath = '/division/DIVISION_ID/player:PLAYER_ID/SEASON_ID';

                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                    overrideMode: null,
                }, account, seasons, divisions, route, currentPath);

                const group = getSeasonButtonGroup();
                expect(reportedError).toBeNull();
                const option = getOption(group, 'Season 6');
                expect(option.href).toContain(`/division/${division5.id}/player:PLAYER_ID/${season6.id}`);
                const shownButton = group.querySelector('button.btn-light') || group.querySelector('button.btn-info');
                expect(shownButton).toBeTruthy();

                await doClick(shownButton);

                expect(mockedUsedNavigate).toHaveBeenCalledWith(`/division/${division5.id}/players/${season5.id}`);
            });

            it('navigates to first division in other season when current division not in other season', async () => {
                const route = '/division/:divisionId/:mode/:seasonId';
                const currentPath = '/division/DIVISION_ID/player:PLAYER_ID/SEASON_ID';

                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division6,
                    overrideMode: null,
                }, account, seasons, divisions, route, currentPath);

                const group = getSeasonButtonGroup();
                expect(reportedError).toBeNull();
                const option = getOption(group, 'Season 6');
                expect(option.href).toContain(`/division/${division5.id}`); // highlighting that division5 will be selected
                expect(option.href).toContain(`/${season6.id}`);
            })
        });

        describe('when logged in', () => {
            const account = {
                access: {
                    manageDivisions: true,
                    manageSeasons: true,
                }
            };

            it('can show edit season dialog', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                    overrideMode: null,
                }, account, seasons, divisions);
                expect(reportedError).toBeNull();
                const editSeasonButton = getSeasonButtonGroup().querySelector('button.btn-info');
                expect(editSeasonButton).toBeTruthy();

                await doClick(editSeasonButton);

                const dialog = context.container.querySelector('.btn-group .modal-dialog');
                expect(dialog).toBeTruthy();
                expect(dialog.textContent).toContain('Edit a season');
            });

            it('can show add season dialog', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                    overrideMode: null,
                }, account, seasons, divisions);
                expect(reportedError).toBeNull();
                const addSeasonOption = getOption(getSeasonButtonGroup(), '➕ New season');

                await doClick(addSeasonOption, 'span');

                const dialog = context.container.querySelector('.btn-group .modal-dialog');
                expect(dialog).toBeTruthy();
                expect(dialog.textContent).toContain('Create a season');
            });

            it('can save season details', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                    overrideMode: null,
                }, account, seasons, divisions);
                expect(reportedError).toBeNull();
                const editSeasonButton = getSeasonButtonGroup().querySelector('button.btn-info');
                expect(editSeasonButton).toBeTruthy();
                await doClick(editSeasonButton);

                const saveButton = Array.from(context.container.querySelectorAll('.btn-group .modal-dialog button'))
                    .filter(btn => btn.textContent === 'Update season')[0];
                await doClick(saveButton);

                expect(reportedError).toBeNull();
                const dialog = context.container.querySelector('.btn-group .modal-dialog');
                expect(dialog).toBeFalsy();
                expect(changedDivisionOrSeason).toEqual('season');
                expect(reloadSeasonsCalled).toEqual(true);
                expect(updatedSeason).not.toBeNull();
            });

            it('can close add/edit season dialog', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                    overrideMode: null,
                }, account, seasons, divisions);
                expect(reportedError).toBeNull();
                const editSeasonButton = getSeasonButtonGroup().querySelector('button.btn-info');
                expect(editSeasonButton).toBeTruthy();
                await doClick(editSeasonButton);

                const closeButton = Array.from(context.container.querySelectorAll('.btn-group .modal-dialog button'))
                    .filter(btn => btn.textContent === 'Close')[0];
                await doClick(closeButton);

                const dialog = context.container.querySelector('.btn-group .modal-dialog');
                expect(dialog).toBeFalsy();
            });

            it('can show edit division dialog', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                    overrideMode: null,
                }, account, seasons, divisions);
                expect(reportedError).toBeNull();
                const editDivisionButton = getDivisionButtonGroup().querySelector('button.btn-info');
                expect(editDivisionButton).toBeTruthy();

                await doClick(editDivisionButton);

                const dialog = context.container.querySelector('.btn-group .modal-dialog');
                expect(dialog).toBeTruthy();
                expect(dialog.textContent).toContain('Edit a division');
            });

            it('can show add division dialog', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                    overrideMode: null,
                }, account, seasons, divisions);
                expect(reportedError).toBeNull();
                const addDivisionOption = getOption(getDivisionButtonGroup(), '➕ New division');

                await doClick(addDivisionOption, 'span');

                const dialog = context.container.querySelector('.btn-group .modal-dialog');
                expect(dialog).toBeTruthy();
                expect(dialog.textContent).toContain('Create a division');
            });

            it('can save division details', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                    overrideMode: null,
                }, account, seasons, divisions);
                expect(reportedError).toBeNull();
                const editDivisionButton = getDivisionButtonGroup().querySelector('button.btn-info');
                expect(editDivisionButton).toBeTruthy();
                await doClick(editDivisionButton);

                const saveButton = Array.from(context.container.querySelectorAll('.btn-group .modal-dialog button'))
                    .filter(btn => btn.textContent === 'Update division')[0];
                await doClick(saveButton);

                expect(reportedError).toBeNull();
                const dialog = context.container.querySelector('.btn-group .modal-dialog');
                expect(dialog).toBeFalsy();
                expect(changedDivisionOrSeason).toEqual('division');
                expect(reloadDivisionsCalled).toEqual(true);
                expect(updatedDivision).not.toBeNull();
            });

            it('can close add/edit division dialog', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                    overrideMode: null,
                }, account, seasons, divisions);
                expect(reportedError).toBeNull();
                const editDivisionButton = getDivisionButtonGroup().querySelector('button.btn-info');
                expect(editDivisionButton).toBeTruthy();
                await doClick(editDivisionButton);

                const closeButton = Array.from(context.container.querySelectorAll('.btn-group .modal-dialog button'))
                    .filter(btn => btn.textContent === 'Close')[0];
                await doClick(closeButton);

                const dialog = context.container.querySelector('.btn-group .modal-dialog');
                expect(dialog).toBeFalsy();
            });
        });
    });
});