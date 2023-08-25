// noinspection JSUnresolvedFunction

import {cleanUp, doChange, doClick, findButton, renderApp} from "../../../helpers/tests";
import React from "react";
import {createTemporaryId} from "../../../helpers/projection";
import {toMap} from "../../../helpers/collections";
import {TournamentContainer} from "./TournamentContainer";
import {TournamentSide} from "./TournamentSide";
import {divisionBuilder, seasonBuilder, sideBuilder, teamBuilder} from "../../../helpers/builders";

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
            {},
            {name: 'Courage Scores'},
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
                <TournamentSide {...props} onChange={onChange} onRemove={onRemove}/>
            </TournamentContainer>));
    }

    describe('renders', () => {
        const season = seasonBuilder('SEASON').build();
        const division = divisionBuilder('DIVISION').build();
        const team = teamBuilder('TEAM').build();

        it('single player (with not found division id) side', async () => {
            await renderComponent({season}, {
                side: sideBuilder('SIDE NAME')
                    .withPlayer('PLAYER', null, division.id)
                    .build(),
                winner: null,
                readOnly: false,
            }, [team]);

            expect(reportedError).toBeNull();
            const sideName = context.container.querySelector('strong');
            const sideLink = sideName.querySelector('a');
            expect(sideLink).toBeFalsy();
            expect(sideName.textContent).toEqual('SIDE NAME');
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName).toBeFalsy();
            const players = Array.from(context.container.querySelectorAll('ol li'));
            expect(players.map(p => p.textContent)).toEqual(['PLAYER']);
        });

        it('single player (with found division id) side', async () => {
            await renderComponent({season}, {
                side: sideBuilder('SIDE NAME')
                    .withPlayer('PLAYER', null, division.id)
                    .build(),
                winner: null,
                readOnly: false,
            }, [team]);

            expect(reportedError).toBeNull();
            const sideName = context.container.querySelector('strong');
            expect(sideName.textContent).toEqual('SIDE NAME');
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName).toBeFalsy();
            const players = Array.from(context.container.querySelectorAll('ol li'));
            expect(players.map(p => p.textContent)).toEqual(['PLAYER']);
        });

        it('single player (without division id) side', async () => {
            await renderComponent({season}, {
                side: sideBuilder('SIDE NAME')
                    .withPlayer('PLAYER')
                    .build(),
                winner: null,
                readOnly: false,
            }, [team]);

            expect(reportedError).toBeNull();
            const sideName = context.container.querySelector('strong');
            expect(sideName.textContent).toEqual('SIDE NAME');
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName).toBeFalsy();
            const players = Array.from(context.container.querySelectorAll('ol li'));
            expect(players.map(p => p.textContent)).toEqual(['PLAYER']);
        });

        it('multi player side', async () => {
            const side = sideBuilder('SIDE NAME')
                .withPlayer('PLAYER 1', null, division.id)
                .withPlayer('PLAYER 2', null, division.id)
                .build();

            await renderComponent({season}, {
                side: side,
                winner: null,
                readOnly: false,
            }, [team]);

            expect(reportedError).toBeNull();
            const sideName = context.container.querySelector('strong');
            expect(sideName.textContent).toEqual('SIDE NAME');
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName).toBeFalsy();
            const players = Array.from(context.container.querySelectorAll('ol li'));
            expect(players.map(p => p.textContent)).toEqual(['PLAYER 1', 'PLAYER 2']);
        });

        it('no-show multi player side', async () => {
            const side = sideBuilder('SIDE NAME')
                .withPlayer('PLAYER 1', null, division.id)
                .withPlayer('PLAYER 2', null, division.id)
                .noShow()
                .build();

            await renderComponent({season}, {
                side: side,
                winner: null,
                readOnly: false,
            }, [team]);

            expect(reportedError).toBeNull();
            const sideName = context.container.querySelector('strong');
            expect(sideName.textContent).toEqual('SIDE NAME');
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName).toBeFalsy();
            const players = Array.from(context.container.querySelectorAll('ol li'));
            expect(players.map(p => p.textContent)).toEqual(['PLAYER 1', 'PLAYER 2']);
            expect(players.map(p => p.className)).toEqual(['text-decoration-line-through', 'text-decoration-line-through']);
        });

        it('team (with different side name) side', async () => {
            await renderComponent({season}, {
                side: sideBuilder('SIDE NAME')
                    .teamId(team.id)
                    .noPlayers()
                    .build(),
                winner: null,
                readOnly: false,
            }, [team]);

            expect(reportedError).toBeNull();
            const sideName = context.container.querySelector('strong');
            expect(sideName.textContent).toEqual('SIDE NAME');
            const players = context.container.querySelector('ol');
            expect(players).toBeFalsy();
        });

        it('team (with not-found division and different side name) side', async () => {
            await renderComponent({season}, {
                side: sideBuilder('SIDE NAME')
                    .teamId(team.id)
                    .noPlayers()
                    .build(),
                winner: null,
                readOnly: false,
            }, [team], []);

            expect(reportedError).toBeNull();
            const sideName = context.container.querySelector('strong');
            expect(sideName.textContent).toEqual('SIDE NAME');
            const players = context.container.querySelector('ol');
            expect(players).toBeFalsy();
        });

        it('no-show team (with different side name) side', async () => {
            const side = sideBuilder('SIDE NAME')
                .teamId(team.id)
                .noShow()
                .noPlayers()
                .build();

            await renderComponent({season}, {
                side: side,
                winner: null,
                readOnly: false,
            }, [team]);

            expect(reportedError).toBeNull();
            const sideName = context.container.querySelector('strong');
            expect(sideName.textContent).toEqual('SIDE NAME');
            expect(sideName.className).toContain('text-decoration-line-through');
            const players = context.container.querySelector('ol');
            expect(players).toBeFalsy();
        });

        it('team (with same side name) side', async () => {
            await renderComponent({season}, {
                side: sideBuilder(team.name)
                    .teamId(team.id)
                    .noPlayers()
                    .build(),
                winner: null,
                readOnly: false,
            }, [team]);

            expect(reportedError).toBeNull();
            const sideName = context.container.querySelector('strong');
            expect(sideName.textContent).toEqual(team.name);
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName).toBeFalsy();
            const players = context.container.querySelector('ol');
            expect(players).toBeFalsy();
        });

        it('no-show team (with same side name) side', async () => {
            await renderComponent({season}, {
                side: sideBuilder(team.name)
                    .teamId(team.id)
                    .noShow()
                    .noPlayers()
                    .build(),
                winner: null,
                readOnly: false,
            }, [team]);

            expect(reportedError).toBeNull();
            const sideName = context.container.querySelector('strong');
            expect(sideName.textContent).toEqual(team.name);
            expect(sideName.className).toContain('text-decoration-line-through');
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName).toBeFalsy();
            const players = context.container.querySelector('ol');
            expect(players).toBeFalsy();
        });

        it('team (with missing team data) side', async () => {
            await renderComponent({season}, {
                side: sideBuilder(team.name)
                    .teamId(createTemporaryId())
                    .noPlayers()
                    .build(),
                winner: null,
                readOnly: false,
            }, [team]);

            expect(reportedError).toBeNull();
            const sideName = context.container.querySelector('strong');
            const sideLink = sideName.querySelector('a');
            expect(sideLink).toBeFalsy();
            expect(sideName.textContent).toEqual(team.name);
            const teamName = context.container.querySelector('div[data-name="team-name"]');
            expect(teamName).toBeFalsy();
            const players = context.container.querySelector('ol');
            expect(players).toBeFalsy();
        });
    });

    describe('interactivity', () => {
        const season = seasonBuilder('SEASON').build();
        const team = teamBuilder('TEAM').build();

        it('can edit side', async () => {
            await renderComponent({season, tournamentData: {}}, {
                side: sideBuilder('SIDE NAME')
                    .teamId(team.id)
                    .build(),
                winner: null,
                readOnly: false,
            }, [team]);

            await doClick(findButton(context.container, '✏️'));

            expect(reportedError).toBeNull();
            const dialog = context.container.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
        });

        it('cannot edit side when readonly', async () => {
            await renderComponent({season}, {
                side: sideBuilder('SIDE NAME')
                    .teamId(team.id)
                    .build(),
                winner: null,
                readOnly: true,
            }, [team]);

            expect(context.container.querySelector('button')).toBeFalsy();
        });

        it('can apply side changes', async () => {
            const sideId = createTemporaryId();
            await renderComponent({season, tournamentData: {}}, {
                side: sideBuilder('SIDE NAME', sideId)
                    .teamId(team.id)
                    .build(),
                winner: null,
                readOnly: false,
            }, [team]);

            await doClick(findButton(context.container, '✏️'));
            const dialog = context.container.querySelector('.modal-dialog');
            await doChange(dialog, 'input[name="name"]', 'NEW NAME', context.user);
            await doClick(findButton(dialog, 'Save'));

            expect(reportedError).toBeNull();
            expect(updatedData).toEqual({
                id: sideId,
                teamId: team.id,
                name: 'NEW NAME',
                players: [],
            });
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can close edit side dialog', async () => {
            await renderComponent({season, tournamentData: {}}, {
                side: sideBuilder('SIDE NAME')
                    .teamId(team.id)
                    .build(),
                winner: null,
                readOnly: false,
            }, [team]);

            await doClick(findButton(context.container, '✏️'));
            const dialog = context.container.querySelector('.modal-dialog');
            await doClick(findButton(dialog, 'Close'));

            expect(reportedError).toBeNull();
            expect(context.container.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can delete side', async () => {
            await renderComponent({season, tournamentData: {}}, {
                side: sideBuilder('SIDE NAME')
                    .teamId(team.id)
                    .build(),
                winner: null,
                readOnly: false,
            }, [team]);
            window.confirm = () => true;

            await doClick(findButton(context.container, '✏️'));
            const dialog = context.container.querySelector('.modal-dialog');
            await doClick(findButton(dialog, 'Delete side'));

            expect(reportedError).toBeNull();
            expect(removed).toEqual(true);
        });
    });
});