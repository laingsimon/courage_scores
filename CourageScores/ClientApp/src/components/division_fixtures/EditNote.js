import React, {useState} from "react";
import {Dialog} from "../common/Dialog";
import {NoteApi} from "../../api/note";
import {Http} from "../../api/http";
import {Settings} from "../../api/settings";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {valueChanged} from "../../Utilities";

export function EditNote({ note, onNoteChanged, divisions, seasons, onClose, onSaved }) {
    const [savingNote, setSavingNote] = useState(false);
    const [saveError, setSaveError] = useState(null);

    async function saveNote() {
        if (savingNote) {
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
            const api = new NoteApi(new Http(new Settings()));
            const response = await api.upsert(note.id, note);

            if (response.success) {
                if (onSaved) {
                    await onSaved();
                }
            } else {
                setSaveError(response);
            }
        }
        finally {
            setSavingNote(false);
        }
    }

    return (<Dialog title={`${note.id ? 'Edit' : 'Create'} note`}>
        <div>
            <div className="input-group my-3">
                <div className="input-group-prepend">
                    <span className="input-group-text">Date</span>
                </div>
                <input type="date" value={note.date.substring(0, 10)} name="date" onChange={valueChanged(note, onNoteChanged)} />
            </div>
            <div className="form-group my-3 d-flex">
                <label htmlFor="note-text" className="input-group-text">Note</label>
                <textarea cols="75" rows="2" id="note-text" value={note.note} name="note" onChange={valueChanged(note, onNoteChanged)}></textarea>
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
        <div className="text-end">
            <button className="btn btn-primary margin-right" onClick={onClose}>Close</button>
            <button className="btn btn-primary margin-right" onClick={saveNote}>
                {savingNote ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                Save
            </button>
        </div>
    </Dialog>);
}