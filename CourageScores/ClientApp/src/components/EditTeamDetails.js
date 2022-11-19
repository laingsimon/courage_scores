import React, { useState } from 'react';
import {Settings} from "../api/settings";
import {Http} from "../api/http";
import {TeamApi} from "../api/team";

export function EditTeamDetails({ id, name, address, divisionId, onSaved, onChange, onCancel, seasonId }) {
    const [ saving, setSaving ] = useState(false);

    async function saveChanges() {
        if (saving) {
            return;
        }

        setSaving(true);

        try {
            const api = new TeamApi(new Http(new Settings()));
            const result = await api.update({
                id: id || undefined,
                name: name,
                address: address,
                divisionId: divisionId,
                seasonId: seasonId
            });

            if (result.success) {
                if (onSaved) {
                    await onSaved();
                }
            } else {
                alert(`Team could not be ${id ? 'created' : 'updated'}: ${JSON.stringify(result)}`);
            }
        } finally {
            setSaving(false);
        }
    }

    function valueChanged(event) {
        if (onChange) {
            onChange(event.target.name, event.target.value);
        }
    }

    return (<div>
        <h4>Team details</h4>
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Name</span>
            </div>
            <input disabled={saving} type="text" className="form-control"
                   name="name" value={name} onChange={valueChanged}/>
        </div>
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Address</span>
            </div>
            <input disabled={saving} type="text" className="form-control"
                   name="address" value={address} onChange={valueChanged}/>
        </div>
        <button className="btn btn-primary margin-right" onClick={() => saveChanges()}>
            {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
            {id ? 'Save team' : 'Add team'}
        </button>
        <button className="btn btn-secondary" onClick={() => (onCancel || function() {})()}>Cancel</button>
    </div>)
}
