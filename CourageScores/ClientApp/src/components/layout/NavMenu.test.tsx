import {
    appProps,
    brandingProps,
    cleanUp,
    IComponent,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { NavMenu } from './NavMenu';
import { ISettings } from '../../api/settings';
import { IBrandingContainerProps } from '../common/BrandingContainer';
import { divisionBuilder } from '../../helpers/builders/divisions';
import { seasonBuilder } from '../../helpers/builders/seasons';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';
import { IAppContainerProps } from '../common/AppContainer';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';

describe('NavMenu', () => {
    let context: TestContext;
    let errorCleared: boolean;

    afterEach(async () => {
        await cleanUp(context);
    });

    async function clearError() {
        errorCleared = true;
    }

    async function renderComponent(
        settings: ISettings,
        appContainerProps: IAppContainerProps,
        branding?: IBrandingContainerProps,
        route?: string,
        currentPath?: string,
    ) {
        errorCleared = false;

        context = await renderApp(
            iocProps({ settings }),
            brandingProps(
                branding ?? {
                    name: '',
                    menu: { beforeDivisions: [], afterDivisions: [] },
                },
            ),
            appContainerProps,
            <NavMenu />,
            route || '/practice',
            currentPath || '/practice?q=value',
        );
    }

    function isExpanded() {
        const header = context.required('header');
        const state = header.element<HTMLElement>().getAttribute('data-state');
        expect(state).toBeTruthy();
        return state === 'expanded';
    }

    function getDivisionItems(): IComponent[] {
        const menu = context.required('nav');
        const items = menu.all('li');
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
        };
        const seasons = [currentSeason, otherSeason];
        const divisions = [division];
        const account: UserDto | undefined = undefined;

        it('when app loading', async () => {
            await renderComponent(
                settings,
                appProps({
                    account,
                    divisions,
                    seasons,
                    appLoading: true,
                    clearError,
                }),
            );

            expect(context.text()).not.toContain('ERROR:');
            const menu = context.required('nav');
            const items = menu.all('li');
            const lastMenuItem = items[items.length - 1];
            expect(lastMenuItem.optional('.spinner-border')).toBeTruthy();
        });

        it('before and after division menu items', async () => {
            await renderComponent(
                settings,
                appProps({
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
                            {
                                text: 'BEFORE 1',
                                url: 'https://localhost/BEFORE1',
                            },
                            {
                                text: 'BEFORE 2',
                                url: 'https://localhost/BEFORE2',
                            },
                        ],
                        afterDivisions: [
                            {
                                text: 'AFTER 1',
                                url: 'https://localhost/AFTER1',
                            },
                            {
                                text: 'AFTER 2',
                                url: 'https://localhost/AFTER2',
                            },
                        ],
                    },
                },
            );

            expect(context.text()).not.toContain('ERROR:');
            const listItems = context.all('nav li');
            expect(listItems.map((li) => li.text())).toEqual([
                'BEFORE 1',
                'BEFORE 2',
                'DIVISION',
                'AFTER 1',
                'AFTER 2',
                'Login',
            ]);
            expect(
                listItems.map(
                    (li) => li.required('a').element<HTMLAnchorElement>().href,
                ),
            ).toEqual([
                'https://localhost/BEFORE1',
                'https://localhost/BEFORE2',
                'http://localhost/teams/' +
                    currentSeason.name +
                    '/?division=' +
                    division.name,
                'https://localhost/AFTER1',
                'https://localhost/AFTER2',
                `https://localhost/api/Account/Login/?redirectUrl=${encodeURIComponent('https://localhost/practice?q=value')}`,
            ]);
        });

        it('divisions', async () => {
            await renderComponent(
                settings,
                appProps({
                    account,
                    divisions,
                    seasons,
                    appLoading: false,
                    clearError,
                }),
                { name: '', menu: { beforeDivisions: [], afterDivisions: [] } },
            );

            expect(context.text()).not.toContain('ERROR:');
            const items = getDivisionItems();
            const divisionItems = items.map((item) => item.text());
            expect(divisionItems).toEqual(['DIVISION']);
        });

        it('login prompt', async () => {
            await renderComponent(
                settings,
                appProps({
                    account,
                    divisions,
                    seasons,
                    appLoading: false,
                    clearError,
                }),
            );

            expect(context.text()).not.toContain('ERROR:');
            const menu = context.required('nav');
            const items = menu.all('li');
            const loginItem = items[items.length - 1];
            expect(loginItem.text()).toEqual('Login');
        });

        it('navigates to login', async () => {
            await renderComponent(
                settings,
                appProps({
                    account,
                    divisions,
                    seasons,
                    appLoading: false,
                    clearError,
                }),
            );
            expect(context.text()).not.toContain('ERROR:');
            const menu = context.required('nav');
            const items = menu.all('li');
            const loginItem = items[items.length - 1];

            const link = loginItem.required('a');
            expect(link.element<HTMLAnchorElement>().href).toEqual(
                `https://localhost/api/Account/Login/?redirectUrl=${encodeURIComponent('https://localhost/practice?q=value')}`,
            );
        });

        it('clears error on navigate', async () => {
            await renderComponent(
                settings,
                appProps({
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
                            {
                                text: 'Practice',
                                url: '/practice',
                            },
                        ],
                        afterDivisions: [],
                    },
                },
            );
            expect(context.text()).not.toContain('ERROR:');
            const menu = context.required('nav');
            const practiceItem = menu
                .all('li')
                .filter((li) => li.text() === 'Practice')[0];
            expect(practiceItem).toBeTruthy();

            const link = practiceItem.required('a');
            link.element<HTMLAnchorElement>().href = '#';
            await link.click();

            expect(errorCleared).toEqual(true);
        });

        it('renders nav-menu error', async () => {
            await renderComponent(
                settings,
                appProps({
                    account,
                    divisions: [null! as DivisionDto],
                    seasons,
                    appLoading: false,
                    clearError,
                }),
            );

            expect(context.text()).toContain('ERROR:');
        });

        it('collapses on navigate', async () => {
            await renderComponent(
                settings,
                appProps({
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
                            {
                                text: 'Practice',
                                url: '/practice',
                            },
                        ],
                        afterDivisions: [],
                    },
                },
            );
            expect(context.text()).not.toContain('ERROR:');
            const menu = context.required('nav');
            await context.required('.navbar-toggler').click();
            expect(isExpanded()).toEqual(true);
            const practiceItem = menu
                .all('li')
                .filter((li) => li.text() === 'Practice')[0];
            expect(practiceItem).toBeTruthy();

            const link = practiceItem.required('a');
            link.element<HTMLAnchorElement>().href = '#';
            await link.click(); // click Practice

            expect(isExpanded()).toEqual(false);
        });

        it('collapses and expands with brand', async () => {
            await renderComponent(
                settings,
                appProps({
                    account,
                    divisions,
                    seasons,
                    appLoading: false,
                    clearError,
                }),
            );
            expect(context.text()).not.toContain('ERROR:');
            await context.required('.navbar-brand').click();
            expect(isExpanded()).toEqual(true);

            await context.required('.navbar-brand').click();

            expect(isExpanded()).toEqual(false);
        });

        it('should highlight route', async () => {
            await renderComponent(
                settings,
                appProps({
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
                            {
                                text: 'Practice',
                                url: '/practice',
                            },
                        ],
                        afterDivisions: [],
                    },
                },
            );
            expect(context.text()).not.toContain('ERROR:');

            const menu = context.required('nav');
            const practiceItem = menu
                .all('li')
                .filter((li) => li.text() === 'Practice')[0];
            expect(practiceItem).toBeTruthy();
            const link = practiceItem.required('a');
            expect(link.className()).toContain('nav-item-active');
        });

        it('should render divisions only for the current season', async () => {
            const division1 = divisionBuilder('DIVISION 1').build();
            const division2 = divisionBuilder('DIVISION 2').build();

            const onlyDivision1SeasonCurrent = seasonBuilder(
                'SEASON - ONLY DIVISION 1',
            )
                .withDivision(division1)
                .isCurrent()
                .build();
            const bothDivisionsSeasonsNotCurrent = seasonBuilder(
                'SEASON - ONLY DIVISION 1',
            )
                .withDivision(division1)
                .withDivision(division2)
                .build();

            await renderComponent(
                settings,
                appProps({
                    account,
                    divisions: [division1, division2],
                    seasons: [
                        onlyDivision1SeasonCurrent,
                        bothDivisionsSeasonsNotCurrent,
                    ],
                    appLoading: false,
                    clearError,
                }),
                undefined,
                '/teams/:seasonId',
                `/teams/${onlyDivision1SeasonCurrent.id}?division=${division1.id}`,
            );
            expect(context.text()).not.toContain('ERROR:');

            const items = getDivisionItems();
            const divisionItems = items.map((item) => item.text());
            expect(divisionItems).toEqual(['DIVISION 1']);
        });

        it('should render all divisions when no active season', async () => {
            const division1 = divisionBuilder('DIVISION 1').build();
            const division2 = divisionBuilder('DIVISION 2').build();
            const bothDivisionsSeasonsNotCurrent = seasonBuilder(
                'SEASON - ONLY DIVISION 1',
            )
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
                undefined,
                '/teams/:seasonId',
                `/teams/${bothDivisionsSeasonsNotCurrent.id}/?division=${division1.id}`,
            );
            expect(context.text()).not.toContain('ERROR:');

            const items = getDivisionItems();
            const divisionItems = items.map((item) => item.text());
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
        };
        const seasons = [
            currentSeason,
            seasonBuilder('OTHER SEASON').withDivision(division).build(),
        ];
        const divisions = [division];
        const account: UserDto = {
            name: '',
            emailAddress: '',
            access: {
                manageAccess: true,
            },
            givenName: 'Simon',
        };

        it('should not show admin link', async () => {
            const nonAdminAccount: UserDto = {
                name: '',
                emailAddress: '',
                access: {},
                givenName: 'Not an admin',
            };
            await renderComponent(
                settings,
                appProps({
                    account: nonAdminAccount,
                    divisions,
                    seasons,
                    appLoading: false,
                    clearError,
                }),
            );
            expect(context.text()).not.toContain('ERROR:');

            const menu = context.required('nav');
            const items = menu.all('li');
            const itemsText = items.map((li) => li.text());
            expect(itemsText.filter((t) => t === 'Admin')).toEqual([]);
        });

        it('should show admin link', async () => {
            await renderComponent(
                settings,
                appProps({
                    account,
                    divisions,
                    seasons,
                    appLoading: false,
                    clearError,
                }),
            );
            expect(context.text()).not.toContain('ERROR:');

            const menu = context.required('nav');
            const items = menu.all('li');
            const adminItem = items[items.length - 2];
            expect(adminItem.text()).toEqual('Admin');
        });

        it('should show logout link', async () => {
            await renderComponent(
                settings,
                appProps({
                    account,
                    divisions,
                    seasons,
                    appLoading: false,
                    clearError,
                }),
            );
            expect(context.text()).not.toContain('ERROR:');

            const menu = context.required('nav');
            const items = menu.all('li');
            const logoutItem = items[items.length - 1];
            expect(logoutItem.text()).toEqual('Logout (Simon)');
        });

        it('should navigate to logout', async () => {
            await renderComponent(
                settings,
                appProps({
                    account,
                    divisions,
                    seasons,
                    appLoading: false,
                    clearError,
                }),
            );
            expect(context.text()).not.toContain('ERROR:');

            const menu = context.required('nav');
            const items = menu.all('li');
            const logoutItem = items[items.length - 1];
            const link = logoutItem.required('a');
            expect(link.element<HTMLAnchorElement>().href).toEqual(
                `https://localhost/api/Account/Logout/?redirectUrl=${encodeURIComponent('https://localhost/practice?q=value')}`,
            );
        });
    });
});
