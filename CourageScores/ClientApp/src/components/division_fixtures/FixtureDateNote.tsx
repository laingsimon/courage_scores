import { useState } from 'react';
import { useDependencies } from '../common/IocContainer';
import { useDivisionData } from '../league/DivisionDataContainer';
import { useApp } from '../common/AppContainer';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { FixtureDateNoteDto } from '../../interfaces/models/dtos/FixtureDateNoteDto';
import { EditFixtureDateNoteDto } from '../../interfaces/models/dtos/EditFixtureDateNoteDto';
import { UntypedPromise } from '../../interfaces/UntypedPromise';
import { hasAccess } from '../../helpers/conditions';
import { renderDate } from '../../helpers/rendering';

export interface IFixtureDateNoteProps {
    note: EditFixtureDateNoteDto;
    setEditNote?(note: EditFixtureDateNoteDto): UntypedPromise;
    preventDelete?: boolean;
}

export function FixtureDateNote({
    note,
    setEditNote,
    preventDelete,
}: IFixtureDateNoteProps) {
    const { onReloadDivision, season } = useDivisionData();
    const { account, onError } = useApp();
    const { noteApi } = useDependencies();
    const [deletingNote, setDeletingNote] = useState<boolean>(false);
    const isNoteAdmin: boolean = hasAccess(
        account,
        (access) => access.manageNotes,
    );
    const isOutOfSeason =
        season &&
        note.date &&
        (note.date < season.startDate || note.date > season.endDate);

    async function deleteNote() {
        /* istanbul ignore next */
        if (deletingNote) {
            /* istanbul ignore next */
            return;
        }

        if (!window.confirm('Are you sure you want to delete this note?')) {
            return;
        }

        setDeletingNote(true);
        try {
            const response: IClientActionResultDto<FixtureDateNoteDto> =
                await noteApi.delete(note.id!);

            if (response.success) {
                await onReloadDivision();
            } else {
                alert('Could not delete note');
            }
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setDeletingNote(false);
        }
    }

    return (
        <div
            className={`alert ${isNoteAdmin && isOutOfSeason ? 'alert-danger' : 'alert-warning'} alert-dismissible fade show pb-0 mb-1`}
            role="alert"
            key={note.id}>
            <span className="margin-right float-start">📌</span>
            <Markdown remarkPlugins={[remarkGfm]}>{note.note}</Markdown>
            {isNoteAdmin && isOutOfSeason ? (
                <div className="text-danger">
                    This note is for a date outside of the season dates (
                    {renderDate(season?.startDate)} -{' '}
                    {renderDate(season?.endDate)}).
                    <br />
                    ⚠️ No fixtures will be shown until the season dates are
                    updated.
                </div>
            ) : null}
            {isNoteAdmin && !preventDelete && note.id ? (
                <button
                    type="button"
                    className="btn-close"
                    data-dismiss="alert"
                    aria-label="Close"
                    onClick={deleteNote}></button>
            ) : null}
            {isNoteAdmin && setEditNote && note.id ? (
                <div className="mt-2 mb-3">
                    <button
                        className="btn btn-sm btn-primary margin-right"
                        onClick={async () => await setEditNote(note)}>
                        Edit
                    </button>
                </div>
            ) : null}
        </div>
    );
}
