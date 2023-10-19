// noinspection JSUnresolvedFunction

import {cleanUp, doClick, doSelectOption, findButton, renderApp, doChange} from "../../helpers/tests";
import React from "react";
import {createTemporaryId} from "../../helpers/projection";
import {EditPlayerDetails} from "./EditPlayerDetails";
import {divisionBuilder, playerBuilder, seasonBuilder, teamBuilder} from "../../helpers/builders";

describe('EditPlayerDetails', () => {
    let context;
    let reportedError;
    let createdPlayers;
    let updatedPlayer;
    let saved;
    let change;
    let canceled;
    let apiResponse;
    let cumulativeCreatedPlayers;

    const playerApi = {
        create: async (divisionId, seasonId, teamId, playerDetails) => {
            createdPlayers.push({divisionId, seasonId, teamId, playerDetails});
            cumulativeCreatedPlayers.push(playerDetails);
            playerDetails.id = createTemporaryId();

            return apiResponse || {
                success: true,
                result: {
                    id: teamId,
                    seasons: [{
                        seasonId: seasonId,
                        players: cumulativeCreatedPlayers,
                    }]
                }
            };
        },
        update: async (seasonId, teamId, playerId, playerDetails, lastUpdated) => {
            updatedPlayer = {seasonId, teamId, playerId, playerDetails, lastUpdated};
            return apiResponse || {success: true};
        }
    }

    async function onSaved(result, newPlayers) {
        saved = { result, newPlayers };
    }

    async function onChange(name, value) {
        change = {name, value};
    }

    async function onCancel() {
        canceled = true;
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props, teams, divisions) {
        reportedError = null;
        updatedPlayer = null;
        createdPlayers = [];
        apiResponse = null;
        saved = null;
        change = null;
        canceled = false;
        cumulativeCreatedPlayers = [];
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
                teams: teams || [],
                divisions: divisions || []
            },
            (<EditPlayerDetails {...props} onSaved={onSaved} onChange={onChange} onCancel={onCancel}/>));
    }

    function findInput(name) {
        const input = context.container.querySelector(`input[name="${name}"]`);
        expect(input).toBeTruthy();
        return input;
    }

    function findNewTeamDropdown() {
        const dropdowns = Array.from(context.container.querySelectorAll(`.btn-group`));
        expect(dropdowns.length).toBeGreaterThanOrEqual(1);
        return dropdowns[0];
    }

    function findNewDivisionDropdown() {
        const dropdowns = Array.from(context.container.querySelectorAll(`.btn-group`));
        return dropdowns[1];
    }

    describe('renders', () => {
        const division = divisionBuilder('DIVISION').build();
        const season = seasonBuilder('SEASON')
            .withDivision(division)
            .build();
        const team = teamBuilder('TEAM')
            .forSeason(season, division)
            .build();

        it('existing player details', async () => {
            await renderComponent({
                player: playerBuilder('NAME').captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                newDivisionId: null,
            }, [team], [division]);

            expect(reportedError).toBeNull();
            expect(findInput('name').value).toEqual('NAME');
            expect(findInput('emailAddress').value).toEqual('EMAIL');
            expect(findInput('captain').checked).toEqual(true);
            expect(findNewTeamDropdown().querySelector('.dropdown-item.active')).toBeTruthy();
            expect(findNewTeamDropdown().querySelector('.dropdown-item.active').textContent).toEqual('TEAM');
            expect(findNewDivisionDropdown().querySelector('.dropdown-item.active')).toBeTruthy();
            expect(findNewDivisionDropdown().querySelector('.dropdown-item.active').textContent).toEqual('DIVISION');
        });

        it('new player details', async () => {
            await renderComponent({
                player: playerBuilder('NAME').noId().captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                newDivisionId: null,
            }, [team], [division]);

            expect(reportedError).toBeNull();
            expect(findInput('name').value).toEqual('NAME');
            expect(findInput('emailAddress').value).toEqual('EMAIL');
            expect(findInput('captain').checked).toEqual(true);
            expect(findNewTeamDropdown().querySelector('.dropdown-item.active')).toBeTruthy();
            expect(findNewTeamDropdown().querySelector('.dropdown-item.active').textContent).toEqual('TEAM');
            expect(findNewDivisionDropdown()).toBeFalsy();
        });

        it('excludes teams where not selected for current season', async () => {
            const differentSeasonTeam = teamBuilder('OTHER SEASON')
                .forSeason(createTemporaryId(), division)
                .build();

            await renderComponent({
                player: playerBuilder('NAME').noId().captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                newDivisionId: null,
            }, [team, differentSeasonTeam], [division]);

            const items = Array.from(findNewTeamDropdown().querySelectorAll('.dropdown-item'));
            expect(items.map(i => i.textContent)).toEqual([ 'Select team', 'TEAM' ]);
        });

        it('multi-add for new player', async () => {
            await renderComponent({
                player: playerBuilder('NAME').noId().captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                newDivisionId: null,
            }, [team], [division]);
            expect(reportedError).toBeNull();

            const multiAdd = context.container.querySelector('input[name="multiple"]');
            expect(multiAdd).toBeTruthy();
        });

        it('without multi-add for existing player', async () => {
            await renderComponent({
                player: playerBuilder('NAME').captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                newDivisionId: null,
            }, [team], [division]);
            expect(reportedError).toBeNull();

            const multiAdd = context.container.querySelector('input[name="multiple"]');
            expect(multiAdd).toBeFalsy();
        });
    });

    describe('interactivity', () => {
        const division = divisionBuilder('DIVISION').build();
        const otherDivision = divisionBuilder('OTHER DIVISION').build();
        const season = seasonBuilder('SEASON')
            .withDivision(division)
            .build();
        const team = teamBuilder('TEAM')
            .forSeason(season, division)
            .build();
        const otherTeam = teamBuilder('OTHER TEAM')
            .forSeason(season, division)
            .build();
        let confirm;
        let alert;
        let response = false;
        window.confirm = (message) => {
            confirm = message;
            return response
        };
        window.alert = (message) => {
            alert = message
        };

        beforeEach(() => {
            confirm = null;
            alert = null;
        });

        it('can change team for new player', async () => {
            await renderComponent({
                player: playerBuilder('NAME').noId().captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                newDivisionId: null,
            }, [team, otherTeam], [division, otherDivision]);
            expect(reportedError).toBeNull();
            expect(findNewTeamDropdown().querySelector('.dropdown-item.active')).toBeTruthy();

            await doSelectOption(findNewTeamDropdown().querySelector('.dropdown-menu'), 'OTHER TEAM');

            expect(change).not.toBeNull();
            expect(change.name).toEqual('teamId');
            expect(change.value).toEqual(otherTeam.id);
        });

        it('can change team for existing player', async () => {
            await renderComponent({
                player: playerBuilder('NAME').captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                newDivisionId: null,
            }, [team, otherTeam], [division, otherDivision]);
            expect(reportedError).toBeNull();
            expect(findNewTeamDropdown().querySelector('.dropdown-item.active')).toBeTruthy();

            await doSelectOption(findNewTeamDropdown().querySelector('.dropdown-menu'), 'OTHER TEAM');

            expect(change).not.toBeNull();
            expect(change.name).toEqual('newTeamId');
            expect(change.value).toEqual(otherTeam.id);
        });

        it('can change to multi-add for new player', async () => {
            await renderComponent({
                player: playerBuilder('NAME').noId().captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                newDivisionId: null,
            }, [team, otherTeam], [division, otherDivision]);
            expect(reportedError).toBeNull();

            await doClick(context.container, 'input[name="multiple"]');

            const name = context.container.querySelector('textarea');
            expect(name.value).toEqual('NAME');
            expect(context.container.querySelector('input[name="captain"]')).toBeFalsy();
            expect(context.container.querySelector('input[name="emailAddress"]')).toBeFalsy();
        });

        it('can change back to single-add for new player', async () => {
            await renderComponent({
                player: playerBuilder('NAME').noId().captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                newDivisionId: null,
            }, [team, otherTeam], [division, otherDivision]);
            expect(reportedError).toBeNull();
            await doClick(context.container, 'input[name="multiple"]');
            await doChange(context.container, 'textarea', 'NAME 1\nNAME 2', context.user);

            await doClick(context.container, 'input[name="multiple"]');

            expect(change.name).toEqual('name');
            expect(change.value).toEqual('');
            expect(context.container.querySelector('input[name="captain"]')).toBeTruthy();
            expect(context.container.querySelector('input[name="emailAddress"]')).toBeTruthy();
        });

        it('can change captaincy', async () => {
            await renderComponent({
                player: playerBuilder('NAME').captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                newDivisionId: null,
            }, [team, otherTeam], [division, otherDivision]);
            expect(reportedError).toBeNull();

            await doClick(findInput('captain'));

            expect(change).not.toBeNull();
            expect(change.name).toEqual('captain');
            expect(change.value).toEqual(false);
        });

        it('can change division for existing player', async () => {
            await renderComponent({
                player: playerBuilder('NAME').captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                newDivisionId: null,
            }, [team, otherTeam], [division, otherDivision]);
            expect(reportedError).toBeNull();

            await doSelectOption(findNewDivisionDropdown().querySelector('.dropdown-menu'), 'OTHER DIVISION');

            expect(change).not.toBeNull();
            expect(change.name).toEqual('newDivisionId');
            expect(change.value).toEqual(otherDivision.id);
        });

        it('requires team to be selected', async () => {
            await renderComponent({
                player: playerBuilder('NAME').noId().captain().email('EMAIL').build(),
                seasonId: season.id,
                team: null,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                newDivisionId: null,
            }, [team, otherTeam], [division, otherDivision]);
            expect(reportedError).toBeNull();

            await doClick(findButton(context.container, 'Add player'));

            expect(alert).toEqual('Please select a team');
        });

        it('requires name to be entered', async () => {
            await renderComponent({
                player: playerBuilder('').noId().captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                newDivisionId: null,
            }, [team, otherTeam], [division, otherDivision]);
            expect(reportedError).toBeNull();

            await doClick(findButton(context.container, 'Add player'));

            expect(alert).toEqual('Please enter a name');
        });

        it('creates new player', async () => {
            await renderComponent({
                player: playerBuilder('NAME').noId().captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                newDivisionId: null,
            }, [team, otherTeam], [division, otherDivision]);
            expect(reportedError).toBeNull();

            await doClick(findButton(context.container, 'Add player'));

            expect(createdPlayers.length).toEqual(1);
            const createdPlayer = createdPlayers[0];
            expect(createdPlayer.seasonId).toEqual(season.id);
            expect(createdPlayer.teamId).toEqual(team.id);
            expect(createdPlayer.playerDetails.name).toEqual('NAME');
            expect(createdPlayer.playerDetails.emailAddress).toEqual('EMAIL');
            expect(createdPlayer.playerDetails.captain).toEqual(true);
            expect(createdPlayer.playerDetails.newTeamId).toEqual(null);
        });

        it('identifies new player', async () => {
            await renderComponent({
                player: playerBuilder('NAME').noId().captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                newDivisionId: null,
            }, [team, otherTeam], [division, otherDivision]);
            expect(reportedError).toBeNull();

            await doClick(findButton(context.container, 'Add player'));

            expect(reportedError).toBeNull();
            expect(saved).not.toBeNull();
            expect(saved.newPlayers).toEqual([{
                name: 'NAME',
                captain: true,
                emailAddress: 'EMAIL',
                id: expect.any(String),
                newTeamId: null,
            }]);
        });

        it('creates multiple players', async () => {
            await renderComponent({
                player: playerBuilder('NAME 1\nNAME 2').noId().build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                newDivisionId: null,
            }, [team, otherTeam], [division, otherDivision]);
            expect(reportedError).toBeNull();
            await doClick(context.container, 'input[name="multiple"]');

            await doClick(findButton(context.container, 'Add players'));

            expect(createdPlayers.length).toEqual(2);
            const createdPlayer1 = createdPlayers[0];
            const createdPlayer2 = createdPlayers[1];
            expect(createdPlayer1.seasonId).toEqual(season.id);
            expect(createdPlayer1.teamId).toEqual(team.id);
            expect(createdPlayer1.playerDetails.name).toEqual('NAME 1');
            expect(createdPlayer1.playerDetails.newTeamId).toEqual(null);
            expect(createdPlayer1.playerDetails.captain).toEqual(false);
            expect(createdPlayer2.seasonId).toEqual(season.id);
            expect(createdPlayer2.teamId).toEqual(team.id);
            expect(createdPlayer2.playerDetails.name).toEqual('NAME 2');
            expect(createdPlayer2.playerDetails.newTeamId).toEqual(null);
            expect(createdPlayer2.playerDetails.captain).toEqual(false);
        });

        it('identifies created players', async () => {
            await renderComponent({
                player: playerBuilder('NAME 1\nNAME 2').noId().build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: null,
                divisionId: division.id,
                newDivisionId: null,
            }, [team, otherTeam], [division, otherDivision]);
            expect(reportedError).toBeNull();
            await doClick(context.container, 'input[name="multiple"]');

            await doClick(findButton(context.container, 'Add players'));

            expect(reportedError).toBeNull();
            expect(saved).not.toBeNull();
            expect(saved.newPlayers).toEqual([{
                id: expect.any(String),
                captain: false,
                name: 'NAME 1',
                newTeamId: null,
                emailAddress: null,
            }, {
                id: expect.any(String),
                captain: false,
                name: 'NAME 2',
                newTeamId: null,
                emailAddress: null,
            }])
        });

        it('updates existing player', async () => {
            const playerId = createTemporaryId();
            await renderComponent({
                player: playerBuilder('NAME', playerId).captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: otherTeam.id,
                divisionId: division.id,
                newDivisionId: null,
            }, [team, otherTeam], [division, otherDivision]);
            expect(reportedError).toBeNull();

            await doClick(findButton(context.container, 'Save player'));

            expect(reportedError).toBeNull();
            expect(updatedPlayer).not.toBeNull();
            expect(updatedPlayer.playerId).toEqual(playerId);
            expect(updatedPlayer.seasonId).toEqual(season.id);
            expect(updatedPlayer.teamId).toEqual(team.id);
            expect(updatedPlayer.playerDetails.gameId).toBeUndefined();
            expect(updatedPlayer.playerDetails.name).toEqual('NAME');
            expect(updatedPlayer.playerDetails.emailAddress).toEqual('EMAIL');
            expect(updatedPlayer.playerDetails.captain).toEqual(true);
            expect(updatedPlayer.playerDetails.newTeamId).toEqual(otherTeam.id);
            expect(saved).not.toBeNull();
            expect(saved.newPlayers).toBeNull();
        });

        it('updates existing player in given game', async () => {
            const playerId = createTemporaryId();
            const gameId = createTemporaryId();
            await renderComponent({
                player: playerBuilder('NAME', playerId).captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: gameId,
                newTeamId: otherTeam.id,
                divisionId: division.id,
                newDivisionId: null,
            }, [team, otherTeam], [division, otherDivision]);
            expect(reportedError).toBeNull();

            await doClick(findButton(context.container, 'Save player'));

            expect(reportedError).toBeNull();
            expect(updatedPlayer).not.toBeNull();
            expect(updatedPlayer.playerId).toEqual(playerId);
            expect(updatedPlayer.seasonId).toEqual(season.id);
            expect(updatedPlayer.teamId).toEqual(team.id);
            expect(updatedPlayer.playerDetails.gameId).toEqual(gameId);
            expect(updatedPlayer.playerDetails.name).toEqual('NAME');
            expect(updatedPlayer.playerDetails.emailAddress).toEqual('EMAIL');
            expect(updatedPlayer.playerDetails.captain).toEqual(true);
            expect(updatedPlayer.playerDetails.newTeamId).toEqual(otherTeam.id);
            expect(saved).not.toBeNull();
            expect(saved.newPlayers).toBeNull();
        });

        it('handles errors during save', async () => {
            await renderComponent({
                player: playerBuilder('NAME').captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: otherTeam.id,
                divisionId: division.id,
                newDivisionId: null,
            }, [team, otherTeam], [division, otherDivision]);
            expect(reportedError).toBeNull();
            apiResponse = {success: false};

            await doClick(findButton(context.container, 'Save player'));

            expect(saved).toBeNull();
            expect(context.container.textContent).toContain('Could not save player details');
        });

        it('can close error dialog after save failure', async () => {
            await renderComponent({
                player: playerBuilder('NAME').captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: otherTeam.id,
                divisionId: division.id,
                newDivisionId: null,
            }, [team, otherTeam], [division, otherDivision]);
            expect(reportedError).toBeNull();
            apiResponse = {success: false};
            await doClick(findButton(context.container, 'Save player'));
            expect(context.container.textContent).toContain('Could not save player details');

            await doClick(findButton(context.container, 'Close'));

            expect(context.container.textContent).not.toContain('Could not save player details');
        });

        it('can cancel editing', async () => {
            await renderComponent({
                player: playerBuilder('NAME').captain().email('EMAIL').build(),
                seasonId: season.id,
                team: team,
                gameId: null,
                newTeamId: otherTeam.id,
                divisionId: division.id,
                newDivisionId: null,
            }, [team, otherTeam], [division, otherDivision]);
            expect(reportedError).toBeNull();
            apiResponse = {success: false};

            await doClick(findButton(context.container, 'Cancel'));

            expect(canceled).toEqual(true);
        });
    });
});