import {
    appProps,
    brandingProps,
    cleanUp,
    doClick, doSelectOption,
    findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {renderDate} from "../../helpers/rendering";
import {FilterFixtures} from "./FilterFixtures";
import {DivisionDataContainer, IDivisionDataContainerProps} from "../league/DivisionDataContainer";
import {teamBuilder} from "../../helpers/builders/teams";
import {IInitialisedFilters} from "../../helpers/filters";
import {DivisionDataDto} from "../../interfaces/models/dtos/Division/DivisionDataDto";
import {IPreferenceData} from "../common/PreferencesContainer";

const mockedUsedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedUsedNavigate,
}));

describe('FilterFixtures', () => {
    let context: TestContext;

    afterEach(() => {
        cleanUp(context);
    });

    async function onReloadDivision(_?: boolean): Promise<DivisionDataDto | null> {
        return null;
    }

    async function setDivisionData(_: DivisionDataDto): Promise<any> {
        return null;
    }

    async function renderComponent(filter: IInitialisedFilters, divisionData: IDivisionDataContainerProps, initialPreferences?: IPreferenceData) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps(),
            (<DivisionDataContainer {...divisionData}>
                <FilterFixtures />
            </DivisionDataContainer>),
            '/fixtures',
            `/fixtures?${new URLSearchParams(filter).toString()}`,
            null,
            initialPreferences);
    }

    describe('type', () => {
        it('when selected', async () => {
            await renderComponent(
                {type: 'league'},
                {
                    name: 'DIVISION',
                    teams: [],
                    onReloadDivision,
                    setDivisionData,
                });

            const dropDown = context.container.querySelector('.btn-group:nth-child(1)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual('League fixtures');
        });

        it('when unrecognised', async () => {
            await renderComponent(
                {type: 'foo'},
                {
                    name: 'DIVISION',
                    teams: [],
                    onReloadDivision,
                    setDivisionData,
                });

            const dropDown = context.container.querySelector('.btn-group:nth-child(1)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeFalsy();
        });

        it('when unselected', async () => {
            await renderComponent(
                {},
                {
                    name: 'DIVISION',
                    teams: [],
                    onReloadDivision,
                    setDivisionData,
                });

            const dropDown = context.container.querySelector('.btn-group:nth-child(1)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual('All fixtures');
        });

        it('changes url to include filter', async () => {
            await renderComponent(
                {division: 'DIVISION'},
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: true,
                }, {});

            await doSelectOption(context.container.querySelector('[datatype="type-filter"] .dropdown-menu'), 'League fixtures');

            expect(mockedUsedNavigate).toHaveBeenCalledWith({
                hash: '',
                pathname: '/fixtures',
                search: 'type=league&division=DIVISION',
            });
        });

        it('changes url to exclude filter', async () => {
            await renderComponent(
                {type: 'league', division: 'DIVISION'},
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: true,
                }, {});

            await doSelectOption(context.container.querySelector('[datatype="type-filter"] .dropdown-menu'), 'All fixtures');

            expect(mockedUsedNavigate).toHaveBeenCalledWith({
                hash: '',
                pathname: '/fixtures',
                search: 'division=DIVISION',
            });
        });
    });

    describe('date', () => {
        it('when selected', async () => {
            await renderComponent(
                {date: 'past'},
                {
                    name: 'DIVISION',
                    teams: [],
                    onReloadDivision,
                    setDivisionData,
                });

            const dropDown = context.container.querySelector('.btn-group:nth-child(2)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual('Past dates');
        });

        it('when specific 3-part date', async () => {
            const date = '2023-01-01';
            const expectedDate = renderDate(date);
            await renderComponent(
                {date},
                {
                    name: 'DIVISION',
                    teams: [],
                    onReloadDivision,
                    setDivisionData,
                });

            const dropDown = context.container.querySelector('.btn-group:nth-child(2)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual(expectedDate);
        });

        it('when unrecognised', async () => {
            await renderComponent(
                {date: 'foo'},
                {
                    name: 'DIVISION',
                    teams: [],
                    onReloadDivision,
                    setDivisionData,
                });

            const dropDown = context.container.querySelector('.btn-group:nth-child(2)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual('foo');
        });

        it('when unselected', async () => {
            await renderComponent(
                {},
                {
                    name: 'DIVISION',
                    teams: [],
                    onReloadDivision,
                    setDivisionData,
                });

            const dropDown = context.container.querySelector('.btn-group:nth-child(2)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual('All dates');
        });

        it('changes url to include filter', async () => {
            await renderComponent(
                {division: 'DIVISION'},
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: true,
                }, {});

            await doSelectOption(context.container.querySelector('[datatype="date-filter"] .dropdown-menu'), 'Future dates');

            expect(mockedUsedNavigate).toHaveBeenCalledWith({
                hash: '',
                pathname: '/fixtures',
                search: 'date=future&division=DIVISION',
            });
        });

        it('changes url to exclude filter', async () => {
            await renderComponent(
                {date: '2023-01-01', division: 'DIVISION'},
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: true,
                }, {});

            await doSelectOption(context.container.querySelector('[datatype="date-filter"] .dropdown-menu'), 'All dates');

            expect(mockedUsedNavigate).toHaveBeenCalledWith({
                hash: '',
                pathname: '/fixtures',
                search: 'division=DIVISION',
            });
        });
    });

    describe('team', () => {
        it('when selected', async () => {
            const team = teamBuilder('TEAM').build();
            await renderComponent(
                {team: 'TEAM'},
                {
                    name: 'DIVISION',
                    teams: [team],
                    onReloadDivision,
                    setDivisionData,
                });

            const dropDown = context.container.querySelector('.btn-group:nth-child(3)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual('TEAM');
        });

        it('when unrecognised', async () => {
            const team = teamBuilder('TEAM').build();
            await renderComponent(
                {team: '1234'},
                {
                    name: 'DIVISION',
                    teams: [team],
                    onReloadDivision,
                    setDivisionData,
                });

            const dropDown = context.container.querySelector('.btn-group:nth-child(3)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeFalsy();
        });

        it('when unselected', async () => {
            await renderComponent(
                {},
                {
                    name: 'DIVISION',
                    teams: [],
                    onReloadDivision,
                    setDivisionData,
                });

            const dropDown = context.container.querySelector('.btn-group:nth-child(3)');
            expect(dropDown).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active')).toBeTruthy();
            expect(dropDown.querySelector('.dropdown-item.active').textContent).toEqual('All teams');
        });

        it('changes url to include filter', async () => {
            const team = teamBuilder('TEAM').build();
            await renderComponent(
                {division: 'DIVISION'},
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [team],
                    favouritesEnabled: true,
                }, {});

            await doSelectOption(context.container.querySelector('[datatype="team-filter"] .dropdown-menu'), 'TEAM');

            expect(mockedUsedNavigate).toHaveBeenCalledWith({
                hash: '',
                pathname: '/fixtures',
                search: 'team=team&division=DIVISION',
            });
        });

        it('changes url to exclude filter', async () => {
            await renderComponent(
                {team: 'TEAM', division: 'DIVISION'},
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: true,
                }, {});

            await doSelectOption(context.container.querySelector('[datatype="team-filter"] .dropdown-menu'), 'All teams');

            expect(mockedUsedNavigate).toHaveBeenCalledWith({
                hash: '',
                pathname: '/fixtures',
                search: 'division=DIVISION',
                });
        });
    });

    describe('clear filters', () => {
        it('clears filters', async () => {
            await renderComponent(
                {team: 'TEAM', division: 'DIVISION'},
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: true,
                }, {});

            await doClick(findButton(context.container, '➖'));

            expect(mockedUsedNavigate).toHaveBeenCalledWith({
                hash: '',
                pathname: '/fixtures',
                search: 'division=DIVISION',
            });
        });

        it('does not show button if no filters', async () => {
            await renderComponent(
                {},
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: true,
                }, {});

            expect(context.container.innerHTML).not.toContain('➖');
        });
    });

    describe('favourites', () => {
        it('shows button when there are favourites and feature is enabled', async () => {
            await renderComponent(
                {team: 'TEAM'},
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: true,
                }, {
                    favouriteTeamIds: [ '1234' ],
                });

            const buttons: HTMLButtonElement[] = Array.from(context.container.querySelectorAll('button.btn-outline-danger')) as HTMLButtonElement[];
            expect(buttons.length).toEqual(1);
            expect(buttons[0].textContent).toEqual('🌟');
        });

        it('does not show button when favourites are not enabled', async () => {
            await renderComponent(
                {team: 'TEAM'},
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: false,
                }, {
                    favouriteTeamIds: [ '1234' ],
                });

            const buttons: HTMLButtonElement[] = Array.from(context.container.querySelectorAll('button.btn-outline-danger')) as HTMLButtonElement[];
            expect(buttons.length).toEqual(0);
        });

        it('does show button when there are no favourites', async () => {
            await renderComponent(
                {team: 'TEAM'},
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: true,
                }, {
                    favouriteTeamIds: [],
                });

            const buttons: HTMLButtonElement[] = Array.from(context.container.querySelectorAll('button.btn-outline-danger')) as HTMLButtonElement[];
            expect(buttons.length).toEqual(0);
        });

        it('does not clear favourites when confirmation is cancelled', async () => {
            await renderComponent(
                {team: 'TEAM'},
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: true,
                }, {
                    favouriteTeamIds: [ '1234' ],
                    someOtherPreference: 'FOO',
                });
            let confirm: string = null;
            window.confirm = (msg) => {
                confirm = msg;
                return false;
            };

            await doClick(findButton(context.container, '🌟'));

            expect(confirm).toEqual('Are you sure you want to clear your favourites?');
            expect(context.cookies.get('preferences')).toEqual({
                favouriteTeamIds: [ '1234' ],
                someOtherPreference: 'FOO',
            });
        });

        it('clears favourites when confirmation is accepted', async () => {
            await renderComponent(
                {team: 'TEAM'},
                {
                    name: 'DIVISION',
                    onReloadDivision,
                    setDivisionData,
                    teams: [],
                    favouritesEnabled: true,
                }, {
                    favouriteTeamIds: [ '1234' ],
                    someOtherPreference: 'FOO',
                });
            window.confirm = () => true;

            await doClick(findButton(context.container, '🌟'));

            expect(context.cookies.get('preferences')).toEqual({
                someOtherPreference: 'FOO',
            });
        });
    });
});