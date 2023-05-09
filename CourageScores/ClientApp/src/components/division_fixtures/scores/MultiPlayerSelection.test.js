// noinspection JSUnresolvedFunction

import React from "react";
import {cleanUp, doClick, renderApp, doChange} from "../../../tests/helpers";
import {MultiPlayerSelection} from "./MultiPlayerSelection";
import {createTemporaryId} from "../../../Utilities";

describe('MultiPlayerSelection', () => {
    let context;
    let reportedError;
    let addedPlayer;
    let removedPlayer;
    const onAddPlayer = (player, notes) => {
        addedPlayer = { player, notes };
    }
    const onRemovePlayer = (id, index) => {
        removedPlayer = { id, index };
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(props) {
        reportedError = null;
        addedPlayer = null;
        removedPlayer = null;
        context = await renderApp(
            {},
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                }
            },
            (<MultiPlayerSelection
                onAddPlayer={onAddPlayer}
                onRemovePlayer={onRemovePlayer}
                {...props} />));
    }

    function getSelectedPlayers() {
        return Array.from(context.container.querySelectorAll('ol li'));
    }

    describe('renders', () => {
        const divisionId = createTemporaryId();
        const seasonId = createTemporaryId();
        const player = {
            id: createTemporaryId(),
            name: 'PLAYER',
            notes: 'NOTES',
        }

        it('readonly component', async () => {
            await renderComponent({
                readOnly: true,
                players: [player],
                allPlayers: [player],
            });

            expect(reportedError).toBeNull();
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
            });

            expect(reportedError).toBeNull();
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
            });

            expect(reportedError).toBeNull();
            const inputs = Array.from(context.container.querySelectorAll('input'));
            const buttons = Array.from(context.container.querySelectorAll('button'));
            expect(inputs.length).toEqual(0);
            expect(buttons.length).toEqual(0);
        });

        it('editable component without notes', async () => {
            await renderComponent({
                players: [player],
                allPlayers: [player],
            });

            expect(reportedError).toBeNull();
            const selectedPlayers = getSelectedPlayers();
            expect(selectedPlayers.length).toEqual(1+1);
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
            });

            expect(reportedError).toBeNull();
            const selectedPlayers = getSelectedPlayers();
            expect(selectedPlayers.length).toEqual(1+1);
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
            });

            expect(reportedError).toBeNull();
            const dropdownToggle = context.container.querySelector('button.dropdown-toggle');
            expect(dropdownToggle).toBeTruthy();
            expect(dropdownToggle.textContent).toEqual('PLACEHOLDER');
        });

        it('readonly selected players', async () => {
            await renderComponent({
                readOnly: true,
                players: [player],
                allPlayers: [player],
                divisionId: divisionId,
                seasonId: seasonId,
            });

            expect(reportedError).toBeNull();
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
                divisionId: divisionId,
                seasonId: seasonId,
            });

            expect(reportedError).toBeNull();
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
                divisionId: divisionId,
                seasonId: seasonId,
            });

            expect(reportedError).toBeNull();
            const selectedPlayer = getSelectedPlayers()[0];
            expect(selectedPlayer).toBeTruthy();
            const linkToPlayer = selectedPlayer.querySelector('a');
            expect(linkToPlayer).toBeTruthy();
            expect(linkToPlayer.href).toContain(`/division/${divisionId}/player:${player.id}/${seasonId}`);
            expect(linkToPlayer.textContent).toEqual('PLAYER');
        });

        it('disabled selected placers with notes', async () => {
            await renderComponent({
                disabled: true,
                players: [player],
                allPlayers: [player],
                showNotes: true,
                divisionId: divisionId,
                seasonId: seasonId,
            });

            expect(reportedError).toBeNull();
            const selectedPlayer = getSelectedPlayers()[0];
            expect(selectedPlayer).toBeTruthy();
            const linkToPlayer = selectedPlayer.querySelector('a');
            expect(linkToPlayer).toBeTruthy();
            expect(linkToPlayer.href).toContain(`/division/${divisionId}/player:${player.id}/${seasonId}`);
            expect(linkToPlayer.textContent).toEqual('PLAYER (NOTES)');
        });

        it('dropdown with dropdownClassName', async () => {
            await renderComponent({
                players: [player],
                allPlayers: [player],
                dropdownClassName: 'DROPDOWN-CLASS-NAME',
            });

            expect(reportedError).toBeNull();
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
            });

            expect(reportedError).toBeNull();
            const notesInput = context.container.querySelector('ol > li:last-child > input');
            expect(notesInput).toBeTruthy();
            expect(notesInput.className).toContain('NOTES-CLASS-NAME');
        });
    });

    describe('interactivity', () => {
        const player = {
            id: createTemporaryId(),
            name: 'PLAYER',
            notes: 'NOTES',
        }
        let alert;
        window.alert = (message) => {
            alert = message;
        }

        it('does not permit removal of players when readonly', async () => {
            await renderComponent({
                readOnly: true,
                players: [player],
                allPlayers: [player],
            });
            expect(reportedError).toBeNull();
            const selectedPlayer = getSelectedPlayers()[0];
            expect(selectedPlayer).toBeTruthy();

            await doClick(selectedPlayer, 'button');

            // passes because <button ... disabled=true ... />
            expect(removedPlayer).toBeNull();
        });

        it('allows players to be added', async () => {
            await renderComponent({
                players: [],
                allPlayers: [player],
            });
            expect(reportedError).toBeNull();

            await doClick(context.container, 'ol > li:last-child button.dropdown-item:last-child'); // select first player
            await doClick(context.container, 'ol > li:last-child > button'); // click +

            expect(addedPlayer).not.toBeNull();
            expect(addedPlayer.player).toEqual(player);
            expect(addedPlayer.notes).toBeFalsy();
        });

        it('players not added when no player selected', async () => {
            await renderComponent({
                players: [],
                allPlayers: [player],
            });
            expect(reportedError).toBeNull();

            // no player selected
            await doClick(context.container, 'ol > li:last-child > button'); // click +

            expect(addedPlayer).toBeNull();
            expect(alert).toEqual('Ensure a player is selected first');
        });

        it('allows players to be added with notes', async () => {
            await renderComponent({
                players: [],
                allPlayers: [player],
                showNotes: true,
            });
            expect(reportedError).toBeNull();

            await doClick(context.container, 'ol > li:last-child button.dropdown-item:last-child'); // select first player
            doChange(context.container, 'ol > li:last-child > input[type="number"]', '100');
            await doClick(context.container, 'ol > li:last-child > button'); // click +

            expect(addedPlayer).not.toBeNull();
            expect(addedPlayer.player).toEqual(player);
            expect(addedPlayer.notes).toEqual('100');
        });

        it('players not added when notes are empty', async () => {
            await renderComponent({
                players: [],
                allPlayers: [player],
                showNotes: true,
            });
            expect(reportedError).toBeNull();

            await doClick(context.container, 'ol > li:last-child button.dropdown-item:last-child'); // select first player
            // notes not updated
            await doClick(context.container, 'ol > li:last-child > button'); // click +

            expect(addedPlayer).toBeNull();
            expect(alert).toEqual('Enter the score first');
        });

        it('allows players to be removed', async () => {
            await renderComponent({
                players: [player],
                allPlayers: [player],
                showNotes: false,
            });
            expect(reportedError).toBeNull();
            const selectedPlayer = getSelectedPlayers()[0];

            await doClick(selectedPlayer, 'button');

            expect(removedPlayer).not.toBeNull();
            expect(removedPlayer.id).toEqual(player.id);
        });
    });
});