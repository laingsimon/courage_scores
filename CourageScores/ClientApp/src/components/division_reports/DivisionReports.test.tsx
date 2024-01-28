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
import React from "react";
import {createTemporaryId} from "../../helpers/projection";
import {DivisionDataContainer, IDivisionDataContainerProps} from "../DivisionDataContainer";
import {DivisionReports} from "./DivisionReports";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {IReportDto} from "../../interfaces/serverSide/Report/IReportDto";
import {IReportCollectionDto} from "../../interfaces/serverSide/Report/IReportCollectionDto";
import {IUserDto} from "../../interfaces/serverSide/Identity/IUserDto";
import {IReportApi} from "../../api/report";
import {IClientActionResultDto} from "../../interfaces/IClientActionResultDto";

describe('DivisionReports', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let returnReport: IReportCollectionDto;
    // noinspection JSUnusedGlobalSymbols
    const reportApi = api<IReportApi>({
        getReport: async () => {
            return returnReport;
        }
    });

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
    });

    async function renderComponent(account: IUserDto, divisionData: IDivisionDataContainerProps) {
        context = await renderApp(
            iocProps({reportApi}),
            brandingProps(),
            appProps({
                account: account,
            }, reportedError),
            (<DivisionDataContainer {...divisionData}>
                <DivisionReports/>
            </DivisionDataContainer>));
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
        const account: IUserDto = {
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

            expect(reportedError.hasError()).toEqual(false);
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
                    valueHeading: 'Value',
                    rows: []
                }],
                messages: []
            }

            await doClick(findButton(context.container, '📊 Get reports...'));

            expect(reportedError.hasError()).toEqual(false);
        });

        it('handles api exception when fetching reports', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                Exception: {
                    Message: 'Some server side error',
                },
            } as IReportCollectionDto;

            await doClick(findButton(context.container, '📊 Get reports...'));

            expect(reportedError.error).toEqual('Some server side error');
        });

        it('remembers selected report after subsequent fetch', async () => {
            const report1: IReportDto = {
                name: 'report-1',
                description: 'Report 1',
                valueHeading: 'Value',
                rows: []
            };
            const report2: IReportDto = {
                name: 'report-2',
                description: 'Report 2',
                valueHeading: 'Value',
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
            const report1: IReportDto = {
                name: 'report-1',
                description: 'Report 1',
                valueHeading: 'Value',
                rows: []
            };
            const report2: IReportDto = {
                name: 'report-2',
                description: 'Report 2',
                valueHeading: 'Value',
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
            const report1: IReportDto = {
                name: 'report-1',
                description: 'Report 1',
                valueHeading: 'Value',
                rows: []
            };
            const report2: IReportDto = {
                name: 'report-2',
                description: 'Report 2',
                valueHeading: 'Value',
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
                    valueHeading: 'Value',
                    rows: []
                }],
                messages: ['A message']
            }

            await doClick(findButton(context.container, '📊 Get reports...'));

            expect(reportedError.hasError()).toEqual(false);
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
                    valueHeading: 'Value',
                    rows: []
                }, {
                    name: 'Another report',
                    description: 'Another report description',
                    valueHeading: 'Count',
                    rows: []
                }],
                messages: []
            }

            await doClick(findButton(context.container, '📊 Get reports...'));

            expect(reportedError.hasError()).toEqual(false);
            const reportOptions = Array.from(context.container.querySelectorAll('.content-background div.btn-group > div[role="menu"] > button')) as HTMLButtonElement[];
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
                    valueHeading: 'A value heading',
                    rows: [{
                        playerName: 'A player',
                        teamName: 'A team',
                        value: 1
                    }, {
                        playerName: 'Another player',
                        teamName: 'Another team',
                        value: 2
                    }]
                }],
                messages: []
            }

            await doClick(findButton(context.container, '📊 Get reports...'));

            expect(reportedError.hasError()).toEqual(false);
            const reportTable = context.container.querySelector('.content-background table');
            expect(reportTable).toBeTruthy();
            const reportHeadings = Array.from(reportTable.querySelectorAll('thead tr th')) as HTMLTableCellElement[];
            expect(Array.from(reportHeadings).map(li => li.textContent)).toEqual(['', 'Player', 'Team', 'A value heading']);
            const reportRows = Array.from(reportTable.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
            expect(reportRows.length).toEqual(2);
            assertReportRow(reportRows[0], ['1', 'A player', 'A team', '1']);
            assertReportRow(reportRows[1], ['2', 'Another player', 'Another team', '2']);
        });

        it('renders per-division print heading', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [{
                    name: 'A report',
                    description: 'A report description',
                    valueHeading: 'A value heading',
                    rows: [{
                        playerName: 'A player',
                        teamName: 'A team',
                        value: 1
                    }, {
                        playerName: 'Another player',
                        teamName: 'Another team',
                        value: 2
                    }],
                    thisDivisionOnly: true,
                }],
                messages: []
            }

            await doClick(findButton(context.container, '📊 Get reports...'));

            expect(reportedError.hasError()).toEqual(false);
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
                    valueHeading: 'A value heading',
                    rows: [{
                        playerName: 'A player',
                        teamName: 'A team',
                        value: 1
                    }, {
                        playerName: 'Another player',
                        teamName: 'Another team',
                        value: 2
                    }],
                    thisDivisionOnly: false,
                }],
                messages: []
            }

            await doClick(findButton(context.container, '📊 Get reports...'));

            expect(reportedError.hasError()).toEqual(false);
            const heading = context.container.querySelector('div[datatype="print-division-heading"]');
            expect(heading).toBeTruthy();
            expect(heading.textContent).toEqual('A season');
        });
    });
});