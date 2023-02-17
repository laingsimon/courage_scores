import React, { useState } from 'react';
import {Settings} from "../../api/settings";
import {Http} from "../../api/http";
import {TeamApi} from "../../api/team";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {BootstrapDropdown} from "../common/BootstrapDropdown";

export function EditTeamDetails({ id, name, address, divisionId, onSaved, onChange, onCancel, seasonId, newDivisionId, divisions }) {
    const noDivision = { value: '00000000-0000-0000-0000-000000000000', text: 'Remove from division' };
    const [ saving, setSaving ] = useState(false);
    const [ saveError, setSaveError ] = useState(null);
    const divisionOptions = divisions.map(division => { return { value: division.id, text: division.name }; });

    async function saveChanges() {
        if (saving) {
            return;
        }

        setSaving(true);

        try {
            const api = new TeamApi(new Http(new Settings()));
            const response = await api.update({
                id: id || undefined,
                name: name,
                address: address,
                divisionId: divisionId,
                seasonId: seasonId,
                newDivisionId: newDivisionId
            });

            if (response.success) {
                if (onSaved) {
                    await onSaved(response.result);
                }
            } else {
                setSaveError(response);
            }
        } finally {
            setSaving(false);
        }
    }

    async function valueChanged(event) {
        if (onChange) {
            await onChange(event.target.name, event.target.value);
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
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Division</span>
            </div>
            <BootstrapDropdown 
                options={divisionOptions.concat([ noDivision ])}
                value={newDivisionId}
                onChange={(newDivisionId) => onChange('newDivisionId', newDivisionId)} />
        </div>
        <button className="btn btn-primary margin-right" onClick={() => saveChanges()}>
            {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
            {id ? 'Save team' : 'Add team'}
        </button>
        <button className="btn btn-secondary" onClick={async () => onCancel ? await onCancel() : null}>Cancel</button>
        {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save team details" />) : null}
    </div>)
}
