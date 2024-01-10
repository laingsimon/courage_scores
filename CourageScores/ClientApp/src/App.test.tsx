// noinspection JSUnresolvedFunction

import {cleanUp, doClick, findButton, noop} from "./helpers/tests";
import React from "react";
import {App} from "./App";
import {act} from "@testing-library/react";
import {MemoryRouter, Route} from "react-router-dom";
import {IocContainer} from "./IocContainer";
import ReactDOM from "react-dom/client";
import {useApp} from "./AppContainer";
import {BrandingContainer} from "./BrandingContainer";
import {divisionBuilder} from "./helpers/builders";

describe('App', () => {
    let context;
    let allDivisions = [];
    let account = null;
    let allSeasons = [];
    let allTeams = [];
    let reportedError;
    let settings;

    const divisionApi = {
        getAll: async () => {
            if (allDivisions.length || allDivisions.length === 0) {
                return allDivisions;
            }

            // noinspection ES6RedundantAwait
            return await allDivisions;
        }
    };
    const accountApi = {
        account: async () => account
    };
    const seasonApi = {
        getAll: async () => allSeasons
    };
    const teamApi = {
        getAll: async () => allTeams
    };
    const errorApi = {
        add: async (error) => {
            reportedError = error;
        }
    };

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(build, embed, testRoute) {
        if (build) {
            createBuildElements(build);
        }

        reportedError = null;
        settings = {};
        context = await renderApp(
            {
                divisionApi,
                accountApi,
                seasonApi,
                teamApi,
                errorApi,
                settings,
            },
            (<BrandingContainer name='COURAGE LEAGUE'>
                <App embed={embed} testRoute={testRoute}/>
            </BrandingContainer>),
            testRoute ? '/test' : null);
    }

    async function renderApp(iocProps, content, currentPath) {
        const container = document.createElement('div');
        document.body.appendChild(container);

        await act(async () => {
            const component = (<MemoryRouter initialEntries={[currentPath]}>
                <IocContainer {...iocProps}>{content}</IocContainer>
            </MemoryRouter>);
            ReactDOM.createRoot(container).render(component);
        });

        return {
            container: container,
            cleanUp: () => {
                if (container) {
                    document.body.removeChild(container);
                }
            }
        };
    }

    function createBuildElements(build) {
        createBuildElement('build:branch', build.branch);
        createBuildElement('build:sha', build.version);
        createBuildElement('build:date', build.date);
    }

    function createBuildElement(name, value) {
        const meta = document.createElement('meta');
        meta.setAttribute('name', name);
        meta.setAttribute('content', value);
        document.head.appendChild(meta);
    }

    function isForDomain(a, domain) {
        const href = a.getAttribute('href');
        const url = new URL(href);

        return url.host === domain;
    }

    function assertSocialLinks() {
        const socialLinks = Array.from(context.container.querySelectorAll('div.social-header a[href]'));
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

    function assertMenu(loading) {
        const header = context.container.querySelector('header');
        expect(header).toBeTruthy();
        const menuItems = Array.from(header.querySelectorAll('li.nav-item'));
        const menuItemText = menuItems.map(li => li.textContent);
        const divisionMenuItems = loading ? [] : allDivisions.map(d => d.name);
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
            <button onClick={() => onError(error)}>onError</button>
            <button onClick={clearError}>clearError</button>
            <button onClick={invalidateCacheAndTryAgain}>invalidateCacheAndTryAgain</button>
            <button onClick={() => reportClientSideException(error)}>reportClientSideException</button>
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
                date: '2023-04-05T06:07:08'
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
                givenName: 'Simon'
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
            let resolve;
            let reject;
            allDivisions = new Promise((res, rej) => {
                resolve = res;
                reject = rej;
            });

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