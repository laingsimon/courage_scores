import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    doSelectOption, ErrorState,
    findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import {createTemporaryId} from "../../helpers/projection";
import {DivisionDataContainer, IDivisionDataContainerProps} from "../league/DivisionDataContainer";
import {DivisionReports} from "./DivisionReports";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {ReportDto} from "../../interfaces/models/dtos/Report/ReportDto";
import {ReportCollectionDto} from "../../interfaces/models/dtos/Report/ReportCollectionDto";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {IReportApi} from "../../interfaces/apis/IReportApi";

describe('DivisionReports', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let returnReport: ReportCollectionDto;
    // noinspection JSUnusedGlobalSymbols
    const reportApi = api<IReportApi>({
        getReport: async () => {
            return returnReport;
        }
    });

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function renderComponent(account: UserDto, divisionData: IDivisionDataContainerProps) {
        context = await renderApp(
            iocProps({reportApi}),
            brandingProps(),
            appProps({
                account: account,
            }, reportedError),
            (<DivisionDataContainer {...divisionData}>
                <DivisionReports/>
            </DivisionDataContainer>),
            '/division/:divisionId/reports/:seasonId',
            `/division/${divisionData.name}/reports/${divisionData.season.name}/`);
    }

    function createDivisionData(divisionId: string): IDivisionDataContainerProps {
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

    function assertReportRow(tr: HTMLTableRowElement, values: string[]) {
        expect(Array.from(tr.querySelectorAll('td')).map(td => td.textContent)).toEqual(values);
    }

    describe('when logged in', () => {
        const account: UserDto = {
            name: '',
            givenName: '',
            emailAddress: '',
            access: {
                runReports: true
            },
        };

        it('renders component', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);

            await renderComponent(account, divisionData);

            reportedError.verifyNoError();
            const input = context.container.querySelectorAll('.content-background input');
            expect(input).toBeTruthy();
        });

        it('can fetch reports', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [{
                    name: 'A report',
                    description: 'A report description',
                    columns: [],
                    rows: []
                }],
                messages: []
            }

            await doClick(findButton(context.container, '📊 Get reports...'));

            reportedError.verifyNoError();
        });

        it('handles api exception when fetching reports', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                Exception: {
                    Message: 'Some server side error',
                },
            } as ReportCollectionDto;

            await doClick(findButton(context.container, '📊 Get reports...'));

            expect(reportedError.error).toEqual('Some server side error');
        });

        it('remembers selected report after subsequent fetch', async () => {
            const report1: ReportDto = {
                name: 'report-1',
                description: 'Report 1',
                columns: [],
                rows: []
            };
            const report2: ReportDto = {
                name: 'report-2',
                description: 'Report 2',
                columns: [],
                rows: []
            };
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [report1, report2],
                messages: []
            }
            await doClick(findButton(context.container, '📊 Get reports...'));

            await doSelectOption(context.container.querySelector('.dropdown-menu'), 'Report 2');
            await doClick(findButton(context.container, '📊 Get reports...'));

            const activeItem = context.container.querySelector('.dropdown-menu .dropdown-item.active');
            expect(activeItem.textContent).toEqual('Report 2');
        });

        it('selects first report if selected report not available on subsequent fetch', async () => {
            const report1: ReportDto = {
                name: 'report-1',
                description: 'Report 1',
                columns: [],
                rows: []
            };
            const report2: ReportDto = {
                name: 'report-2',
                description: 'Report 2',
                columns: [],
                rows: []
            };
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [report1, report2],
                messages: []
            }
            await doClick(findButton(context.container, '📊 Get reports...'));
            await doSelectOption(context.container.querySelector('.dropdown-menu'), 'Report 2');

            returnReport = {
                reports: [report1],
                messages: []
            }
            await doClick(findButton(context.container, '📊 Get reports...'));

            const activeItem = context.container.querySelector('.dropdown-menu .dropdown-item.active');
            expect(activeItem.textContent).toEqual('Report 1');
        });

        it('selects no report if no reports returned on subsequent fetch', async () => {
            const report1: ReportDto = {
                name: 'report-1',
                description: 'Report 1',
                columns: [],
                rows: []
            };
            const report2: ReportDto = {
                name: 'report-2',
                description: 'Report 2',
                columns: [],
                rows: []
            };
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [report1, report2],
                messages: []
            }
            await doClick(findButton(context.container, '📊 Get reports...'));
            await doSelectOption(context.container.querySelector('.dropdown-menu'), 'Report 2');

            returnReport = {
                reports: [],
                messages: []
            }
            await doClick(findButton(context.container, '📊 Get reports...'));

            const activeItem = context.container.querySelector('.dropdown-menu .dropdown-item.active');
            expect(activeItem).toBeNull();
        });

        it('renders messages', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [{
                    name: 'A report',
                    description: 'A report description',
                    columns: [],
                    rows: []
                }],
                messages: ['A message']
            }

            await doClick(findButton(context.container, '📊 Get reports...'));

            reportedError.verifyNoError();
            const messages = Array.from(context.container.querySelectorAll('.content-background ul > li')) as HTMLElement[];
            expect(messages.map(li => li.textContent)).toEqual(['A message']);
        });

        it('renders report options', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [{
                    name: 'A report',
                    description: 'A report description',
                    columns: [],
                    rows: []
                }, {
                    name: 'Another report',
                    description: 'Another report description',
                    columns: [],
                    rows: []
                }],
                messages: []
            }

            await doClick(findButton(context.container, '📊 Get reports...'));

            reportedError.verifyNoError();
            const reportOptions = Array.from(context.container.querySelectorAll('.content-background div.btn-group div[role="menu"] > button')) as HTMLButtonElement[];
            expect(reportOptions.map(li => li.textContent)).toEqual(['A report description', 'Another report description']);
        });

        it('renders report rows', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [{
                    name: 'A report',
                    description: 'A report description',
                    columns: ['A team heading', 'A player heading', 'A value heading'],
                    rows: [{
                        cells: [{
                            text: 'A team',
                        }, {
                            text: 'A player',
                        }, {
                            text: '1'
                        }],
                    }, {
                        cells: [ {
                            text: 'Another team',
                        }, {
                            text: 'Another player',
                        }, {
                            text: '2'
                        } ],
                    }],
                }],
                messages: []
            }

            await doClick(findButton(context.container, '📊 Get reports...'));

            reportedError.verifyNoError();
            const reportTable = context.container.querySelector('.content-background table');
            expect(reportTable).toBeTruthy();
            const reportHeadings = Array.from(reportTable.querySelectorAll('thead tr th')) as HTMLTableCellElement[];
            expect(Array.from(reportHeadings).map(li => li.textContent)).toEqual(['', 'A team heading', 'A player heading', 'A value heading']);
            const reportRows = Array.from(reportTable.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
            expect(reportRows.length).toEqual(2);
            assertReportRow(reportRows[0], ['1', 'A team', 'A player', '1']);
            assertReportRow(reportRows[1], ['2', 'Another team', 'Another player', '2']);
        });

        it('renders per-division print heading', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [{
                    name: 'A report',
                    description: 'A report description',
                    columns: ['A team heading', 'A player heading', 'A value heading'],
                    rows: [{
                        cells: [{
                            text: 'A team',
                        }, {
                            text: 'A player',
                        }, {
                            text: '1'
                        }],
                    }, {
                        cells: [ {
                            text: 'Another team',
                        }, {
                            text: 'Another player',
                        }, {
                            text: '2'
                        } ],
                    }],
                    thisDivisionOnly: true,
                }],
                messages: []
            }

            await doClick(findButton(context.container, '📊 Get reports...'));

            reportedError.verifyNoError();
            const heading = context.container.querySelector('div[datatype="print-division-heading"]');
            expect(heading).toBeTruthy();
            expect(heading.textContent).toEqual('DIVISION, A season');
        });

        it('renders cross-division print heading', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [{
                    name: 'A report',
                    description: 'A report description',
                    columns: ['A team heading', 'A player heading', 'A value heading'],
                    rows: [{
                        cells: [{
                            text: 'A team',
                        }, {
                            text: 'A player',
                        }, {
                            text: '1'
                        }],
                    }, {
                        cells: [ {
                            text: 'Another team',
                        }, {
                            text: 'Another player',
                        }, {
                            text: '2'
                        } ],
                    }],
                    thisDivisionOnly: false,
                }],
                messages: []
            }

            await doClick(findButton(context.container, '📊 Get reports...'));

            reportedError.verifyNoError();
            const heading = context.container.querySelector('div[datatype="print-division-heading"]');
            expect(heading).toBeTruthy();
            expect(heading.textContent).toEqual('A season');
        });

        it('renders link to tournament', async () => {
            const divisionId = createTemporaryId();
            const tournamentId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [{
                    name: 'A report',
                    description: 'A report description',
                    columns: ['heading'],
                    rows: [{
                        cells: [{
                            text: 'TEXT',
                            tournamentId: tournamentId,
                        }],
                    }],
                }],
                messages: []
            }

            await doClick(findButton(context.container, '📊 Get reports...'));

            reportedError.verifyNoError();
            const reportTable = context.container.querySelector('.content-background table');
            expect(reportTable).toBeTruthy();
            const reportRows = Array.from(reportTable.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
            expect(reportRows.length).toEqual(1);
            const link: HTMLAnchorElement = reportRows[0].querySelector('a');
            expect(link.href).toEqual(`http://localhost/tournament/${tournamentId}`);
            expect(link.text).toEqual('TEXT');
        });

        it('renders link to player by name', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [{
                    name: 'A report',
                    description: 'A report description',
                    columns: ['heading'],
                    rows: [{
                        cells: [{
                            text: 'TEXT',
                            playerName: 'PLAYER',
                            teamName: 'TEAM',
                            divisionName: 'DIVISION',
                        }],
                    }],
                }],
                messages: []
            }

            await doClick(findButton(context.container, '📊 Get reports...'));

            reportedError.verifyNoError();
            const reportTable = context.container.querySelector('.content-background table');
            expect(reportTable).toBeTruthy();
            const reportRows = Array.from(reportTable.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
            expect(reportRows.length).toEqual(1);
            const link: HTMLAnchorElement = reportRows[0].querySelector('a');
            expect(link.href).toEqual(`http://localhost/division/DIVISION/player:PLAYER@TEAM/A%20season`);
            expect(link.text).toEqual('TEXT');
        });

        it('renders link to team by name', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [{
                    name: 'A report',
                    description: 'A report description',
                    columns: ['heading'],
                    rows: [{
                        cells: [{
                            text: 'TEXT',
                            teamName: 'TEAM',
                            divisionName: 'DIVISION',
                        }],
                    }],
                }],
                messages: []
            }

            await doClick(findButton(context.container, '📊 Get reports...'));

            reportedError.verifyNoError();
            const reportTable = context.container.querySelector('.content-background table');
            expect(reportTable).toBeTruthy();
            const reportRows = Array.from(reportTable.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
            expect(reportRows.length).toEqual(1);
            const link: HTMLAnchorElement = reportRows[0].querySelector('a');
            expect(link.href).toEqual(`http://localhost/division/DIVISION/team:TEAM/A%20season`);
            expect(link.text).toEqual('TEXT');
        });

        it('renders link to player by id', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [{
                    name: 'A report',
                    description: 'A report description',
                    columns: ['heading'],
                    rows: [{
                        cells: [{
                            text: 'TEXT',
                            playerId: 'PLAYER_ID',
                            teamId: 'TEAM_ID',
                            divisionId: 'DIVISION_ID',
                        }],
                    }],
                }],
                messages: []
            }

            await doClick(findButton(context.container, '📊 Get reports...'));

            reportedError.verifyNoError();
            const reportTable = context.container.querySelector('.content-background table');
            expect(reportTable).toBeTruthy();
            const reportRows = Array.from(reportTable.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
            expect(reportRows.length).toEqual(1);
            const link: HTMLAnchorElement = reportRows[0].querySelector('a');
            expect(link.href).toEqual(`http://localhost/division/DIVISION_ID/player:PLAYER_ID@TEAM_ID/A%20season`);
            expect(link.text).toEqual('TEXT');
        });

        it('renders link to team by id', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [{
                    name: 'A report',
                    description: 'A report description',
                    columns: ['heading'],
                    rows: [{
                        cells: [{
                            text: 'TEXT',
                            teamId: 'TEAM_ID',
                            divisionId: 'DIVISION_ID',
                        }],
                    }],
                }],
                messages: []
            }

            await doClick(findButton(context.container, '📊 Get reports...'));

            reportedError.verifyNoError();
            const reportTable = context.container.querySelector('.content-background table');
            expect(reportTable).toBeTruthy();
            const reportRows = Array.from(reportTable.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
            expect(reportRows.length).toEqual(1);
            const link: HTMLAnchorElement = reportRows[0].querySelector('a');
            expect(link.href).toEqual(`http://localhost/division/DIVISION_ID/team:TEAM_ID/A%20season`);
            expect(link.text).toEqual('TEXT');
        });

        it('renders missing cells', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [{
                    name: 'A report',
                    description: 'A report description',
                    columns: ['heading', 'optional column '],
                    rows: [{
                        cells: [{
                            text: 'TEXT',
                        }],
                    }],
                }],
                messages: []
            }

            await doClick(findButton(context.container, '📊 Get reports...'));

            reportedError.verifyNoError();
            const reportTable = context.container.querySelector('.content-background table');
            expect(reportTable).toBeTruthy();
            const reportRows = Array.from(reportTable.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
            expect(reportRows.length).toEqual(1);
            const cells = Array.from(reportRows[0].querySelectorAll('td')) as HTMLTableCellElement[];
            expect(cells.length).toEqual(1 + 2);
        });
    });
});