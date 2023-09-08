// noinspection JSUnresolvedFunction

import {cleanUp, doClick, doSelectOption, findButton, renderApp} from "../helpers/tests";
import React from "react";
import {DivisionControls} from "./DivisionControls";
import {renderDate} from "../helpers/rendering";
import {divisionBuilder, seasonBuilder} from "../helpers/builders";

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
        update: (data, lastUpdated) => {
            updatedSeason = {data, lastUpdated};
            return {
                success: true
            }
        }
    };
    const divisionApi = {
        update: (data, lastUpdated) => {
            updatedDivision = {data, lastUpdated};
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
            {seasonApi, divisionApi},
            {name: 'Courage Scores'},
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
                    return seasons;
                },
                reloadDivisions: () => {
                    reloadDivisionsCalled = true;
                    return divisions;
                }
            },
            (<DivisionControls {...props} onDivisionOrSeasonChanged={divisionOrSeasonChanged}/>),
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
        await doClick(group.querySelector('.dropdown-toggle'));
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
        const division1 = divisionBuilder('Division 1').build();
        const division2 = divisionBuilder('Division 2').build();
        const season1 = seasonBuilder('Season 1')
            .starting(getDate(-1))
            .ending(getDate(2))
            .withDivision(division1)
            .withDivision(division2)
            .build();
        const season2 = seasonBuilder('Season 2')
            .starting(getDate(2))
            .ending(getDate(4))
            .withDivision(division1)
            .build();
        const seasons = [season1, season2];
        const divisions = [division1, division2];

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
                    'Season 1 ' + seasonDates(season1)]);
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
                    'Division 2']);
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
                    'Season 1 ' + seasonDates(season1)]);
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
                expect(getOptions(getDivisionButtonGroup())).toEqual([]);
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
        const division3 = divisionBuilder('Division 3').build();
        const division4 = divisionBuilder('Division 4').build();
        const season3 = seasonBuilder('Season 3')
            .starting(getDate(-1))
            .ending(getDate(2))
            .withDivision(division3)
            .withDivision(division4)
            .build();
        const season4 = seasonBuilder('Season 4')
            .starting(getDate(2))
            .ending(getDate(4))
            .withDivision(division3)
            .build();
        const seasons = [season3, season4];
        const divisions = [division3, division4];

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
                    '➕ New season']);
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
                    '➕ New division']);
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
                    '➕ New season']);
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
                expect(getOptions(getDivisionButtonGroup())).toEqual([]);
            });
        });
    });

    describe('interactivity', () => {
        const division5 = divisionBuilder('Division 5').build();
        const division6 = divisionBuilder('Division 6').build();
        const season5 = seasonBuilder('Season 5')
            .starting(getDate(-1))
            .ending(getDate(2))
            .withDivision(division5)
            .withDivision(division6)
            .build();
        const season6 = seasonBuilder('Season 6')
            .starting(getDate(2))
            .ending(getDate(4))
            .withDivision(division5)
            .build();
        const seasons = [season5, season6];
        const divisions = [division5, division6];

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
                expect(option.href).toContain(`/division/${encodeURI(division5.name)}/OVERRIDE/${encodeURI(season6.name)}`);

                await doClick(findButton(group, `Season 5 ${seasonDates(season5)}`));

                expect(mockedUsedNavigate).toHaveBeenCalledWith(`/division/${division5.name}/OVERRIDE/${season5.name}`);
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
                expect(option.href).toContain(`/division/${encodeURI(division5.name)}/team:TEAM_ID/${encodeURI(season6.name)}`);

                await doClick(findButton(group, `Season 5 ${seasonDates(season5)}`));

                expect(mockedUsedNavigate).toHaveBeenCalledWith(`/division/${division5.name}/teams/${season5.name}`);
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
                expect(option.href).toContain(`/division/${encodeURI(division5.name)}/player:PLAYER_ID/${encodeURI(season6.name)}`);

                await doClick(findButton(group, 'Season 5 ' + seasonDates(season5)));

                expect(mockedUsedNavigate).toHaveBeenCalledWith(`/division/${division5.name}/players/${season5.name}`);
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
                expect(option.href).toContain(`/division/${encodeURI(division5.name)}`); // highlighting that division5 will be selected
                expect(option.href).toContain(`/${encodeURI(season6.name)}`);
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

                await doClick(findButton(getSeasonButtonGroup(), `Season 5 ${seasonDates(season5)}✏`));

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

                await doSelectOption(getSeasonButtonGroup().querySelector('.dropdown-menu'), '➕ New season');

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
                await doClick(findButton(getSeasonButtonGroup(), `Season 5 ${seasonDates(season5)}✏`));

                await doClick(findButton(context.container, 'Update season'));

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
                await doClick(findButton(getSeasonButtonGroup(), `Season 5 ${seasonDates(season5)}✏`));

                await doClick(findButton(context.container, 'Close'));

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

                await doClick(findButton(getDivisionButtonGroup(), 'Division 5✏'));

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

                await doSelectOption(getDivisionButtonGroup().querySelector('.dropdown-menu'), '➕ New division');

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
                await doClick(findButton(getDivisionButtonGroup(), 'Division 5✏'));

                await doClick(findButton(context.container, 'Update division'));

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
                await doClick(findButton(getDivisionButtonGroup(), 'Division 5✏'));

                await doClick(findButton(context.container, 'Close'));

                const dialog = context.container.querySelector('.btn-group .modal-dialog');
                expect(dialog).toBeFalsy();
            });
        });
    });
});