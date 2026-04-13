import {
    appProps,
    cleanUp,
    IComponent,
    iocProps,
    renderApp,
    TestContext,
} from '../helpers/tests';
import { renderDate } from '../helpers/rendering';
import { About } from './About';
import { IBuild } from './common/IBuild';
import { IBrandingContainerProps } from './common/BrandingContainer';
import { IBrandingData } from './common/IBrandingData';

describe('About', () => {
    let context: TestContext;
    const emptyBuild: IBuild = {};
    const emptyBranding: IBrandingData = {
        name: '',
        menu: {
            beforeDivisions: [],
            afterDivisions: [],
        },
    };

    afterEach(async () => {
        await cleanUp(context);
    });

    async function renderComponent(
        build: IBuild,
        branding: IBrandingContainerProps,
    ) {
        context = await renderApp(
            iocProps(),
            branding,
            appProps({ build }),
            <About />,
        );
    }

    function getRow(title: string): IComponent {
        const rows = context.all('table.table tbody tr');
        const row = rows.find((r) => r.optional('th')?.text() === title);

        expect(row).toBeTruthy();
        return row!;
    }

    describe('with build information', () => {
        it('shows branch', async () => {
            await renderComponent(
                {
                    branch: 'BRANCH',
                    version: '0123456789abcdef',
                    date: '2023-04-05T06:07:08',
                    prName: 'my PR title',
                },
                emptyBranding,
            );

            const branchRow = getRow('Branch');
            const cell = branchRow.required('td');
            expect(cell.text()).toEqual('BRANCH');
        });

        it('shows version', async () => {
            await renderComponent(
                {
                    branch: 'BRANCH',
                    version: '0123456789abcdef',
                    date: '2023-04-05T06:07:08',
                    prName: 'my PR title',
                },
                emptyBranding,
            );

            const branchRow = getRow('Version');
            const cell = branchRow.required('td');
            const link = cell.required('a');
            expect(link.element<HTMLAnchorElement>().href).toEqual(
                `https://github.com/laingsimon/courage_scores/commit/0123456789abcdef`,
            );
            expect(link.text()).toEqual('my PR title (01234567)');
        });

        it('shows version with PR link', async () => {
            await renderComponent(
                {
                    branch: 'BRANCH',
                    version: '0123456789abcdef',
                    date: '2023-04-05T06:07:08',
                    prName: 'my PR title',
                    prLink: 'https://github.com/laingsimon/courage_scores/pulls/1234',
                },
                emptyBranding,
            );

            const branchRow = getRow('Version');
            const cell = branchRow.required('td');
            const link = cell.required('a');
            expect(link.element<HTMLAnchorElement>().href).toEqual(
                `https://github.com/laingsimon/courage_scores/pulls/1234`,
            );
            expect(link.text()).toEqual('my PR title (01234567)');
        });

        it('shows empty when no version', async () => {
            await renderComponent(
                {
                    branch: 'BRANCH',
                    date: '2023-04-05T06:07:08',
                },
                emptyBranding,
            );

            const branchRow = getRow('Version');
            const cell = branchRow.required('td');
            expect(cell.text()).toEqual('Unknown');
        });

        it('shows date', async () => {
            const buildDate = '2023-04-05T06:07:08Z';
            await renderComponent(
                {
                    branch: 'BRANCH',
                    version: '0123456789abcdef',
                    date: buildDate,
                },
                emptyBranding,
            );

            const branchRow = getRow('Date');
            const cell = branchRow.required('td');
            const expectedDate =
                renderDate(buildDate) +
                ' ' +
                new Date(buildDate).toLocaleTimeString();
            expect(cell.text()).toEqual(expectedDate);
        });
    });

    describe('with branding', () => {
        it('renders link to brand website', async () => {
            await renderComponent(emptyBuild, {
                name: 'COURAGE SCORES',
                website: 'https://couragescores',
                custodians: [],
                email: '',
                menu: { beforeDivisions: [], afterDivisions: [] },
                twitter: '',
                facebook: '',
            });

            const websiteLink = context
                .all('a')
                .find((link) => link.text() === 'COURAGE SCORES');
            expect(websiteLink).toBeTruthy();
            expect(websiteLink!.element<HTMLAnchorElement>().href).toEqual(
                'https://couragescores/',
            );
        });

        it('renders custodians', async () => {
            await renderComponent(emptyBuild, {
                name: 'COURAGE SCORES',
                website: 'https://couragescores',
                custodians: ['Simon', 'Laing'],
                email: '',
                menu: { beforeDivisions: [], afterDivisions: [] },
                twitter: '',
                facebook: '',
            });

            const custodians = context
                .all('p')
                .find((p) => (p.text() ?? '').indexOf('Custodians') !== -1);
            expect(custodians).toBeTruthy();
            expect(custodians!.text()).toContain('Simon');
            expect(custodians!.text()).toContain('Laing');
        });
    });
});
