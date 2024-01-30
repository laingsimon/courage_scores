import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doClick,
    findButton,
    iocProps,
    renderApp,
    TestContext
} from "../../helpers/tests";
import React from "react";
import {FixtureDateNote, IFixtureDateNoteProps} from "./FixtureDateNote";
import {DivisionDataContainer} from "../DivisionDataContainer";
import {noteBuilder} from "../../helpers/builders/divisions";
import {IClientActionResultDto} from "../../interfaces/IClientActionResultDto";
import {IFixtureDateNoteDto} from "../../interfaces/models/dtos/IFixtureDateNoteDto";
import {IUserDto} from "../../interfaces/models/dtos/Identity/IUserDto";
import {createTemporaryId} from "../../helpers/projection";
import {INoteApi} from "../../interfaces/apis/NoteApi";

describe('FixtureDateNote', () => {
    let context: TestContext;
    let editNote: IFixtureDateNoteDto;
    let deletedNoteId: string;
    let deleteResult: IClientActionResultDto<IFixtureDateNoteDto>;

    const noteApi = api<INoteApi>({
        delete: async (id: string) => {
            deletedNoteId = id;
            return deleteResult || {success: true};
        }
    });

    async function setEditNote(note: IFixtureDateNoteDto) {
        editNote = note;
    }

    afterEach(() => {
        cleanUp(context);
    });

    beforeEach(() => {
        editNote = null;
        deletedNoteId = null;
    });

    async function onReloadDivision() {
        return null;
    }

    async function setDivisionData() {
        return null;
    }

    async function renderComponent(props: IFixtureDateNoteProps, account?: IUserDto) {
        context = await renderApp(
            iocProps({noteApi}),
            brandingProps(),
            appProps({
                account
            }),
            (<DivisionDataContainer onReloadDivision={onReloadDivision} name="" setDivisionData={setDivisionData} id={createTemporaryId()}>
                <FixtureDateNote {...props}/>
            </DivisionDataContainer>));
    }

    describe('renders', () => {
        it('when logged out', async () => {
            await renderComponent({
                note: noteBuilder().note('**some markdown**').build(),
                setEditNote,
            });

            const markdown = context.container.querySelector('p');
            expect(markdown).toBeTruthy();
            expect(markdown.textContent).toContain('some markdown');
        });

        it('when logged in, without ability to delete', async () => {
            const account: IUserDto = {
                givenName: '',
                name: '',
                emailAddress: '',
                access: {
                    manageNotes: true,
                }
            };
            await renderComponent({
                note: noteBuilder().note('**some markdown**').build(),
                preventDelete: true,
                setEditNote,
            },
            account);

            const buttons = Array.from(context.container.querySelectorAll('button'));
            expect(buttons.length).toEqual(1);
            expect(buttons[0].textContent).toEqual('Edit');
        });

        it('when logged in, with ability to delete', async () => {
            const account: IUserDto = {
                givenName: '',
                name: '',
                emailAddress: '',
                access: {
                    manageNotes: true,
                }
            };
            await renderComponent({
                note: noteBuilder().note('**some markdown**').build(),
                setEditNote
            },
            account);

            const buttons = Array.from(context.container.querySelectorAll('button'));
            expect(buttons.length).toEqual(2);
            expect(buttons[0].textContent).toEqual('');
            expect(buttons[0].className).toEqual('btn-close');
        });

        it('when logged in, without ability to edit', async () => {
            const account: IUserDto = {
                givenName: '',
                name: '',
                emailAddress: '',
                access: {
                    manageNotes: true,
                }
            };
            await renderComponent({
                note: noteBuilder().note('**some markdown**').build(),
                preventDelete: true,
            },
            account);

            const buttons = Array.from(context.container.querySelectorAll('button'));
            expect(buttons.length).toEqual(0);
        });
    });

    describe('interactivity', () => {
        it('can delete note', async () => {
            const account: IUserDto = {
                givenName: '',
                name: '',
                emailAddress: '',
                access: {
                    manageNotes: true,
                }
            };
            const note = noteBuilder().note('**some markdown**').build();
            await renderComponent({ note, setEditNote }, account);
            let confirm: string;
            window.confirm = (message) => {
                confirm = message;
                return true;
            }

            await doClick(context.container.querySelector('button.btn-close'));

            expect(confirm).toEqual('Are you sure you want to delete this note?');
            expect(deletedNoteId).toEqual(note.id);
        });

        it('prevents delete if user does not agree', async () => {
            const account: IUserDto = {
                givenName: '',
                name: '',
                emailAddress: '',
                access: {
                    manageNotes: true,
                }
            };
            const note = noteBuilder().note('**some markdown**').build();
            await renderComponent({ note, setEditNote }, account);
            let confirm: string;
            window.confirm = (message) => {
                confirm = message;
                return false;
            }

            await doClick(context.container.querySelector('button.btn-close'));

            expect(confirm).toEqual('Are you sure you want to delete this note?');
            expect(deletedNoteId).toBeNull();
        });

        it('alerts if unable to delete', async () => {
            const account: IUserDto = {
                givenName: '',
                name: '',
                emailAddress: '',
                access: {
                    manageNotes: true,
                }
            };
            const note = noteBuilder().note('**some markdown**').build();
            await renderComponent({ note, setEditNote }, account);
            let alert: string;
            window.confirm = () => true;
            window.alert = (message) => alert = message;
            deleteResult = {success: false};

            await doClick(context.container.querySelector('button.btn-close'));

            expect(alert).toEqual('Could not delete note');
        });

        it('can edit note', async () => {
            const account: IUserDto = {
                givenName: '',
                name: '',
                emailAddress: '',
                access: {
                    manageNotes: true,
                }
            };
            const note = noteBuilder().note('**some markdown**').build();
            await renderComponent({ note, setEditNote }, account);

            await doClick(findButton(context.container, 'Edit'));

            expect(editNote).toEqual(note);
        });
    });
});