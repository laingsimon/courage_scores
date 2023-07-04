// noinspection JSUnresolvedFunction

import {cleanUp, doClick, renderApp, findButton, doSelectOption} from "../../helpers/tests";
import React from "react";
import {createTemporaryId} from "../../helpers/projection";
import {DivisionDataContainer} from "../DivisionDataContainer";
import {DivisionReports} from "./DivisionReports";

describe('DivisionTeams', () => {
    let context;
    let reportedError;
    let divisionReloaded = false;
    let requestedReports;
    let returnReport;
    const reportApi = {
        getReport: async (req) => {
            requestedReports.push(req);
            return returnReport;
        }
    };

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(account, divisionData) {
        reportedError = null;
        divisionReloaded = false;
        requestedReports = [];
        context = await renderApp(
            { reportApi },
            { name: 'Courage Scores' },
            {
                account: account,
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                error: null,
            },
            (<DivisionDataContainer {...divisionData}>
                <DivisionReports />
            </DivisionDataContainer>));
    }

    function createDivisionData(divisionId) {
        const season = {
            id: createTemporaryId(),
            name: 'A season',
            startDate: '2022-02-03T00:00:00',
            endDate: '2022-08-25T00:00:00',
            divisions: []
        };
        return {
            id: divisionId,
            teams: [ ],
            players: [ ],
            season: season
        };
    }

    function assertReportRow(tr, values) {
        expect(Array.from(tr.querySelectorAll('td')).map(td => td.textContent)).toEqual(values);
    }

    describe('when logged in', () => {
        const account = { access: { runReports: true } };

        it('renders component', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);

            await renderComponent(account, divisionData);

            expect(reportedError).toBeNull();
            const input = context.container.querySelectorAll('.content-background input');
            expect(input).toBeTruthy();
        });

        it('can fetch reports', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [ {
                    name: 'A report',
                    description: 'A report description',
                    valueHeading: 'Value',
                    rows: []
                } ],
                messages: [ ]
            }

            await doClick(findButton(context.container, '📊 Get reports...'));

            expect(reportedError).toBeNull();
        });

        it('remembers selected report after subsequent fetch', async () => {
            const report1 = {
                name: 'report-1',
                description: 'Report 1',
                valueHeading: 'Value',
                rows: []
            };
            const report2 = {
                name: 'report-2',
                description: 'Report 2',
                valueHeading: 'Value',
                rows: []
            };
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [ report1, report2 ],
                messages: [ ]
            }
            await doClick(findButton(context.container, '📊 Get reports...'));

            await doSelectOption(context.container.querySelector('.dropdown-menu'), 'Report 2');
            await doClick(findButton(context.container, '📊 Get reports...'));

            const activeItem = context.container.querySelector('.dropdown-menu .dropdown-item.active');
            expect(activeItem.textContent).toEqual('Report 2');
        });

        it('selects first report if selected report not available on subsequent fetch', async () => {
            const report1 = {
                name: 'report-1',
                description: 'Report 1',
                valueHeading: 'Value',
                rows: []
            };
            const report2 = {
                name: 'report-2',
                description: 'Report 2',
                valueHeading: 'Value',
                rows: []
            };
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [ report1, report2 ],
                messages: [ ]
            }
            await doClick(findButton(context.container, '📊 Get reports...'));
            await doSelectOption(context.container.querySelector('.dropdown-menu'), 'Report 2');

            returnReport = {
                reports: [ report1 ],
                messages: [ ]
            }
            await doClick(findButton(context.container, '📊 Get reports...'));

            const activeItem = context.container.querySelector('.dropdown-menu .dropdown-item.active');
            expect(activeItem.textContent).toEqual('Report 1');
        });

        it('selects no report if no reports returned on subsequent fetch', async () => {
            const report1 = {
                name: 'report-1',
                description: 'Report 1',
                valueHeading: 'Value',
                rows: []
            };
            const report2 = {
                name: 'report-2',
                description: 'Report 2',
                valueHeading: 'Value',
                rows: []
            };
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [ report1, report2 ],
                messages: [ ]
            }
            await doClick(findButton(context.container, '📊 Get reports...'));
            await doSelectOption(context.container.querySelector('.dropdown-menu'), 'Report 2');

            returnReport = {
                reports: [ ],
                messages: [ ]
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
                reports: [ {
                    name: 'A report',
                    description: 'A report description',
                    valueHeading: 'Value',
                    rows: []
                } ],
                messages: [ 'A message' ]
            }

            await doClick(findButton(context.container, '📊 Get reports...'));

            expect(reportedError).toBeNull();
            const messages = context.container.querySelectorAll('.content-background ul > li');
            expect(Array.from(messages).map(li => li.textContent)).toEqual([ 'A message' ]);
        });

        it('renders report options', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [ {
                    name: 'A report',
                    description: 'A report description',
                    valueHeading: 'Value',
                    rows: []
                }, {
                    name: 'Another report',
                    description: 'Another report description',
                    valueHeading: 'Count',
                    rows: []
                } ],
                messages: [ ]
            }

            await doClick(findButton(context.container, '📊 Get reports...'));

            expect(reportedError).toBeNull();
            const reportOptions = context.container.querySelectorAll('.content-background div.btn-group > div[role="menu"] > button');
            expect(Array.from(reportOptions).map(li => li.textContent)).toEqual([ 'A report description', 'Another report description' ]);
        });

        it('renders report rows', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(account, divisionData);
            returnReport = {
                reports: [ {
                    name: 'A report',
                    description: 'A report description',
                    valueHeading: 'A value heading',
                    rows: [ {
                        playerName: 'A player',
                        teamName: 'A team',
                        value: 1
                    }, {
                        playerName: 'Another player',
                        teamName: 'Another team',
                        value: 2
                    } ]
                } ],
                messages: [ ]
            }

            await doClick(findButton(context.container, '📊 Get reports...'));

            expect(reportedError).toBeNull();
            const reportTable = context.container.querySelector('.content-background table');
            expect(reportTable).toBeTruthy();
            const reportHeadings = reportTable.querySelectorAll('thead tr th');
            expect(Array.from(reportHeadings).map(li => li.textContent)).toEqual([ '', 'Player', 'Team', 'A value heading' ]);
            const reportRows = reportTable.querySelectorAll('tbody tr');
            expect(reportRows.length).toEqual(2);
            assertReportRow(reportRows[0], [ '1', 'A player', 'A team', '1' ]);
            assertReportRow(reportRows[1], [ '2', 'Another player', 'Another team', '2' ]);
        });
    });
});