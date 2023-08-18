﻿// noinspection JSUnresolvedFunction

import {cleanUp, doClick, findButton, renderApp} from "../../helpers/tests";
import React from "react";
import {FixtureDateNote} from "./FixtureDateNote";
import {DivisionDataContainer} from "../DivisionDataContainer";
import {noteBuilder} from "../../helpers/builders";

describe('FixtureDateNote', () => {
    let context;
    let reportedError;
    let editNote;
    let divisionReloaded;
    let deletedNoteId;
    let deleteResult;

    const noteApi = {
        delete: async (id) => {
            deletedNoteId = id;
            return deleteResult || {success: true};
        }
    }

    function setEditNote(note) {
        editNote = note;
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(note, preventDelete, account, setEditNote) {
        reportedError = null;
        editNote = null;
        deletedNoteId = null;
        divisionReloaded = false;
        context = await renderApp(
            {noteApi},
            {name: 'Courage Scores'},
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
                account
            },
            (<DivisionDataContainer onReloadDivision={() => divisionReloaded = true}>
                <FixtureDateNote note={note} preventDelete={preventDelete} setEditNote={setEditNote}/>
            </DivisionDataContainer>));
    }

    describe('renders', () => {
        it('when logged out', async () => {
            await renderComponent(noteBuilder().note('**some markdown**').build());

            const markdown = context.container.querySelector('p');
            expect(markdown).toBeTruthy();
            expect(markdown.textContent).toContain('some markdown');
        });

        it('when logged in, without ability to delete', async () => {
            const account = {
                access: {
                    manageNotes: true,
                }
            };
            await renderComponent(
                noteBuilder().note('**some markdown**').build(),
                true,
                account,
                setEditNote);

            const buttons = Array.from(context.container.querySelectorAll('button'));
            expect(buttons.length).toEqual(1);
            expect(buttons[0].textContent).toEqual('Edit');
        });

        it('when logged in, with ability to delete', async () => {
            const account = {
                access: {
                    manageNotes: true,
                }
            };
            await renderComponent(
                noteBuilder().note('**some markdown**').build(),
                false,
                account,
                setEditNote);

            const buttons = Array.from(context.container.querySelectorAll('button'));
            expect(buttons.length).toEqual(2);
            expect(buttons[0].textContent).toEqual('');
            expect(buttons[0].className).toEqual('btn-close');
        });

        it('when logged in, without ability to edit', async () => {
            const account = {
                access: {
                    manageNotes: true,
                }
            };
            await renderComponent(
                noteBuilder().note('**some markdown**').build(),
                true,
                account,
                null);

            const buttons = Array.from(context.container.querySelectorAll('button'));
            expect(buttons.length).toEqual(0);
        });
    });

    describe('interactivity', () => {
        it('can delete note', async () => {
            const account = {
                access: {
                    manageNotes: true,
                }
            };
            const note = noteBuilder().note('**some markdown**').build();
            await renderComponent(note, false, account, setEditNote);
            let confirm;
            window.confirm = (message) => {
                confirm = message;
                return true;
            }

            await doClick(context.container.querySelector('button.btn-close'));

            expect(confirm).toEqual('Are you sure you want to delete this note?');
            expect(deletedNoteId).toEqual(note.id);
        });

        it('prevents delete if user does not agree', async () => {
            const account = {
                access: {
                    manageNotes: true,
                }
            };
            const note = noteBuilder().note('**some markdown**').build();
            await renderComponent(note, false, account, setEditNote);
            let confirm;
            window.confirm = (message) => {
                confirm = message;
                return false;
            }

            await doClick(context.container.querySelector('button.btn-close'));

            expect(confirm).toEqual('Are you sure you want to delete this note?');
            expect(deletedNoteId).toBeNull();
        });

        it('alerts if unable to delete', async () => {
            const account = {
                access: {
                    manageNotes: true,
                }
            };
            const note = noteBuilder().note('**some markdown**').build();
            await renderComponent(note, false, account, setEditNote);
            let alert;
            window.confirm = () => true;
            window.alert = (message) => alert = message;
            deleteResult = {success: false};

            await doClick(context.container.querySelector('button.btn-close'));

            expect(alert).toEqual('Could not delete note');
        });

        it('can edit note', async () => {
            const account = {
                access: {
                    manageNotes: true,
                }
            };
            const note = noteBuilder().note('**some markdown**').build();
            await renderComponent(note, false, account, setEditNote);

            await doClick(findButton(context.container, 'Edit'));

            expect(editNote).toEqual(note);
        });
    });
});