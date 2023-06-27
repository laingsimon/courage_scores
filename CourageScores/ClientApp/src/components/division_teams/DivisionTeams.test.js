// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick, doChange, findButton} from "../../helpers/tests";
import React from "react";
import {createTemporaryId} from "../../helpers/projection";
import {DivisionDataContainer} from "../DivisionDataContainer";
import {DivisionTeams} from "./DivisionTeams";

describe('DivisionTeams', () => {
    let context;
    let reportedError;
    let divisionReloaded = false;
    let account;
    const teamApi = {
        update: async (team, lastUpdated) => {
            return {
                success: true,
                result: team,
            };
        }
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(divisionData, divisions) {
        reportedError = null;
        divisionReloaded = false;
        context = await renderApp(
            { teamApi },
            {
                account: account,
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                divisions: divisions || [],
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
            const teamsRows = context.container.querySelectorAll('.content-background table.table tbody tr');
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
            const addTeamButton = context.container.querySelector('.content-background > div > div .btn-primary');
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
            const teamsRows = context.container.querySelectorAll('.content-background table.table tbody tr');
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
            const addTeamButton = context.container.querySelector('.content-background > div > div .btn-primary');
            expect(addTeamButton).toBeTruthy();
        });

        it('renders add team dialog', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(
                { ...divisionData, onReloadDivision: onReloadDivision });

            await doClick(findButton(context.container, 'Add team'));

            expect(reportedError).toBeNull();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            expect(dialog.textContent).toContain('Create a new team...');
        });

        it('can create new team', async () => {
            const divisionId = createTemporaryId();
            const divisionData = createDivisionData(divisionId);
            await renderComponent(
                { ...divisionData, onReloadDivision: onReloadDivision });
            await doClick(findButton(context.container, 'Add team'));
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog.textContent).toContain('Create a new team...');

            await doChange(dialog, 'input[name="name"]', 'NEW TEAM', context.user);
            await doClick(findButton(dialog, 'Add team'));

            expect(reportedError).toBeNull();
            expect(divisionReloaded).toEqual(true);
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy(); // dialog closed
        });
    });
});