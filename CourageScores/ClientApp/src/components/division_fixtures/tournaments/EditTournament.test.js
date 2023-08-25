// noinspection JSUnresolvedFunction

import {cleanUp, doChange, doClick, doSelectOption, findButton, renderApp} from "../../../helpers/tests";
import React from "react";
import {createTemporaryId} from "../../../helpers/projection";
import {toMap} from "../../../helpers/collections";
import {EditTournament} from "./EditTournament";
import {TournamentContainer} from "./TournamentContainer";
import {seasonBuilder, sideBuilder, teamBuilder, tournamentBuilder} from "../../../helpers/builders";

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
                account,
                teams: toMap(teams || []),
            },
            (<TournamentContainer {...containerProps} setTournamentData={setTournamentData}>
                <EditTournament {...props} />
            </TournamentContainer>));
    }

    describe('renders', () => {
        const account = null;
        const season = seasonBuilder('SEASON').build();

        it('who is playing', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide(s => s.name('SIDE 1'))
                .withSide(s => s.name('ANOTHER SIDE'))
                .build();

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
            expect(sideNames).toEqual(['ANOTHER SIDE', 'SIDE 1']);
        });

        it('rounds, when 2 or more sides', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide(s => s.name('SIDE 1'))
                .withSide(s => s.name('ANOTHER SIDE'))
                .build();

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

        it('no rounds, when less than 2 sides', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide(s => s.name('SIDE 1'))
                .build();

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

        it('accolades, when 2 or more sides with scores', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide(s => s.name('SIDE 1'))
                .withSide(s => s.name('ANOTHER SIDE'))
                .round(r => r.withMatch(m => m.sideA('SIDE 1', 1).sideB('ANOTHER SIDE', 2)))
                .build();

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
        });

        it('no accolades, when less than 2 sides', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide(s => s.name('SIDE 1'))
                .build();

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
            const side1 = sideBuilder('SIDE 1').build();
            const anotherSide = sideBuilder('ANOTHER SIDE').build();
            const tournamentData = tournamentBuilder()
                .round(r => r
                    .withMatch(m => m
                        .sideA(side1, 1)
                        .sideB(anotherSide, 2)))
                .forSeason(season)
                .withSide(side1)
                .withSide(anotherSide)
                .build();

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
            const side1 = sideBuilder('SIDE 1').build();
            const anotherSide = sideBuilder('ANOTHER SIDE').build();
            const tournamentData = tournamentBuilder()
                .round(r => r
                    .withMatch(m => m
                        .sideA(side1, 2)
                        .sideB(anotherSide, 2))
                    .round(r => r
                        .withMatch(m => m.sideA(side1, 2).sideB(anotherSide, 1))))
                .forSeason(season)
                .withSide(side1)
                .withSide(anotherSide)
                .build();

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
        const season = seasonBuilder('SEASON').build();
        const team1 = teamBuilder('TEAM 1').forSeason(season, createTemporaryId()).build();

        it('can add a side', async () => {
            const existingSide = sideBuilder('SIDE 1').build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide(existingSide)
                .build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: [],
                allPlayers: [],
            }, {
                disabled: false,
                saving: false,
                canSave: true
            }, account, [team1]);
            const playing = context.container.querySelector('div > div > div:nth-child(1)');
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)');

            await doClick(findButton(sides, '➕'));
            const dialog = sides.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            await doSelectOption(dialog.querySelector('.dropdown-menu'), 'TEAM 1');
            await doClick(findButton(dialog, 'Save'));

            expect(reportedError).toBeNull();
            expect(updatedData.sides).toEqual([existingSide, {
                id: expect.any(String),
                name: 'TEAM 1',
                teamId: team1.id,
            }]);
        });

        it('trims whitespace from end of new side name', async () => {
            const existingSide = sideBuilder('SIDE 1').build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide(existingSide)
                .build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: [],
                allPlayers: [],
            }, {
                disabled: false,
                saving: false,
                canSave: true
            }, account, [team1]);
            const playing = context.container.querySelector('div > div > div:nth-child(1)');
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)');

            await doClick(findButton(sides, '➕'));
            const dialog = sides.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            await doSelectOption(dialog.querySelector('.dropdown-menu'), 'TEAM 1');
            await doChange(dialog, 'input[name="name"]', 'NAME   ', context.user);
            await doClick(findButton(dialog, 'Save'));

            expect(reportedError).toBeNull();
            expect(updatedData.sides).toEqual([{
                id: expect.any(String),
                name: 'NAME',
                teamId: team1.id,
            }, existingSide]);
        });

        it('can close add a side dialog', async () => {
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide(s => s.name('SIDE 1'))
                .build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: [],
                allPlayers: [],
            }, {
                disabled: false,
                saving: false,
                canSave: true
            }, account, [team1]);
            const playing = context.container.querySelector('div > div > div:nth-child(1)');
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)');

            await doClick(findButton(sides, '➕'));
            const dialog = sides.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            await doClick(findButton(dialog, 'Close'));

            expect(reportedError).toBeNull();
            expect(sides.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can close edit side dialog', async () => {
            const side = sideBuilder('SIDE 1').build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide(side)
                .build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: [],
                allPlayers: [],
            }, {
                disabled: false,
                saving: false,
                canSave: true
            }, account, [team1]);
            const playing = context.container.querySelector('div > div > div:nth-child(1)');
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)');
            const sideElement = sides.querySelector('div');
            let message;
            window.confirm = (msg) => {
                message = msg;
                return true;
            }

            await doClick(findButton(sideElement, '✏️'));
            const dialog = sides.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            await doClick(findButton(dialog, 'Close'));

            expect(reportedError).toBeNull();
            expect(sides.querySelector('.modal-dialog')).toBeFalsy();
        });

        it('can remove a side', async () => {
            const side = sideBuilder('SIDE 1').build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide(side)
                .build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: [],
                allPlayers: [],
            }, {
                disabled: false,
                saving: false,
                canSave: true
            }, account, [team1]);
            const playing = context.container.querySelector('div > div > div:nth-child(1)');
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)');
            const sideElement = sides.querySelector('div');
            let message;
            window.confirm = (msg) => {
                message = msg;
                return true;
            }

            await doClick(findButton(sideElement, '✏️'));
            const dialog = sides.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            await doClick(findButton(dialog, 'Delete side'));

            expect(reportedError).toBeNull();
            expect(updatedData.sides).toEqual([]);
        });

        it('updates side A data in rounds', async () => {
            const side = sideBuilder('SIDE 1').teamId(team1.id).build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide(side)
                .round(r => r.withMatch(
                    m => m.sideA(side)
                ))
                .build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: [],
                allPlayers: [],
            }, {
                disabled: false,
                saving: false,
                canSave: true
            }, account, [team1]);
            const playing = context.container.querySelector('div > div > div:nth-child(1)');
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)');
            const sideElement = sides.querySelector('div');

            await doClick(findButton(sideElement, '✏️'));
            const dialog = sides.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            await doChange(sideElement, 'input[name="name"]', 'NEW SIDE 1', context.user);
            await doClick(findButton(dialog, 'Save'));

            expect(reportedError).toBeNull();
            expect(updatedData.round.matches[0]).toEqual({
                id: expect.any(String),
                sideA: {id: side.id, name: 'NEW SIDE 1', teamId: team1.id, players: []},
                sideB: null,
                scoreA: null,
                scoreB: null,
            });
        });

        it('updates side B data in rounds', async () => {
            const side = sideBuilder('SIDE 1').teamId(team1.id).build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide(side)
                .round(r => r.withMatch(
                    m => m.sideB(side)
                ))
                .build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: [],
                allPlayers: [],
            }, {
                disabled: false,
                saving: false,
                canSave: true
            }, account, [team1]);
            const playing = context.container.querySelector('div > div > div:nth-child(1)');
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)');
            const sideElement = sides.querySelector('div');

            await doClick(findButton(sideElement, '✏️'));
            const dialog = sides.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            await doChange(sideElement, 'input[name="name"]', 'NEW SIDE 1', context.user);
            await doClick(findButton(dialog, 'Save'));

            expect(reportedError).toBeNull();
            expect(updatedData.round.matches[0]).toEqual({
                id: expect.any(String),
                sideA: null,
                sideB: {id: side.id, name: 'NEW SIDE 1', teamId: team1.id, players: []},
                scoreA: null,
                scoreB: null,
            });
        });

        it('trims whitespace from end of edited side name', async () => {
            const side = sideBuilder('SIDE 1').teamId(team1.id).build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide(side)
                .round(r => r.withMatch(
                    m => m.sideB(side)
                ))
                .build();
            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: [],
                allPlayers: [],
            }, {
                disabled: false,
                saving: false,
                canSave: true
            }, account, [team1]);
            const playing = context.container.querySelector('div > div > div:nth-child(1)');
            expect(playing.textContent).toEqual('Playing:');
            const sides = context.container.querySelector('div > div > div:nth-child(2)');
            const sideElement = sides.querySelector('div');

            await doClick(findButton(sideElement, '✏️'));
            const dialog = sides.querySelector('.modal-dialog');
            expect(dialog).toBeTruthy();
            await doChange(sideElement, 'input[name="name"]', 'NEW SIDE 1   ', context.user);
            await doClick(findButton(dialog, 'Save'));

            expect(reportedError).toBeNull();
            expect(updatedData.sides[0]).toEqual({
                id: side.id,
                name: 'NEW SIDE 1',
                teamId: team1.id,
                players: []
            });
        });

        it('excludes no-show sides from match selection', async () => {
            const side1 = sideBuilder('SIDE 1').teamId(team1.id).build();
            const side2 = sideBuilder('SIDE 2 (no show)').teamId(team1.id).noShow().build();
            const tournamentData = tournamentBuilder()
                .forSeason(season)
                .withSide(side1)
                .withSide(side2)
                .build();

            await renderComponent({
                tournamentData,
                season,
                alreadyPlaying: [],
                allPlayers: [],
            }, {
                disabled: false,
                saving: false,
                canSave: true
            }, account, [team1]);

            const rounds = context.container.querySelector('div > div > div.mt-3:nth-child(3)');
            const round1SideA = rounds.querySelector('table tbody tr:first-child td:nth-child(1)');
            const sideOptions = Array.from(round1SideA.querySelectorAll('.dropdown-menu .dropdown-item'));
            expect(sideOptions.map(o => o.textContent)).toEqual(['SIDE 1']);
        });
    });
});