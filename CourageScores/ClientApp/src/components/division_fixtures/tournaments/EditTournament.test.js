// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doSelectOption, doClick, findButton, doChange} from "../../../helpers/tests";
import React from "react";
import {createTemporaryId} from "../../../helpers/projection";
import {toMap} from "../../../helpers/collections";
import {EditTournament} from "./EditTournament";
import {TournamentContainer} from "./TournamentContainer";

describe('EditTournament', () => {
    let context;
    let reportedError;
    let updatedData;

    afterEach(() => {
        cleanUp(context);
    });

    async function setTournamentData(newData) {
        updatedData = newData;
    }

    async function renderComponent(containerProps, props, account, teams) {
        reportedError = null;
        updatedData = null;
        context = await renderApp(
            {},
            {
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
                account,
                teams: toMap(teams || []),
            },
            (<TournamentContainer {...containerProps} setTournamentData={setTournamentData}>
                <EditTournament {...props} />
            </TournamentContainer>));
    }

    describe('renders', () => {
        const account = null;
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
        };

        it('who is playing', async () => {
            const tournamentData = {
                round: null,
                divisionId: null,
                seasonId: season.id,
                sides: [{
                    id: createTemporaryId(),
                    name: 'SIDE 1',
                    players: [],
                    teamId: null,
                },{
                    id: createTemporaryId(),
                    name: 'ANOTHER SIDE',
                    players: [],
                    teamId: null,
                }],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: [],
                allPlayers: [],
            }, {
                disabled: true,
                saving: false,
                canSave: false
            }, account);

            const playing = context.container.querySelector('div > div > div:nth-child(1)');
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)');
            const sideNames = Array.from(sides.querySelectorAll('div')).map(side => side.textContent);
            expect(sideNames).toEqual([ 'ANOTHER SIDE', 'SIDE 1' ]);
        });

        it('rounds, when 2 or more sides', async () => {
            const tournamentData = {
                round: null,
                divisionId: null,
                seasonId: season.id,
                sides: [{
                    id: createTemporaryId(),
                    name: 'SIDE 1',
                    players: [],
                    teamId: null,
                },{
                    id: createTemporaryId(),
                    name: 'ANOTHER SIDE',
                    players: [],
                    teamId: null,
                }],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: [],
                allPlayers: [],
            }, {
                disabled: true,
                saving: false,
                canSave: false
            }, account);

            const playing = context.container.querySelector('div > div > div:nth-child(1)');
            expect(playing.textContent).toEqual('Playing:');
            const rounds = context.container.querySelector('div > div > div:nth-child(3)');
            expect(rounds).toBeTruthy();
            expect(rounds.textContent).toEqual('No matches defined');
        });

        it('no rounds, when less than 2 sides', async () => {
            const tournamentData = {
                round: null,
                divisionId: null,
                seasonId: season.id,
                sides: [{
                    id: createTemporaryId(),
                    name: 'SIDE 1',
                    players: [],
                    teamId: null,
                }],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: [],
                allPlayers: [],
            }, {
                disabled: true,
                saving: false,
                canSave: false
            }, account);

            const playing = context.container.querySelector('div > div > div:nth-child(1)');
            expect(playing.textContent).toEqual('Playing:');
            const rounds = context.container.querySelector('div > div > div:nth-child(3)');
            expect(rounds).toBeFalsy();
        });

        it('accolades, when 2 or more sides', async () => {
            const tournamentData = {
                round: null,
                divisionId: null,
                seasonId: season.id,
                sides: [{
                    id: createTemporaryId(),
                    name: 'SIDE 1',
                    players: [],
                    teamId: null,
                },{
                    id: createTemporaryId(),
                    name: 'ANOTHER SIDE',
                    players: [],
                    teamId: null,
                }],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: [],
                allPlayers: [],
            }, {
                disabled: true,
                saving: false,
                canSave: false
            }, account);

            const playing = context.container.querySelector('div > div > div:nth-child(1)');
            expect(playing.textContent).toEqual('Playing:');
            const accolades = context.container.querySelector('div > div > table');
            expect(accolades).toBeTruthy();
            expect(accolades.textContent).toContain('180s');
            expect(accolades.textContent).toContain('100+ c/o');
        });

        it('no accolades, when less than 2 sides', async () => {
            const tournamentData = {
                round: null,
                divisionId: null,
                seasonId: season.id,
                sides: [{
                    id: createTemporaryId(),
                    name: 'SIDE 1',
                    players: [],
                    teamId: null,
                }],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: [],
                allPlayers: [],
            }, {
                disabled: true,
                saving: false,
                canSave: false
            }, account);

            const accolades = context.container.querySelector('div > div > table');
            expect(accolades).toBeFalsy();
        });

        it('winning side from first round', async () => {
            const side1 = {
                id: createTemporaryId(),
                name: 'SIDE 1',
                players: [],
                teamId: null,
            };
            const anotherSide = {
                id: createTemporaryId(),
                name: 'ANOTHER SIDE',
                players: [],
                teamId: null,
            };
            const tournamentData = {
                round: {
                    matches: [ {
                        sideA: side1,
                        sideB: anotherSide,
                        scoreA: 1,
                        scoreB: 2,
                    } ]
                },
                divisionId: null,
                seasonId: season.id,
                sides: [side1, anotherSide],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: [],
                allPlayers: [],
            }, {
                disabled: true,
                saving: false,
                canSave: false
            }, account);

            const playing = context.container.querySelector('div > div > div:nth-child(1)');
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)');
            const winningSide = sides.querySelector('.bg-winner');
            expect(winningSide).toBeTruthy();
            expect(winningSide.textContent).toContain('ANOTHER SIDE');
        });

        it('winning side from second round', async () => {
            const side1 = {
                id: createTemporaryId(),
                name: 'SIDE 1',
                players: [],
                teamId: null,
            };
            const anotherSide = {
                id: createTemporaryId(),
                name: 'ANOTHER SIDE',
                players: [],
                teamId: null,
            };
            const tournamentData = {
                round: {
                    matches: [ {
                        sideA: side1,
                        sideB: anotherSide,
                        scoreA: 2,
                        scoreB: 2,
                    } ],
                    nextRound: {
                        matches: [ {
                            sideA: side1,
                            sideB: anotherSide,
                            scoreA: 2,
                            scoreB: 1,
                        } ],
                        nextRound: null
                    }
                },
                divisionId: null,
                seasonId: season.id,
                sides: [side1, anotherSide],
                oneEighties: [],
                over100Checkouts: [],
            };

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: [],
                allPlayers: [],
            }, {
                disabled: true,
                saving: false,
                canSave: false
            }, account);

            const playing = context.container.querySelector('div > div > div:nth-child(1)');
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)');
            const winningSide = sides.querySelector('.bg-winner');
            expect(winningSide).toBeTruthy();
            expect(winningSide.textContent).toContain('SIDE 1');
        });
    });

    describe('interactivity', () => {
        const account = {
            access: {
                manageTournaments: true,
            }
        };
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
        };
        const team1 = {
            id: createTemporaryId(),
            name: 'TEAM 1',
            seasons: [ {
                seasonId: season.id,
            } ],
        };

        it('can add a side', async () => {
            const tournamentData = {
                round: null,
                divisionId: null,
                seasonId: season.id,
                sides: [{
                    id: createTemporaryId(),
                    name: 'SIDE 1',
                    players: [],
                    teamId: null,
                }],
                oneEighties: [],
                over100Checkouts: [],
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: [],
                allPlayers: [],
            }, {
                disabled: false,
                saving: false,
                canSave: true
            }, account, [ team1 ]);
            const playing = context.container.querySelector('div > div > div:nth-child(1)');
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)');

            await doSelectOption(sides.querySelector('.bg-yellow .dropdown-menu'), 'TEAM 1');

            expect(reportedError).toBeNull();
            expect(updatedData.sides).toEqual([tournamentData.sides[0], {
                name: 'TEAM 1',
                teamId: team1.id,
            }]);
        });

        it('can start updating a side name', async () => {
            const side = {
                id: createTemporaryId(),
                name: 'SIDE 1',
                players: [],
                teamId: team1.id,
            };
            const tournamentData = {
                round: null,
                divisionId: null,
                seasonId: season.id,
                sides: [side],
                oneEighties: [],
                over100Checkouts: [],
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: [],
                allPlayers: [],
            }, {
                disabled: false,
                saving: false,
                canSave: true
            }, account, [ team1 ]);
            const playing = context.container.querySelector('div > div > div:nth-child(1)');
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)');
            const sideElement = sides.querySelector('div');

            await doClick(findButton(sideElement, '✏️'));
            await doChange(sideElement, 'input[name="newName"]', 'NEW SIDE 1', context.user);

            expect(reportedError).toBeNull();
            expect(updatedData.sides).toEqual([{
                id: side.id,
                newName: 'NEW SIDE 1',
                name: 'SIDE 1',
                players: [],
                teamId: team1.id,
            }]);
        });

        it('can complete updating a side name', async () => {
            const side = {
                id: createTemporaryId(),
                newName: 'NEW SIDE 1',
                name: 'SIDE 1',
                players: [],
                teamId: team1.id,
            };
            const tournamentData = {
                round: null,
                divisionId: null,
                seasonId: season.id,
                sides: [side],
                oneEighties: [],
                over100Checkouts: [],
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: [],
                allPlayers: [],
            }, {
                disabled: false,
                saving: false,
                canSave: true
            }, account, [ team1 ]);
            const playing = context.container.querySelector('div > div > div:nth-child(1)');
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)');
            const sideElement = sides.querySelector('div');

            await doClick(findButton(sideElement, '✏️'));
            await doChange(sideElement, 'input[name="newName"]', 'NEW SIDE 1', context.user);
            await doClick(findButton(sideElement, '✅'));

            expect(reportedError).toBeNull();
            expect(updatedData.sides).toEqual([{
                id: side.id,
                name: 'NEW SIDE 1',
                players: [],
                teamId: team1.id,
            }]);
        });

        it('can remove a side', async () => {
            const side = {
                id: createTemporaryId(),
                name: 'SIDE 1',
                players: [],
                teamId: team1.id,
            };
            const tournamentData = {
                round: null,
                divisionId: null,
                seasonId: season.id,
                sides: [side],
                oneEighties: [],
                over100Checkouts: [],
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: [],
                allPlayers: [],
            }, {
                disabled: false,
                saving: false,
                canSave: true
            }, account, [ team1 ]);
            const playing = context.container.querySelector('div > div > div:nth-child(1)');
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)');
            const sideElement = sides.querySelector('div');
            let message;
            window.confirm = (msg) => {
                message = msg;
                return true;
            }

            await doClick(findButton(sideElement, '🗑'));

            expect(reportedError).toBeNull();
            expect(updatedData.sides).toEqual([]);
        });

        it('updates side A data in rounds', async () => {
            const side = {
                id: createTemporaryId(),
                newName: 'NEW SIDE 1',
                name: 'SIDE 1',
                teamId: team1.id,
                players: [],
            };
            const tournamentData = {
                round: {
                    matches: [{
                        sideA: { id: side.id, name: 'SIDE 1', teamId: team1.id },
                        sideB: null,
                        scoreA: null,
                        scoreB: null,
                    }],
                },
                divisionId: null,
                seasonId: season.id,
                sides: [side],
                oneEighties: [],
                over100Checkouts: [],
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: [],
                allPlayers: [],
            }, {
                disabled: false,
                saving: false,
                canSave: true
            }, account, [ team1 ]);
            const playing = context.container.querySelector('div > div > div:nth-child(1)');
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)');
            const sideElement = sides.querySelector('div');

            await doClick(findButton(sideElement, '✏️'));
            await doChange(sideElement, 'input[name="newName"]', 'NEW SIDE 1', context.user);
            await doClick(findButton(sideElement, '✅'));

            expect(reportedError).toBeNull();
            expect(updatedData.round.matches[0]).toEqual({
                sideA: { id: side.id, name: 'NEW SIDE 1', teamId: team1.id, players: [] },
                sideB: null,
                scoreA: null,
                scoreB: null,
            });
        });

        it('updates side B data in rounds', async () => {
            const side = {
                id: createTemporaryId(),
                newName: 'NEW SIDE 1',
                name: 'SIDE 1',
                teamId: team1.id,
                players: [],
            };
            const tournamentData = {
                round: {
                    matches: [{
                        sideA: null,
                        sideB: { id: side.id, name: 'SIDE 1', teamId: team1.id },
                        scoreA: null,
                        scoreB: null,
                    }],
                },
                divisionId: null,
                seasonId: season.id,
                sides: [side],
                oneEighties: [],
                over100Checkouts: [],
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: [],
                allPlayers: [],
            }, {
                disabled: false,
                saving: false,
                canSave: true
            }, account, [ team1 ]);
            const playing = context.container.querySelector('div > div > div:nth-child(1)');
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)');
            const sideElement = sides.querySelector('div');

            await doClick(findButton(sideElement, '✏️'));
            await doChange(sideElement, 'input[name="newName"]', 'NEW SIDE 1', context.user);
            await doClick(findButton(sideElement, '✅'));

            expect(reportedError).toBeNull();
            expect(updatedData.round.matches[0]).toEqual({
                sideA: null,
                sideB: { id: side.id, name: 'NEW SIDE 1', teamId: team1.id, players: [] },
                scoreA: null,
                scoreB: null,
            });
        });
    });
});