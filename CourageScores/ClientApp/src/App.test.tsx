import {api, cleanUp, doClick, findButton, iocProps, noop, Prompts, TestContext} from "./helpers/tests";
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
    let fullScreenRequested: boolean;
    let fullScreenExited: boolean;

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

    beforeEach(() => {
        reportedError = null;
        settings = {};
        fullScreenExited = false;
        fullScreenRequested = false;
        // @ts-ignore
        // noinspection JSConstantReassignment
        document.fullscreenElement = null;
        // @ts-ignore
        // noinspection JSConstantReassignment
        document.fullscreenEnabled = false;
    })

    async function renderComponent(build?: IBuild, embed?: boolean, testRoute?: React.ReactNode) {
        if (build) {
            createBuildElements(build);
        }

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
            testRoute ? '/test' : undefined);

        document.body.requestFullscreen = async (_?: FullscreenOptions) => { fullScreenRequested = true };
        document.exitFullscreen = async () => { fullScreenExited = true; };
    }

    async function renderApp(iocProps: IIocContainerProps, content: React.ReactNode, currentPath?: string): Promise<TestContext> {
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
            prompts: new Prompts(),
        };
    }

    function createBuildElements(build: IBuild) {
        createBuildElement('build:branch', build.branch!);
        createBuildElement('build:sha', build.version!);
        createBuildElement('build:date', build.date!);
        createBuildElement('build:pr_name', build.prName!);
    }

    function createBuildElement(name: string, value: string) {
        const meta = document.createElement('meta');
        meta.setAttribute('name', name);
        meta.setAttribute('content', value);
        document.head.appendChild(meta);
    }

    function isForDomain(a: HTMLAnchorElement, domain: string) {
        const href = a.getAttribute('href')!;
        const url = new URL(href);

        return url.host === domain;
    }

    function assertSocialLinks() {
        const socialLinks = Array.from(context.container.querySelectorAll('div.social-header a[href]')) as HTMLAnchorElement[];
        expect(socialLinks.length).toEqual(3);
        const email = socialLinks.filter(a => a.getAttribute('href')!.indexOf('mailto:') !== -1)[0];
        const facebook = socialLinks.filter(a => isForDomain(a, 'www.facebook.com'))[0];
        const twitter = socialLinks.filter(a => isForDomain(a, 'twitter.com'))[0];
        expect(email).toBeTruthy();
        expect(facebook).toBeTruthy();
        expect(twitter).toBeTruthy();
    }

    function assertHeading() {
        const heading = context.container.querySelector('h1.heading')!;
        expect(heading).toBeTruthy();
        expect(heading.textContent).toEqual('COURAGE LEAGUE');
    }

    function assertMenu(loading?: boolean) {
        const header = context.container.querySelector('header')!;
        expect(header).toBeTruthy();
        const menuItems = Array.from(header.querySelectorAll('li.nav-item'));
        const menuItemText = menuItems.map(li => li.textContent);
        const divisionMenuItems = loading ? [] : allDivisions.map((d: DivisionDto) => d.name);
        const expectedMenuItemsAfterDivisions: string[] = [];

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

    function FullScreenElement() {
        const {fullScreen} = useApp();

        return (<div>
            <input type="checkbox" readOnly name="isFullScreen" checked={fullScreen.isFullScreen} />
            <input type="checkbox" readOnly name="canGoFullScreen" checked={fullScreen.canGoFullScreen} />
            <button className="btn" onClick={() => fullScreen.exitFullScreen()}>exitFullScreen</button>
            <button className="btn" onClick={() => fullScreen.enterFullScreen()}>enterFullScreen</button>
            <button className="btn" onClick={() => fullScreen.toggleFullScreen()}>toggleFullScreen</button>
        </div>)
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
            await renderComponent(undefined, true);

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

            await renderComponent();

            assertSocialLinks();
            assertHeading();
            assertMenu();
        });

        it('with divisions', async () => {
            allDivisions = [
                divisionBuilder('Division One').build(),
                divisionBuilder('Division Two').build()
            ];

            await renderComponent();

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
                undefined,
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
                undefined,
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
                undefined,
                false,
                (<Route path='/test' element={<TestElement/>}/>));

            await doClick(findButton(context.container, 'invalidateCacheAndTryAgain'));

            expect(settings.invalidateCacheOnNextRequest).toEqual(true);
            expect(context.container.textContent).not.toContain('An error occurred');
        });

        it('can clear error', async () => {
            await renderComponent(
                undefined,
                false,
                (<Route path='/test' element={<TestElement/>}/>));
            await doClick(findButton(context.container, 'onError'));

            await doClick(findButton(context.container, 'Clear error'));

            expect(context.container.textContent).not.toContain('An error occurred');
        });

        describe('enterFullscreen', () => {
            it('can enter full screen if enabled', async () => {
                // @ts-ignore
                // noinspection JSConstantReassignment
                document.fullscreenEnabled = true;
                await renderComponent(
                    undefined,
                    false,
                    (<Route path='/test' element={<FullScreenElement/>}/>));
                const canGoFullScreen = context.container.querySelector('input[name="canGoFullScreen"]')! as HTMLInputElement;
                expect(canGoFullScreen.checked).toEqual(true);

                await doClick(findButton(context.container, 'enterFullScreen'));

                expect(fullScreenRequested).toEqual(true);
            });

            it('does not enter full screen if disabled', async () => {
                await renderComponent(
                    undefined,
                    false,
                    (<Route path='/test' element={<FullScreenElement/>}/>));
                const canGoFullScreen = context.container.querySelector('input[name="canGoFullScreen"]')! as HTMLInputElement;
                expect(canGoFullScreen.checked).toEqual(false);

                await doClick(findButton(context.container, 'enterFullScreen'));

                expect(fullScreenRequested).toEqual(false);
            });
        });

        describe('exitFullscreen', () => {
            it('can exit full screen if in full screen', async () => {
                // @ts-ignore
                // noinspection JSConstantReassignment
                document.fullscreenElement = document.createElement('hr');
                await renderComponent(
                    undefined,
                    false,
                    (<Route path='/test' element={<FullScreenElement/>}/>));
                const wasFullScreen = context.container.querySelector('input[name="isFullScreen"]')! as HTMLInputElement;
                expect(wasFullScreen.checked).toEqual(true);

                await doClick(findButton(context.container, 'exitFullScreen'));

                expect(fullScreenExited).toEqual(true);
            });

            it('does not exit full screen if not in full screen', async () => {
                await renderComponent(
                    undefined,
                    false,
                    (<Route path='/test' element={<FullScreenElement/>}/>));
                // @ts-ignore
                // noinspection JSConstantReassignment
                document.fullscreenEnabled = true;
                const wasFullScreen = context.container.querySelector('input[name="isFullScreen"]')! as HTMLInputElement;
                expect(wasFullScreen.checked).toEqual(false);

                await doClick(findButton(context.container, 'exitFullScreen'));

                expect(fullScreenExited).toEqual(false);
            });
        });

        describe('toggleFullscreen', () => {
            it('enters full screen if enabled and not in full screen', async () => {
                // @ts-ignore
                // noinspection JSConstantReassignment
                document.fullscreenEnabled = true;
                await renderComponent(
                    undefined,
                    false,
                    (<Route path='/test' element={<FullScreenElement/>}/>));
                const canGoFullScreen = context.container.querySelector('input[name="canGoFullScreen"]')! as HTMLInputElement;
                expect(canGoFullScreen.checked).toEqual(true);
                const wasFullScreen = context.container.querySelector('input[name="isFullScreen"]')! as HTMLInputElement;
                expect(wasFullScreen.checked).toEqual(false);

                await doClick(findButton(context.container, 'toggleFullScreen'));

                expect(fullScreenRequested).toEqual(true);
                expect(fullScreenExited).toEqual(false);
            });

            it('exits full screen if in full screen', async () => {
                // @ts-ignore
                // noinspection JSConstantReassignment
                document.fullscreenEnabled = true;
                // @ts-ignore
                // noinspection JSConstantReassignment
                document.fullscreenElement = document.createElement('hr');
                await renderComponent(
                    undefined,
                    false,
                    (<Route path='/test' element={<FullScreenElement/>}/>));
                const canGoFullScreen = context.container.querySelector('input[name="canGoFullScreen"]')! as HTMLInputElement;
                expect(canGoFullScreen.checked).toEqual(true);
                const wasFullScreen = context.container.querySelector('input[name="isFullScreen"]')! as HTMLInputElement;
                expect(wasFullScreen.checked).toEqual(true);

                await doClick(findButton(context.container, 'toggleFullScreen'));

                expect(fullScreenRequested).toEqual(false);
                expect(fullScreenExited).toEqual(true);
            });
        });
    });
});