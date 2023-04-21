// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../tests/helpers";
import React from "react";
import {createTemporaryId} from "../../Utilities";
import {DivisionDataContainer} from "../DivisionDataContainer";
import {DivisionTeams} from "./DivisionTeams";

describe('DivisionTeams', () => {
    let context;
    let reportedError;
    let divisionReloaded = false;
    let account;

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(divisionData) {
        reportedError = null;
        divisionReloaded = false;
        context = await renderApp(
            { },
            {
                account: account,
                onError: (err) => {
                    reportedError = err;
                },
                error: null,
            },
            (<DivisionDataContainer {...divisionData}>
                <DivisionTeams />
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
            teams: [ {
                id: createTemporaryId(),
                name: 'A team 2',
                played: 1,
                points: 2,
                fixturesWon: 3,
                fixturesLost: 4,
                fixturesDrawn: 5,
                difference: 6,
                rank: 2
            }, {
                id: createTemporaryId(),
                name: 'A team 1',
                played: 1,
                points: 2,
                fixturesWon: 3,
                fixturesLost: 4,
                fixturesDrawn: 5,
                difference: 6,
                rank: 1
            } ],
            players: [ ],
            season: season
        };
    }

    async function onReloadDivision() {
        divisionReloaded = true;
    }

    function assertTeam(tr, values) {
        expect(Array.from(tr.querySelectorAll('td')).map(td => td.textContent)).toEqual(values);
    }

    describe('when logged out', () => {
        beforeEach(() => {
            account = null;
        });

        it('renders teams', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);

            await renderComponent(
                { ...divisionData, onReloadDivision: onReloadDivision });

            expect(reportedError).toBeNull();
            const teamsRows = context.container.querySelectorAll('.light-background table.table tbody tr');
            expect(teamsRows.length).toEqual(2);
            assertTeam(teamsRows[0], [ 'A team 1', '1', '2', '3', '4', '5', '6' ]);
            assertTeam(teamsRows[1], [ 'A team 2', '1', '2', '3', '4', '5', '6' ]);
        });

        it('does not render add team button', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);

            await renderComponent(
                { ...divisionData, onReloadDivision: onReloadDivision });

            expect(reportedError).toBeNull();
            const addTeamButton = context.container.querySelector('.light-background > div > div .btn-primary');
            expect(addTeamButton).toBeFalsy();
        });
    });

    describe('when logged in', () => {
        beforeEach(() => {
            account = { access: { manageTeams: true } };
        });

        it('renders teams', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);

            await renderComponent(
                { ...divisionData, onReloadDivision: onReloadDivision });

            expect(reportedError).toBeNull();
            const teamsRows = context.container.querySelectorAll('.light-background table.table tbody tr');
            expect(teamsRows.length).toEqual(2);
            assertTeam(teamsRows[0], [ '✏️➕A team 1', '1', '2', '3', '4', '5', '6' ]);
            assertTeam(teamsRows[1], [ '✏️➕A team 2', '1', '2', '3', '4', '5', '6' ]);
        });

        it('renders add team button', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);

            await renderComponent(
                { ...divisionData, onReloadDivision: onReloadDivision });

            expect(reportedError).toBeNull();
            const addTeamButton = context.container.querySelector('.light-background > div > div .btn-primary');
            expect(addTeamButton).toBeTruthy();
        });
    });
});