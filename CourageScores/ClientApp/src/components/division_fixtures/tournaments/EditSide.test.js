// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doSelectOption, doClick, findButton, doChange} from "../../../helpers/tests";
import React from "react";
import {createTemporaryId} from "../../../helpers/projection";
import {toMap} from "../../../helpers/collections";
import {EditSide} from "./EditSide";
import {TournamentContainer} from "./TournamentContainer";

describe('EditSide', () => {
    let context;
    let reportedError;
    let updatedData;
    let closed;
    let applied;
    let deleted;

    afterEach(() => {
        cleanUp(context);
    });

    async function onChange(newData) {
        updatedData = newData;
    }

    async function onClose() {
        closed = true;
    }

    async function onApply() {
        applied = true;
    }

    async function onDelete() {
        deleted = true;
    }

    async function renderComponent(containerProps, side, teams) {
        reportedError = null;
        updatedData = null;
        closed = false;
        applied = false;
        deleted = false;
        context = await renderApp(
            { },
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
                teams: toMap(teams || []),
            },
            (<TournamentContainer {...containerProps}>
                <EditSide side={side} onChange={onChange} onClose={onClose} onApply={onApply} onDelete={onDelete} />
            </TournamentContainer>));
    }

    function alreadyPlaying(player) {
        const playing = {};
        playing[player.id] = player;
        return playing;
    }

    describe('renders', () => {
        const player = {
            id: createTemporaryId(),
            name: 'PLAYER',
        };
        const anotherPlayer = {
            id: createTemporaryId(),
            name: 'ANOTHER PLAYER',
        };
        const tournamentData = {
            divisionId: createTemporaryId(),
            sides: [{
                id: createTemporaryId(),
                name: 'ANOTHER SIDE',
                players: [ anotherPlayer ],
            }]
        };
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
        };
        const team = {
            id: createTemporaryId(),
            name: 'TEAM',
            seasons: [ {
                seasonId: season.id,
                players: [ player, anotherPlayer ],
                divisionId: tournamentData.divisionId,
            } ]
        };

        it('new side', async () => {
            const side = {
            };

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {}
            }, side, null);

            expect(reportedError).toBeNull();
            expect(context.container.querySelector('input[name="name"]').value).toEqual('');
            expect(context.container.querySelector('.dropdown-menu')).not.toBeNull();
            expect(context.container.querySelector('ol.list-group')).not.toBeNull();
        });

        it('side with players', async () => {
            const side = {
                name: 'SIDE NAME',
                players: [player]
            };

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {}
            }, side, [ team ]);

            expect(reportedError).toBeNull();
            expect(context.container.querySelector('input[name="name"]').value).toEqual('SIDE NAME');
            expect(context.container.querySelector('.dropdown-menu')).toBeNull();
            expect(context.container.querySelector('ol.list-group')).not.toBeNull();
            expect(context.container.querySelector('ol.list-group li.list-group-item.active').textContent).toEqual('PLAYER');
        });

        it('filtered players', async () => {
            const side = {
                name: 'SIDE NAME',
                players: [player]
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {}
            }, side, [ team ]);

            await doChange(context.container, 'input[name="playerFilter"]', 'ANOTHER', context.user);

            expect(context.container.querySelector('ol.list-group')).not.toBeNull();
            const playerItems = Array.from(context.container.querySelectorAll('ol.list-group li.list-group-item'));
            expect(playerItems.map(li => li.textContent)).toEqual([ 'ANOTHER PLAYER (🚫 Selected in another side)' ]);
        });

        it('side with teamId', async () => {
            const side = {
                name: 'SIDE NAME',
                teamId: team.id,
            };

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {}
            }, side, [ team ]);

            expect(reportedError).toBeNull();
            expect(context.container.querySelector('input[name="name"]').value).toEqual('SIDE NAME');
            expect(context.container.querySelector('.dropdown-menu .active')).not.toBeNull();
            expect(context.container.querySelector('.dropdown-menu .active').textContent).toEqual('TEAM');
            expect(context.container.querySelector('ol.list-group')).toBeNull();
        });

        it('when team is not registered to season', async () => {
            const teamNotInSeason = {
                id: createTemporaryId(),
                name: 'TEAM',
                seasons: [ {
                    seasonId: createTemporaryId(),
                    players: [ {
                        id: createTemporaryId(), name: 'NOT IN SEASON PLAYER'
                    } ],
                    divisionId: tournamentData.divisionId,
                } ]
            }
            const side = {
                name: 'SIDE NAME',
                teamId: teamNotInSeason.id,
            };

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {}
            }, side, [ teamNotInSeason ]);

            expect(reportedError).toBeNull();
            const playerItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(playerItems.map(li => li.textContent)).not.toContain( 'NOT IN SEASON PLAYER');
        });

        it('excludes players from another division when for a division', async () => {
            const side = {
                name: 'SIDE NAME',
            };
            const otherDivisionTeam = {
                id: createTemporaryId(),
                name: 'OTHER DIVISION TEAM',
                seasons: [ {
                    seasonId: season.id,
                    players: [ {
                        id: createTemporaryId(),
                        name: 'OTHER DIVISION PLAYER',
                    } ],
                    divisionId: createTemporaryId(),
                } ]
            };

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: alreadyPlaying(player),
            }, side, [ otherDivisionTeam, team ]);

            expect(reportedError).toBeNull();
            const playerItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(playerItems.map(li => li.textContent)).not.toContain( 'OTHER DIVISION PLAYER');
        });

        it('includes players from another division when cross-divisional', async () => {
            const side = {
                name: 'SIDE NAME',
            };
            const otherDivisionTeam = {
                id: createTemporaryId(),
                name: 'OTHER DIVISION TEAM',
                seasons: [ {
                    seasonId: season.id,
                    players: [ {
                        id: createTemporaryId(),
                        name: 'OTHER DIVISION PLAYER',
                    } ],
                    divisionId: createTemporaryId(),
                } ]
            };
            const crossDivisionalTournamentData = {
                id: createTemporaryId(),
                divisionId: null,
                sides: []
            };

            await renderComponent({
                tournamentData: crossDivisionalTournamentData,
                season,
                alreadyPlaying: alreadyPlaying(player),
            }, side, [ otherDivisionTeam, team ]);

            expect(reportedError).toBeNull();
            const playerItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(playerItems.map(li => li.textContent)).toContain( 'OTHER DIVISION PLAYER');
        });

        it('unselectable players when selected in another tournament', async () => {
            const side = {
                name: 'SIDE NAME',
            };

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: alreadyPlaying(player),
            }, side, [ team ]);

            expect(reportedError).toBeNull();
            const playerItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(playerItems.map(li => li.textContent)).toContain( 'PLAYER (🚫 Playing in another tournament)');
        });

        it('unselectable players when selected in another side', async () => {
            const side = {
                name: 'SIDE NAME',
            };

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, side, [ team ]);

            expect(reportedError).toBeNull();
            const playerItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(playerItems.map(li => li.textContent)).toContain('ANOTHER PLAYER (🚫 Selected in another side)');
        });

        it('selectable players when selected in this side', async () => {
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, tournamentData.sides[0], [ team ]);

            expect(reportedError).toBeNull();
            const playerItems = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));
            expect(playerItems.map(li => li.textContent)).toContain('ANOTHER PLAYER');
        });

        it('delete button when side exists', async () => {
            const side = {
                name: 'SIDE NAME',
                id: createTemporaryId(),
                teamId: team.id,
            };

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, side, [ team ]);

            expect(reportedError).toBeNull();
            expect(context.container.querySelector('.btn-danger')).toBeTruthy();
            expect(context.container.querySelector('.btn-danger').textContent).toEqual('Delete side');
        });

        it('no delete button when side is new', async () => {
            const side = {
                name: 'SIDE NAME'
            };

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, side, [ team ]);

            expect(reportedError).toBeNull();
            expect(context.container.querySelector('.btn-danger')).toBeFalsy();
        });
    });

    describe('interactivity', () => {
        const player = {
            id: createTemporaryId(),
            name: 'PLAYER',
        };
        const anotherPlayer = {
            id: createTemporaryId(),
            name: 'ANOTHER PLAYER',
        };
        const tournamentData = {
            divisionId: createTemporaryId(),
            sides: [{
                id: createTemporaryId(),
                name: 'ANOTHER SIDE',
                players: [ anotherPlayer ],
            }]
        };
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
        };
        const team = {
            id: createTemporaryId(),
            name: 'TEAM',
            seasons: [ {
                seasonId: season.id,
                players: [ player, anotherPlayer ],
                divisionId: tournamentData.divisionId,
            } ]
        };

        it('can change side name', async () => {
            const side = {
                name: 'SIDE NAME'
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, side, [ team ]);

            await doChange(context.container, 'input[name="name"]', 'NEW NAME', context.user);

            expect(reportedError).toBeNull();
            expect(updatedData).toEqual({
                name: 'NEW NAME',
            });
        });

        it('can change team id', async () => {
            const side = {
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, side, [ team ]);

            await doSelectOption(context.container.querySelector('.dropdown-menu'), 'TEAM');

            expect(reportedError).toBeNull();
            expect(updatedData).toEqual({
                name: 'TEAM',
                teamId: team.id,
            });
        });

        it('can unset team id', async () => {
            const side = {
                name: 'TEAM',
                teamId: team.id
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, side, [ team ]);

            await doSelectOption(context.container.querySelector('.dropdown-menu'), 'Select team');

            expect(reportedError).toBeNull();
            expect(updatedData).toEqual({
                name: 'TEAM',
                teamId: undefined,
            });
        });

        it('can add player', async () => {
            const side = {
                name: '',
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, side, [ team ]);
            const players = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));

            await doClick(players.filter(p => p.textContent === 'PLAYER')[0]);

            expect(reportedError).toBeNull();
            expect(updatedData).toEqual({
                name: 'PLAYER',
                players: [{
                    id: player.id,
                    name: player.name,
                }],
            });
        });

        it('can add player and team name does not change', async () => {
            const side = {
                name: 'OTHER NAME',
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, side, [ team ]);
            const players = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));

            await doClick(players.filter(p => p.textContent === 'PLAYER')[0]);

            expect(reportedError).toBeNull();
            expect(updatedData).toEqual({
                name: 'OTHER NAME',
                players: [{
                    id: player.id,
                    name: player.name,
                }],
            });
        });

        it('can add another player', async () => {
            const side = {
                name: 'PLAYER',
                players: [player]
            };
            const noSidesTournamentData = {
                divisionId: tournamentData.divisionId,
                sides: []
            };
            await renderComponent({
                tournamentData: noSidesTournamentData,
                season,
                alreadyPlaying: {},
            }, side, [ team ]);
            const players = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));

            await doClick(players.filter(p => p.textContent === 'ANOTHER PLAYER')[0]);

            expect(reportedError).toBeNull();
            expect(updatedData).toEqual({
                name: 'ANOTHER PLAYER, PLAYER',
                players: [{
                    id: anotherPlayer.id,
                    name: 'ANOTHER PLAYER',
                }, {
                    id: player.id,
                    name: 'PLAYER',
                }],
            });
        });

        it('can add another player and team name does not change', async () => {
            const side = {
                name: 'SIDE NAME',
                players: [player]
            };
            const noSidesTournamentData = {
                divisionId: tournamentData.divisionId,
                sides: []
            };
            await renderComponent({
                tournamentData: noSidesTournamentData,
                season,
                alreadyPlaying: {},
            }, side, [ team ]);
            const players = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));

            await doClick(players.filter(p => p.textContent === 'ANOTHER PLAYER')[0]);

            expect(reportedError).toBeNull();
            expect(updatedData).toEqual({
                name: 'SIDE NAME',
                players: [{
                    id: player.id,
                    name: 'PLAYER',
                }, {
                    id: anotherPlayer.id,
                    name: 'ANOTHER PLAYER',
                }],
            });
        });

        it('can remove player', async () => {
            const side = {
                name: 'ANOTHER PLAYER, PLAYER',
                players: [player, anotherPlayer]
            };
            const noSidesTournamentData = {
                divisionId: tournamentData.divisionId,
                sides: []
            };
            await renderComponent({
                tournamentData: noSidesTournamentData,
                season,
                alreadyPlaying: {},
            }, side, [ team ]);
            const players = Array.from(context.container.querySelectorAll('.list-group .list-group-item'));

            await doClick(players.filter(p => p.textContent === 'ANOTHER PLAYER')[0]);

            expect(reportedError).toBeNull();
            expect(updatedData).toEqual({
                name: 'PLAYER',
                players: [player],
            });
        });

        it('can delete side', async () => {
            const side = {
                name: 'SIDE NAME',
                id: createTemporaryId(),
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, side, [ team ]);
            let confirm;
            window.confirm = (msg) => {
                confirm = msg;
                return true;
            }

            await doClick(findButton(context.container, 'Delete side'));

            expect(reportedError).toBeNull();
            expect(confirm).toEqual('Are you sure you want to remove SIDE NAME?');
            expect(deleted).toEqual(true);
        });

        it('does not delete side when rejected', async () => {
            const side = {
                name: 'SIDE NAME',
                id: createTemporaryId(),
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, side, [ team ]);
            let confirm;
            window.confirm = (msg) => {
                confirm = msg;
                return false;
            }

            await doClick(findButton(context.container, 'Delete side'));

            expect(reportedError).toBeNull();
            expect(confirm).toEqual('Are you sure you want to remove SIDE NAME?');
            expect(deleted).toEqual(false);
        });

        it('cannot save side if no name', async () => {
            const side = {
                name: '',
                id: createTemporaryId(),
                teamId: team.id,
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, side, [ team ]);
            let alert;
            window.alert = (msg) => {
                alert = msg;
            };

            await doClick(findButton(context.container, 'Save'));

            expect(reportedError).toBeNull();
            expect(alert).toEqual('Please enter a name for this side');
            expect(applied).toEqual(false);
        });

        it('cannot save side if no teamId and no players', async () => {
            const side = {
                name: '',
                id: createTemporaryId(),
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, side, [ team ]);
            let alert;
            window.alert = (msg) => {
                alert = msg;
            };

            await doClick(findButton(context.container, 'Save'));

            expect(reportedError).toBeNull();
            expect(alert).toEqual('Select a team or some players');
            expect(applied).toEqual(false);
        });

        it('can save side', async () => {
            const side = {
                name: 'SIDE NAME',
                id: createTemporaryId(),
                players: [player]
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, side, [ team ]);

            await doClick(findButton(context.container, 'Save'));

            expect(reportedError).toBeNull();
            expect(applied).toEqual(true);
        });

        it('can close', async () => {
            const side = {
                name: '',
                id: createTemporaryId(),
                players: [player]
            };
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: {},
            }, side, [ team ]);

            await doClick(findButton(context.container, 'Close'));

            expect(reportedError).toBeNull();
            expect(closed).toEqual(true);
            expect(applied).toEqual(false);
        });
    });
});