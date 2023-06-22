import React, {useState} from "react";
import {useDependencies} from "../../IocContainer";
import {useDivisionData} from "../DivisionDataContainer";
import {useApp} from "../../AppContainer";
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';

export function FixtureDateNote({ note, setEditNote, preventDelete }) {
    const { onReloadDivision } = useDivisionData();
    const { account, onError } = useApp();
    const { noteApi } = useDependencies();
    const [ deletingNote, setDeletingNote ] = useState(false);
    const isNoteAdmin = account && account.access && account.access.manageNotes;

    async function deleteNote(note) {
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
            const response = await noteApi.delete(note.id);

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

    return (<div className="alert alert-warning alert-dismissible fade show" role="alert" key={note.id}>
        <span className="margin-right">📌</span>
        <ReactMarkdown remarkPlugins={[gfm]}>{note.note}</ReactMarkdown>
        {isNoteAdmin && !preventDelete ? (<button type="button" className="btn-close" data-dismiss="alert" aria-label="Close" onClick={() => deleteNote(note)}></button>) : null}
        {isNoteAdmin && setEditNote ? (<div className="mt-2">
            <button className="btn btn-sm btn-primary margin-right" onClick={() => setEditNote(note)}>Edit</button>
        </div>) : null}
    </div>);
}