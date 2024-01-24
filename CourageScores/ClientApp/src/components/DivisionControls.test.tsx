import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    doSelectOption, ErrorState,
    findButton,
    iocProps,
    renderApp,
    TestContext
} from "../helpers/tests";
import React from "react";
import {DivisionControls, IDivisionControlsProps} from "./DivisionControls";
import {renderDate} from "../helpers/rendering";
import {IEditSeasonDto} from "../interfaces/serverSide/Season/IEditSeasonDto";
import {ISeasonDto} from "../interfaces/serverSide/Season/ISeasonDto";
import {IEditDivisionDto} from "../interfaces/serverSide/IEditDivisionDto";
import {IDivisionDto} from "../interfaces/serverSide/IDivisionDto";
import {IUserDto} from "../interfaces/serverSide/Identity/IUserDto";
import {IClientActionResultDto} from "../interfaces/IClientActionResultDto";
import {ISeasonApi} from "../api/season";
import {IDivisionApi} from "../api/division";
import {divisionBuilder} from "../helpers/builders/divisions";
import {seasonBuilder} from "../helpers/builders/seasons";

const mockedUsedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedUsedNavigate,
}));

describe('DivisionControls', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let changedDivisionOrSeason: boolean;
    let reloadSeasonsCalled: boolean;
    let reloadDivisionsCalled: boolean;
    let updatedSeason: {data: IEditSeasonDto, lastUpdated?: string};
    let updatedDivision: {data: IEditDivisionDto, lastUpdated?: string};
    const seasonApi = api<ISeasonApi>({
        update: (data: IEditSeasonDto, lastUpdated?: string): Promise<IClientActionResultDto<ISeasonDto>> => {
            updatedSeason = {data, lastUpdated};
            return {
                success: true,
            } as any;
        }
    });
    const divisionApi = api<IDivisionApi>({
        update: (data: IEditDivisionDto, lastUpdated?: string): Promise<IClientActionResultDto<IDivisionDto>> => {
            updatedDivision = {data, lastUpdated};
            return {
                success: true
            } as any;
        }
    });

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        changedDivisionOrSeason = null;
        reloadDivisionsCalled = false;
        reloadSeasonsCalled = false;
        updatedSeason = null;
        updatedDivision = null;
    });

    async function divisionOrSeasonChanged(x?: boolean) {
        changedDivisionOrSeason = x;
    }

    async function renderComponent(props: IDivisionControlsProps, account: IUserDto, seasons: ISeasonDto[], divisions: IDivisionDto[], route?: string, currentPath?: string) {
        context = await renderApp(
            iocProps({seasonApi, divisionApi}),
            brandingProps(),
            appProps({
                account,
                divisions,
                seasons,
                reloadSeasons: async () => {
                    reloadSeasonsCalled = true;
                    return seasons;
                },
                reloadDivisions: async () => {
                    reloadDivisionsCalled = true;
                    return divisions;
                }
            }, reportedError),
            (<DivisionControls {...props} onDivisionOrSeasonChanged={divisionOrSeasonChanged}/>),
            route,
            currentPath);
    }

    function getOptions(group: Element) {
        const items = Array.from(group.querySelectorAll('div.dropdown-menu .dropdown-item')) as HTMLElement[];
        return items.map(i => i.textContent);
    }

    function getOption(group: Element, containingText: string) {
        const items = Array.from(group.querySelectorAll('div.dropdown-menu .dropdown-item')) as HTMLAnchorElement[];
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

    function getDate(monthOffset: number) {
        let date = new Date();
        date.setMonth(date.getMonth() + (monthOffset || 0))
        return date.toISOString();
    }

    function seasonDates(season: ISeasonDto) {
        return `(${renderDate(season.startDate)} - ${renderDate(season.endDate)})`;
    }

    function getShownData(group: Element) {
        const buttons = Array.from(group.querySelectorAll('button')) as HTMLButtonElement[];
        expect(buttons.length).toBeGreaterThanOrEqual(1);
        return buttons[0];
    }

    async function toggleDropdown(group: Element) {
        await doClick(group.querySelector('.dropdown-toggle'));
    }

    function assertDropdownOpen(group: Element, expectOpen: boolean) {
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
        const division1: IDivisionDto = divisionBuilder('Division 1').build();
        const division2: IDivisionDto = divisionBuilder('Division 2').build();
        const season1: ISeasonDto = seasonBuilder('Season 1')
            .starting(getDate(-1))
            .ending(getDate(2))
            .withDivision(division1)
            .withDivision(division2)
            .build();
        const season2: ISeasonDto = seasonBuilder('Season 2')
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
                } as any, account, seasons, divisions);

                expect(reportedError.hasError()).toEqual(false);
                const seasonButton = getShownData(getSeasonButtonGroup());
                expect(seasonButton.textContent).toContain('Season 1');
                expect(seasonButton.textContent).toContain(seasonDates(season1));
            });

            it('shows other seasons', async () => {
                await renderComponent({
                    originalSeasonData: season1,
                    originalDivisionData: division1,
                    overrideMode: null,
                } as any, account, seasons, divisions);

                expect(reportedError.hasError()).toEqual(false);
                expect(getOptions(getSeasonButtonGroup())).toEqual([
                    'Season 2 ' + seasonDates(season2),
                    'Season 1 ' + seasonDates(season1)]);
            });

            it('shows current division', async () => {
                await renderComponent({
                    originalSeasonData: season1,
                    originalDivisionData: division1,
                    overrideMode: null,
                } as any, account, seasons, divisions);

                expect(reportedError.hasError()).toEqual(false);
                const divisionButton = getShownData(getDivisionButtonGroup());
                expect(divisionButton.textContent).toEqual('Division 1');
            });

            it('shows other divisions', async () => {
                await renderComponent({
                    originalSeasonData: season1,
                    originalDivisionData: division1,
                    overrideMode: null,
                } as any, account, seasons, divisions);

                expect(reportedError.hasError()).toEqual(false);
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
                } as any, account, seasons, divisions);

                expect(reportedError.hasError()).toEqual(false);
                const seasonButton = getShownData(getSeasonButtonGroup());
                expect(seasonButton.textContent).toEqual('Select a season');
                assertDropdownOpen(getSeasonButtonGroup(), true);
            });

            it('shows other seasons', async () => {
                await renderComponent({
                    originalSeasonData: null,
                    originalDivisionData: division1,
                    overrideMode: null,
                } as any, account, seasons, divisions);

                expect(reportedError.hasError()).toEqual(false);
                expect(getOptions(getSeasonButtonGroup())).toEqual([
                    'Season 2 ' + seasonDates(season2),
                    'Season 1 ' + seasonDates(season1)]);
            });

            it('shows all divisions', async () => {
                await renderComponent({
                    originalSeasonData: null,
                    originalDivisionData: division1,
                    overrideMode: null,
                } as any, account, seasons, divisions);

                expect(reportedError.hasError()).toEqual(false);
                const divisionButton = getShownData(getDivisionButtonGroup());
                expect(divisionButton.textContent).toEqual('All divisions');
            });

            it('shows no divisions', async () => {
                await renderComponent({
                    originalSeasonData: null,
                    originalDivisionData: division1,
                    overrideMode: null,
                } as any, account, seasons, divisions);

                expect(reportedError.hasError()).toEqual(false);
                expect(getOptions(getDivisionButtonGroup())).toEqual([]);
            });
        });
    });

    describe('when logged in', () => {
        const account: IUserDto = {
            name: '',
            givenName: '',
            emailAddress: '',
            access: {
                manageDivisions: true,
                manageSeasons: true,
            }
        };
        const division3: IDivisionDto = divisionBuilder('Division 3').build();
        const division4: IDivisionDto = divisionBuilder('Division 4').build();
        const season3: ISeasonDto = seasonBuilder('Season 3')
            .starting(getDate(-1))
            .ending(getDate(2))
            .withDivision(division3)
            .withDivision(division4)
            .build();
        const season4: ISeasonDto = seasonBuilder('Season 4')
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
                } as any, account, seasons, divisions);

                expect(reportedError.hasError()).toEqual(false);
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
                } as any, account, seasons, divisions);

                expect(reportedError.hasError()).toEqual(false);
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
                } as any, account, seasons, divisions);

                expect(reportedError.hasError()).toEqual(false);
                const divisionButton = getShownData(getDivisionButtonGroup());
                expect(divisionButton.textContent).toEqual('Division 3✏');
            });

            it('shows other divisions', async () => {
                await renderComponent({
                    originalSeasonData: season3,
                    originalDivisionData: division3,
                    overrideMode: null,
                } as any, account, seasons, divisions);

                expect(reportedError.hasError()).toEqual(false);
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
                } as any, account, seasons, divisions);

                expect(reportedError.hasError()).toEqual(false);
                const seasonButton = getShownData(getSeasonButtonGroup());
                expect(seasonButton.textContent).toEqual('Select a season');
                assertDropdownOpen(getSeasonButtonGroup(), true);
            });

            it('shows other seasons', async () => {
                await renderComponent({
                    originalSeasonData: null,
                    originalDivisionData: division3,
                    overrideMode: null,
                } as any, account, seasons, divisions);

                expect(reportedError.hasError()).toEqual(false);
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
                } as any, account, seasons, divisions);

                expect(reportedError.hasError()).toEqual(false);
                const divisionButton = getShownData(getDivisionButtonGroup());
                expect(divisionButton.textContent).toEqual('All divisions');
            });

            it('shows no divisions', async () => {
                await renderComponent({
                    originalSeasonData: null,
                    originalDivisionData: division3,
                    overrideMode: null,
                } as any, account, seasons, divisions);

                expect(reportedError.hasError()).toEqual(false);
                expect(getOptions(getDivisionButtonGroup())).toEqual([]);
            });
        });
    });

    describe('interactivity', () => {
        const division5: IDivisionDto = divisionBuilder('Division 5').build();
        const division6: IDivisionDto = divisionBuilder('Division 6').build();
        const season5: ISeasonDto = seasonBuilder('Season 5')
            .starting(getDate(-1))
            .ending(getDate(2))
            .withDivision(division5)
            .withDivision(division6)
            .build();
        const season6: ISeasonDto = seasonBuilder('Season 6')
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
                } as any, account, seasons, divisions);
                expect(reportedError.hasError()).toEqual(false);
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
                } as any, account, seasons, divisions);
                expect(reportedError.hasError()).toEqual(false);
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
                } as any, account, seasons, divisions);
                expect(reportedError.hasError()).toEqual(false);
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
                } as any, account, seasons, divisions, route, currentPath);

                const group = getSeasonButtonGroup();
                expect(reportedError.hasError()).toEqual(false);
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
                } as any, account, seasons, divisions, route, currentPath);

                const group = getSeasonButtonGroup();
                expect(reportedError.hasError()).toEqual(false);
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
                } as any, account, seasons, divisions, route, currentPath);

                const group = getSeasonButtonGroup();
                expect(reportedError.hasError()).toEqual(false);
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
                } as any, account, seasons, divisions, route, currentPath);

                const group = getSeasonButtonGroup();
                expect(reportedError.hasError()).toEqual(false);
                const option = getOption(group, 'Season 6');
                expect(option.href).toContain(`/division/${encodeURI(division5.name)}`); // highlighting that division5 will be selected
                expect(option.href).toContain(`/${encodeURI(season6.name)}`);
            })
        });

        describe('when logged in', () => {
            const account: IUserDto = {
                name: '',
                givenName: '',
                emailAddress: '',
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
                } as any, account, seasons, divisions);
                expect(reportedError.hasError()).toEqual(false);

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
                } as any, account, seasons, divisions);
                expect(reportedError.hasError()).toEqual(false);

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
                } as any, account, seasons, divisions);
                expect(reportedError.hasError()).toEqual(false);
                await doClick(findButton(getSeasonButtonGroup(), `Season 5 ${seasonDates(season5)}✏`));

                await doClick(findButton(context.container, 'Update season'));

                expect(reportedError.hasError()).toEqual(false);
                const dialog = context.container.querySelector('.btn-group .modal-dialog');
                expect(dialog).toBeFalsy();
                expect(changedDivisionOrSeason).toEqual(true);
                expect(reloadSeasonsCalled).toEqual(true);
                expect(updatedSeason).not.toBeNull();
            });

            it('can close add/edit season dialog', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                    overrideMode: null,
                } as any, account, seasons, divisions);
                expect(reportedError.hasError()).toEqual(false);
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
                } as any, account, seasons, divisions);
                expect(reportedError.hasError()).toEqual(false);

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
                } as any, account, seasons, divisions);
                expect(reportedError.hasError()).toEqual(false);

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
                } as any, account, seasons, divisions);
                expect(reportedError.hasError()).toEqual(false);
                await doClick(findButton(getDivisionButtonGroup(), 'Division 5✏'));

                await doClick(findButton(context.container, 'Update division'));

                expect(reportedError.hasError()).toEqual(false);
                const dialog = context.container.querySelector('.btn-group .modal-dialog');
                expect(dialog).toBeFalsy();
                expect(changedDivisionOrSeason).toEqual(true);
                expect(reloadDivisionsCalled).toEqual(true);
                expect(updatedDivision).not.toBeNull();
            });

            it('can close add/edit division dialog', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                    overrideMode: null,
                } as any, account, seasons, divisions);
                expect(reportedError.hasError()).toEqual(false);
                await doClick(findButton(getDivisionButtonGroup(), 'Division 5✏'));

                await doClick(findButton(context.container, 'Close'));

                const dialog = context.container.querySelector('.btn-group .modal-dialog');
                expect(dialog).toBeFalsy();
            });
        });
    });
});