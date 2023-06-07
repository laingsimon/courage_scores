// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick, doChange, findButton} from "../../helpers/tests";
import React from "react";
import {createTemporaryId} from "../../helpers/projection";
import {DivisionTeam} from "./DivisionTeam";
import {DivisionDataContainer} from "../DivisionDataContainer";

describe('DivisionTeam', () => {
    let context;
    let reportedError;
    let divisionReloaded;
    let updatedTeam;
    let apiResponse;

    const teamApi = {
        update: async (team, lastUpdated) => {
            updatedTeam = { team, lastUpdated };
            return apiResponse || { success: true, result: team };
        }
    };

    async function onReloadDivision() {
        divisionReloaded = true;
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(team, account, divisionData, teams) {
        reportedError = null;
        divisionReloaded = false;
        updatedTeam = null;
        context = await renderApp(
            {
                teamApi
            },
            {
                account,
                onError: (err) => {
                    reportedError = err;
                },
                divisions: [],
                teams: teams || [],
                seasons: []
            },
            (<DivisionDataContainer {...divisionData} onReloadDivision={onReloadDivision}>
                <DivisionTeam team={team} />
            </DivisionDataContainer>),
            null,
            null,
            'tbody');
    }

    describe('when logged out', () => {
        const account = null;
        const division = {
            id: createTemporaryId(),
            name: 'DIVISION',
        };
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
        };

        it('renders team details', async () => {
            const team = {
                id: createTemporaryId(),
                name: 'TEAM',
                played: 1,
                points: 2,
                fixturesWon: 3,
                fixturesLost: 4,
                fixturesDrawn: 5,
                difference: 6
            };

            await renderComponent(team, account, { id: division.id, season });
            expect(reportedError).toBeNull();

            const cells = Array.from(context.container.querySelectorAll('td'));
            const cellText = cells.map(c => c.textContent);
            expect(cellText).toEqual([
                'TEAM',
                '1',
                '2',
                '3',
                '4',
                '5',
                '6'
            ]);
        });

        it('does not render editing controls', async () => {
            const team = {
                id: createTemporaryId(),
                name: 'TEAM',
                played: 1,
                points: 2,
                fixturesWon: 3,
                fixturesLost: 4,
                fixturesDrawn: 5,
                difference: 6
            };

            await renderComponent(team, account, { id: division.id, season });
            expect(reportedError).toBeNull();

            const firstCell = context.container.querySelector('td:first-child');
            expect(firstCell.textContent).toEqual('TEAM');
            expect(firstCell.querySelector('button')).toBeFalsy();
        });
    });

    describe('when logged in', () => {
        const account = {
            access: {
                manageTeams: true,
            }
        };
        const division = {
            id: createTemporaryId(),
            name: 'DIVISION',
        };
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
        };

        it('can edit team', async () => {
            const team = {
                id: createTemporaryId(),
                name: 'TEAM',
                played: 1,
                points: 2,
                fixturesWon: 3,
                fixturesLost: 4,
                fixturesDrawn: 5,
                difference: 6
            };
            await renderComponent(team, account, { id: division.id, season });
            expect(reportedError).toBeNull();
            const firstCell = context.container.querySelector('td:first-child');
            const editButton = findButton(firstCell, '✏️');

            await doClick(editButton);

            expect(reportedError).toBeNull();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            expect(dialog.textContent).toContain('Edit team: TEAM');
        });

        it('can change team details', async () => {
            const team = {
                id: createTemporaryId(),
                name: 'TEAM',
                played: 1,
                points: 2,
                fixturesWon: 3,
                fixturesLost: 4,
                fixturesDrawn: 5,
                difference: 6,
                updated: '2023-07-01T00:00:00',
            };
            await renderComponent(team, account, { id: division.id, season });
            expect(reportedError).toBeNull();
            const firstCell = context.container.querySelector('td:first-child');
            const editButton = findButton(firstCell, '✏️');
            await doClick(editButton);
            const dialog = context.container.querySelector('.modal-dialog');

            doChange(dialog, 'input[name="name"]', 'NEW TEAM');
            const saveButton = findButton(dialog, 'Save team');
            await doClick(saveButton);

            expect(reportedError).toBeNull();
            expect(updatedTeam).not.toBeNull();
            expect(updatedTeam.lastUpdated).toEqual('2023-07-01T00:00:00');
            expect(updatedTeam.team.name).toEqual('NEW TEAM');
        });

        it('can close edit dialog', async () => {
            const team = {
                id: createTemporaryId(),
                name: 'TEAM',
                played: 1,
                points: 2,
                fixturesWon: 3,
                fixturesLost: 4,
                fixturesDrawn: 5,
                difference: 6
            };
            await renderComponent(team, account, { id: division.id, season });
            expect(reportedError).toBeNull();
            const firstCell = context.container.querySelector('td:first-child');
            const editButton = findButton(firstCell, '✏️');
            await doClick(editButton);
            const cancelButton = findButton(context.container.querySelector('.modal-dialog'), 'Cancel');

            await doClick(cancelButton);

            expect(reportedError).toBeNull();
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can show add to season dialog', async () => {
            const team = {
                id: createTemporaryId(),
                name: 'TEAM',
                played: 1,
                points: 2,
                fixturesWon: 3,
                fixturesLost: 4,
                fixturesDrawn: 5,
                difference: 6,
                seasons: []
            };
            await renderComponent(team, account, { id: division.id, season }, [ team ]);
            expect(reportedError).toBeNull();
            const firstCell = context.container.querySelector('td:first-child');
            const editButton = findButton(firstCell, '➕');

            await doClick(editButton);

            expect(reportedError).toBeNull();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            expect(dialog.textContent).toContain('Assign seasons');
        });

        it('can close add to season dialog', async () => {
            const team = {
                id: createTemporaryId(),
                name: 'TEAM',
                played: 1,
                points: 2,
                fixturesWon: 3,
                fixturesLost: 4,
                fixturesDrawn: 5,
                difference: 6,
                seasons: []
            };
            await renderComponent(team, account, { id: division.id, season }, [ team ]);
            expect(reportedError).toBeNull();
            const firstCell = context.container.querySelector('td:first-child');
            const editButton = findButton(firstCell, '➕');
            await doClick(editButton);
            const dialog = context.container.querySelector('.modal-dialog');

            await doClick(findButton(dialog, 'Close'));

            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });
    });
});