import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    ErrorState,
    IComponent,
    iocProps,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { createTemporaryId } from '../../helpers/projection';
import {
    DivisionDataContainer,
    IDivisionDataContainerProps,
} from '../league/DivisionDataContainer';
import { DivisionReports } from './DivisionReports';
import { seasonBuilder } from '../../helpers/builders/seasons';
import { ReportDto } from '../../interfaces/models/dtos/Report/ReportDto';
import { ReportCollectionDto } from '../../interfaces/models/dtos/Report/ReportCollectionDto';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';
import { IReportApi } from '../../interfaces/apis/IReportApi';

describe('DivisionReports', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let returnReport: ReportCollectionDto;
    // noinspection JSUnusedGlobalSymbols
    const reportApi = api<IReportApi>({
        getReport: async () => {
            return returnReport;
        },
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function renderComponent(
        account: UserDto,
        divisionData: IDivisionDataContainerProps,
    ) {
        context = await renderApp(
            iocProps({ reportApi }),
            brandingProps(),
            appProps(
                {
                    account: account,
                },
                reportedError,
            ),
            <DivisionDataContainer {...divisionData}>
                <DivisionReports />
            </DivisionDataContainer>,
            '/division/:divisionId/reports/:seasonId',
            `/division/${divisionData.name}/reports/${divisionData.season!.name}/`,
        );
    }

    function createDivisionData(
        divisionId: string,
    ): IDivisionDataContainerProps {
        return {
            id: divisionId,
            name: 'DIVISION',
            teams: [],
            players: [],
            season: seasonBuilder('A season')
                .starting('2022-02-03T00:00:00')
                .ending('2022-08-25T00:00:00')
                .build(),
            onReloadDivision: async () => null,
            setDivisionData: async () => null,
            children: null,
        };
    }

    function assertReportRow(row: IComponent, values: string[]) {
        expect(row.all('td').map((t) => t.text())).toEqual(values);
    }

    describe('when logged in', () => {
        const account: UserDto = {
            name: '',
            givenName: '',
            emailAddress: '',
            access: {
                runReports: true,
            },
        };

        it('renders component', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);

            await renderComponent(account, divisionData);

            reportedError.verifyNoError();
            expect(
                context.all('.content-background input').length,
            ).toBeGreaterThan(0);
        });

        it('can fetch reports', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [
                    {
                        name: 'A report',
                        description: 'A report description',
                        columns: [],
                        rows: [],
                    },
                ],
                messages: [],
                created: '',
            };

            await context.button('📊 Get reports...').click();

            reportedError.verifyNoError();
        });

        it('handles api exception when fetching reports', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                Exception: {
                    Message: 'Some server side error',
                    created: '',
                },
                created: '',
            } as ReportCollectionDto;

            await context.button('📊 Get reports...').click();

            expect(reportedError.error).toEqual('Some server side error');
        });

        it('remembers selected report after subsequent fetch', async () => {
            const report1: ReportDto = {
                name: 'report-1',
                description: 'Report 1',
                columns: [],
                rows: [],
            };
            const report2: ReportDto = {
                name: 'report-2',
                description: 'Report 2',
                columns: [],
                rows: [],
            };
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [report1, report2],
                messages: [],
                created: '',
            };
            await context.button('📊 Get reports...').click();

            await context.required('.dropdown-menu').select('Report 2');
            await context.button('📊 Get reports...').click();

            const activeItem = context.required(
                '.dropdown-menu .dropdown-item.active',
            );
            expect(activeItem.text()).toEqual('Report 2');
        });

        it('selects first report if selected report not available on subsequent fetch', async () => {
            const report1: ReportDto = {
                name: 'report-1',
                description: 'Report 1',
                columns: [],
                rows: [],
            };
            const report2: ReportDto = {
                name: 'report-2',
                description: 'Report 2',
                columns: [],
                rows: [],
            };
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [report1, report2],
                messages: [],
                created: '',
            };
            await context.button('📊 Get reports...').click();
            await context.required('.dropdown-menu').select('Report 2');

            returnReport = {
                reports: [report1],
                messages: [],
                created: '',
            };
            await context.button('📊 Get reports...').click();

            const activeItem = context.required(
                '.dropdown-menu .dropdown-item.active',
            );
            expect(activeItem.text()).toEqual('Report 1');
        });

        it('selects no report if no reports returned on subsequent fetch', async () => {
            const report1: ReportDto = {
                name: 'report-1',
                description: 'Report 1',
                columns: [],
                rows: [],
            };
            const report2: ReportDto = {
                name: 'report-2',
                description: 'Report 2',
                columns: [],
                rows: [],
            };
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [report1, report2],
                messages: [],
                created: '',
            };
            await context.button('📊 Get reports...').click();
            await context.required('.dropdown-menu').select('Report 2');

            returnReport = {
                reports: [],
                messages: [],
                created: '',
            };
            await context.button('📊 Get reports...').click();

            expect(
                context.optional('.dropdown-menu .dropdown-item.active'),
            ).toBeUndefined();
        });

        it('renders messages', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [
                    {
                        name: 'A report',
                        description: 'A report description',
                        columns: [],
                        rows: [],
                    },
                ],
                messages: ['A message'],
                created: '',
            };

            await context.button('📊 Get reports...').click();

            reportedError.verifyNoError();
            const messages = context.all('.content-background ul > li');
            expect(messages.map((li) => li.text())).toEqual(['A message']);
        });

        it('renders report options', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [
                    {
                        name: 'A report',
                        description: 'A report description',
                        columns: [],
                        rows: [],
                    },
                    {
                        name: 'Another report',
                        description: 'Another report description',
                        columns: [],
                        rows: [],
                    },
                ],
                messages: [],
                created: '',
            };

            await context.button('📊 Get reports...').click();

            reportedError.verifyNoError();
            const reportOptions = context.all(
                '.content-background div.btn-group div[role="menu"] > button',
            );
            expect(reportOptions.map((b) => b.text())).toEqual([
                'A report description',
                'Another report description',
            ]);
        });

        it('renders report rows', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [
                    {
                        name: 'A report',
                        description: 'A report description',
                        columns: [
                            'A team heading',
                            'A player heading',
                            'A value heading',
                        ],
                        rows: [
                            {
                                cells: [
                                    {
                                        text: 'A team',
                                    },
                                    {
                                        text: 'A player',
                                    },
                                    {
                                        text: '1',
                                    },
                                ],
                            },
                            {
                                cells: [
                                    {
                                        text: 'Another team',
                                    },
                                    {
                                        text: 'Another player',
                                    },
                                    {
                                        text: '2',
                                    },
                                ],
                            },
                        ],
                    },
                ],
                messages: [],
                created: '',
            };

            await context.button('📊 Get reports...').click();

            reportedError.verifyNoError();
            const reportTable = context.required('.content-background table');
            const reportHeadings = reportTable.all('thead tr th');
            expect(reportHeadings.map((th) => th.text())).toEqual([
                '',
                'A team heading',
                'A player heading',
                'A value heading',
            ]);
            const reportRows = reportTable.all('tbody tr');
            expect(reportRows.length).toEqual(2);
            assertReportRow(reportRows[0], ['1', 'A team', 'A player', '1']);
            assertReportRow(reportRows[1], [
                '2',
                'Another team',
                'Another player',
                '2',
            ]);
        });

        it('renders per-division print heading', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [
                    {
                        name: 'A report',
                        description: 'A report description',
                        columns: [
                            'A team heading',
                            'A player heading',
                            'A value heading',
                        ],
                        rows: [
                            {
                                cells: [
                                    {
                                        text: 'A team',
                                    },
                                    {
                                        text: 'A player',
                                    },
                                    {
                                        text: '1',
                                    },
                                ],
                            },
                            {
                                cells: [
                                    {
                                        text: 'Another team',
                                    },
                                    {
                                        text: 'Another player',
                                    },
                                    {
                                        text: '2',
                                    },
                                ],
                            },
                        ],
                        thisDivisionOnly: true,
                    },
                ],
                messages: [],
                created: '',
            };

            await context.button('📊 Get reports...').click();

            reportedError.verifyNoError();
            const heading = context.required(
                'div[datatype="print-division-heading"]',
            );
            expect(heading.text()).toEqual('DIVISION, A season');
        });

        it('renders cross-division print heading', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [
                    {
                        name: 'A report',
                        description: 'A report description',
                        columns: [
                            'A team heading',
                            'A player heading',
                            'A value heading',
                        ],
                        rows: [
                            {
                                cells: [
                                    {
                                        text: 'A team',
                                    },
                                    {
                                        text: 'A player',
                                    },
                                    {
                                        text: '1',
                                    },
                                ],
                            },
                            {
                                cells: [
                                    {
                                        text: 'Another team',
                                    },
                                    {
                                        text: 'Another player',
                                    },
                                    {
                                        text: '2',
                                    },
                                ],
                            },
                        ],
                        thisDivisionOnly: false,
                    },
                ],
                messages: [],
                created: '',
            };

            await context.button('📊 Get reports...').click();

            reportedError.verifyNoError();
            const heading = context.required(
                'div[datatype="print-division-heading"]',
            );
            expect(heading.text()).toEqual('A season');
        });

        it('renders link to tournament', async () => {
            const divisionId = createTemporaryId();
            const tournamentId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [
                    {
                        name: 'A report',
                        description: 'A report description',
                        columns: ['heading'],
                        rows: [
                            {
                                cells: [
                                    {
                                        text: 'TEXT',
                                        tournamentId: tournamentId,
                                    },
                                ],
                            },
                        ],
                    },
                ],
                messages: [],
                created: '',
            };

            await context.button('📊 Get reports...').click();

            reportedError.verifyNoError();
            const reportTable = context.required('.content-background table');
            const reportRows = reportTable.all('tbody tr');
            expect(reportRows.length).toEqual(1);
            const link = reportRows[0]
                .required('a')
                .element<HTMLAnchorElement>();
            expect(link.href).toEqual(
                `http://localhost/tournament/${tournamentId}`,
            );
            expect(link.text).toEqual('TEXT');
        });

        it('renders link to player by name', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [
                    {
                        name: 'A report',
                        description: 'A report description',
                        columns: ['heading'],
                        rows: [
                            {
                                cells: [
                                    {
                                        text: 'TEXT',
                                        playerName: 'PLAYER',
                                        teamName: 'TEAM',
                                        divisionName: 'DIVISION',
                                    },
                                ],
                            },
                        ],
                    },
                ],
                messages: [],
                created: '',
            };

            await context.button('📊 Get reports...').click();

            reportedError.verifyNoError();
            const reportTable = context.required('.content-background table');
            const reportRows = reportTable.all('tbody tr');
            expect(reportRows.length).toEqual(1);
            const link = reportRows[0]
                .required('a')
                .element<HTMLAnchorElement>();
            expect(link.href).toEqual(
                `http://localhost/division/DIVISION/player:PLAYER@TEAM/A%20season`,
            );
            expect(link.text).toEqual('TEXT');
        });

        it('renders link to team by name', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [
                    {
                        name: 'A report',
                        description: 'A report description',
                        columns: ['heading'],
                        rows: [
                            {
                                cells: [
                                    {
                                        text: 'TEXT',
                                        teamName: 'TEAM',
                                        divisionName: 'DIVISION',
                                    },
                                ],
                            },
                        ],
                    },
                ],
                messages: [],
                created: '',
            };

            await context.button('📊 Get reports...').click();

            reportedError.verifyNoError();
            const reportTable = context.required('.content-background table');
            const reportRows = reportTable.all('tbody tr');
            expect(reportRows.length).toEqual(1);
            const link = reportRows[0]
                .required('a')
                .element<HTMLAnchorElement>();
            expect(link.href).toEqual(
                `http://localhost/division/DIVISION/team:TEAM/A%20season`,
            );
            expect(link.text).toEqual('TEXT');
        });

        it('renders link to player by id', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [
                    {
                        name: 'A report',
                        description: 'A report description',
                        columns: ['heading'],
                        rows: [
                            {
                                cells: [
                                    {
                                        text: 'TEXT',
                                        playerId: 'PLAYER_ID',
                                        teamId: 'TEAM_ID',
                                        divisionId: 'DIVISION_ID',
                                    },
                                ],
                            },
                        ],
                    },
                ],
                messages: [],
                created: '',
            };

            await context.button('📊 Get reports...').click();

            reportedError.verifyNoError();
            const reportTable = context.required('.content-background table');
            const reportRows = reportTable.all('tbody tr');
            expect(reportRows.length).toEqual(1);
            const link = reportRows[0]
                .required('a')
                .element<HTMLAnchorElement>();
            expect(link.href).toEqual(
                `http://localhost/division/DIVISION_ID/player:PLAYER_ID@TEAM_ID/A%20season`,
            );
            expect(link.text).toEqual('TEXT');
        });

        it('renders link to team by id', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [
                    {
                        name: 'A report',
                        description: 'A report description',
                        columns: ['heading'],
                        rows: [
                            {
                                cells: [
                                    {
                                        text: 'TEXT',
                                        teamId: 'TEAM_ID',
                                        divisionId: 'DIVISION_ID',
                                    },
                                ],
                            },
                        ],
                    },
                ],
                messages: [],
                created: '',
            };

            await context.button('📊 Get reports...').click();

            reportedError.verifyNoError();
            const reportTable = context.required('.content-background table');
            const reportRows = reportTable.all('tbody tr');
            expect(reportRows.length).toEqual(1);
            const link = reportRows[0]
                .required('a')
                .element<HTMLAnchorElement>();
            expect(link.href).toEqual(
                `http://localhost/division/DIVISION_ID/team:TEAM_ID/A%20season`,
            );
            expect(link.text).toEqual('TEXT');
        });

        it('renders missing cells', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [
                    {
                        name: 'A report',
                        description: 'A report description',
                        columns: ['heading', 'optional column '],
                        rows: [
                            {
                                cells: [
                                    {
                                        text: 'TEXT',
                                    },
                                ],
                            },
                        ],
                    },
                ],
                messages: [],
                created: '',
            };

            await context.button('📊 Get reports...').click();

            reportedError.verifyNoError();
            const reportTable = context.required('.content-background table');
            const reportRows = reportTable.all('tbody tr');
            expect(reportRows.length).toEqual(1);
            expect(reportRows[0].all('td').length).toEqual(1 + 2);
        });
    });
});
