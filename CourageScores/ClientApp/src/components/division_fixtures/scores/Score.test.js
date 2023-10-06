// noinspection JSUnresolvedFunction

import {cleanUp, doChange, doClick, doSelectOption, findButton, noop, renderApp} from "../../../helpers/tests";
import React from "react";
import {any, toMap} from "../../../helpers/collections";
import {createTemporaryId, repeat} from "../../../helpers/projection";
import {Score} from "./Score";
import {
    divisionBuilder,
    fixtureBuilder,
    matchBuilder,
    playerBuilder,
    seasonBuilder,
    teamBuilder
} from "../../../helpers/builders";

describe('Score', () => {
    let context;
    let reportedError;
    let fixtureDataMap = {};
    let updatedFixtures;
    let createdPlayer;
    let teamsReloaded;
    let newPlayerApiResult;
    let saveGameApiResult;
    const gameApi = {
        get: async (fixtureId) => {
            if (any(Object.keys(fixtureDataMap), key => key === fixtureId)) {
                return fixtureDataMap[fixtureId];
            }

            throw new Error('Unexpected request for fixture data');
        },
        updateScores: async (fixtureId, fixtureData) => {
            updatedFixtures[fixtureId] = fixtureData;
            return saveGameApiResult || {
                success: true,
                messages: ['Fixture updated'],
                result: fixtureData,
            }
        }
    };
    const playerApi = {
        create: (divisionId, seasonId, teamId, playerDetails) => {
            const newPlayer = Object.assign(playerBuilder().build(), playerDetails);
            createdPlayer = {divisionId, seasonId, teamId, playerDetails, newPlayer};
            if (!newPlayerApiResult) {
                throw new Error('You must set newPlayerApiResult to a factory method instance');
            }
            return newPlayerApiResult(createdPlayer);
        },
    };
    const originalConsoleLog = console.log;

    beforeEach(() => {
        console.log = noop;
    });

    afterEach(() => {
        cleanUp(context);
        console.log = originalConsoleLog;
    });

    async function renderComponent(id, appData, account) {
        reportedError = null;
        updatedFixtures = {};
        createdPlayer = null;
        teamsReloaded = false;
        newPlayerApiResult = null;
        saveGameApiResult = null;
        context = await renderApp(
            {gameApi, playerApi},
            {name: 'Courage Scores'},
            {
                account,
                onError: (err) => {
                    if (err.message) {
                        reportedError = {
                            message: err.message,
                            stack: err.stack
                        };
                    } else {
                        reportedError = err;
                    }
                },
                error: null,
                reportClientSideException: noop,
                reloadTeams: () => {
                    teamsReloaded = true;
                },
                ...appData
            },
            (<Score/>),
            '/:fixtureId',
            '/' + id);
    }

    function getDefaultAppData() {
        const division = divisionBuilder('A division').build();
        const season = seasonBuilder('A season')
            .starting('2022-02-03T00:00:00')
            .ending('2022-08-25T00:00:00')
            .withDivision(division)
            .build();
        const homePlayer = playerBuilder('Home player').build();
        const awayPlayer = playerBuilder('Away player').build();
        const homeTeam = teamBuilder('Home team')
            .forSeason(season, division, [ homePlayer ])
            .build();
        const awayTeam = teamBuilder('Away team')
            .forSeason(season, division, [ awayPlayer ])
            .build();

        return {
            divisions: toMap([division]),
            seasons: toMap([season]),
            teams: toMap([homeTeam, awayTeam])
        };
    }

    function getUnplayedFixtureData(appData) {
        const homeTeam = appData.teams.filter(t => t.name === 'Home team')[0];
        const awayTeam = appData.teams.filter(t => t.name === 'Away team')[0];

        return fixtureBuilder('2023-01-02T00:00:00')
            .forSeason(appData.seasons.filter(_ => true)[0])
            .forDivision(appData.divisions.filter(_ => true)[0])
            .playing(homeTeam, awayTeam)
            .addTo(fixtureDataMap)
            .build();
    }

    function getPlayedFixtureData(appData) {
        const homeTeam = appData.teams.filter(t => t.name === 'Home team')[0];
        const awayTeam = appData.teams.filter(t => t.name === 'Away team')[0];

        const firstDivision = appData.divisions.filter(_ => true)[0];
        const firstSeason = appData.seasons.filter(_ => true)[0];

        function findPlayer(team, name) {
            if (!firstSeason || !team || !team.seasons) {
                return name;
            }

            const teamSeason = team.seasons.filter(s => s.seasonId === firstSeason.id)[0];
            const player = teamSeason.players.filter(p => p.name === name)[0];
            return player || (name + ' Not found');
        }

        function createMatch(homeScore, awayScore) {
            return matchBuilder()
                .withHome(findPlayer(homeTeam, 'Home player'))
                .withAway(findPlayer(awayTeam, 'Away player'))
                .scores(homeScore, awayScore)
                .build();
        }

        return fixtureBuilder('2023-01-02T00:00:00')
            .playing({
                    id: homeTeam ? homeTeam.id : createTemporaryId(),
                    name: homeTeam ? homeTeam.name : 'not found',
                    manOfTheMatch: findPlayer(homeTeam, 'Home player').id,
                },
                {
                    id: awayTeam ? awayTeam.id : createTemporaryId(),
                    name: awayTeam ? awayTeam.name : 'not found',
                    manOfTheMatch: findPlayer(awayTeam, 'Away player').id,
                })
            .forSeason(firstSeason ? firstSeason : createTemporaryId())
            .forDivision(firstDivision ? firstDivision : createTemporaryId())
            .withMatch(createMatch(3, 2))
            .withMatch(createMatch(3, 2))
            .withMatch(createMatch(3, 2))
            .withMatch(createMatch(3, 2))
            .withMatch(createMatch(3, 2))
            .withMatch(createMatch(3, 0))
            .withMatch(createMatch(3, 0))
            .withMatch(createMatch(3, 0))
            .with180(findPlayer(homeTeam, 'Home player'))
            .withHiCheck(findPlayer(awayTeam, 'Away player'), '140')
            .addTo(fixtureDataMap)
            .build();
    }

    function assertMatchRow(tr, ...expectedCellText) {
        const cellText = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());

        expect(cellText.length).toEqual(expectedCellText.length);

        for (let index = 0; index < cellText.length; index++) {
            const cellTextValue = cellText[index];
            const expectedCellTextValue = expectedCellText[index];

            expect(cellTextValue).toContain(expectedCellTextValue);
        }
    }

    describe('when logged out', () => {
        const account = null;

        it('renders when fixture not found', async () => {
            const fixture = fixtureBuilder().build();
            const appData = getDefaultAppData();
            fixtureDataMap[fixture.id] = null;

            await renderComponent(fixture.id, appData, account);

            expect(reportedError).toEqual('Game could not be found');
        });

        it('renders when fixture data not returned successfully', async () => {
            const fixture = fixtureBuilder().build();
            const appData = getDefaultAppData();
            fixtureDataMap[fixture.id] = {status: 400, errors: {'key': 'Some error'}};

            await renderComponent(fixture.id, appData, account);

            expect(reportedError).toEqual('Error accessing fixture: Code: 400 -- key: Some error');
        });

        it('renders when home or away are not defined', async () => {
            const fixture = fixtureBuilder().build();
            const appData = getDefaultAppData();
            fixtureDataMap[fixture.id] = {};

            await renderComponent(fixture.id, appData, account);

            expect(reportedError).toEqual('Either home or away team are undefined for this game');
        });

        it('renders score card with no results', async () => {
            const appData = getDefaultAppData();
            const fixture = getUnplayedFixtureData(appData);

            await renderComponent(fixture.id, appData, account);

            expect(reportedError).toBeNull();
            const container = context.container.querySelector('.content-background');
            expect(container).toBeTruthy();
            const tableBody = container.querySelector('table tbody');
            expect(tableBody).toBeTruthy();
            const singleRow = tableBody.querySelector('tr td');
            expect(singleRow).toBeTruthy();
            expect(singleRow.textContent).toEqual('No scores, yet');
        });

        it('renders score card with results', async () => {
            const appData = getDefaultAppData();
            const fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData, account);

            expect(reportedError).toBeNull();
            const container = context.container.querySelector('.content-background');
            expect(container).toBeTruthy();
            const tableBody = container.querySelector('table tbody');
            expect(tableBody).toBeTruthy();
            const matchRows = tableBody.querySelectorAll('tr');
            expect(matchRows.length).toEqual(12);
            assertMatchRow(matchRows[0], 'Singles');
            assertMatchRow(matchRows[1], 'Home player', '3', '', '2', 'Away player');
            assertMatchRow(matchRows[2], 'Home player', '3', '', '2', 'Away player');
            assertMatchRow(matchRows[3], 'Home player', '3', '', '2', 'Away player');
            assertMatchRow(matchRows[4], 'Home player', '3', '', '2', 'Away player');
            assertMatchRow(matchRows[5], 'Home player', '3', '', '2', 'Away player');
            assertMatchRow(matchRows[6], 'Pairs');
            assertMatchRow(matchRows[7], 'Home player', '3', '', '0', 'Away player');
            assertMatchRow(matchRows[8], 'Home player', '3', '', '0', 'Away player');
            assertMatchRow(matchRows[9], 'Triples');
            assertMatchRow(matchRows[10], 'Home player', '3', '', '0', 'Away player');
            assertMatchRow(matchRows[11], '180sHome player', '', '100+ c/oAway player (140)');
        });

        it('renders when no divisions', async () => {
            const appData = getDefaultAppData();
            appData.divisions = [];
            const fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData, account);

            expect(reportedError).toEqual('App has finished loading, no divisions are available');
        });

        it('renders when no seasons', async () => {
            const appData = getDefaultAppData();
            appData.seasons = [];
            const fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData, account);

            expect(reportedError).toEqual('App has finished loading, no seasons are available');
        });

        it('renders when no teams', async () => {
            const appData = getDefaultAppData();
            appData.teams = [];
            const fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData, account);

            expect(reportedError).toEqual('App has finished loading, no teams are available');
        });
    });

    describe('when logged in', () => {
        const account = {access: {manageScores: true}};

        it('renders score card without results', async () => {
            const appData = getDefaultAppData();
            const fixture = getUnplayedFixtureData(appData);

            await renderComponent(fixture.id, appData, account);

            expect(reportedError).toBeNull();
            const container = context.container.querySelector('.content-background');
            expect(container).toBeTruthy();
            const tableBody = container.querySelector('table tbody');
            expect(tableBody).toBeTruthy();
            const matchRows = tableBody.querySelectorAll('tr');
            expect(matchRows.length).toEqual(14);
            assertMatchRow(matchRows[0], 'Singles');
            assertMatchRow(matchRows[1], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[2], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[3], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[4], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[5], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[6], 'Pairs');
            assertMatchRow(matchRows[7], 'Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[8], 'Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[9], 'Triples');
            assertMatchRow(matchRows[10], 'Home playerAdd a player...  Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[11], 'Man of the match');
            assertMatchRow(matchRows[12], '', '', '');
            assertMatchRow(matchRows[13], 'Select some player/s to add 180s and hi-checks');
        });

        it('renders score card with results', async () => {
            const appData = getDefaultAppData();
            const fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData, account);

            expect(reportedError).toBeNull();
            const container = context.container.querySelector('.content-background');
            expect(container).toBeTruthy();
            const tableBody = container.querySelector('table tbody');
            expect(tableBody).toBeTruthy();
            const matchRows = tableBody.querySelectorAll('tr');
            expect(matchRows.length).toEqual(14);
            assertMatchRow(matchRows[0], 'Singles');
            assertMatchRow(matchRows[1], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[2], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[3], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[4], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[5], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[6], 'Pairs');
            assertMatchRow(matchRows[7], 'Home player Home playerAdd a player...  Add a player...', '', '', '', 'Away player Away playerAdd a player...  Add a player...');
            assertMatchRow(matchRows[7], 'Home player Home playerAdd a player...  Add a player...', '', '', '', 'Away player Away playerAdd a player...  Add a player...');
            assertMatchRow(matchRows[9], 'Triples');
            assertMatchRow(matchRows[10], 'Home player Home playerAdd a player...  Add a player...  Add a player...', '', '', '', 'Away player Away playerAdd a player...  Add a player...  Add a player...');
            assertMatchRow(matchRows[11], 'Man of the match');
            assertMatchRow(matchRows[12], '', '', '');
            assertMatchRow(matchRows[13], '180s', '', '100+ c/o');
        });

        it('renders when no divisions', async () => {
            const appData = getDefaultAppData();
            appData.divisions = [];
            const fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData, account);

            expect(reportedError).toEqual('App has finished loading, no divisions are available');
        });

        it('renders when no seasons', async () => {
            const appData = getDefaultAppData();
            appData.seasons = [];
            const fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData, account);

            expect(reportedError).toEqual('App has finished loading, no seasons are available');
        });

        it('renders when no teams', async () => {
            const appData = getDefaultAppData();
            appData.teams = [];
            const fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData, account);

            expect(reportedError).toEqual('App has finished loading, no teams are available');
        });

        it('renders when team has no seasons', async () => {
            const appData = getDefaultAppData();
            const fixture = getPlayedFixtureData(appData);
            appData.teams = toMap(appData.teams.map(t => {
                if (t.name === 'Home team') {
                    t.seasons = null;
                }
                return t;
            }));

            await renderComponent(fixture.id, appData, account);

            expect(reportedError).toEqual('home team has no seasons');
        });

        it('renders when team is not registered to season', async () => {
            const appData = getDefaultAppData();
            const fixture = getPlayedFixtureData(appData);
            appData.teams = toMap(appData.teams.map(t => {
                if (t.name === 'Home team') {
                    t.seasons = [];
                }
                return t;
            }));

            await renderComponent(fixture.id, appData, account);

            expect(reportedError).toContain('home team has not registered for this season: ');
        });

        it('renders when team not found', async () => {
            const appData = getDefaultAppData();
            appData.teams = toMap(appData.teams.filter(t => t.name !== 'Home team'));
            const fixture = getPlayedFixtureData(appData);

            await renderComponent(fixture.id, appData, account);

            expect(reportedError).toContain('home team could not be found - ');
        });

        it('renders previously renamed players', async () => {
            const appData = getDefaultAppData();
            const fixture = getPlayedFixtureData(appData);
            const homeTeam = appData.teams.filter(t => t.name === 'Home team')[0];
            const newHomeTeamPlayer = playerBuilder('New name').captain().build();
            homeTeam.seasons[0].players.push(newHomeTeamPlayer);
            const firstSinglesMatch = fixtureDataMap[fixture.id].matches[0];
            firstSinglesMatch.homePlayers[0] = Object.assign(
                {},
                newHomeTeamPlayer,
                {name: 'Old name'});
            firstSinglesMatch.sut = true;

            await renderComponent(fixture.id, appData, account);

            const firstSinglesRow = context.container.querySelector('.content-background table tbody tr:nth-child(2)');
            expect(firstSinglesRow).toBeTruthy();
            const playerSelection = firstSinglesRow.querySelector('td:nth-child(1)');
            expect(playerSelection.querySelector('.dropdown-toggle').textContent).toEqual('New name (nee Old name)');
            const selectedPlayer = playerSelection.querySelector('.dropdown-menu .active');
            expect(selectedPlayer).toBeTruthy();
            expect(selectedPlayer.textContent).toEqual('New name (nee Old name)');
        });

        it('can add a player to home team', async () => {
            const appData = getDefaultAppData();
            const fixture = getPlayedFixtureData(appData);
            await renderComponent(fixture.id, appData, account);
            newPlayerApiResult = (createdPlayer) => {
                const existingTeam = Object.assign({}, appData.teams[createdPlayer.teamId]);
                existingTeam.seasons = existingTeam.seasons.map(ts => {
                    const newTeamSeason = Object.assign({}, ts);

                    if (ts.seasonId === createdPlayer.seasonId) {
                        newTeamSeason.players = newTeamSeason.players.concat([
                            createdPlayer.newPlayer
                        ]);
                    }

                    return newTeamSeason;
                });

                return {
                    success: true,
                    result: existingTeam,
                };
            };

            expect(reportedError).toBeNull();
            const firstSinglesRow = context.container.querySelector('.content-background table tbody tr:nth-child(2)');
            expect(firstSinglesRow).toBeTruthy();
            const playerSelection = firstSinglesRow.querySelector('td:nth-child(1)');
            await doSelectOption(playerSelection.querySelector('.dropdown-menu'), 'Add a player...');
            const addPlayerDialog = context.container.querySelector('.modal-dialog');
            expect(addPlayerDialog).toBeTruthy();
            expect(addPlayerDialog.textContent).toContain('Create home player...');
            await doChange(addPlayerDialog, 'input[name="name"]', 'NEW PLAYER', context.user);
            await doClick(findButton(addPlayerDialog, 'Add player'));

            expect(reportedError).toBeNull();
            expect(teamsReloaded).toEqual(true);
            expect(createdPlayer).not.toBeNull();
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can handle missing team season during add new player', async () => {
            const appData = getDefaultAppData();
            const fixture = getPlayedFixtureData(appData);
            await renderComponent(fixture.id, appData, account);
            newPlayerApiResult = (createdPlayer) => {
                const existingTeam = Object.assign({}, appData.teams[createdPlayer.teamId]);
                existingTeam.seasons = existingTeam.seasons.filter(_ => false); // return no team seasons

                return {
                    success: true,
                    result: existingTeam,
                };
            };

            expect(reportedError).toBeNull();
            const firstSinglesRow = context.container.querySelector('.content-background table tbody tr:nth-child(2)');
            expect(firstSinglesRow).toBeTruthy();
            const playerSelection = firstSinglesRow.querySelector('td:nth-child(1)');
            await doSelectOption(playerSelection.querySelector('.dropdown-menu'), 'Add a player...');
            const addPlayerDialog = context.container.querySelector('.modal-dialog');
            expect(addPlayerDialog).toBeTruthy();
            expect(addPlayerDialog.textContent).toContain('Create home player...');
            await doChange(addPlayerDialog, 'input[name="name"]', 'NEW PLAYER', context.user);
            await doClick(findButton(addPlayerDialog, 'Add player'));

            expect(reportedError).toEqual('Could not find updated teamSeason');
            expect(teamsReloaded).toEqual(true);
            expect(createdPlayer).not.toBeNull();
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can handle new player not found after creating new player', async () => {
            const appData = getDefaultAppData();
            const fixture = getPlayedFixtureData(appData);
            await renderComponent(fixture.id, appData, account);
            newPlayerApiResult = (createdPlayer) => {
                const existingTeam = Object.assign({}, appData.teams[createdPlayer.teamId]);
                existingTeam.seasons = existingTeam.seasons.map(ts => {
                    return Object.assign({}, ts);
                });

                return {
                    success: true,
                    result: existingTeam,
                };
            };

            expect(reportedError).toBeNull();
            const firstSinglesRow = context.container.querySelector('.content-background table tbody tr:nth-child(2)');
            expect(firstSinglesRow).toBeTruthy();
            const playerSelection = firstSinglesRow.querySelector('td:nth-child(1)');
            await doSelectOption(playerSelection.querySelector('.dropdown-menu'), 'Add a player...');
            const addPlayerDialog = context.container.querySelector('.modal-dialog');
            expect(addPlayerDialog).toBeTruthy();
            expect(addPlayerDialog.textContent).toContain('Create home player...');
            await doChange(addPlayerDialog, 'input[name="name"]', 'NEW PLAYER', context.user);
            await doClick(findButton(addPlayerDialog, 'Add player'));

            expect(reportedError).toEqual('Could not find new player in updated season, looking for player with name: "NEW PLAYER"');
            expect(teamsReloaded).toEqual(true);
            expect(createdPlayer).not.toBeNull();
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can add a player to away team', async () => {
            const appData = getDefaultAppData();
            const fixture = getPlayedFixtureData(appData);
            await renderComponent(fixture.id, appData, account);

            expect(reportedError).toBeNull();
            const firstSinglesRow = context.container.querySelector('.content-background table tbody tr:nth-child(2)');
            expect(firstSinglesRow).toBeTruthy();
            const playerSelection = firstSinglesRow.querySelector('td:nth-child(5)');
            await doSelectOption(playerSelection.querySelector('.dropdown-menu'), 'Add a player...');

            const addPlayerDialog = context.container.querySelector('.modal-dialog');
            expect(addPlayerDialog).toBeTruthy();
            expect(addPlayerDialog.textContent).toContain('Create away player...');
        });

        it('can close add player dialog', async () => {
            const appData = getDefaultAppData();
            const fixture = getPlayedFixtureData(appData);
            await renderComponent(fixture.id, appData, account);
            expect(reportedError).toBeNull();
            const firstSinglesRow = context.container.querySelector('.content-background table tbody tr:nth-child(2)');
            expect(firstSinglesRow).toBeTruthy();
            const playerSelection = firstSinglesRow.querySelector('td:nth-child(5)');
            await doSelectOption(playerSelection.querySelector('.dropdown-menu'), 'Add a player...');

            await doClick(findButton(context.container.querySelector('.modal-dialog'), 'Cancel'));

            const addPlayerDialog = context.container.querySelector('.modal-dialog');
            expect(addPlayerDialog).toBeFalsy();
        });

        it('can save scores', async () => {
            const appData = getDefaultAppData();
            const fixture = getPlayedFixtureData(appData);
            await renderComponent(fixture.id, appData, account);

            await doClick(findButton(context.container, 'Save'));

            expect(reportedError).toBeNull();
            expect(updatedFixtures[fixture.id]).not.toBeNull();
        });

        it('renders error if save fails', async () => {
            const appData = getDefaultAppData();
            const fixture = getPlayedFixtureData(appData);
            await renderComponent(fixture.id, appData, account);
            saveGameApiResult = {
                success: false,
            };

            await doClick(findButton(context.container, 'Save'));

            expect(context.container.textContent).toContain('Could not save score');
        });

        it('can change player', async () => {
            const appData = getDefaultAppData();
            const homeTeam = appData.teams.filter(t => t.name === 'Home team')[0];
            const anotherHomePlayer = playerBuilder('Another player').build();
            homeTeam.seasons[0].players.push(anotherHomePlayer);
            const fixture = getPlayedFixtureData(appData);
            await renderComponent(fixture.id, appData, account);
            const firstSinglesRow = context.container.querySelector('.content-background table tbody tr:nth-child(2)');
            expect(firstSinglesRow).toBeTruthy();
            const playerSelection = firstSinglesRow.querySelector('td:nth-child(1)');

            await doClick(findButton(playerSelection, 'Another player'));
            await doClick(findButton(context.container, 'Save'));

            expect(reportedError).toBeNull();
            expect(updatedFixtures[fixture.id]).not.toBeNull();
            expect(updatedFixtures[fixture.id].matches[0].homePlayers).toEqual([anotherHomePlayer]);
        });

        it('can change match options', async () => {
            const appData = getDefaultAppData();
            const fixture = getPlayedFixtureData(appData);
            await renderComponent(fixture.id, appData, account);
            const firstSinglesRow = context.container.querySelector('.content-background table tbody tr:nth-child(2)');
            expect(firstSinglesRow).toBeTruthy();
            const playerSelection = firstSinglesRow.querySelector('td:nth-child(5)');

            await doClick(findButton(playerSelection, '🛠'));
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            await doChange(dialog, 'input[name="numberOfLegs"]', '30', context.user);
            await doClick(findButton(dialog, 'Close'));
            await doClick(findButton(context.container, 'Save'));

            expect(reportedError).toBeNull();
            expect(updatedFixtures[fixture.id]).not.toBeNull();
            expect(updatedFixtures[fixture.id].matchOptions[0].numberOfLegs).toEqual(30);
        });

        it('can unpublish unselected submission', async () => {
            const appData = getDefaultAppData();
            const fixtureData = getPlayedFixtureData(appData);
            fixtureData.resultsPublished = true;
            fixtureData.homeSubmission = getPlayedFixtureData(appData);
            fixtureData.awaySubmission = getPlayedFixtureData(appData);
            await renderComponent(fixtureData.id, appData, account);
            expect(reportedError).toBeNull();
            let alert;
            window.alert = (msg) => alert = msg;

            await doClick(findButton(context.container, 'Unpublish'));

            expect(reportedError).toBeNull();
            expect(alert).toEqual('Results have been unpublished, but NOT saved. Re-merge the changes then click save for them to be saved');
            const matches = Array.from(context.container.querySelectorAll('table tbody tr'));
            const allScores = matches.flatMap(match => {
                const tds = Array.from(match.querySelectorAll('td')).filter(td => td.colSpan !== 2);
                return Array.from(tds.flatMap(td => Array.from(td.querySelectorAll('input'))));
            });
            expect(allScores.map(input => input.value)).toEqual(repeat(16, _ => '')); // 16 = 8 matches * 2 sides
        });

        it('can unpublish home submission', async () => {
            const appData = getDefaultAppData();
            const fixtureData = getPlayedFixtureData(appData);
            fixtureData.resultsPublished = true;
            fixtureData.homeSubmission = getPlayedFixtureData(appData);
            fixtureData.awaySubmission = getPlayedFixtureData(appData);
            fixtureData.homeSubmission.matches.forEach(match => {
                match.homeScore = 1;
                match.awayScore = 1;
            });
            await renderComponent(fixtureData.id, appData, account);
            expect(reportedError).toBeNull();
            let alert;
            window.alert = (msg) => alert = msg;
            await doClick(context.container, 'span[title="See home submission"]');
            expect(reportedError).toBeNull();

            await doClick(findButton(context.container, 'Unpublish'));

            expect(reportedError).toBeNull();
            expect(alert).toEqual('Results have been unpublished, but NOT saved. Re-merge the changes then click save for them to be saved');
            const matches = Array.from(context.container.querySelectorAll('table tbody tr'));
            const allScores = matches.flatMap(match => {
                const tds = Array.from(match.querySelectorAll('td')).filter(td => td.colSpan !== 2);
                return Array.from(tds.flatMap(td => Array.from(td.querySelectorAll('strong')))).map(str => str.textContent);
            });
            expect(allScores).toEqual(repeat(16, _ => '1')); // 16 = 8 matches * 2 sides
        });

        it('can unpublish away submission', async () => {
            const appData = getDefaultAppData();
            const fixtureData = getPlayedFixtureData(appData);
            fixtureData.resultsPublished = true;
            fixtureData.homeSubmission = getPlayedFixtureData(appData);
            fixtureData.awaySubmission = getPlayedFixtureData(appData);
            fixtureData.awaySubmission.matches.forEach(match => {
                match.homeScore = 2;
                match.awayScore = 2;
            });
            await renderComponent(fixtureData.id, appData, account);
            expect(reportedError).toBeNull();
            let alert;
            window.alert = (msg) => alert = msg;
            await doClick(context.container, 'span[title="See away submission"]');
            expect(reportedError).toBeNull();

            await doClick(findButton(context.container, 'Unpublish'));

            expect(reportedError).toBeNull();
            expect(alert).toEqual('Results have been unpublished, but NOT saved. Re-merge the changes then click save for them to be saved');
            const matches = Array.from(context.container.querySelectorAll('table tbody tr'));
            const allScores = matches.flatMap(match => {
                const tds = Array.from(match.querySelectorAll('td')).filter(td => td.colSpan !== 2);
                return Array.from(tds.flatMap(td => Array.from(td.querySelectorAll('strong')))).map(str => str.textContent);
            });
            expect(allScores).toEqual(repeat(16, _ => '2')); // 16 = 8 matches * 2 sides
        });

        it('can show when only home submission present', async () => {
            const appData = getDefaultAppData();
            const fixtureData = getPlayedFixtureData(appData);
            fixtureData.resultsPublished = false;
            fixtureData.homeSubmission = getPlayedFixtureData(appData);
            fixtureData.awaySubmission = null;
            fixtureData.homeSubmission.matches.forEach(match => {
                match.homeScore = 1;
                match.awayScore = 1;
            });
            fixtureData.homeSubmission.away.manOfTheMatch = null;
            fixtureData.home.manOfTheMatch = null;
            fixtureData.away.manOfTheMatch = null;

            await renderComponent(fixtureData.id, appData, account);

            expect(reportedError).toBeNull();
        });

        it('can show when only away submission present', async () => {
            const appData = getDefaultAppData();
            const fixtureData = getPlayedFixtureData(appData);
            fixtureData.resultsPublished = false;
            fixtureData.homeSubmission = null;
            fixtureData.awaySubmission = getPlayedFixtureData(appData);
            fixtureData.awaySubmission.matches.forEach(match => {
                match.homeScore = 1;
                match.awayScore = 1;
            });
            fixtureData.awaySubmission.home.manOfTheMatch = null;
            fixtureData.home.manOfTheMatch = null;
            fixtureData.away.manOfTheMatch = null;

            await renderComponent(fixtureData.id, appData, account);

            expect(reportedError).toBeNull();
        });
    });

    describe('when logged in as a home clerk', () => {
        const appData = getDefaultAppData();
        const fixture = getUnplayedFixtureData(appData);
        const account = {
            access: {
                manageScores: false,
                inputResults: true,
            },
            teamId: fixture.home.id,
        };

        it('renders score card without results', async () => {
            await renderComponent(fixture.id, appData, account);

            expect(reportedError).toBeNull();
            const container = context.container.querySelector('.content-background');
            expect(container).toBeTruthy();
            const tableBody = container.querySelector('table tbody');
            expect(tableBody).toBeTruthy();
            const matchRows = tableBody.querySelectorAll('tr');
            expect(matchRows.length).toEqual(14);
            assertMatchRow(matchRows[0], 'Singles');
            assertMatchRow(matchRows[1], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[2], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[3], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[4], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[5], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[6], 'Pairs');
            assertMatchRow(matchRows[7], 'Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[8], 'Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[9], 'Triples');
            assertMatchRow(matchRows[10], 'Home playerAdd a player...  Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[11], 'Man of the match');
            assertMatchRow(matchRows[12], '', '', '');
            assertMatchRow(matchRows[13], 'Select some player/s to add 180s and hi-checks');
        });

        it('renders published score card', async () => {
            fixture.resultsPublished = true;

            await renderComponent(fixture.id, appData, account);

            expect(reportedError).toBeNull();
            const container = context.container.querySelector('.content-background');
            expect(container).toBeTruthy();
            const tableBody = container.querySelector('table tbody');
            expect(tableBody).toBeTruthy();
            const matchRows = tableBody.querySelectorAll('tr');
            expect(matchRows.length).toEqual(12);
            assertMatchRow(matchRows[0], 'Singles');
            assertMatchRow(matchRows[1], '', '', '', '', '');
            assertMatchRow(matchRows[2], '', '', '', '', '');
            assertMatchRow(matchRows[3], '', '', '', '', '');
            assertMatchRow(matchRows[4], '', '', '', '', '');
            assertMatchRow(matchRows[5], '', '', '', '', '');
            assertMatchRow(matchRows[6], 'Pairs');
            assertMatchRow(matchRows[7], '', '', '', '', '');
            assertMatchRow(matchRows[8], '', '', '', '', '');
            assertMatchRow(matchRows[9], 'Triples');
            assertMatchRow(matchRows[10], '', '', '', '', '');
            assertMatchRow(matchRows[11], '');
        });
    });

    describe('when logged in as an away clerk', () => {
        const appData = getDefaultAppData();
        const fixture = getUnplayedFixtureData(appData);
        const account = {
            access: {
                manageScores: false,
                inputResults: true,
            },
            teamId: fixture.away.id,
        };

        it('renders score card without results', async () => {
            await renderComponent(fixture.id, appData, account);

            expect(reportedError).toBeNull();
            const container = context.container.querySelector('.content-background');
            expect(container).toBeTruthy();
            const tableBody = container.querySelector('table tbody');
            expect(tableBody).toBeTruthy();
            const matchRows = tableBody.querySelectorAll('tr');
            expect(matchRows.length).toEqual(14);
            assertMatchRow(matchRows[0], 'Singles');
            assertMatchRow(matchRows[1], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[2], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[3], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[4], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[5], 'Home playerAdd a player...', '', '', '', 'Away playerAdd a player...');
            assertMatchRow(matchRows[6], 'Pairs');
            assertMatchRow(matchRows[7], 'Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[8], 'Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[9], 'Triples');
            assertMatchRow(matchRows[10], 'Home playerAdd a player...  Home playerAdd a player...  Home playerAdd a player...', '', '', '', 'Away playerAdd a player...  Away playerAdd a player...  Away playerAdd a player...');
            assertMatchRow(matchRows[11], 'Man of the match');
            assertMatchRow(matchRows[12], '', '', '');
            assertMatchRow(matchRows[13], 'Select some player/s to add 180s and hi-checks');
        });

        it('renders published score card', async () => {
            fixture.resultsPublished = true;

            await renderComponent(fixture.id, appData, account);

            expect(reportedError).toBeNull();
            const container = context.container.querySelector('.content-background');
            expect(container).toBeTruthy();
            const tableBody = container.querySelector('table tbody');
            expect(tableBody).toBeTruthy();
            const matchRows = tableBody.querySelectorAll('tr');
            expect(matchRows.length).toEqual(12);
            assertMatchRow(matchRows[0], 'Singles');
            assertMatchRow(matchRows[1], '', '', '', '', '');
            assertMatchRow(matchRows[2], '', '', '', '', '');
            assertMatchRow(matchRows[3], '', '', '', '', '');
            assertMatchRow(matchRows[4], '', '', '', '', '');
            assertMatchRow(matchRows[5], '', '', '', '', '');
            assertMatchRow(matchRows[6], 'Pairs');
            assertMatchRow(matchRows[7], '', '', '', '', '');
            assertMatchRow(matchRows[8], '', '', '', '', '');
            assertMatchRow(matchRows[9], 'Triples');
            assertMatchRow(matchRows[10], '', '', '', '', '');
            assertMatchRow(matchRows[11], '');
        });
    });
});