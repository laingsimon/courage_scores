// noinspection JSUnresolvedFunction

import {cleanUp, doChange, doClick, findButton, renderApp} from "../../helpers/tests";
import React from "react";
import {DivisionPlayer} from "./DivisionPlayer";
import {DivisionDataContainer} from "../DivisionDataContainer";
import {createTemporaryId, EMPTY_ID} from "../../helpers/projection";

describe('DivisionPlayer', () => {
    let context;
    let reportedError;
    let teamsReloaded;
    let divisionReloaded;
    let deletedPlayer;
    let updatedPlayer;
    let apiResponse;
    const playerApi = {
        delete: async (seasonId, teamId, playerId) => {
            deletedPlayer = {seasonId, teamId, playerId};
            return apiResponse || {success: true};
        },
        update: async (seasonId, teamId, playerId, playerDetails, lastUpdated) => {
            updatedPlayer = {seasonId, teamId, playerId, playerDetails, lastUpdated};
            return apiResponse || {success: true};
        }
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props, divisionData, account) {
        reportedError = null;
        teamsReloaded = false;
        divisionReloaded = false;
        deletedPlayer = null;
        updatedPlayer = null;
        apiResponse = null;
        context = await renderApp(
            {
                playerApi
            },
            {name: 'Courage Scores'},
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                account,
                reloadTeams: () => teamsReloaded = true,
                teams: [],
                divisions: []
            },
            (<DivisionDataContainer {...divisionData} onReloadDivision={() => divisionReloaded = true}>
                <DivisionPlayer {...props} />
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
        const player = {
            id: createTemporaryId(),
            rank: 1,
            name: 'NAME',
            team: 'TEAM',
            teamId: createTemporaryId(),
            singles: {
                matchesPlayed: 2,
                matchesWon: 3,
                matchesLost: 4,
            },
            points: 5,
            winPercentage: 6,
            oneEighties: 7,
            over100Checkouts: 8,
        };

        describe('renders', () => {
            it('with venue', async () => {
                await renderComponent({
                        player,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name},
                    account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('td'));
                expect(cells.length).toEqual(10);
                expect(cells.map(c => c.textContent)).toEqual([
                    '1',
                    'NAME',
                    'TEAM',
                    '2',
                    '3',
                    '4',
                    '5',
                    '6',
                    '7',
                    '8']);
            });

            it('captaincy marker', async () => {
                const captain = Object.assign({}, player);
                captain.captain = true;
                await renderComponent({
                        player: captain,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name},
                    account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('td'));
                expect(cells.length).toEqual(10);
                const nameCell = cells[1];
                expect(nameCell.textContent).toEqual('🤴 NAME');
            });

            it('without venue', async () => {
                await renderComponent({
                        player,
                        hideVenue: true
                    },
                    {id: division.id, season, name: division.name},
                    account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('td'));
                expect(cells.length).toEqual(9);
                expect(cells.map(c => c.textContent)).toEqual([
                    '1',
                    'NAME',
                    '2',
                    '3',
                    '4',
                    '5',
                    '6',
                    '7',
                    '8']);
            });

            it('no action buttons', async () => {
                await renderComponent({
                        player,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name},
                    account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('td'));
                const playerLinkCell = cells[1];
                expect(playerLinkCell.querySelector('button')).toBeFalsy();
            });

            it('link to player details', async () => {
                await renderComponent({
                        player,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name},
                    account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('td'));
                const playerLinkCell = cells[1];
                const link = playerLinkCell.querySelector('a');
                expect(link).toBeTruthy();
                expect(link.href).toEqual(`http://localhost/division/${division.name}/player:${player.name}@${player.team}/${season.name}`);
            });

            it('link to team details', async () => {
                await renderComponent({
                        player,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name},
                    account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('td'));
                const teamLinkCell = cells[2];
                const link = teamLinkCell.querySelector('a');
                expect(link).toBeTruthy();
                expect(link.href).toEqual(`http://localhost/division/${division.name}/team:${player.team}/${season.name}`);
            });

            it('team name only if no team id', async () => {
                const noTeamPlayer = Object.assign({}, player);
                noTeamPlayer.teamId = EMPTY_ID;
                await renderComponent({
                        player: noTeamPlayer,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name},
                    account);

                expect(reportedError).toBeNull();
                const cells = Array.from(context.container.querySelectorAll('td'));
                const teamLinkCell = cells[2];
                const link = teamLinkCell.querySelector('a');
                expect(link).toBeFalsy();
                expect(teamLinkCell.textContent).toEqual(noTeamPlayer.team);
            });
        });
    });

    describe('when logged in', () => {
        const account = {
            access: {
                managePlayers: true,
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
        const player = {
            id: createTemporaryId(),
            rank: 1,
            name: 'NAME',
            team: 'TEAM',
            teamId: createTemporaryId(),
            singles: {
                matchesPlayed: 2,
                matchesWon: 3,
                matchesLost: 4,
            },
            points: 5,
            winPercentage: 6,
            oneEighties: 7,
            over100Checkouts: 8,
        };
        let confirm;
        let response = false;
        window.confirm = (message) => {
            confirm = message;
            return response
        };

        beforeEach(() => {
            confirm = null;
        });

        describe('interactivity', () => {
            it('can show edit player dialog', async () => {
                await renderComponent({
                        player,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name},
                    account);
                const nameCell = context.container.querySelector('td:nth-child(2)');
                expect(nameCell.textContent).toContain('NAME');

                await doClick(findButton(nameCell, '✏️'));

                const dialog = nameCell.querySelector('.modal-dialog');
                expect(dialog).toBeTruthy();
                expect(dialog.textContent).toContain('Edit player: NAME');
            });

            it('can close edit player dialog', async () => {
                await renderComponent({
                        player,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name},
                    account);
                const nameCell = context.container.querySelector('td:nth-child(2)');
                await doClick(findButton(nameCell, '✏️'));
                expect(nameCell.querySelector('.modal-dialog')).toBeTruthy();

                await doClick(findButton(nameCell.querySelector('.modal-dialog'), 'Cancel'));

                expect(nameCell.querySelector('.modal-dialog')).toBeFalsy();
            });

            it('prevents delete of player', async () => {
                await renderComponent({
                        player,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name},
                    account);
                const nameCell = context.container.querySelector('td:nth-child(2)');
                response = false;

                await doClick(findButton(nameCell, '🗑️'));

                expect(confirm).toEqual('Are you sure you want to delete NAME?');
                expect(deletedPlayer).toBeNull();
                expect(divisionReloaded).toEqual(false);
                expect(teamsReloaded).toEqual(false);
            });

            it('can delete player', async () => {
                await renderComponent({
                        player,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name},
                    account);
                const nameCell = context.container.querySelector('td:nth-child(2)');
                response = true;

                await doClick(findButton(nameCell, '🗑️'));

                expect(confirm).toEqual('Are you sure you want to delete NAME?');
                expect(deletedPlayer).not.toBeNull();
                expect(divisionReloaded).toEqual(true);
                expect(teamsReloaded).toEqual(true);
            });

            it('can save player details', async () => {
                await renderComponent({
                        player,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name},
                    account);
                const nameCell = context.container.querySelector('td:nth-child(2)');
                await doClick(findButton(nameCell, '✏️'));
                const dialog = nameCell.querySelector('.modal-dialog');
                await doChange(dialog, 'input[name="name"]', 'NEW NAME', context.user);

                await doClick(findButton(dialog, 'Save player'));

                expect(reportedError).toBeNull();
                expect(updatedPlayer).not.toBeNull();
                expect(updatedPlayer.playerDetails.name).toEqual('NEW NAME');
                expect(divisionReloaded).toEqual(true);
                expect(teamsReloaded).toEqual(true);
            });

            it('shows error if player details cannot be saved', async () => {
                await renderComponent({
                        player,
                        hideVenue: false
                    },
                    {id: division.id, season, name: division.name},
                    account);
                const nameCell = context.container.querySelector('td:nth-child(2)');
                await doClick(findButton(nameCell, '✏️'));
                const dialog = nameCell.querySelector('.modal-dialog');
                await doChange(dialog, 'input[name="name"]', 'NEW NAME', context.user);
                apiResponse = {success: false};

                await doClick(findButton(dialog, 'Save player'));

                expect(reportedError).toBeNull();
                expect(updatedPlayer).not.toBeNull();
                expect(nameCell.textContent).toContain('Could not save player details');
                expect(divisionReloaded).toEqual(false);
                expect(teamsReloaded).toEqual(false);
            });
        });
    });
});