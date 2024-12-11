import {api, cleanUp, doClick, findButton, iocProps, noop, TestContext} from "./helpers/tests";
import {App} from "./App";
import {act} from "@testing-library/react";
import {MemoryRouter, Route} from "react-router";
import {IocContainer, IIocContainerProps} from "./components/common/IocContainer";
import ReactDOM from "react-dom/client";
import {useApp} from "./components/common/AppContainer";
import {BrandingContainer} from "./components/common/BrandingContainer";
import {UserDto} from "./interfaces/models/dtos/Identity/UserDto";
import {SeasonDto} from "./interfaces/models/dtos/Season/SeasonDto";
import {TeamDto} from "./interfaces/models/dtos/Team/TeamDto";
import {ErrorDetailDto} from "./interfaces/models/dtos/ErrorDetailDto";
import {DivisionDto} from "./interfaces/models/dtos/DivisionDto";
import {IBuild} from "./components/common/IBuild";
import {IClientActionResultDto} from "./components/common/IClientActionResultDto";
import {divisionBuilder} from "./helpers/builders/divisions";
import {IAccountApi} from "./interfaces/apis/IAccountApi";
import {IErrorApi} from "./interfaces/apis/IErrorApi";
import {IDivisionApi} from "./interfaces/apis/IDivisionApi";
import {ISeasonApi} from "./interfaces/apis/ISeasonApi";
import {ITeamApi} from "./interfaces/apis/ITeamApi";
import React from "react";

describe('App', () => {
    let context: TestContext;
    let allDivisions: any = [];
    let account: UserDto | null = null;
    let allSeasons: SeasonDto[] = [];
    let allTeams: TeamDto[] = [];
    let reportedError: ErrorDetailDto | null;
    let settings: any;

    const divisionApi = api<IDivisionApi>({
        getAll: async (): Promise<DivisionDto[]> => {
            if (allDivisions.length || allDivisions.length === 0) {
                return allDivisions;
            }

            return await allDivisions;
        }
    });
    const accountApi = api<IAccountApi>({
        account: async (): Promise<UserDto | null> => account
    });
    const seasonApi = api<ISeasonApi>({
        getAll: async (): Promise<SeasonDto[]> => allSeasons
    });
    const teamApi = api<ITeamApi>({
        getAll: async (): Promise<TeamDto[]> => allTeams
    });
    const errorApi = api<IErrorApi>({
        add: async (error: ErrorDetailDto): Promise<IClientActionResultDto<ErrorDetailDto>> => {
            reportedError = error;
            return { success: true };
        }
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    async function renderComponent(build?: IBuild, embed?: boolean, testRoute?: React.ReactNode) {
        if (build) {
            createBuildElements(build);
        }

        reportedError = null;
        settings = {};
        context = await renderApp(
            iocProps({
                divisionApi,
                accountApi,
                seasonApi,
                teamApi,
                errorApi,
                settings,
            }),
            (<BrandingContainer name='COURAGE LEAGUE'>
                <App controls={true} embed={embed} testRoute={testRoute}/>
            </BrandingContainer>),
            testRoute ? '/test' : null);
    }

    async function renderApp(iocProps: IIocContainerProps, content: React.ReactNode, currentPath: string): Promise<TestContext> {
        const container = document.createElement('div');
        document.body.appendChild(container);

        let root: ReactDOM.Root;
        await act(async () => {
            const component = (<MemoryRouter initialEntries={[currentPath || '/']}>
                <IocContainer {...iocProps}>{content}</IocContainer>
            </MemoryRouter>);
            root = ReactDOM.createRoot(container)
            root.render(component);
        });

        return {
            container: container,
            cleanUp: async () => {
                await act(async () => {
                    root.unmount();
                });
                if (container && document && document.body) {
                    document.body.removeChild(container);
                }
            },
            user: null,
            cookies: null,
        };
    }

    function createBuildElements(build: IBuild) {
        createBuildElement('build:branch', build.branch);
        createBuildElement('build:sha', build.version);
        createBuildElement('build:date', build.date);
        createBuildElement('build:pr_name', build.prName);
    }

    function createBuildElement(name: string, value: string) {
        const meta = document.createElement('meta');
        meta.setAttribute('name', name);
        meta.setAttribute('content', value);
        document.head.appendChild(meta);
    }

    function isForDomain(a: HTMLAnchorElement, domain: string) {
        const href = a.getAttribute('href');
        const url = new URL(href);

        return url.host === domain;
    }

    function assertSocialLinks() {
        const socialLinks = Array.from(context.container.querySelectorAll('div.social-header a[href]')) as HTMLAnchorElement[];
        expect(socialLinks.length).toEqual(3);
        const email = socialLinks.filter(a => a.getAttribute('href').indexOf('mailto:') !== -1)[0];
        const facebook = socialLinks.filter(a => isForDomain(a, 'www.facebook.com'))[0];
        const twitter = socialLinks.filter(a => isForDomain(a, 'twitter.com'))[0];
        expect(email).toBeTruthy();
        expect(facebook).toBeTruthy();
        expect(twitter).toBeTruthy();
    }

    function assertHeading() {
        const heading = context.container.querySelector('h1.heading');
        expect(heading).toBeTruthy();
        expect(heading.textContent).toEqual('COURAGE LEAGUE');
    }

    function assertMenu(loading?: boolean) {
        const header = context.container.querySelector('header');
        expect(header).toBeTruthy();
        const menuItems = Array.from(header.querySelectorAll('li.nav-item'));
        const menuItemText = menuItems.map(li => li.textContent);
        const divisionMenuItems = loading ? [] : allDivisions.map((d: DivisionDto) => d.name);
        const expectedMenuItemsAfterDivisions = [];

        if (!loading) {
            if (account) {
                expectedMenuItemsAfterDivisions.push(`Logout (${account.givenName})`);
            } else {
                expectedMenuItemsAfterDivisions.push('Login');
            }
        } else {
            expectedMenuItemsAfterDivisions.push(''); // spinner
        }

        const expectedMenuItems = divisionMenuItems.concat(expectedMenuItemsAfterDivisions);
        expect(menuItemText).toEqual(expectedMenuItems);
    }

    function TestElement() {
        const {onError, clearError, invalidateCacheAndTryAgain, reportClientSideException} = useApp();
        const error = {message: 'ERROR'};

        return (<div>
            <button className="btn" onClick={() => onError(error)}>onError</button>
            <button className="btn" onClick={clearError}>clearError</button>
            <button className="btn" onClick={invalidateCacheAndTryAgain}>invalidateCacheAndTryAgain</button>
            <button className="btn" onClick={() => reportClientSideException(error)}>reportClientSideException</button>
        </div>);
    }

    describe('renders', () => {
        it('without build information', async () => {
            await renderComponent();

            assertSocialLinks();
            assertHeading();
            assertMenu();
        });

        it('with build information', async () => {
            await renderComponent({
                branch: 'BRANCH',
                version: '0123456789abcdef',
                date: '2023-04-05T06:07:08',
            });

            assertSocialLinks();
            assertHeading();
            assertMenu();
        });

        it('embedded', async () => {
            await renderComponent(null, true);

            const socialLinks = Array.from(context.container.querySelectorAll('div.social-header a[href]'));
            expect(socialLinks.length).toEqual(0);
            const heading = context.container.querySelector('h1.heading');
            expect(heading).toBeFalsy();
            const header = context.container.querySelector('header');
            expect(header).toBeFalsy();
        });

        it('when logged in', async () => {
            account = {
                name: 'Simon Laing',
                givenName: 'Simon',
                emailAddress: '',
            };

            await renderComponent(null);

            assertSocialLinks();
            assertHeading();
            assertMenu();
        });

        it('with divisions', async () => {
            allDivisions = [
                divisionBuilder('Division One').build(),
                divisionBuilder('Division Two').build()
            ];

            await renderComponent(null);

            assertSocialLinks();
            assertHeading();
            assertMenu();
        });

        it('when still loading', async () => {
            allDivisions = new Promise<DivisionDto[]>(() => {});

            await renderComponent();

            assertSocialLinks();
            assertHeading();
            assertMenu(true);
        });
    });

    describe('functionality', () => {
        it('can report client side exception via onError', async () => {
            await renderComponent(
                null,
                false,
                (<Route path='/test' element={<TestElement/>}/>));
            console.error = noop;

            await doClick(findButton(context.container, 'onError'));

            expect(reportedError).not.toEqual({
                message: 'ERROR',
                source: 'UI',
            });
            expect(context.container.textContent).toContain('An error occurred');
        });

        it('can report client side exception directly', async () => {
            await renderComponent(
                null,
                false,
                (<Route path='/test' element={<TestElement/>}/>));

            await doClick(findButton(context.container, 'reportClientSideException'));

            expect(reportedError).not.toEqual({
                message: 'ERROR',
                source: 'UI',
            });
            expect(context.container.textContent).not.toContain('An error occurred');
        });

        it('can invalidate caches', async () => {
            await renderComponent(
                null,
                false,
                (<Route path='/test' element={<TestElement/>}/>));

            await doClick(findButton(context.container, 'invalidateCacheAndTryAgain'));

            expect(settings.invalidateCacheOnNextRequest).toEqual(true);
            expect(context.container.textContent).not.toContain('An error occurred');
        });

        it('can clear error', async () => {
            await renderComponent(
                null,
                false,
                (<Route path='/test' element={<TestElement/>}/>));
            await doClick(findButton(context.container, 'onError'));

            await doClick(findButton(context.container, 'Clear error'));

            expect(context.container.textContent).not.toContain('An error occurred');
        });
    });
});