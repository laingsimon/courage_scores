import {appProps, brandingProps, cleanUp, doClick, iocProps, renderApp, TestContext} from "../../helpers/tests";
import {NavMenu} from "./NavMenu";
import {ISettings} from "../../api/settings";
import {IBrandingContainerProps} from "../common/BrandingContainer";
import {divisionBuilder} from "../../helpers/builders/divisions";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {IAppContainerProps} from "../common/AppContainer";

describe('NavMenu', () => {
    let context: TestContext;
    let errorCleared: boolean;

    afterEach(() => {
        cleanUp(context);
    });

    function clearError() {
        errorCleared = true;
    }

    async function renderComponent(settings: ISettings, appContainerProps: IAppContainerProps, branding?: IBrandingContainerProps, route?: string, currentPath?: string) {
        errorCleared = false;

        branding = branding || {name: '', menu: {beforeDivisions: [], afterDivisions: []}};

        context = await renderApp(
            iocProps({settings}),
            branding ?? brandingProps(),
            appContainerProps,
            (<NavMenu/>),
            route || '/practice',
            currentPath || '/practice?q=value');
    }

    function isExpanded() {
        const header = context.container.querySelector('header');
        expect(header).toBeTruthy();
        const state = header.getAttribute('data-state');
        expect(state).toBeTruthy();
        return state === 'expanded';
    }

    function getDivisionItems() {
        const menu = context.container.querySelector('nav');
        const items = Array.from(menu.querySelectorAll('li'));
        items.pop(); // login

        return items;
    }

    describe('when logged out', () => {
        const division = divisionBuilder('DIVISION').build();
        const currentSeason = seasonBuilder('SEASON')
            .withDivision(division)
            .isCurrent()
            .withDivision(division)
            .build();
        const otherSeason = seasonBuilder('OTHER SEASON')
            .withDivision(division)
            .build();
        const settings: ISettings = {
            apiHost: 'https://localhost',
            invalidateCacheOnNextRequest: false,
        }
        const seasons = [currentSeason, otherSeason];
        const divisions = [division];
        const account: UserDto = null;

        it('when app loading', async () => {
            await renderComponent(settings, appProps({
                account,
                divisions,
                seasons,
                appLoading: true,
                clearError,
            }));

            expect(context.container.textContent).not.toContain('ERROR:');
            const menu = context.container.querySelector('nav');
            const items = Array.from(menu.querySelectorAll('li'));
            const lastMenuItem = items[items.length - 1];
            expect(lastMenuItem.querySelector('.spinner-border')).toBeTruthy();
        });

        it('before and after division menu items', async () => {
            await renderComponent(settings, appProps({
                    account,
                    divisions,
                    seasons,
                    appLoading: false,
                    clearError,
                }),
                {
                    name: '',
                    menu: {
                        beforeDivisions: [
                            {text: 'BEFORE 1', url: 'https://localhost/BEFORE1'},
                            {text: 'BEFORE 2', url: 'https://localhost/BEFORE2'},
                        ],
                        afterDivisions: [
                            {text: 'AFTER 1', url: 'https://localhost/AFTER1'},
                            {text: 'AFTER 2', url: 'https://localhost/AFTER2'},
                        ]
                    }
                });

            expect(context.container.textContent).not.toContain('ERROR:');
            const listItems = Array.from(context.container.querySelectorAll('nav li'));
            expect(listItems.map(li => li.textContent)).toEqual(['BEFORE 1', 'BEFORE 2', 'DIVISION', 'AFTER 1', 'AFTER 2', 'Login']);
            expect(listItems.map(li => li.querySelector('a').href)).toEqual([
                'https://localhost/BEFORE1',
                'https://localhost/BEFORE2',
                'http://localhost/teams/' + currentSeason.name + '/?division=' + division.name,
                'https://localhost/AFTER1',
                'https://localhost/AFTER2',
                'https://localhost/api/Account/Login/?redirectUrl=https://localhost/practice?q=value']);
        });

        it('divisions', async () => {
            await renderComponent(settings, appProps({
                    account,
                    divisions,
                    seasons,
                    appLoading: false,
                    clearError,
                }),
                {name: '', menu: {beforeDivisions: [], afterDivisions: []}});

            expect(context.container.textContent).not.toContain('ERROR:');
            const items = getDivisionItems();
            const divisionItems = items.map(item => item.textContent);
            expect(divisionItems).toEqual(['DIVISION']);
        });

        it('login prompt', async () => {
            await renderComponent(settings, appProps({
                account,
                divisions,
                seasons,
                appLoading: false,
                clearError,
            }));

            expect(context.container.textContent).not.toContain('ERROR:');
            const menu = context.container.querySelector('nav');
            const items = Array.from(menu.querySelectorAll('li'));
            const loginItem = items[items.length - 1];
            expect(loginItem.textContent).toEqual('Login');
        });

        it('navigates to login', async () => {
            await renderComponent(settings, appProps({
                account,
                divisions,
                seasons,
                appLoading: false,
                clearError,
            }));
            expect(context.container.textContent).not.toContain('ERROR:');
            const menu = context.container.querySelector('nav');
            const items = Array.from(menu.querySelectorAll('li'));
            const loginItem = items[items.length - 1];

            const link = loginItem.querySelector('a');
            expect(link).toBeTruthy();
            expect(link.href).toEqual('https://localhost/api/Account/Login/?redirectUrl=https://localhost/practice?q=value');
        });

        it('clears error on navigate', async () => {
            await renderComponent(settings, appProps({
                account,
                divisions,
                seasons,
                appLoading: false,
                clearError,
            }), {
                name: '',
                menu: {
                    beforeDivisions: [{
                        text: 'Practice',
                        url: '/practice',
                    }],
                    afterDivisions: [],
                }
            });
            expect(context.container.textContent).not.toContain('ERROR:');
            const menu = context.container.querySelector('nav');
            const practiceItem = Array.from(menu.querySelectorAll('li'))
                .filter(li => li.textContent === 'Practice')[0];
            expect(practiceItem).toBeTruthy();

            const link = practiceItem.querySelector('a');
            link.href = '#';
            await doClick(link);

            expect(errorCleared).toEqual(true);
        });

        it('renders nav-menu error', async () => {
            await renderComponent(settings, appProps({
                account,
                divisions: [null],
                seasons,
                appLoading: false,
                clearError,
            }));

            expect(context.container.textContent).toContain('ERROR:');
        });

        it('collapses on navigate', async () => {
            await renderComponent(settings, appProps({
                account,
                divisions,
                seasons,
                appLoading: false,
                clearError,
            }), {
                name: '',
                menu: {
                    beforeDivisions: [{
                        text: 'Practice',
                        url: '/practice',
                    }],
                    afterDivisions: [],
                }
            });
            expect(context.container.textContent).not.toContain('ERROR:');
            const menu = context.container.querySelector('nav');
            await doClick(context.container.querySelector('.navbar-toggler'));
            expect(isExpanded()).toEqual(true);
            const practiceItem = Array.from(menu.querySelectorAll('li'))
                .filter(li => li.textContent === 'Practice')[0];
            expect(practiceItem).toBeTruthy();

            const link = practiceItem.querySelector('a');
            link.href = '#';
            await doClick(link); // click Practice

            expect(isExpanded()).toEqual(false);
        });

        it('collapses and expands with brand', async () => {
            await renderComponent(settings, appProps({
                account,
                divisions,
                seasons,
                appLoading: false,
                clearError,
            }));
            expect(context.container.textContent).not.toContain('ERROR:');
            await doClick(context.container.querySelector('.navbar-brand'));
            expect(isExpanded()).toEqual(true);

            await doClick(context.container.querySelector('.navbar-brand'));

            expect(isExpanded()).toEqual(false);
        });

        it('should highlight route', async () => {
            await renderComponent(settings, appProps({
                account,
                divisions,
                seasons,
                appLoading: false,
                clearError,
            }), {
                name: '',
                menu: {
                    beforeDivisions: [{
                        text: 'Practice',
                        url: '/practice',
                    }],
                    afterDivisions: [],
                }
            });
            expect(context.container.textContent).not.toContain('ERROR:');

            const menu = context.container.querySelector('nav');
            const practiceItem = Array.from(menu.querySelectorAll('li'))
                .filter(li => li.textContent === 'Practice')[0];
            expect(practiceItem).toBeTruthy();
            const link = practiceItem.querySelector('a');
            expect(link.className).toContain('nav-item-active');
        });

        it('should render divisions only for the current season', async () => {
            const division1 = divisionBuilder('DIVISION 1').build();
            const division2 = divisionBuilder('DIVISION 2').build();

            const onlyDivision1SeasonCurrent = seasonBuilder('SEASON - ONLY DIVISION 1')
                .withDivision(division1)
                .isCurrent()
                .build();
            const bothDivisionsSeasonsNotCurrent = seasonBuilder('SEASON - ONLY DIVISION 1')
                .withDivision(division1)
                .withDivision(division2)
                .build();

            await renderComponent(
                settings,
                appProps({
                    account,
                    divisions: [division1, division2],
                    seasons: [onlyDivision1SeasonCurrent, bothDivisionsSeasonsNotCurrent],
                    appLoading: false,
                    clearError,
                }),
                null,
                '/teams/:seasonId',
                `/teams/${onlyDivision1SeasonCurrent.id}?division=${division1.id}`);
            expect(context.container.textContent).not.toContain('ERROR:');

            const items = getDivisionItems();
            const divisionItems = items.map(item => item.textContent);
            expect(divisionItems).toEqual(['DIVISION 1']);
        });

        it('should render all divisions when no active season', async () => {
            const division1 = divisionBuilder('DIVISION 1').build();
            const division2 = divisionBuilder('DIVISION 2').build();
            const bothDivisionsSeasonsNotCurrent = seasonBuilder('SEASON - ONLY DIVISION 1')
                .withDivision(division1)
                .withDivision(division2)
                .build();

            await renderComponent(
                settings,
                appProps({
                    account,
                    divisions: [division1, division2],
                    seasons: [bothDivisionsSeasonsNotCurrent],
                    appLoading: false,
                    clearError,
                }),
                null,
                '/teams/:seasonId',
                `/teams/${bothDivisionsSeasonsNotCurrent.id}/?division=${division1.id}`);
            expect(context.container.textContent).not.toContain('ERROR:');

            const items = getDivisionItems();
            const divisionItems = items.map(item => item.textContent);
            expect(divisionItems).toEqual(['DIVISION 1', 'DIVISION 2']);
        });
    });

    describe('when logged in', () => {
        const division = divisionBuilder('DIVISION').build();
        const currentSeason = seasonBuilder('SEASON')
            .withDivision(division)
            .isCurrent()
            .build();
        const settings: ISettings = {
            apiHost: 'https://localhost',
            invalidateCacheOnNextRequest: false,
        }
        const seasons = [
            currentSeason,
            seasonBuilder('OTHER SEASON').withDivision(division).build()];
        const divisions = [division];
        const account: UserDto = {
            name: '',
            emailAddress: '',
            access: {
                manageAccess: true
            },
            givenName: 'Simon',
        };

        it('should not show admin link', async () => {
            const nonAdminAccount: UserDto = {
                name: '',
                emailAddress: '',
                access: {},
                givenName: 'Not an admin',
            }
            await renderComponent(settings, appProps({
                account: nonAdminAccount,
                divisions,
                seasons,
                appLoading: false,
                clearError,
            }));
            expect(context.container.textContent).not.toContain('ERROR:');

            const menu = context.container.querySelector('nav');
            const items = Array.from(menu.querySelectorAll('li'));
            const itemsText = items.map(li => li.textContent);
            expect(itemsText.filter(t => t === 'Admin')).toEqual([]);
        });

        it('should show admin link', async () => {
            await renderComponent(settings, appProps({
                account,
                divisions,
                seasons,
                appLoading: false,
                clearError,
            }));
            expect(context.container.textContent).not.toContain('ERROR:');

            const menu = context.container.querySelector('nav');
            const items = Array.from(menu.querySelectorAll('li'));
            const adminItem = items[items.length - 2];
            expect(adminItem.textContent).toEqual('Admin');
        });

        it('should show logout link', async () => {
            await renderComponent(settings, appProps({
                account,
                divisions,
                seasons,
                appLoading: false,
                clearError,
            }));
            expect(context.container.textContent).not.toContain('ERROR:');

            const menu = context.container.querySelector('nav');
            const items = Array.from(menu.querySelectorAll('li'));
            const logoutItem = items[items.length - 1];
            expect(logoutItem.textContent).toEqual('Logout (Simon)');
        });

        it('should navigate to logout', async () => {
            await renderComponent(settings, appProps({
                account,
                divisions,
                seasons,
                appLoading: false,
                clearError,
            }));
            expect(context.container.textContent).not.toContain('ERROR:');

            const menu = context.container.querySelector('nav');
            const items = Array.from(menu.querySelectorAll('li'));
            const logoutItem = items[items.length - 1];
            const link = logoutItem.querySelector('a');
            expect(link).toBeTruthy();
            expect(link.href).toEqual('https://localhost/api/Account/Logout/?redirectUrl=https://localhost/practice?q=value');
        });
    })
});