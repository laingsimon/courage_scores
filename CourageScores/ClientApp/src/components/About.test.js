// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../helpers/tests";
import {renderDate} from "../helpers/rendering";
import React from "react";
import {About} from "./About";
import {BrandingContainer} from "../BrandingContainer";

describe('About', () => {
    let context;
    let reportedError;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(build, branding) {
        reportedError = null;
        context = await renderApp(
            { },
            branding,
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                build
            },
            (<About />));
    }

    function getRow(title) {
        const rows = Array.from(context.container.querySelectorAll('table.table tbody tr'));
        const row = rows.filter(row => {
            const heading = row.querySelector('th');
            return heading.textContent === title;
        })[0];

        expect(row).toBeTruthy();
        return row;
    }

    describe('with build information', () => {
        it('shows branch', async () => {
           await renderComponent({
               branch: 'BRANCH',
               version: '0123456789abcdef',
               date: '2023-04-05T06:07:08',
           }, {});

           const branchRow = getRow('Branch');
           const cell = branchRow.querySelector('td');
           expect(cell.textContent).toEqual('BRANCH');
        });

        it('shows version', async () => {
            await renderComponent({
                branch: 'BRANCH',
                version: '0123456789abcdef',
                date: '2023-04-05T06:07:08',
            }, {});

            const branchRow = getRow('Version');
            const cell = branchRow.querySelector('td');
            const link = cell.querySelector('a');
            expect(link.href).toEqual(`https://github.com/laingsimon/courage_scores/commit/0123456789abcdef`);
            expect(link.textContent).toEqual('01234567');
            expect(cell.textContent).toEqual('01234567');
        });

        it('shows empty when no version', async () => {
            await renderComponent({
                branch: 'BRANCH',
                date: '2023-04-05T06:07:08',
            }, {});

            const branchRow = getRow('Version');
            const cell = branchRow.querySelector('td');
            expect(cell.textContent).toEqual('Unknown');
        });

        it('shows date', async () => {
            const buildDate = '2023-04-05T06:07:08';
            await renderComponent({
                branch: 'BRANCH',
                version: '0123456789abcdef',
                date: buildDate,
            }, {});

            const branchRow = getRow('Date');
            const cell = branchRow.querySelector('td');
            const expectedDate = renderDate(buildDate) + ' ' + new Date(buildDate).toLocaleTimeString();
            expect(cell.textContent).toEqual(expectedDate);
        });
    });

    describe('with branding', () => {
        it('renders link to brand website', async () => {
            await renderComponent({}, {
                name: 'COURAGE SCORES',
                website: 'https://couragescores',
                custodians: [],
            });

            const links = Array.from(context.container.querySelectorAll('a'));
            const websiteLink = links.filter(link => link.textContent === 'COURAGE SCORES')[0];
            expect(websiteLink).toBeTruthy();
            expect(websiteLink.href).toEqual('https://couragescores/');
        });

        it('renders custodians', async () => {
            await renderComponent({}, {
                name: 'COURAGE SCORES',
                website: 'https://couragescores',
                custodians: [ 'Simon', 'Laing' ],
            });

            const custodians = Array.from(context.container.querySelectorAll('p')).filter(p => p.textContent.indexOf('Custodians') !== -1)[0];
            expect(custodians).toBeTruthy();
            expect(custodians.textContent).toContain('Simon');
            expect(custodians.textContent).toContain('Laing');
        });
    });
});