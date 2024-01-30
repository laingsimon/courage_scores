import React from "react";
import {
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick, ErrorState,
    findButton,
    iocProps,
    renderApp, TestContext
} from "../../../helpers/tests";
import {IMultiPlayerSelectionProps, MultiPlayerSelection} from "./MultiPlayerSelection";
import {ISelectablePlayer} from "../../division_players/PlayerSelection";
import {ITeamDto} from "../../../interfaces/models/dtos/Team/ITeamDto";
import {divisionBuilder} from "../../../helpers/builders/divisions";
import {seasonBuilder} from "../../../helpers/builders/seasons";
import {playerBuilder} from "../../../helpers/builders/players";
import {teamBuilder} from "../../../helpers/builders/teams";

describe('MultiPlayerSelection', () => {
    let context: TestContext;
    let reportedError: ErrorState;
    let addedPlayer: { player: ISelectablePlayer, notes: string };
    let removedPlayer: { id: string, index: number };
    async function onAddPlayer(player: ISelectablePlayer, notes: string) {
        addedPlayer = {player, notes};
    }
    async function onRemovePlayer(id: string, index: number) {
        removedPlayer = {id, index};
    }

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        reportedError = new ErrorState();
        addedPlayer = null;
        removedPlayer = null;
    });

    async function renderComponent(props: IMultiPlayerSelectionProps, allTeams?: ITeamDto[]) {
        context = await renderApp(
            iocProps(),
            brandingProps(),
            appProps({
                teams: allTeams,
            }, reportedError),
            (<MultiPlayerSelection {...props} />));
    }

    function getSelectedPlayers() {
        return Array.from(context.container.querySelectorAll('ol li'));
    }

    describe('renders', () => {
        const division = divisionBuilder('DIVISION').build();
        const season = seasonBuilder('SEASON')
            .withDivision(division)
            .build();
        const player = playerBuilder('PLAYER').notes('NOTES').build();

        it('readonly component', async () => {
            await renderComponent({
                readOnly: true,
                players: [player],
                allPlayers: [player],
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });

            expect(reportedError.hasError()).toEqual(false);
            const inputs = Array.from(context.container.querySelectorAll('input'));
            const buttons = Array.from(context.container.querySelectorAll('button'));
            expect(inputs.length).toEqual(0);
            expect(buttons.length).toEqual(1);
        });

        it('disabled component', async () => {
            await renderComponent({
                disabled: true,
                players: [player],
                allPlayers: [player],
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });

            expect(reportedError.hasError()).toEqual(false);
            const inputs = Array.from(context.container.querySelectorAll('input'));
            const buttons = Array.from(context.container.querySelectorAll('button'));
            expect(inputs.length).toEqual(0);
            expect(buttons.length).toEqual(0);
        });

        it('disabled and readonly component', async () => {
            await renderComponent({
                readOnly: true,
                disabled: true,
                players: [player],
                allPlayers: [player],
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });

            expect(reportedError.hasError()).toEqual(false);
            const inputs = Array.from(context.container.querySelectorAll('input'));
            const buttons = Array.from(context.container.querySelectorAll('button'));
            expect(inputs.length).toEqual(0);
            expect(buttons.length).toEqual(0);
        });

        it('editable component without notes', async () => {
            await renderComponent({
                players: [player],
                allPlayers: [player],
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });

            expect(reportedError.hasError()).toEqual(false);
            const selectedPlayers = getSelectedPlayers();
            expect(selectedPlayers.length).toEqual(1 + 1);
            const selectedPlayer = selectedPlayers[0];
            const removePlayerButton = selectedPlayer.querySelector('button');
            expect(removePlayerButton).toBeTruthy();
            expect(removePlayerButton.textContent).toEqual('PLAYER 🗑');
            const addPlayerButton = context.container.querySelector('ol > li:last-child > button');
            expect(addPlayerButton).toBeTruthy();
            expect(addPlayerButton.textContent).toEqual('➕');
            const notesInput = context.container.querySelector('ol > li:last-child > input');
            expect(notesInput).toBeFalsy();
        });

        it('editable component with notes', async () => {
            await renderComponent({
                players: [player],
                allPlayers: [player],
                showNotes: true,
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });

            expect(reportedError.hasError()).toEqual(false);
            const selectedPlayers = getSelectedPlayers();
            expect(selectedPlayers.length).toEqual(1 + 1);
            const selectedPlayer = selectedPlayers[0];
            const removePlayerButton = selectedPlayer.querySelector('button');
            expect(removePlayerButton).toBeTruthy();
            expect(removePlayerButton.textContent).toEqual('PLAYER (NOTES) 🗑');
            const addPlayerButton = context.container.querySelector('ol > li:last-child > button');
            expect(addPlayerButton).toBeTruthy();
            expect(addPlayerButton.textContent).toEqual('➕');
            const notesInput = context.container.querySelector('ol > li:last-child > input');
            expect(notesInput).toBeTruthy();
        });

        it('placeholder in dropdown', async () => {
            await renderComponent({
                players: [player],
                allPlayers: [player],
                placeholder: 'PLACEHOLDER',
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });

            expect(reportedError.hasError()).toEqual(false);
            const dropdownToggle = context.container.querySelector('button.dropdown-toggle');
            expect(dropdownToggle).toBeTruthy();
            expect(dropdownToggle.textContent).toEqual('PLACEHOLDER');
        });

        it('readonly selected players', async () => {
            await renderComponent({
                readOnly: true,
                players: [player],
                allPlayers: [player],
                division: division,
                season: season,
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });

            expect(reportedError.hasError()).toEqual(false);
            const selectedPlayer = getSelectedPlayers()[0];
            expect(selectedPlayer).toBeTruthy();
            const selectedPlayerButton = selectedPlayer.querySelector('button');
            expect(selectedPlayerButton).toBeTruthy();
            expect(selectedPlayerButton.textContent).toEqual('PLAYER 🗑');
            expect(selectedPlayerButton.disabled).toBeTruthy();
        });

        it('readonly selected placers with notes', async () => {
            await renderComponent({
                readOnly: true,
                players: [player],
                allPlayers: [player],
                showNotes: true,
                division: division,
                season: season,
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });

            expect(reportedError.hasError()).toEqual(false);
            const selectedPlayer = getSelectedPlayers()[0];
            expect(selectedPlayer).toBeTruthy();
            const selectedPlayerButton = selectedPlayer.querySelector('button');
            expect(selectedPlayerButton).toBeTruthy();
            expect(selectedPlayerButton.textContent).toEqual('PLAYER (NOTES) 🗑');
            expect(selectedPlayerButton.disabled).toBeTruthy();
        });

        it('disabled selected players', async () => {
            await renderComponent({
                disabled: true,
                players: [player],
                allPlayers: [player],
                division: division,
                season: season,
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            }, [teamBuilder('TEAM_NAME').forSeason(season, division, [player]).build()]);

            expect(reportedError.hasError()).toEqual(false);
            const selectedPlayer = getSelectedPlayers()[0];
            expect(selectedPlayer).toBeTruthy();
            const linkToPlayer = selectedPlayer.querySelector('a');
            expect(linkToPlayer).toBeTruthy();
            expect(linkToPlayer.href).toContain(`/division/${division.name}/player:${player.name}@TEAM_NAME/${season.name}`);
            expect(linkToPlayer.textContent).toEqual('PLAYER');
        });

        it('disabled selected players link via id when team has no matching season', async () => {
            const team = teamBuilder().forSeason(seasonBuilder('ANOTHER SEASON').build(), division).build();
            await renderComponent({
                disabled: true,
                players: [player],
                allPlayers: [player],
                division: division,
                season: season,
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            }, [team]);

            expect(reportedError.hasError()).toEqual(false);
            const selectedPlayer = getSelectedPlayers()[0];
            expect(selectedPlayer).toBeTruthy();
            const linkToPlayer = selectedPlayer.querySelector('a');
            expect(linkToPlayer).toBeTruthy();
            expect(linkToPlayer.href).toContain(`/division/${division.name}/player:${player.id}/${season.name}`);
            expect(linkToPlayer.textContent).toEqual('PLAYER');
        });

        it('disabled selected players link via id when player not found for team season', async () => {
            await renderComponent({
                disabled: true,
                players: [player],
                allPlayers: [player],
                division: division,
                season: season,
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            }, [ teamBuilder().forSeason(season).build() ]);

            expect(reportedError.hasError()).toEqual(false);
            const selectedPlayer = getSelectedPlayers()[0];
            expect(selectedPlayer).toBeTruthy();
            const linkToPlayer = selectedPlayer.querySelector('a');
            expect(linkToPlayer).toBeTruthy();
            expect(linkToPlayer.href).toContain(`/division/${division.name}/player:${player.id}/${season.name}`);
            expect(linkToPlayer.textContent).toEqual('PLAYER');
        });

        it('disabled selected placers with notes', async () => {
            await renderComponent({
                disabled: true,
                players: [player],
                allPlayers: [player],
                showNotes: true,
                division: division,
                season: season,
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            }, []);

            expect(reportedError.hasError()).toEqual(false);
            const selectedPlayer = getSelectedPlayers()[0];
            expect(selectedPlayer).toBeTruthy();
            const linkToPlayer = selectedPlayer.querySelector('a');
            expect(linkToPlayer).toBeTruthy();
            expect(linkToPlayer.href).toContain(`/division/${division.name}/player:${player.id}/${season.name}`);
            expect(linkToPlayer.textContent).toEqual('PLAYER (NOTES)');
        });

        it('dropdown with dropdownClassName', async () => {
            await renderComponent({
                players: [player],
                allPlayers: [player],
                dropdownClassName: 'DROPDOWN-CLASS-NAME',
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });

            expect(reportedError.hasError()).toEqual(false);
            const dropdown = context.container.querySelector('ol > li:last-child div.btn-group');
            expect(dropdown).toBeTruthy();
            expect(dropdown.className).toContain('DROPDOWN-CLASS-NAME');
        });

        it('component with notesClassName', async () => {
            await renderComponent({
                players: [player],
                allPlayers: [player],
                notesClassName: 'NOTES-CLASS-NAME',
                showNotes: true,
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });

            expect(reportedError.hasError()).toEqual(false);
            const notesInput = context.container.querySelector('ol > li:last-child > input');
            expect(notesInput).toBeTruthy();
            expect(notesInput.className).toContain('NOTES-CLASS-NAME');
        });
    });

    describe('interactivity', () => {
        const player: ISelectablePlayer = playerBuilder('PLAYER').notes('NOTES').build();
        let alert: string;
        window.alert = (message) => {
            alert = message;
        }

        it('does not permit removal of players when readonly', async () => {
            await renderComponent({
                readOnly: true,
                players: [player],
                allPlayers: [player],
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });
            expect(reportedError.hasError()).toEqual(false);
            const selectedPlayer = getSelectedPlayers()[0];
            expect(selectedPlayer).toBeTruthy();

            const button = findButton(selectedPlayer, 'PLAYER 🗑');

            expect(button.disabled).toEqual(true);
        });

        it('allows players to be added', async () => {
            await renderComponent({
                players: [],
                allPlayers: [player],
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });
            expect(reportedError.hasError()).toEqual(false);

            await doClick(findButton(context.container, 'PLAYER'));
            await doClick(findButton(context.container, '➕'));

            expect(addedPlayer).not.toBeNull();
            expect(addedPlayer.player).toEqual(player);
            expect(addedPlayer.notes).toBeFalsy();
        });

        it('players not added when no player selected', async () => {
            await renderComponent({
                players: [],
                allPlayers: [player],
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });
            expect(reportedError.hasError()).toEqual(false);

            // no player selected
            await doClick(findButton(context.container, '➕'));

            expect(addedPlayer).toBeNull();
            expect(alert).toEqual('Ensure a player is selected first');
        });

        it('allows players to be added with notes', async () => {
            await renderComponent({
                players: [],
                allPlayers: [player],
                showNotes: true,
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });
            expect(reportedError.hasError()).toEqual(false);

            await doClick(findButton(context.container, 'PLAYER'));
            await doChange(context.container, 'ol > li:last-child > input[type="number"]', '100', context.user);
            await doClick(findButton(context.container, '➕'));

            expect(addedPlayer).not.toBeNull();
            expect(addedPlayer.player).toEqual(player);
            expect(addedPlayer.notes).toEqual('100');
        });

        it('players not added when notes are empty', async () => {
            await renderComponent({
                players: [],
                allPlayers: [player],
                showNotes: true,
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });
            expect(reportedError.hasError()).toEqual(false);

            await doClick(findButton(context.container, 'PLAYER'));
            // notes not updated
            await doClick(findButton(context.container, '➕'));

            expect(addedPlayer).toBeNull();
            expect(alert).toEqual('Enter the score first');
        });

        it('allows players to be removed', async () => {
            await renderComponent({
                players: [player],
                allPlayers: [player],
                showNotes: false,
                onAddPlayer: onAddPlayer,
                onRemovePlayer: onRemovePlayer,
            });
            expect(reportedError.hasError()).toEqual(false);
            const selectedPlayer = getSelectedPlayers()[0];

            await doClick(findButton(selectedPlayer, 'PLAYER 🗑'));

            expect(removedPlayer).not.toBeNull();
            expect(removedPlayer.id).toEqual(player.id);
        });
    });
});