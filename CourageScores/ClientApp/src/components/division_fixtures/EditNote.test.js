// noinspection JSUnresolvedFunction

import {cleanUp, renderApp, doChange, doClick} from "../../tests/helpers";
import {createTemporaryId} from "../../helpers/projection";
import React from "react";
import {EditNote} from "./EditNote";

describe('EditNote', () => {
    let context;
    let reportedError;
    let savedNote;
    let createdNote;
    let changedNote;
    let closed;
    let saved;
    let saveResult;

    const noteApi = {
        create: async (note) => {
            createdNote = note;
            return saveResult || { success: true };
        },
        upsert: async (id, note, lastUpdated) => {
            savedNote = { id, note, lastUpdated };
            return saveResult || { success: true };
        },
    }

    function onNoteChanged(note) {
        changedNote = note;
    }
    function onClose() {
        closed = true;
    }
    function onSaved() {
        saved = true;
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(note, divisions, seasons) {
        reportedError = null;
        savedNote = null;
        changedNote = null;
        createdNote = null;
        closed = false;
        saved = false;
        context = await renderApp(
            { noteApi },
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                divisions,
                seasons
            },
            (<EditNote note={note} onNoteChanged={onNoteChanged} onClose={onClose} onSaved={onSaved} />));
    }

    describe('renders', () => {
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
        };
        const division = {
            id: createTemporaryId(),
            name: 'DIVISION',
        }
        const divisions = [division];
        const seasons = [season];

        it('when editing', async () => {
            await renderComponent({
                id: createTemporaryId(),
                date: '2023-05-01T00:00:00',
                note: 'Some note',
                seasonId: season.id,
                divisionId: null,
            }, divisions, seasons);

            const header = context.container.querySelector('.modal-header');
            expect(header).toBeTruthy();
            expect(header.textContent).toContain('Edit note');
        });

        it('when creating', async () => {
            await renderComponent({
                date: '2023-05-01T00:00:00',
                note: 'Some note',
                seasonId: season.id,
                divisionId: null,
            }, divisions, seasons);

            const header = context.container.querySelector('.modal-header');
            expect(header).toBeTruthy();
            expect(header.textContent).toContain('Create note');
        });

        it('date', async () => {
            await renderComponent({
                id: createTemporaryId(),
                date: '2023-05-01T00:00:00',
                note: 'Some note',
                seasonId: season.id,
                divisionId: null,
            }, divisions, seasons);

            const dateGroup = context.container.querySelector('.modal-body > div > div:nth-child(1)');
            expect(dateGroup).toBeTruthy();
            expect(dateGroup.textContent).toContain('Date');
            const dateInput = dateGroup.querySelector('input');
            expect(dateInput).toBeTruthy();
            expect(dateInput.value).toEqual('2023-05-01');
        });

        it('note', async () => {
            await renderComponent({
                id: createTemporaryId(),
                date: '2023-05-01T00:00:00',
                note: 'Some note',
                seasonId: season.id,
                divisionId: null,
            }, divisions, seasons);

            const noteGroup = context.container.querySelector('.modal-body > div > div:nth-child(2)');
            expect(noteGroup).toBeTruthy();
            expect(noteGroup.textContent).toContain('Note');
            const noteInput = noteGroup.querySelector('textarea');
            expect(noteInput).toBeTruthy();
            expect(noteInput.value).toEqual('Some note');
        });

        it('preview', async () => {
            await renderComponent({
                id: createTemporaryId(),
                date: '2023-05-01T00:00:00',
                note: '**Some** note',
                seasonId: season.id,
                divisionId: null,
            }, divisions, seasons);

            const previewGroup = context.container.querySelector('.modal-body > div > div:nth-child(3)');
            expect(previewGroup).toBeTruthy();
            expect(previewGroup.textContent).toContain('Preview');
            expect(previewGroup.querySelector('div > div.alert > p').innerHTML).toEqual('<strong>Some</strong> note');
        });

        it('season', async () => {
            await renderComponent({
                id: createTemporaryId(),
                date: '2023-05-01T00:00:00',
                note: 'Some note',
                seasonId: season.id,
                divisionId: null,
            }, divisions, seasons);

            const seasonGroup = context.container.querySelector('.modal-body > div > div:nth-child(4)');
            expect(seasonGroup).toBeTruthy();
            expect(seasonGroup.textContent).toContain('Season');
            const seasonInput = seasonGroup.querySelector('select');
            expect(seasonInput).toBeTruthy();
            expect(seasonInput.value).toEqual(season.id);
        });

        it('division', async () => {
            await renderComponent({
                id: createTemporaryId(),
                date: '2023-05-01T00:00:00',
                note: 'Some note',
                seasonId: season.id,
                divisionId: division.id,
            }, divisions, seasons);

            const divisionGroup = context.container.querySelector('.modal-body > div > div:nth-child(5)');
            expect(divisionGroup).toBeTruthy();
            expect(divisionGroup.textContent).toContain('Division');
            const divisionInput = divisionGroup.querySelector('select');
            expect(divisionInput).toBeTruthy();
            expect(divisionInput.value).toEqual(division.id);
        });

        it('all divisions', async () => {
            await renderComponent({
                id: createTemporaryId(),
                date: '2023-05-01T00:00:00',
                note: 'Some note',
                seasonId: season.id,
                divisionId: null,
            }, divisions, seasons);

            const divisionGroup = context.container.querySelector('.modal-body > div > div:nth-child(5)');
            expect(divisionGroup).toBeTruthy();
            expect(divisionGroup.textContent).toContain('Division');
            const divisionInput = divisionGroup.querySelector('select');
            expect(divisionInput).toBeTruthy();
            expect(divisionInput.value).toEqual('NULL');
        });
    });

    describe('interactivity', () => {
        const season = {
            id: createTemporaryId(),
            name: 'SEASON',
        };
        const division = {
            id: createTemporaryId(),
            name: 'DIVISION',
        }
        const divisions = [division];
        const seasons = [season];
        let alert;

        window.alert = (message) => alert = message;

        it('can change date', async () => {
            await renderComponent({
                id: createTemporaryId(),
                date: '2023-05-01T00:00:00',
                note: 'Some note',
                seasonId: season.id,
                divisionId: null,
            }, divisions, seasons);
            const dateGroup = context.container.querySelector('.modal-body > div > div:nth-child(1)');

            doChange(dateGroup, 'input', '2023-06-06');

            expect(changedNote).toBeTruthy();
            expect(changedNote.date).toEqual('2023-06-06');
        });

        it('can change note', async () => {
            await renderComponent({
                id: createTemporaryId(),
                date: '2023-05-01T00:00:00',
                note: 'Some note',
                seasonId: season.id,
                divisionId: null,
            }, divisions, seasons);
            const noteGroup = context.container.querySelector('.modal-body > div > div:nth-child(2)');

            doChange(noteGroup, 'textarea', 'Another note');

            expect(changedNote).toBeTruthy();
            expect(changedNote.note).toEqual('Another note');
        });

        it('can change season', async () => {
            const anotherSeason = {
                id: createTemporaryId(),
                name: 'ANOTHER SEASON',
            };
            await renderComponent({
                id: createTemporaryId(),
                date: '2023-05-01T00:00:00',
                note: 'Some note',
                seasonId: season.id,
                divisionId: null,
            }, divisions, [ season, anotherSeason ]);
            const seasonGroup = context.container.querySelector('.modal-body > div > div:nth-child(4)');

            doChange(seasonGroup, 'select', anotherSeason.id);

            expect(changedNote).toBeTruthy();
            expect(changedNote.seasonId).toEqual(anotherSeason.id);
        });

        it('can change division', async () => {
            const anotherDivision = {
                id: createTemporaryId(),
                name: 'ANOTHER DIVISION',
            };
            await renderComponent({
                id: createTemporaryId(),
                date: '2023-05-01T00:00:00',
                note: 'Some note',
                seasonId: season.id,
                divisionId: null,
            }, [ division, anotherDivision ], seasons);
            const divisionGroup = context.container.querySelector('.modal-body > div > div:nth-child(5)');

            doChange(divisionGroup, 'select', anotherDivision.id);

            expect(changedNote).toBeTruthy();
            expect(changedNote.divisionId).toEqual(anotherDivision.id);
        });

        it('can change to all divisions', async () => {
            await renderComponent({
                id: createTemporaryId(),
                date: '2023-05-01T00:00:00',
                note: 'Some note',
                seasonId: season.id,
                divisionId: null,
            }, divisions, seasons);
            const divisionGroup = context.container.querySelector('.modal-body > div > div:nth-child(5)');

            doChange(divisionGroup, 'select', 'NULL');

            expect(changedNote).toBeTruthy();
            expect(changedNote.divisionId).toEqual(null);
        });

        it('cannot save when no note', async () => {
            await renderComponent({
                id: createTemporaryId(),
                date: '2023-05-01T00:00:00',
                note: '',
                seasonId: season.id,
                divisionId: null,
            }, divisions, seasons);
            const saveButton = context.container.querySelector('.modal-body > div:last-child > button:last-child');
            expect(saveButton).toBeTruthy();
            expect(saveButton.textContent).toEqual('Save');
            alert = null;

            await doClick(saveButton);

            expect(alert).toEqual('You must enter a note');
            expect(savedNote).toBeNull();
        });

        it('cannot save when no date', async () => {
            await renderComponent({
                id: createTemporaryId(),
                date: '',
                note: 'Some note',
                seasonId: season.id,
                divisionId: null,
            }, divisions, seasons);
            const saveButton = context.container.querySelector('.modal-body > div:last-child > button:last-child');
            expect(saveButton).toBeTruthy();
            expect(saveButton.textContent).toEqual('Save');
            alert = null;

            await doClick(saveButton);

            expect(alert).toEqual('You must enter a date');
            expect(savedNote).toBeNull();
        });

        it('can save changes', async () => {
            await renderComponent({
                id: createTemporaryId(),
                date: '2023-05-01T00:00:00',
                note: 'Some note',
                seasonId: season.id,
                divisionId: null,
                updated: '2023-07-01T00:00:00',
            }, divisions, seasons);
            const saveButton = context.container.querySelector('.modal-body > div:last-child > button:last-child');
            expect(saveButton).toBeTruthy();
            expect(saveButton.textContent).toEqual('Save');
            alert = null;

            await doClick(saveButton);

            expect(alert).toBeNull();
            expect(savedNote).not.toBeNull();
            expect(savedNote.lastUpdated).toEqual('2023-07-01T00:00:00');
            expect(saved).toEqual(true);
        });

        it('shows error if unable to save', async () => {
            await renderComponent({
                id: createTemporaryId(),
                date: '2023-05-01T00:00:00',
                note: 'Some note',
                seasonId: season.id,
                divisionId: null,
            }, divisions, seasons);
            const saveButton = context.container.querySelector('.modal-body > div:last-child > button:last-child');
            expect(saveButton).toBeTruthy();
            expect(saveButton.textContent).toEqual('Save');
            alert = null;
            saveResult = {
                success: false,
            }

            await doClick(saveButton);

            expect(alert).toBeNull();
            expect(savedNote).not.toBeNull();
            expect(saved).toEqual(false);
        });

        it('can close dialog', async () => {
            await renderComponent({
                id: createTemporaryId(),
                date: '2023-05-01T00:00:00',
                note: 'Some note',
                seasonId: season.id,
                divisionId: null,
            }, divisions, seasons);
            const closeButton = context.container.querySelector('.modal-body > div:last-child > button:first-child');
            expect(closeButton).toBeTruthy();
            expect(closeButton.textContent).toEqual('Close');

            await doClick(closeButton);

            expect(closed).toEqual(true);
        });
    });
});