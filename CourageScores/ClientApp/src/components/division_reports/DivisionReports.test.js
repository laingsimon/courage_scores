// noinspection JSUnresolvedFunction

import {cleanUp, doClick, renderApp} from "../../helpers/tests";
import React from "react";
import {act} from "@testing-library/react";
import {createTemporaryId} from "../../helpers/projection";
import {DivisionDataContainer} from "../DivisionDataContainer";
import {DivisionReports} from "./DivisionReports";

describe('DivisionTeams', () => {
    let context;
    let reportedError;
    let divisionReloaded = false;
    let account;
    let requestedReports;
    let returnReport;
    const mockReportApi = {
        getReport: async (req) => {
            requestedReports.push(req);
            return returnReport;
        }
    };

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(divisionData) {
        reportedError = null;
        divisionReloaded = false;
        requestedReports = [];
        context = await renderApp(
            { reportApi: mockReportApi },
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
        beforeEach(() => {
            account = { access: { runReports: true } };
        });

        it('renders component', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);

            await renderComponent(divisionData);

            expect(reportedError).toBeNull();
            const input = context.container.querySelectorAll('.light-background input');
            expect(input).toBeTruthy();
        });

        it('can fetch reports', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(divisionData);
            returnReport = {
                reports: [ {
                    name: 'A report',
                    description: 'A report description',
                    valueHeading: 'Value',
                    rows: []
                } ],
                messages: [ ]
            }

            await act(async () => {
                await doClick(context.container, '.light-background button');
            })

            expect(reportedError).toBeNull();
        });

        it('renders messages', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(divisionData);
            returnReport = {
                reports: [ {
                    name: 'A report',
                    description: 'A report description',
                    valueHeading: 'Value',
                    rows: []
                } ],
                messages: [ 'A message' ]
            }

            await act(async () => {
                await doClick(context.container, '.light-background button');
            })

            expect(reportedError).toBeNull();
            const messages = context.container.querySelectorAll('.light-background ul > li');
            expect(Array.from(messages).map(li => li.textContent)).toEqual([ 'A message' ]);
        });

        it('renders report options', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(divisionData);
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

            await act(async () => {
                await doClick(context.container, '.light-background button');
            })

            expect(reportedError).toBeNull();
            const reportOptions = context.container.querySelectorAll('.light-background div.btn-group > div[role="menu"] > button');
            expect(Array.from(reportOptions).map(li => li.textContent)).toEqual([ 'A report description', 'Another report description' ]);
        });

        it('renders report rows', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(divisionData);
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

            await act(async () => {
                await doClick(context.container, '.light-background button');
            })

            expect(reportedError).toBeNull();
            const reportTable = context.container.querySelector('.light-background table');
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