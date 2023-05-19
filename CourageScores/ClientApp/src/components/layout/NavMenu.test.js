// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick} from "../../tests/helpers";
import React from "react";
import {NavMenu} from "./NavMenu";
import {createTemporaryId} from "../../Utilities";

describe('NavMenu', () => {
    let context;
    let reportedError;
    let errorCleared;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(settings, account, divisions, seasons, appLoading, route, currentPath) {
        reportedError = null;
        errorCleared = false;
        context = await renderApp(
            { settings },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                account,
                clearError: () => errorCleared = true,
                divisions,
                appLoading,
                seasons
            },
            (<NavMenu />),
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
        items.shift(); //home
        items.shift(); //news
        items.shift(); //practice
        items.pop(); // login
        items.pop(); // about
        items.pop(); // downloads
        items.pop(); // rules

        return items;
    }

    describe('when logged out', () => {
        const division = {
            id: createTemporaryId(),
            name: 'DIVISION',
        };
        const currentSeason = {
            id: createTemporaryId(),
            name: 'SEASON',
            isCurrent: true,
            divisions: [ division ]
        };
        const settings = {
            apiHost: 'https://localhost',
        }
        const seasons = [
            currentSeason,
            { id: createTemporaryId(), name: 'OTHER SEASON', isCurrent: false, divisions: [ division ] }];
        const divisions = [division];
        const account = null;

        it('when app loading', async () => {
            await renderComponent(settings, account, divisions, seasons, true);

            expect(context.container.textContent).not.toContain('ERROR:');
            const menu = context.container.querySelector('nav');
            const items = Array.from(menu.querySelectorAll('li'));
            const lastMenuItem = items[items.length - 1];
            expect(lastMenuItem.querySelector('.spinner-border')).toBeTruthy();
        });

        it('divisions', async () => {
            await renderComponent(settings, account, divisions, seasons, false);

            expect(context.container.textContent).not.toContain('ERROR:');
            const items = getDivisionItems();
            const divisionItems = items.map(item => item.textContent);
            expect(divisionItems).toEqual([ 'DIVISION' ]);
        });

        it('login prompt', async () => {
            await renderComponent(settings, account, divisions, seasons, false);

            expect(context.container.textContent).not.toContain('ERROR:');
            const menu = context.container.querySelector('nav');
            const items = Array.from(menu.querySelectorAll('li'));
            const loginItem = items[items.length - 1];
            expect(loginItem.textContent).toEqual('Login');
        });

        it('navigates to login', async () => {
            await renderComponent(settings, account, divisions, seasons, false);
            expect(context.container.textContent).not.toContain('ERROR:');
            const menu = context.container.querySelector('nav');
            const items = Array.from(menu.querySelectorAll('li'));
            const loginItem = items[items.length - 1];

            const link = loginItem.querySelector('a');
            expect(link).toBeTruthy();
            expect(link.href).toEqual('https://localhost/api/Account/Login/?redirectUrl=https://localhost/practice');
        });

        it('clears error on navigate', async () => {
            await renderComponent(settings, account, divisions, seasons, false);
            expect(context.container.textContent).not.toContain('ERROR:');
            const menu = context.container.querySelector('nav');
            const items = Array.from(menu.querySelectorAll('li'));
            const practiceItem = items[2];
            expect(practiceItem.textContent).toEqual('Practice');

            const link = practiceItem.querySelector('a');
            link.href = '#';
            await doClick(link);

            expect(errorCleared).toEqual(true);
        });

        it('renders nav-menu error', async () => {
            await renderComponent(settings, account, [null], seasons, false);

            expect(context.container.textContent).toContain('ERROR:');
        });

        it('collapses on navigate', async () => {
            await renderComponent(settings, account, divisions, seasons, false);
            expect(context.container.textContent).not.toContain('ERROR:');
            const menu = context.container.querySelector('nav');
            const items = Array.from(menu.querySelectorAll('li'));
            const toggler = context.container.querySelector('.navbar-toggler');
            expect(toggler).toBeTruthy();
            await doClick(toggler);
            expect(isExpanded()).toEqual(true);

            const link = items[2].querySelector('a');
            link.href = '#';
            await doClick(link); // click Practice

            expect(isExpanded()).toEqual(false);
        });

        it('highlight division', async () => {
            await renderComponent(
                settings,
                account,
                divisions,
                seasons,
                false,
                '/division/:id',
                '/division/' + division.id);
            expect(context.container.textContent).not.toContain('ERROR:');

            const menu = context.container.querySelector('nav');
            const divisionItem = Array.from(menu.querySelectorAll('li'))
                .filter(li => li.textContent === 'DIVISION')[0];
            expect(divisionItem).toBeTruthy();
            const link = divisionItem.querySelector('a');
            expect(link.className).toContain('nav-item-active');
        });

        it('should highlight route', async () => {
            await renderComponent(settings, account, divisions, seasons, false);
            expect(context.container.textContent).not.toContain('ERROR:');

            const menu = context.container.querySelector('nav');
            const practiceItem = Array.from(menu.querySelectorAll('li'))
                .filter(li => li.textContent === 'Practice')[0];
            expect(practiceItem).toBeTruthy();
            const link = practiceItem.querySelector('a');
            expect(link.className).toContain('nav-item-active');
        });

        it('should render divisions only for the current season', async () => {
            const division1 = {
                id: createTemporaryId(),
                name: 'DIVISION 1',
            };
            const division2 = {
                id: createTemporaryId(),
                name: 'DIVISION 2',
            };
            const onlyDivision1SeasonCurrent = {
                id: createTemporaryId(),
                name: 'SEASON - ONLY DIVISION 1',
                divisions: [ division1 ],
                isCurrent: true,
            };
            const bothDivisionsSeasonsNotCurrent = {
                id: createTemporaryId(),
                name: 'SEASON - ONLY DIVISION 1',
                divisions: [ division1, division2 ],
                isCurrent: false,
            };

            await renderComponent(
                settings,
                account,
                [division1, division2],
                [onlyDivision1SeasonCurrent, bothDivisionsSeasonsNotCurrent],
                false,
                '/division/:divisionId/:mode/:seasonId',
                `/division/${division1.id}/teams/${onlyDivision1SeasonCurrent.id}`);
            expect(context.container.textContent).not.toContain('ERROR:');

            const items = getDivisionItems();
            const divisionItems = items.map(item => item.textContent);
            expect(divisionItems).toEqual([ 'DIVISION 1' ]);
        });

        it('should render all divisions when no active season', async () => {
            const division1 = {
                id: createTemporaryId(),
                name: 'DIVISION 1',
            };
            const division2 = {
                id: createTemporaryId(),
                name: 'DIVISION 2',
            };
            const bothDivisionsSeasonsNotCurrent = {
                id: createTemporaryId(),
                name: 'SEASON - ONLY DIVISION 1',
                divisions: [ division1, division2 ],
                isCurrent: false,
            };

            await renderComponent(
                settings,
                account,
                [division1, division2],
                [bothDivisionsSeasonsNotCurrent],
                false,
                '/divisions/:divisionId/teams/:seasonId',
                `/divisions/${division1.id}/teams/${bothDivisionsSeasonsNotCurrent.id}`);
            expect(context.container.textContent).not.toContain('ERROR:');

            const items = getDivisionItems();
            const divisionItems = items.map(item => item.textContent);
            expect(divisionItems).toEqual([ 'DIVISION 1', 'DIVISION 2' ]);
        });
    });

    describe('when logged in', () => {
        const division = {
            id: createTemporaryId(),
            name: 'DIVISION',
        };
        const currentSeason = {
            id: createTemporaryId(),
            name: 'SEASON',
            isCurrent: true,
            divisions: [ division ]
        };
        const settings = {
            apiHost: 'https://localhost',
        }
        const seasons = [
            currentSeason,
            { id: createTemporaryId(), name: 'OTHER SEASON', isCurrent: false, divisions: [ division ] }];
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
            await renderComponent(settings, nonAdminAccount, divisions, seasons, false);
            expect(context.container.textContent).not.toContain('ERROR:');

            const menu = context.container.querySelector('nav');
            const items = Array.from(menu.querySelectorAll('li'));
            const itemsText = items.map(li => li.textContent);
            expect(itemsText.filter(t => t === 'Admin')).toEqual([]);
        });

        it('should show admin link', async () => {
            await renderComponent(settings, account, divisions, seasons, false);
            expect(context.container.textContent).not.toContain('ERROR:');

            const menu = context.container.querySelector('nav');
            const items = Array.from(menu.querySelectorAll('li'));
            const adminItem = items[items.length - 2];
            expect(adminItem.textContent).toEqual('Admin');
        });

        it('should show logout link', async () => {
            await renderComponent(settings, account, divisions, seasons, false);
            expect(context.container.textContent).not.toContain('ERROR:');

            const menu = context.container.querySelector('nav');
            const items = Array.from(menu.querySelectorAll('li'));
            const logoutItem = items[items.length - 1];
            expect(logoutItem.textContent).toEqual('Logout (Simon)');
        });

        it('should navigate to logout', async () => {
            await renderComponent(settings, account, divisions, seasons, false);
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