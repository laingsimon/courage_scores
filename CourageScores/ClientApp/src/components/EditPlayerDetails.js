import React, { useState } from 'react';
import {Settings} from "../api/settings";
import {Http} from "../api/http";
import {PlayerApi} from "../api/player";
import {BootstrapDropdown} from "./BootstrapDropdown";

export function EditPlayerDetails({ id, name, captain, teamId, onSaved, onChange, onCancel, divisionData }) {
    const [ saving, setSaving ] = useState(false);

    async function saveChanges() {
        if (saving) {
            return;
        }

        if (!teamId) {
            window.alert('Please select a team');
            return;
        }
        if (!name) {
            window.alert('Please enter a name');
            return;
        }

        setSaving(true);

        try {
            const api = new PlayerApi(new Http(new Settings()));
            const result = id
                ? await api.update(teamId, id, { name: name, captain: captain })
                : await api.create(teamId, { name: name, captain: captain });

            if (result.success) {
                if (onSaved) {
                    await onSaved();
                }
            } else {
                alert(`Player could not be ${id ? 'created' : 'updated'}: ${JSON.stringify(result)}`);
            }
        } finally {
            setSaving(false);
        }
    }

    function valueChanged(event) {
        if (onChange) {
            if (event.target.type === 'checkbox') {
                onChange(event.target.name, event.target.checked);
                return;
            }

            onChange(event.target.name, event.target.value);
        }
    }

    return (<div>
        <h4>Player details</h4>
        {id ? null : (<div className="input-group mb-3">
                <div className="input-group-prepend">
                    <span className="input-group-text">Team</span>
                </div>
                <BootstrapDropdown
                    onChange={value => onChange('teamId', value)} value={teamId || ''}
                    options={[{ value: '', text: 'Select team' }].concat(divisionData.teams.map(t => { return { value: t.id, text: t.name } }))} />
            </div>
        )}
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Name</span>
            </div>
            <input disabled={saving} type="text" className="form-control"
                   name="name" value={name || ''} onChange={valueChanged}/>
        </div>
        <div className="input-group mb-3">
            <div className="form-check form-switch margin-right">
                <input disabled={saving} type="checkbox"
                   name="captain" id="captain" checked={captain || false} onChange={valueChanged} className="form-check-input" />
                <label className="form-check-label" htmlFor="captain">Captain</label>
            </div>
        </div>
        <button className="btn btn-primary margin-right" onClick={() => saveChanges()}>
            {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
            {id ? 'Save player' : 'Add player'}
        </button>
        <button className="btn btn-secondary" onClick={() => (onCancel || function() {})()}>Cancel</button>
    </div>)
}
