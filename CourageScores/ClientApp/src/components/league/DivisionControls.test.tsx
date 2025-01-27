import {
    api,
    appProps,
    brandingProps,
    cleanUp, doChange,
    doClick,
    doSelectOption, ErrorState,
    findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {DivisionControls, IDivisionControlsProps} from "./DivisionControls";
import {renderDate} from "../../helpers/rendering";
import {EditSeasonDto} from "../../interfaces/models/dtos/Season/EditSeasonDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {EditDivisionDto} from "../../interfaces/models/dtos/EditDivisionDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {divisionBuilder} from "../../helpers/builders/divisions";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {IDivisionApi} from "../../interfaces/apis/IDivisionApi";
import {ISeasonApi} from "../../interfaces/apis/ISeasonApi";

describe('DivisionControls', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let changedDivisionOrSeason: boolean | undefined;
    let reloadSeasonsCalled: boolean;
    let reloadDivisionsCalled: boolean;
    let updatedSeason: EditSeasonDto | null;
    let updatedDivision: EditDivisionDto | null;
    let seasonApiResult: IClientActionResultDto<SeasonDto> | null;
    let divisionApiResult: IClientActionResultDto<DivisionDto> | null;

    const seasonApi = api<ISeasonApi>({
        update: async (data: EditSeasonDto): Promise<IClientActionResultDto<SeasonDto>> => {
            updatedSeason = data;
            return seasonApiResult || {
                success: true,
            };
        }
    });
    const divisionApi = api<IDivisionApi>({
        update: async (data: EditDivisionDto): Promise<IClientActionResultDto<DivisionDto>> => {
            updatedDivision = data;
            return divisionApiResult || {
                success: true
            };
        }
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        changedDivisionOrSeason = undefined;
        reloadDivisionsCalled = false;
        reloadSeasonsCalled = false;
        updatedSeason = null;
        updatedDivision = null;
        seasonApiResult = null;
        divisionApiResult = null;
    });

    async function divisionOrSeasonChanged(preventReloadIfIdsAreTheSame?: boolean) {
        changedDivisionOrSeason = preventReloadIfIdsAreTheSame;
    }

    async function renderComponent(props: IDivisionControlsProps, account: UserDto | null, seasons: SeasonDto[], divisions: DivisionDto[], route?: string, currentPath?: string) {
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
        const item = items.filter(i => i.textContent!.indexOf(containingText) !== -1)[0];
        expect(item).toBeTruthy();
        return item;
    }

    function getSeasonButtonGroup() {
        return context.container.querySelector('div.btn-group > div.btn-group:nth-child(1)')!;
    }

    function getDivisionButtonGroup() {
        return context.container.querySelector('div.btn-group > div.btn-group:nth-child(2)')!;
    }

    function getDate(monthOffset: number) {
        let date = new Date();
        date.setMonth(date.getMonth() + (monthOffset || 0))
        return date.toISOString();
    }

    function seasonDates(season: SeasonDto) {
        return `(${renderDate(season.startDate)} - ${renderDate(season.endDate)})`;
    }

    function getShownData(group: Element) {
        const buttons = Array.from(group.querySelectorAll('button')) as HTMLButtonElement[];
        expect(buttons.length).toBeGreaterThanOrEqual(1);
        return buttons[0];
    }

    async function toggleDropdown(group: Element) {
        await doClick(group.querySelector('.dropdown-toggle')!);
    }

    function assertDropdownOpen(group: Element, expectOpen: boolean) {
        const menu = group.querySelector('.dropdown-menu')!;
        expect(menu).toBeTruthy();
        if (expectOpen) {
            expect(menu.className).toContain('show');
        } else {
            expect(menu.className).not.toContain('show');
        }
    }

    describe('when logged out', () => {
        const account: UserDto | null = null;
        const division1: DivisionDto = divisionBuilder('Division 1').build();
        const division2: DivisionDto = divisionBuilder('Division 2').build();
        const season1: SeasonDto = seasonBuilder('Season 1')
            .starting(getDate(-1))
            .ending(getDate(2))
            .withDivision(division1)
            .withDivision(division2)
            .build();
        const season2: SeasonDto = seasonBuilder('Season 2')
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
                }, account, seasons, divisions);

                reportedError.verifyNoError();
                const seasonButton = getShownData(getSeasonButtonGroup());
                expect(seasonButton.textContent).toContain('Season 1');
                expect(seasonButton.textContent).toContain(seasonDates(season1));
            });

            it('shows other seasons', async () => {
                await renderComponent({
                    originalSeasonData: season1,
                    originalDivisionData: division1,
                }, account, seasons, divisions);

                reportedError.verifyNoError();
                expect(getOptions(getSeasonButtonGroup())).toEqual([
                    'Season 2 ' + seasonDates(season2),
                    'Season 1 ' + seasonDates(season1)]);
            });

            it('shows current division', async () => {
                await renderComponent({
                    originalSeasonData: season1,
                    originalDivisionData: division1,
                }, account, seasons, divisions);

                reportedError.verifyNoError();
                const divisionButton = getShownData(getDivisionButtonGroup());
                expect(divisionButton.textContent).toEqual('Division 1');
            });

            it('shows other divisions', async () => {
                await renderComponent({
                    originalSeasonData: season1,
                    originalDivisionData: division1,
                }, account, seasons, divisions);

                reportedError.verifyNoError();
                expect(getOptions(getDivisionButtonGroup())).toEqual([
                    'Division 1',
                    'Division 2']);
            });
        });

        describe('when out of season', () => {
            it('prompts user to select a season', async () => {
                await renderComponent({
                    originalDivisionData: division1,
                }, account, seasons, divisions);

                reportedError.verifyNoError();
                const seasonButton = getShownData(getSeasonButtonGroup());
                expect(seasonButton.textContent).toEqual('Select a season');
                assertDropdownOpen(getSeasonButtonGroup(), true);
            });

            it('shows other seasons', async () => {
                await renderComponent({
                    originalDivisionData: division1,
                }, account, seasons, divisions);

                reportedError.verifyNoError();
                expect(getOptions(getSeasonButtonGroup())).toEqual([
                    'Season 2 ' + seasonDates(season2),
                    'Season 1 ' + seasonDates(season1)]);
            });

            it('shows all divisions', async () => {
                await renderComponent({
                    originalDivisionData: division1,
                }, account, seasons, divisions);

                reportedError.verifyNoError();
                const divisionButton = getShownData(getDivisionButtonGroup());
                expect(divisionButton.textContent).toEqual('All divisions');
            });

            it('shows no divisions', async () => {
                await renderComponent({
                    originalDivisionData: division1,
                }, account, seasons, divisions);

                reportedError.verifyNoError();
                expect(getOptions(getDivisionButtonGroup())).toEqual([]);
            });
        });
    });

    describe('when logged in', () => {
        const account: UserDto = {
            name: '',
            givenName: '',
            emailAddress: '',
            access: {
                manageDivisions: true,
                manageSeasons: true,
            }
        };
        const division3:DivisionDto = divisionBuilder('Division 3').build();
        const division4: DivisionDto = divisionBuilder('Division 4').build();
        const season3: SeasonDto = seasonBuilder('Season 3')
            .starting(getDate(-1))
            .ending(getDate(2))
            .withDivision(division3)
            .withDivision(division4)
            .build();
        const season4: SeasonDto = seasonBuilder('Season 4')
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
                }, account, seasons, divisions);

                reportedError.verifyNoError();
                const seasonButton = getShownData(getSeasonButtonGroup());
                expect(seasonButton.textContent).toContain('Season 3');
                expect(seasonButton.textContent).toContain(seasonDates(season3));
                expect(seasonButton.textContent).toContain('✏');
            });

            it('shows other seasons', async () => {
                await renderComponent({
                    originalSeasonData: season3,
                    originalDivisionData: division3,
                }, account, seasons, divisions);

                reportedError.verifyNoError();
                expect(getOptions(getSeasonButtonGroup())).toEqual([
                    'Season 4 ' + seasonDates(season4),
                    'Season 3 ' + seasonDates(season3),
                    '➕ New season']);
            });

            it('shows current division', async () => {
                await renderComponent({
                    originalSeasonData: season3,
                    originalDivisionData: division3,
                }, account, seasons, divisions);

                reportedError.verifyNoError();
                const divisionButton = getShownData(getDivisionButtonGroup());
                expect(divisionButton.textContent).toEqual('Division 3✏');
            });

            it('shows other divisions', async () => {
                await renderComponent({
                    originalSeasonData: season3,
                    originalDivisionData: division3,
                }, account, seasons, divisions);

                reportedError.verifyNoError();
                expect(getOptions(getDivisionButtonGroup())).toEqual([
                    'Division 3',
                    'Division 4',
                    '➕ New division']);
            });
        });

        describe('when out of season', () => {
            it('prompts user to select a season', async () => {
                await renderComponent({
                    originalDivisionData: division3,
                }, account, seasons, divisions);

                reportedError.verifyNoError();
                const seasonButton = getShownData(getSeasonButtonGroup());
                expect(seasonButton.textContent).toEqual('Select a season');
                assertDropdownOpen(getSeasonButtonGroup(), true);
            });

            it('shows other seasons', async () => {
                await renderComponent({
                    originalDivisionData: division3,
                }, account, seasons, divisions);

                reportedError.verifyNoError();
                expect(getOptions(getSeasonButtonGroup())).toEqual([
                    'Season 4 ' + seasonDates(season4),
                    'Season 3 ' + seasonDates(season3),
                    '➕ New season']);
            });

            it('shows all divisions', async () => {
                await renderComponent({
                    originalDivisionData: division3,
                }, account, seasons, divisions);

                reportedError.verifyNoError();
                const divisionButton = getShownData(getDivisionButtonGroup());
                expect(divisionButton.textContent).toEqual('All divisions');
            });

            it('shows no divisions', async () => {
                await renderComponent({
                    originalDivisionData: division3,
                }, account, seasons, divisions);

                reportedError.verifyNoError();
                expect(getOptions(getDivisionButtonGroup())).toEqual([]);
            });
        });
    });

    describe('interactivity', () => {
        const division5: DivisionDto = divisionBuilder('Division 5').build();
        const division6: DivisionDto = divisionBuilder('Division 6').build();
        const season5: SeasonDto = seasonBuilder('Season 5')
            .starting(getDate(-1))
            .ending(getDate(2))
            .withDivision(division5)
            .withDivision(division6)
            .build();
        const season6: SeasonDto = seasonBuilder('Season 6')
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
                }, account, seasons, divisions);
                reportedError.verifyNoError();
                const group = getSeasonButtonGroup();
                assertDropdownOpen(group, false);

                await toggleDropdown(group);

                assertDropdownOpen(group, true);
            });

            it('can open division drop down', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                }, account, seasons, divisions);
                reportedError.verifyNoError();
                const group = getDivisionButtonGroup();
                assertDropdownOpen(group, false);

                await toggleDropdown(group);

                assertDropdownOpen(group, true);
            });

            it('can close season drop down', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                }, account, seasons, divisions);
                reportedError.verifyNoError();
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
                reportedError.verifyNoError();
                const option = getOption(group, 'Season 6');
                expect(option.href).toContain(`/division/${encodeURI(division5.name)}/OVERRIDE/${encodeURI(season6.name)}`);
                await doClick(group.querySelector('.dropdown-toggle')!); // open the dropdown to be able to click on an item

                await doClick(findButton(group, `Season 5 ${seasonDates(season5)}`));

                expect(group.querySelector('.show')).toBeFalsy();
            });

            it('navigates correctly when on team overview page', async () => {
                const route = '/division/:divisionId/:mode/:seasonId';
                const currentPath = '/division/DIVISION_ID/team:TEAM_ID/SEASON_ID';

                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                }, account, seasons, divisions, route, currentPath);

                const group = getSeasonButtonGroup();
                reportedError.verifyNoError();
                const option = getOption(group, 'Season 6');
                expect(option.href).toContain(`/division/${encodeURI(division5.name)}/team:TEAM_ID/${encodeURI(season6.name)}`);
                await doClick(group.querySelector('.dropdown-toggle')!); // open the dropdown to be able to click on an item

                await doClick(findButton(group, `Season 5 ${seasonDates(season5)}`));

                expect(group.querySelector('.show')).toBeFalsy();
            });

            it('navigates correctly when on player overview page', async () => {
                const route = '/division/:divisionId/:mode/:seasonId';
                const currentPath = '/division/DIVISION_ID/player:PLAYER_ID/SEASON_ID';

                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                }, account, seasons, divisions, route, currentPath);

                const group = getSeasonButtonGroup();
                reportedError.verifyNoError();
                const option = getOption(group, 'Season 6');
                expect(option.href).toContain(`/division/${encodeURI(division5.name)}/player:PLAYER_ID/${encodeURI(season6.name)}`);
                await doClick(group.querySelector('.dropdown-toggle')!); // open the dropdown to be able to click on an item

                await doClick(findButton(group, 'Season 5 ' + seasonDates(season5)));

                expect(group.querySelector('.show')).toBeFalsy();
            });

            it('navigates to first division in other season when current division not in other season', async () => {
                const route = '/division/:divisionId/:mode/:seasonId';
                const currentPath = '/division/DIVISION_ID/player:PLAYER_ID/SEASON_ID';

                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division6,
                }, account, seasons, divisions, route, currentPath);

                const group = getSeasonButtonGroup();
                reportedError.verifyNoError();
                const option = getOption(group, 'Season 6');
                expect(option.href).toEqual(`http://localhost/division/${encodeURI(division5.name)}/player:PLAYER_ID/${encodeURI(season6.name)}`);
            });

            it('navigates to other season from multi-division page', async () => {
                const route = '/fixtures/:seasonId';
                const currentPath = '/fixtures/SEASON_ID/?division=DIVISION_ID';

                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division6,
                    overrideMode: 'fixtures',
                }, account, seasons, divisions, route, currentPath);

                const group = getSeasonButtonGroup();
                reportedError.verifyNoError();
                const option = getOption(group, 'Season 6');
                expect(option.href).toEqual(`http://localhost/fixtures/${encodeURI(season6.name)}/?division=Division+5`);
            });

            it('navigates to other season from multi-division page maintaining search parameters', async () => {
                const route = '/fixtures/:seasonId';
                const currentPath = '/fixtures/SEASON_ID/?division=DIVISION_ID&notes=Knockout';

                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division6,
                    overrideMode: 'fixtures',
                }, account, seasons, divisions, route, currentPath);

                const group = getSeasonButtonGroup();
                reportedError.verifyNoError();
                const option = getOption(group, 'Season 6');
                expect(option.href).toEqual(`http://localhost/fixtures/${encodeURI(season6.name)}/?division=Division+5&notes=Knockout`);
            });
        });

        describe('when logged in', () => {
            const account: UserDto = {
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
                }, account, seasons, divisions);
                reportedError.verifyNoError();

                await doClick(findButton(getSeasonButtonGroup(), `Season 5 ${seasonDates(season5)}✏`));

                const dialog = context.container.querySelector('.btn-group .modal-dialog')!;
                expect(dialog).toBeTruthy();
                expect(dialog.textContent).toContain('Edit a season');
            });

            it('can show add season dialog', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                }, account, seasons, divisions);
                reportedError.verifyNoError();

                await doSelectOption(getSeasonButtonGroup().querySelector('.dropdown-menu'), '➕ New season');

                const dialog = context.container.querySelector('.btn-group .modal-dialog')!;
                expect(dialog).toBeTruthy();
                expect(dialog.textContent).toContain('Create a season');
            });

            it('can change season details', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                }, account, seasons, divisions);
                reportedError.verifyNoError();
                await doClick(findButton(getSeasonButtonGroup(), `Season 5 ${seasonDates(season5)}✏`));
                const dialog = context.container.querySelector('.btn-group .modal-dialog')!;

                await doChange(dialog, 'input[name="name"]', 'NEW SEASON', context.user);
                await doClick(findButton(context.container, 'Update season'));

                reportedError.verifyNoError();
                expect(updatedSeason!.name).toEqual('NEW SEASON');
            });

            it('can save season details', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                }, account, seasons, divisions);
                reportedError.verifyNoError();
                await doClick(findButton(getSeasonButtonGroup(), `Season 5 ${seasonDates(season5)}✏`));

                await doClick(findButton(context.container, 'Update season'));

                reportedError.verifyNoError();
                const dialog = context.container.querySelector('.btn-group .modal-dialog');
                expect(dialog).toBeFalsy();
                expect(changedDivisionOrSeason).toEqual(false);
                expect(reloadSeasonsCalled).toEqual(true);
                expect(updatedSeason).not.toBeNull();
            });

            it('handles error when saving season details', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                }, account, seasons, divisions);
                reportedError.verifyNoError();
                await doClick(findButton(getSeasonButtonGroup(), `Season 5 ${seasonDates(season5)}✏`));
                seasonApiResult = {
                    success: false,
                    errors: [
                        'SOME ERROR',
                    ],
                };

                await doClick(findButton(context.container, 'Update season'));

                reportedError.verifyNoError();
                expect(context.container.textContent).toContain('Could not save details');
                expect(context.container.textContent).toContain('SOME ERROR');
                expect(updatedSeason).not.toBeNull();
            });

            it('can close add/edit season dialog', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                }, account, seasons, divisions);
                reportedError.verifyNoError();
                await doClick(findButton(getSeasonButtonGroup(), `Season 5 ${seasonDates(season5)}✏`));

                await doClick(findButton(context.container, 'Close'));

                const dialog = context.container.querySelector('.btn-group .modal-dialog');
                expect(dialog).toBeFalsy();
            });

            it('can show edit division dialog', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                }, account, seasons, divisions);
                reportedError.verifyNoError();

                await doClick(findButton(getDivisionButtonGroup(), 'Division 5✏'));

                const dialog = context.container.querySelector('.btn-group .modal-dialog')!;
                expect(dialog).toBeTruthy();
                expect(dialog.textContent).toContain('Edit a division');
            });

            it('can show add division dialog', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                }, account, seasons, divisions);
                reportedError.verifyNoError();

                await doSelectOption(getDivisionButtonGroup().querySelector('.dropdown-menu'), '➕ New division');

                const dialog = context.container.querySelector('.btn-group .modal-dialog')!;
                expect(dialog).toBeTruthy();
                expect(dialog.textContent).toContain('Create a division');
            });

            it('can change division details', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                }, account, seasons, divisions);
                reportedError.verifyNoError();
                await doClick(findButton(getDivisionButtonGroup(), 'Division 5✏'));
                const dialog = context.container.querySelector('.btn-group .modal-dialog')!;

                await doChange(dialog, 'input[name="name"]', 'NEW DIVISION', context.user);
                await doClick(findButton(context.container, 'Update division'));

                reportedError.verifyNoError();
                expect(updatedDivision!.name).toEqual('NEW DIVISION');
            });

            it('can save division details', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                }, account, seasons, divisions);
                reportedError.verifyNoError();
                await doClick(findButton(getDivisionButtonGroup(), 'Division 5✏'));

                await doClick(findButton(context.container, 'Update division'));

                reportedError.verifyNoError();
                const dialog = context.container.querySelector('.btn-group .modal-dialog');
                expect(dialog).toBeFalsy();
                expect(changedDivisionOrSeason).toEqual(false);
                expect(reloadDivisionsCalled).toEqual(true);
                expect(updatedDivision).not.toBeNull();
            });

            it('handles error when saving division details', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                }, account, seasons, divisions);
                reportedError.verifyNoError();
                await doClick(findButton(getDivisionButtonGroup(), 'Division 5✏'));
                divisionApiResult = {
                    success: false,
                    errors: [
                        'SOME ERROR',
                    ],
                };

                await doClick(findButton(context.container, 'Update division'));

                reportedError.verifyNoError();
                expect(context.container.textContent).toContain('Could not save details');
                expect(context.container.textContent).toContain('SOME ERROR');
                expect(updatedDivision).not.toBeNull();
            });

            it('can close add/edit division dialog', async () => {
                await renderComponent({
                    originalSeasonData: season5,
                    originalDivisionData: division5,
                }, account, seasons, divisions);
                reportedError.verifyNoError();
                await doClick(findButton(getDivisionButtonGroup(), 'Division 5✏'));

                await doClick(findButton(context.container, 'Close'));

                const dialog = context.container.querySelector('.btn-group .modal-dialog');
                expect(dialog).toBeFalsy();
            });
        });
    });
});