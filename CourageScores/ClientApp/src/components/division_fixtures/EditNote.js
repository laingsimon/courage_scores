import React, {useState} from "react";
import {Dialog} from "../common/Dialog";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {valueChanged} from "../../helpers/events";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";
import {FixtureDateNote} from "./FixtureDateNote";

export function EditNote({ note, onNoteChanged, onClose, onSaved }) {
    const [savingNote, setSavingNote] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const { noteApi } = useDependencies();
    const { divisions, seasons, onError } = useApp();

    async function saveNote() {
        /* istanbul ignore next */
        if (savingNote) {
            /* istanbul ignore next */
            return;
        }

        if (!note.note) {
            window.alert('You must enter a note');
            return;
        }

        if (!note.date) {
            window.alert('You must enter a date');
            return;
        }

        setSavingNote(true);
        try{
            const response = note.id
                ? await noteApi.upsert(note.id, note, note.updated)
                : await noteApi.create(note);

            if (response.success) {
                if (onSaved) {
                    await onSaved();
                }
            } else {
                setSaveError(response);
            }
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setSavingNote(false);
        }
    }

    return (<Dialog title={`${note.id ? 'Edit' : 'Create'} note`}>
        <div>
            <div className="input-group my-3">
                <div className="input-group-prepend">
                    <span className="input-group-text">Date</span>
                </div>
                <input type="date" className="form-control" value={note.date.substring(0, 10)} name="date" onChange={valueChanged(note, onNoteChanged)} />
            </div>
            <div className="form-group my-3 d-flex">
                <label htmlFor="note-text" className="input-group-text">Note</label>
                <textarea cols="75" rows="2" id="note-text" value={note.note} name="note" onChange={valueChanged(note, onNoteChanged)}></textarea>
            </div>
            <div className="form-group my-3">
                <h5>Preview</h5>
                <div>
                    <FixtureDateNote note={ note } preventDelete={true} />
                </div>
            </div>
            <div className="input-group my-3">
                <div className="input-group-prepend">
                    <span className="input-group-text">Season</span>
                </div>
                <select value={note.seasonId} name="seasonId" onChange={valueChanged(note, onNoteChanged)}>
                    {seasons.map(season => <option value={season.id} key={season.id}>{season.name}</option>)}
                </select>
            </div>
            <div className="input-group my-3">
                <div className="input-group-prepend">
                    <span className="input-group-text">Division (optional)</span>
                </div>
                <select value={note.divisionId || 'NULL'} name="divisionId" onChange={valueChanged(note, onNoteChanged, 'NULL')}>
                    <option key="" value={'NULL'}>All divisions</option>
                    {divisions.map(division => (<option key={division.id} value={division.id}>{division.name}</option>))}
                </select>
            </div>
            {saveError
                ? (<ErrorDisplay
                    {...saveError}
                    onClose={() => setSaveError(null)}
                    title="Could not save note" />)
                : null}
        </div>
        <div className="modal-footer px-0 pb-0">
            <div className="left-aligned">
                <button className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
            <button className="btn btn-primary" onClick={saveNote}>
                {savingNote ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                Save
            </button>
        </div>
    </Dialog>);
}