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
import {FixtureDateNote, IFixtureDateNoteProps} from "./FixtureDateNote";
import {DivisionDataContainer} from "../league/DivisionDataContainer";
import {noteBuilder} from "../../helpers/builders/divisions";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {FixtureDateNoteDto} from "../../interfaces/models/dtos/FixtureDateNoteDto";
import {UserDto} from "../../interfaces/models/dtos/Identity/UserDto";
import {createTemporaryId} from "../../helpers/projection";
import {INoteApi} from "../../interfaces/apis/INoteApi";

describe('FixtureDateNote', () => {
    let context: TestContext;
    let editNote: FixtureDateNoteDto | null;
    let deletedNoteId: string | null;
    let deleteResult: IClientActionResultDto<FixtureDateNoteDto> | null;

    const noteApi = api<INoteApi>({
        delete: async (id: string) => {
            deletedNoteId = id;
            return deleteResult || {success: true};
        }
    });

    async function setEditNote(note: FixtureDateNoteDto) {
        editNote = note;
    }

    afterEach(async () => {
        await cleanUp(context);
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

    async function renderComponent(props: IFixtureDateNoteProps, account?: UserDto) {
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

            const markdown = context.container.querySelector('p')!;
            expect(markdown).toBeTruthy();
            expect(markdown.textContent).toContain('some markdown');
        });

        it('when logged in, without ability to delete', async () => {
            const account: UserDto = {
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
            const account: UserDto = {
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
            const account: UserDto = {
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
            const account: UserDto = {
                givenName: '',
                name: '',
                emailAddress: '',
                access: {
                    manageNotes: true,
                }
            };
            const note = noteBuilder().note('**some markdown**').build();
            await renderComponent({ note, setEditNote }, account);
            let confirm: string | undefined;
            window.confirm = (message: string | undefined) => {
                confirm = message;
                return true;
            }

            await doClick(context.container.querySelector('button.btn-close')!);

            expect(confirm).toEqual('Are you sure you want to delete this note?');
            expect(deletedNoteId).toEqual(note.id);
        });

        it('prevents delete if user does not agree', async () => {
            const account: UserDto = {
                givenName: '',
                name: '',
                emailAddress: '',
                access: {
                    manageNotes: true,
                }
            };
            const note = noteBuilder().note('**some markdown**').build();
            await renderComponent({ note, setEditNote }, account);
            let confirm: string | undefined;
            window.confirm = (message: string | undefined) => {
                confirm = message;
                return false;
            }

            await doClick(context.container.querySelector('button.btn-close')!);

            expect(confirm).toEqual('Are you sure you want to delete this note?');
            expect(deletedNoteId).toBeNull();
        });

        it('alerts if unable to delete', async () => {
            const account: UserDto = {
                givenName: '',
                name: '',
                emailAddress: '',
                access: {
                    manageNotes: true,
                }
            };
            const note = noteBuilder().note('**some markdown**').build();
            await renderComponent({ note, setEditNote }, account);
            let alert: string | undefined;
            window.confirm = () => true;
            window.alert = (message: string) => alert = message;
            deleteResult = {success: false};

            await doClick(context.container.querySelector('button.btn-close')!);

            expect(alert).toEqual('Could not delete note');
        });

        it('can edit note', async () => {
            const account: UserDto = {
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