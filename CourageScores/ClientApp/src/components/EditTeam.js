import React, { useState } from 'react';
import {Settings} from "../api/settings";
import {Http} from "../api/http";
import {TeamApi} from "../api/team";

export function EditTeam(props) {
    const [ name, setName ] = useState(props.name || '');
    const [ address, setAddress ] = useState(props.address || '');
    const [ saving, setSaving ] = useState(false);

    async function saveChanges() {
        if (saving) {
            return;
        }

        setSaving(true);

        try {
            const api = new TeamApi(new Http(new Settings()));
            const result = await api.update({
                id: props.id || undefined,
                name: name,
                address: address,
                divisionId: props.divisionId
            });

            if (result.success) {
                if (props.onChange) {
                    await props.onChange();
                }
            } else {
                alert('Team could not be created: ' + JSON.stringify(result));
            }
        } finally {
            setSaving(false);
        }
    }

    return (<div>
        <h4>Team details</h4>
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Name</span>
            </div>
            <input disabled={saving} type="text" className="form-control"
                   name="name" value={name} onChange={(event) => setName(event.target.value)}/>
        </div>
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Address</span>
            </div>
            <input disabled={saving} type="text" className="form-control"
                   name="address" value={address} onChange={(event) => setAddress(event.target.value)}/>
        </div>
        <button className="btn btn-primary margin-right" onClick={() => saveChanges()}>
            {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
            {props.id ? 'Save team' : 'Add team'}
        </button>
        <button className="btn btn-secondary" onClick={() => (props.onCancel || function() {})()}>Cancel</button>
    </div>)
}