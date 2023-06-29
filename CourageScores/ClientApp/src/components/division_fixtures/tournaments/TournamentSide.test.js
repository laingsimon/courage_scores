// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doClick, findButton, doChange} from "../../../helpers/tests";
import React from "react";
import {createTemporaryId} from "../../../helpers/projection";
import {toMap} from "../../../helpers/collections";
import {TournamentContainer} from "./TournamentContainer";
import {TournamentSide} from "./TournamentSide";

describe('TournamentSide', () => {
    let context;
    let reportedError;
    let updatedData;
    let removed;

    afterEach(() => {
        cleanUp(context);
    });

    async function onChange(newData) {
        updatedData = newData;
    }

    async function onRemove() {
        removed = true;
    }

    async function renderComponent(containerProps, props, teams) {
        reportedError = null;
        updatedData = null;
        removed = false;
        context = await renderApp(
            { },
            { name: 'Courage Scores' },
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
                <TournamentSide {...props} onChange={onChange} onRemove={onRemove} />
            </TournamentContainer>));
    }

    describe('renders', () => {
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
        };
        const team = {
            id: createTemporaryId(),
            name: 'TEAM',
            divisionId: createTemporaryId(),
        };

        it('single player (with division id) side', async () => {
            const player = {
                id: createTemporaryId(),
                name: 'PLAYER',
                divisionId: team.divisionId,
            };
            const side = {
                id: createTemporaryId(),
                players: [
                    player
                ],
                name: 'SIDE NAME',
            };

            await renderComponent({ season }, {
                side: side,
                winner: null,
                readOnly: false,
            }, [ team ]);

            expect(reportedError).toBeNull();
            const sideName = context.container.querySelector('strong');
            const sideLink = sideName.querySelector('a');
            expect(sideLink.href).toEqual(`http://localhost/division/${player.divisionId}/player:${player.id}/${season.id}`);
            expect(sideLink.textContent).toEqual('SIDE NAME');
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName).toBeFalsy();
            const players = Array.from(context.container.querySelectorAll('ol li'));
            expect(players.map(p => p.textContent)).toEqual([ player.name ]);
        });

        it('single player (without division id) side', async () => {
            const player = {
                id: createTemporaryId(),
                name: 'PLAYER',
                divisionId: null,
            };
            const side = {
                id: createTemporaryId(),
                players: [
                    player
                ],
                name: 'SIDE NAME',
            };

            await renderComponent({ season }, {
                side: side,
                winner: null,
                readOnly: false,
            }, [ team ]);

            expect(reportedError).toBeNull();
            const sideName = context.container.querySelector('strong');
            expect(sideName.textContent).toEqual('SIDE NAME');
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName).toBeFalsy();
            const players = Array.from(context.container.querySelectorAll('ol li'));
            expect(players.map(p => p.textContent)).toEqual([ player.name ]);
        });

        it('multi player side', async () => {
            const player1 = {
                id: createTemporaryId(),
                name: 'PLAYER 1',
                divisionId: team.divisionId,
            };
            const player2 = {
                id: createTemporaryId(),
                name: 'PLAYER 2',
                divisionId: team.divisionId,
            };
            const side = {
                id: createTemporaryId(),
                players: [
                    player1, player2
                ],
                name: 'SIDE NAME',
            };

            await renderComponent({ season }, {
                side: side,
                winner: null,
                readOnly: false,
            }, [ team ]);

            expect(reportedError).toBeNull();
            const sideName = context.container.querySelector('strong');
            expect(sideName.textContent).toEqual('SIDE NAME');
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName).toBeFalsy();
            const players = Array.from(context.container.querySelectorAll('ol li'));
            expect(players.map(p => p.textContent)).toEqual([ player1.name, player2.name ]);
        });

        it('no-show multi player side', async () => {
            const player1 = {
                id: createTemporaryId(),
                name: 'PLAYER 1',
                divisionId: team.divisionId,
            };
            const player2 = {
                id: createTemporaryId(),
                name: 'PLAYER 2',
                divisionId: team.divisionId,
            };
            const side = {
                id: createTemporaryId(),
                players: [
                    player1, player2
                ],
                name: 'SIDE NAME',
                noShow: true,
            };

            await renderComponent({ season }, {
                side: side,
                winner: null,
                readOnly: false,
            }, [ team ]);

            expect(reportedError).toBeNull();
            const sideName = context.container.querySelector('strong');
            expect(sideName.textContent).toEqual('SIDE NAME');
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName).toBeFalsy();
            const players = Array.from(context.container.querySelectorAll('ol li'));
            expect(players.map(p => p.textContent)).toEqual([ player1.name, player2.name ]);
            expect(players.map(p => p.className)).toEqual([ 'text-decoration-line-through', 'text-decoration-line-through' ]);
        });

        it('team (with different side name) side', async () => {
            const side = {
                id: createTemporaryId(),
                teamId: team.id,
                name: 'SIDE NAME',
            };

            await renderComponent({ season }, {
                side: side,
                winner: null,
                readOnly: false,
            }, [ team ]);

            expect(reportedError).toBeNull();
            const sideName = context.container.querySelector('strong');
            const sideLink = sideName.querySelector('a');
            expect(sideLink.href).toEqual(`http://localhost/division/${team.divisionId}/team:${team.id}/${season.id}`);
            expect(sideLink.textContent).toEqual('SIDE NAME');
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            const teamLink = teamName.querySelector('a');
            expect(teamLink.href).toEqual(`http://localhost/division/${team.divisionId}/team:${team.id}/${season.id}`);
            expect(teamLink.textContent).toEqual(team.name);
            const players = context.container.querySelector('ol');
            expect(players).toBeFalsy();
        });

        it('no-show team (with different side name) side', async () => {
            const side = {
                id: createTemporaryId(),
                teamId: team.id,
                name: 'SIDE NAME',
                noShow: true,
            };

            await renderComponent({ season }, {
                side: side,
                winner: null,
                readOnly: false,
            }, [ team ]);

            expect(reportedError).toBeNull();
            const sideName = context.container.querySelector('strong');
            const sideLink = sideName.querySelector('a');
            expect(sideLink.href).toEqual(`http://localhost/division/${team.divisionId}/team:${team.id}/${season.id}`);
            expect(sideLink.textContent).toEqual('SIDE NAME');
            expect(sideLink.parentElement.className).toContain('text-decoration-line-through');
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName.className).toContain('text-decoration-line-through');
            const teamLink = teamName.querySelector('a');
            expect(teamLink.href).toEqual(`http://localhost/division/${team.divisionId}/team:${team.id}/${season.id}`);
            expect(teamLink.textContent).toEqual(team.name);
            const players = context.container.querySelector('ol');
            expect(players).toBeFalsy();
        });

        it('team (with same side name) side', async () => {
            const side = {
                id: createTemporaryId(),
                teamId: team.id,
                name: team.name,
            };

            await renderComponent({ season }, {
                side: side,
                winner: null,
                readOnly: false,
            }, [ team ]);

            expect(reportedError).toBeNull();
            const sideName = context.container.querySelector('strong');
            const sideLink = sideName.querySelector('a');
            expect(sideLink.href).toEqual(`http://localhost/division/${team.divisionId}/team:${team.id}/${season.id}`);
            expect(sideLink.textContent).toEqual(team.name);
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName).toBeFalsy();
            const players = context.container.querySelector('ol');
            expect(players).toBeFalsy();
        });

        it('no-show team (with same side name) side', async () => {
            const side = {
                id: createTemporaryId(),
                teamId: team.id,
                name: team.name,
                noShow: true,
            };

            await renderComponent({ season }, {
                side: side,
                winner: null,
                readOnly: false,
            }, [ team ]);

            expect(reportedError).toBeNull();
            const sideName = context.container.querySelector('strong');
            const sideLink = sideName.querySelector('a');
            expect(sideLink.href).toEqual(`http://localhost/division/${team.divisionId}/team:${team.id}/${season.id}`);
            expect(sideLink.textContent).toEqual(team.name);
            expect(sideLink.parentElement.className).toContain('text-decoration-line-through');
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName).toBeFalsy();
            const players = context.container.querySelector('ol');
            expect(players).toBeFalsy();
        });

        it('team (with missing team data) side', async () => {
            const side = {
                id: createTemporaryId(),
                teamId: createTemporaryId(),
                name: team.name,
            };

            await renderComponent({ season }, {
                side: side,
                winner: null,
                readOnly: false,
            }, [ team ]);

            expect(reportedError).toBeNull();
            const sideName = context.container.querySelector('strong');
            const sideLink = sideName.querySelector('a');
            expect(sideLink).toBeFalsy();
            expect(sideName.textContent).toEqual(side.name);
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName).toBeFalsy();
            const players = context.container.querySelector('ol');
            expect(players).toBeFalsy();
        });
    });

    describe('interactivity', () => {
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
        };
        const team = {
            id: createTemporaryId(),
            name: 'TEAM',
            divisionId: createTemporaryId(),
            seasons: [],
        };

        it('can edit side', async () => {
            const side = {
                id: createTemporaryId(),
                teamId: team.id,
                name: 'SIDE NAME',
            };
            await renderComponent({ season, tournamentData: {} }, {
                side: side,
                winner: null,
                readOnly: false,
            }, [ team ]);

            await doClick(findButton(context.container, '✏️'));

            expect(reportedError).toBeNull();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
        });

        it('cannot edit side when readonly', async () => {
            const side = {
                id: createTemporaryId(),
                teamId: team.id,
                name: 'SIDE NAME',
            };

            await renderComponent({ season }, {
                side: side,
                winner: null,
                readOnly: true,
            }, [ team ]);

            expect(context.container.querySelector('button')).toBeFalsy();
        });

        it('can apply side changes', async () => {
            const side = {
                id: createTemporaryId(),
                teamId: team.id,
                name: 'SIDE NAME',
            };
            await renderComponent({ season, tournamentData: {} }, {
                side: side,
                winner: null,
                readOnly: false,
            }, [ team ]);

            await doClick(findButton(context.container, '✏️'));
            const dialog = context.container.querySelector('.modal-dialog');
            await doChange(dialog, 'input[name="name"]', 'NEW NAME', context.user);
            await doClick(findButton(dialog, 'Save'));

            expect(reportedError).toBeNull();
            expect(updatedData).toEqual({
                id: side.id,
                teamId: side.teamId,
                name: 'NEW NAME'
            });
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can close edit side dialog', async () => {
            const side = {
                id: createTemporaryId(),
                teamId: team.id,
                name: 'SIDE NAME',
            };
            await renderComponent({ season, tournamentData: {} }, {
                side: side,
                winner: null,
                readOnly: false,
            }, [ team ]);

            await doClick(findButton(context.container, '✏️'));
            const dialog = context.container.querySelector('.modal-dialog');
            await doClick(findButton(dialog, 'Close'));

            expect(reportedError).toBeNull();
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can delete side', async () => {
            const side = {
                id: createTemporaryId(),
                teamId: team.id,
                name: 'SIDE NAME',
            };
            await renderComponent({ season, tournamentData: {} }, {
                side: side,
                winner: null,
                readOnly: false,
            }, [ team ]);
            window.confirm = () => true;

            await doClick(findButton(context.container, '✏️'));
            const dialog = context.container.querySelector('.modal-dialog');
            await doClick(findButton(dialog, 'Delete side'));

            expect(reportedError).toBeNull();
            expect(removed).toEqual(true);
        });
    });
});