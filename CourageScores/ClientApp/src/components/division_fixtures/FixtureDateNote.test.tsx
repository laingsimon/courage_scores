import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    iocProps,
    renderApp,
    TestContext,
    user,
} from '../../helpers/tests.tsx';
import { FixtureDateNote, IFixtureDateNoteProps } from './FixtureDateNote.tsx';
import { DivisionDataContainer } from '../league/DivisionDataContainer.tsx';
import { noteBuilder } from '../../helpers/builders/divisions.ts';
import { IClientActionResultDto } from '../common/IClientActionResultDto.ts';
import { FixtureDateNoteDto } from '../../interfaces/models/dtos/FixtureDateNoteDto.ts';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto.ts';
import { createTemporaryId } from '../../helpers/projection.ts';
import { INoteApi } from '../../interfaces/apis/INoteApi.ts';

describe('FixtureDateNote', () => {
    let context: TestContext;
    let editNote: FixtureDateNoteDto | null;
    let deletedNoteId: string | null;
    let deleteResult: IClientActionResultDto<FixtureDateNoteDto> | null;

    const noteApi = api<INoteApi>({
        delete: async (id: string) => {
            deletedNoteId = id;
            return deleteResult || { success: true };
        },
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

    async function renderComponent(
        props: IFixtureDateNoteProps,
        account?: UserDto,
    ) {
        context = await renderApp(
            iocProps({ noteApi }),
            brandingProps(),
            appProps({
                account,
            }),
            <DivisionDataContainer
                onReloadDivision={onReloadDivision}
                name=""
                setDivisionData={setDivisionData}
                id={createTemporaryId()}>
                <FixtureDateNote {...props} />
            </DivisionDataContainer>,
        );
    }

    describe('renders', () => {
        it('when logged out', async () => {
            await renderComponent({
                note: noteBuilder().note('**some markdown**').build(),
                setEditNote,
            });

            const markdown = context.required('p');
            expect(markdown.text()).toContain('some markdown');
        });

        it('when logged in, without ability to delete', async () => {
            const account = user({
                manageNotes: true,
            });
            await renderComponent(
                {
                    note: noteBuilder().note('**some markdown**').build(),
                    preventDelete: true,
                    setEditNote,
                },
                account,
            );

            const buttons = context.all('button');
            expect(buttons.length).toEqual(1);
            expect(buttons[0].text()).toEqual('Edit');
        });

        it('when logged in, with ability to delete', async () => {
            const account = user({
                manageNotes: true,
            });
            await renderComponent(
                {
                    note: noteBuilder().note('**some markdown**').build(),
                    setEditNote,
                },
                account,
            );

            const buttons = context.all('button');
            expect(buttons.length).toEqual(2);
            expect(buttons[0].text()).toEqual('');
            expect(buttons[0].className()).toEqual('btn-close');
        });

        it('when logged in, without ability to edit', async () => {
            const account = user({
                manageNotes: true,
            });
            await renderComponent(
                {
                    note: noteBuilder().note('**some markdown**').build(),
                    preventDelete: true,
                },
                account,
            );

            const buttons = context.all('button');
            expect(buttons.length).toEqual(0);
        });
    });

    describe('interactivity', () => {
        it('can delete note', async () => {
            const account = user({
                manageNotes: true,
            });
            const note = noteBuilder().note('**some markdown**').build();
            await renderComponent({ note, setEditNote }, account);
            context.prompts.respondToConfirm(
                'Are you sure you want to delete this note?',
                true,
            );

            await context.required('button.btn-close').click();

            context.prompts.confirmWasShown(
                'Are you sure you want to delete this note?',
            );
            expect(deletedNoteId).toEqual(note.id);
        });

        it('prevents delete if user does not agree', async () => {
            const account = user({
                manageNotes: true,
            });
            const note = noteBuilder().note('**some markdown**').build();
            await renderComponent({ note, setEditNote }, account);
            context.prompts.respondToConfirm(
                'Are you sure you want to delete this note?',
                false,
            );

            await context.required('button.btn-close').click();

            context.prompts.confirmWasShown(
                'Are you sure you want to delete this note?',
            );
            expect(deletedNoteId).toBeNull();
        });

        it('alerts if unable to delete', async () => {
            const account = user({
                manageNotes: true,
            });
            const note = noteBuilder().note('**some markdown**').build();
            await renderComponent({ note, setEditNote }, account);
            deleteResult = { success: false };
            context.prompts.respondToConfirm(
                'Are you sure you want to delete this note?',
                true,
            );

            await context.required('button.btn-close').click();

            context.prompts.alertWasShown('Could not delete note');
        });

        it('can edit note', async () => {
            const account = user({
                manageNotes: true,
            });
            const note = noteBuilder().note('**some markdown**').build();
            await renderComponent({ note, setEditNote }, account);

            await context.button('Edit').click();

            expect(editNote).toEqual(note);
        });
    });
});
