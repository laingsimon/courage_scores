import {appProps, cleanUp, iocProps, renderApp, TestContext} from "../helpers/tests";
import {renderDate} from "../helpers/rendering";
import React from "react";
import {About} from "./About";
import {IBuild} from "../interfaces/IBuild";
import {IBrandingContainerProps} from "../BrandingContainer";

describe('About', () => {
    let context: TestContext;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(build: IBuild, branding: IBrandingContainerProps) {
        context = await renderApp(
            iocProps(),
            branding,
            appProps({build}),
            (<About/>));
    }

    function getRow(title: string): HTMLTableRowElement {
        const rows: HTMLTableRowElement[] = Array.from(context.container.querySelectorAll('table.table tbody tr'));
        const row = rows.filter(row => {
            const heading = row.querySelector('th') as HTMLTableCellElement;
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
            }, {} as any);

            const branchRow = getRow('Branch');
            const cell = branchRow.querySelector('td') as HTMLTableCellElement;
            expect(cell.textContent).toEqual('BRANCH');
        });

        it('shows version', async () => {
            await renderComponent({
                branch: 'BRANCH',
                version: '0123456789abcdef',
                date: '2023-04-05T06:07:08',
            }, {} as any);

            const branchRow = getRow('Version');
            const cell = branchRow.querySelector('td') as HTMLTableCellElement;
            const link = cell.querySelector('a') as HTMLAnchorElement;
            expect(link.href).toEqual(`https://github.com/laingsimon/courage_scores/commit/0123456789abcdef`);
            expect(link.textContent).toEqual('01234567');
            expect(cell.textContent).toEqual('01234567');
        });

        it('shows empty when no version', async () => {
            await renderComponent({
                branch: 'BRANCH',
                date: '2023-04-05T06:07:08',
                version: null!,
            }, {} as any);

            const branchRow = getRow('Version');
            const cell = branchRow.querySelector('td') as HTMLTableCellElement;
            expect(cell.textContent).toEqual('Unknown');
        });

        it('shows date', async () => {
            const buildDate = '2023-04-05T06:07:08';
            await renderComponent({
                branch: 'BRANCH',
                version: '0123456789abcdef',
                date: buildDate,
            }, {} as any);

            const branchRow = getRow('Date');
            const cell = branchRow.querySelector('td') as HTMLTableCellElement;
            const expectedDate = renderDate(buildDate) + ' ' + new Date(buildDate).toLocaleTimeString();
            expect(cell.textContent).toEqual(expectedDate);
        });
    });

    describe('with branding', () => {
        it('renders link to brand website', async () => {
            await renderComponent({} as any, {
                name: 'COURAGE SCORES',
                website: 'https://couragescores',
                custodians: [],
                email: '',
                menu: { beforeDivisions: [], afterDivisions: [] },
                twitter: '',
                facebook: '',
            });

            const links = Array.from(context.container.querySelectorAll('a'));
            const websiteLink = links.filter(link => link.textContent === 'COURAGE SCORES')[0];
            expect(websiteLink).toBeTruthy();
            expect(websiteLink.href).toEqual('https://couragescores/');
        });

        it('renders custodians', async () => {
            await renderComponent({} as any, {
                name: 'COURAGE SCORES',
                website: 'https://couragescores',
                custodians: ['Simon', 'Laing'],
                email: '',
                menu: { beforeDivisions: [], afterDivisions: [] },
                twitter: '',
                facebook: '',
            });

            const custodians = Array.from(context.container.querySelectorAll('p')).filter(p => p.textContent!.indexOf('Custodians') !== -1)[0];
            expect(custodians).toBeTruthy();
            expect(custodians.textContent).toContain('Simon');
            expect(custodians.textContent).toContain('Laing');
        });
    });
});