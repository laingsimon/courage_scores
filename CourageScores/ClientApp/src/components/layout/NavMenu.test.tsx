import {appProps, brandingProps, cleanUp, doClick, iocProps, renderApp, TestContext} from "../../helpers/tests";
import React from "react";
import {NavMenu} from "./NavMenu";
import {ISettings} from "../../api/settings";
import {IAppProps} from "../../App";
import {IBrandingContainerProps} from "../../BrandingContainer";
import {divisionBuilder} from "../../helpers/builders/divisions";
import {seasonBuilder} from "../../helpers/builders/seasons";

describe('NavMenu', () => {
    let context: TestContext;
    let errorCleared: boolean;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(settings: ISettings, appContainerProps: IAppProps, branding?: IBrandingContainerProps, route?: string, currentPath?: string) {
        errorCleared = false;

        branding = branding || {name: '', menu: {beforeDivisions: [], afterDivisions: []}};

        context = await renderApp(
            iocProps({settings}),
            branding ?? brandingProps(),
            appProps({
                clearError: () => errorCleared = true,
                ...appContainerProps,
            }),
            (<NavMenu/>),
            route || '/practice',
            currentPath || '/practice');
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
        const account = null;

        it('when app loading', async () => {
            await renderComponent(settings, {
                account,
                divisions,
                seasons,
                appLoading: true,
            } as any);

            expect(context.container.textContent).not.toContain('ERROR:');
            const menu = context.container.querySelector('nav');
            const items = Array.from(menu.querySelectorAll('li'));
            const lastMenuItem = items[items.length - 1];
            expect(lastMenuItem.querySelector('.spinner-border')).toBeTruthy();
        });

        it('before and after division menu items', async () => {
            await renderComponent(settings, {
                    account,
                    divisions,
                    seasons,
                    appLoading: false,
                } as any,
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
                'http://localhost/division/' + division.name + '/teams/' + currentSeason.name,
                'https://localhost/AFTER1',
                'https://localhost/AFTER2',
                'https://localhost/api/Account/Login/?redirectUrl=https://localhost/practice']);
        });

        it('divisions', async () => {
            await renderComponent(settings, {
                    account,
                    divisions,
                    seasons,
                    appLoading: false
                } as any,
                {name: '', menu: {beforeDivisions: [], afterDivisions: []}});

            expect(context.container.textContent).not.toContain('ERROR:');
            const items = getDivisionItems();
            const divisionItems = items.map(item => item.textContent);
            expect(divisionItems).toEqual(['DIVISION']);
        });

        it('login prompt', async () => {
            await renderComponent(settings, {
                account,
                divisions,
                seasons,
                appLoading: false
            } as any);

            expect(context.container.textContent).not.toContain('ERROR:');
            const menu = context.container.querySelector('nav');
            const items = Array.from(menu.querySelectorAll('li'));
            const loginItem = items[items.length - 1];
            expect(loginItem.textContent).toEqual('Login');
        });

        it('navigates to login', async () => {
            await renderComponent(settings, {
                account,
                divisions,
                seasons,
                appLoading: false
            } as any);
            expect(context.container.textContent).not.toContain('ERROR:');
            const menu = context.container.querySelector('nav');
            const items = Array.from(menu.querySelectorAll('li'));
            const loginItem = items[items.length - 1];

            const link = loginItem.querySelector('a');
            expect(link).toBeTruthy();
            expect(link.href).toEqual('https://localhost/api/Account/Login/?redirectUrl=https://localhost/practice');
        });

        it('clears error on navigate', async () => {
            await renderComponent(settings, {
                account,
                divisions,
                seasons,
                appLoading: false
            } as any, {
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
            await renderComponent(settings, {
                account,
                divisions: [null],
                seasons,
                appLoading: false
            } as any);

            expect(context.container.textContent).toContain('ERROR:');
        });

        it('collapses on navigate', async () => {
            await renderComponent(settings, {
                account,
                divisions,
                seasons,
                appLoading: false
            } as any, {
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
            await renderComponent(settings, {
                account,
                divisions,
                seasons,
                appLoading: false
            } as any);
            expect(context.container.textContent).not.toContain('ERROR:');
            await doClick(context.container.querySelector('.navbar-brand'));
            expect(isExpanded()).toEqual(true);

            await doClick(context.container.querySelector('.navbar-brand'));

            expect(isExpanded()).toEqual(false);
        });

        it('highlight division', async () => {
            await renderComponent(
                settings,
                {
                    account,
                    divisions,
                    seasons,
                    appLoading: false
                } as any,
                null,
                '/division/:id',
                '/division/' + division.name);
            expect(context.container.textContent).not.toContain('ERROR:');

            const menu = context.container.querySelector('nav');
            const divisionItem = Array.from(menu.querySelectorAll('li'))
                .filter(li => li.textContent === 'DIVISION')[0];
            expect(divisionItem).toBeTruthy();
            const link = divisionItem.querySelector('a');
            expect(link.className).toContain('nav-item-active');
        });

        it('should highlight route', async () => {
            await renderComponent(settings, {
                account,
                divisions,
                seasons,
                appLoading: false
            } as any, {
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
                {
                    account,
                    divisions: [division1, division2],
                    seasons: [onlyDivision1SeasonCurrent, bothDivisionsSeasonsNotCurrent],
                    appLoading: false
                } as any,
                null,
                '/division/:divisionId/:mode/:seasonId',
                `/division/${division1.id}/teams/${onlyDivision1SeasonCurrent.id}`);
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
                {
                    account,
                    divisions: [division1, division2],
                    seasons: [bothDivisionsSeasonsNotCurrent],
                    appLoading: false
                } as any,
                null,
                '/divisions/:divisionId/teams/:seasonId',
                `/divisions/${division1.id}/teams/${bothDivisionsSeasonsNotCurrent.id}`);
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
        const account = {
            access: {
                manageAccess: true
            },
            givenName: 'Simon',
        };

        it('should not show admin link', async () => {
            const nonAdminAccount = {
                access: {},
                givenName: 'Not an admin',
            }
            await renderComponent(settings, {
                account: nonAdminAccount,
                divisions,
                seasons,
                appLoading: false
            } as any);
            expect(context.container.textContent).not.toContain('ERROR:');

            const menu = context.container.querySelector('nav');
            const items = Array.from(menu.querySelectorAll('li'));
            const itemsText = items.map(li => li.textContent);
            expect(itemsText.filter(t => t === 'Admin')).toEqual([]);
        });

        it('should show admin link', async () => {
            await renderComponent(settings, {
                account,
                divisions,
                seasons,
                appLoading: false
            } as any);
            expect(context.container.textContent).not.toContain('ERROR:');

            const menu = context.container.querySelector('nav');
            const items = Array.from(menu.querySelectorAll('li'));
            const adminItem = items[items.length - 2];
            expect(adminItem.textContent).toEqual('Admin');
        });

        it('should show logout link', async () => {
            await renderComponent(settings, {
                account,
                divisions,
                seasons,
                appLoading: false
            } as any);
            expect(context.container.textContent).not.toContain('ERROR:');

            const menu = context.container.querySelector('nav');
            const items = Array.from(menu.querySelectorAll('li'));
            const logoutItem = items[items.length - 1];
            expect(logoutItem.textContent).toEqual('Logout (Simon)');
        });

        it('should navigate to logout', async () => {
            await renderComponent(settings, {
                account,
                divisions,
                seasons,
                appLoading: false
            } as any);
            expect(context.container.textContent).not.toContain('ERROR:');

            const menu = context.container.querySelector('nav');
            const items = Array.from(menu.querySelectorAll('li'));
            const logoutItem = items[items.length - 1];
            const link = logoutItem.querySelector('a');
            expect(link).toBeTruthy();
            expect(link.href).toEqual('https://localhost/api/Account/Logout/?redirectUrl=https://localhost/practice');
        });
    })
});