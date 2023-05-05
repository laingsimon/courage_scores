// noinspection JSUnresolvedFunction

import {cleanUp} from "./tests/helpers";
import React from "react";
import {App} from "./App";
import {createTemporaryId} from "./Utilities";
import {act} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {IocContainer} from "./IocContainer";
import ReactDOM from "react-dom/client";

describe('App', () => {
    let context;
    let allDivisions = [];
    let account = null;
    let allSeasons = [];
    let allTeams = [];

    let divisionApi = {
        getAll: async () => {
            if (allDivisions.length || allDivisions.length === 0) {
                return allDivisions;
            }

            // noinspection ES6RedundantAwait
            return await allDivisions;
        }
    };
    let accountApi = {
        account: async () => account
    };
    let seasonApi = {
        getAll: async () => allSeasons
    };
    let teamApi = {
        getAll: async () => allTeams
    };
    let errorApi = {};

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(build, excludeSurround) {
        if (build) {
            createBuildElements(build);
        }

        context = await renderApp(
            {
                divisionApi,
                accountApi,
                seasonApi,
                teamApi,
                errorApi
            },
            <App shouldExcludeSurround={excludeSurround} />);
    }

    async function renderApp(iocProps, content) {
        const container = document.createElement('div');
        document.body.appendChild(container);

        await act(async () => {
            const component = (<MemoryRouter>
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

    function assertSocialLinks() {
        const socialLinks = Array.from(context.container.querySelectorAll('div.mid-grey-background a[href]'));
        expect(socialLinks.length).toEqual(3);
        const email = socialLinks.filter(a => a.getAttribute('href').indexOf('mailto:') !== -1)[0];
        const facebook = socialLinks.filter(a => a.getAttribute('href').indexOf('facebook.com') !== -1)[0];
        const twitter = socialLinks.filter(a => a.getAttribute('href').indexOf('twitter.com') !== -1)[0];
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
        const expectedMenuItemsBeforeDivisions = [ 'Home', 'News', 'Practice' ];
        const divisionMenuItems = loading ? [] : allDivisions.map(d => d.name);
        const expectedMenuItemsAfterDivisions = [ 'Rules', 'Downloads', 'About' ];

        if (!loading) {
            if (account) {
                expectedMenuItemsAfterDivisions.push(`Logout (${account.givenName})`);
            } else {
                expectedMenuItemsAfterDivisions.push('Login');
            }
        } else {
            expectedMenuItemsAfterDivisions.push(''); // spinner
        }

        const expectedMenuItems = expectedMenuItemsBeforeDivisions.concat(divisionMenuItems).concat(expectedMenuItemsAfterDivisions);
        expect(menuItemText).toEqual(expectedMenuItems);
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

        it('without surround', async () => {
            await renderComponent(null, true);

            const socialLinks = Array.from(context.container.querySelectorAll('div.mid-grey-background a[href]'));
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
            allDivisions = [ {
                id: createTemporaryId(),
                name: 'Division One'
            }, {
                id: createTemporaryId(),
                name: 'Division Two'
            } ];

            await renderComponent(null);

            assertSocialLinks();
            assertHeading();
            assertMenu();
        });

        it('when still loading', async () => {
            let resolve;
            let reject;
            allDivisions = new Promise((res, rej) => { resolve = res; reject = rej; });

            await renderComponent();

            assertSocialLinks();
            assertHeading();
            assertMenu(true);
        });
    });
});