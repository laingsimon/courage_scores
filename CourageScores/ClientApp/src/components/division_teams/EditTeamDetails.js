import React, { useState } from 'react';
import {ErrorDisplay} from "../common/ErrorDisplay";
import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";

export function EditTeamDetails({ divisionId, onSaved, onChange, onCancel, seasonId, team }) {

    const { divisions } = useApp();
    const { teamApi } = useDependencies();
    const [ saving, setSaving ] = useState(false);
    const [ saveError, setSaveError ] = useState(null);
    const divisionOptions = divisions.map(division => { return { value: division.id, text: division.name }; });

    async function saveChanges() {
        if (!team.name) {
            window.alert('You must enter a team name');
            return;
        }

        if (saving) {
            /* istanbul ignore next */
            return;
        }

        setSaving(true);

        try {
            const response = await teamApi.update({
                id: team.id || undefined,
                name: team.name,
                address: team.address,
                divisionId: divisionId,
                seasonId: seasonId,
                newDivisionId: team.newDivisionId,
            }, team.updated);

            if (response.success) {
                if (onChange) {
                    await onChange('updated', response.result.updated);
                }
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
                   name="name" value={team.name} onChange={valueChanged}/>
        </div>
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Address</span>
            </div>
            <input disabled={saving} type="text" className="form-control"
                   name="address" value={team.address} onChange={valueChanged}/>
        </div>
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Division</span>
            </div>
            <BootstrapDropdown
                disabled={saving || !team.id || !onChange}
                options={divisionOptions}
                value={team.newDivisionId}
                onChange={(newDivisionId) => onChange ? onChange('newDivisionId', newDivisionId) : null} />
        </div>
        <button className="btn btn-primary margin-right" onClick={saveChanges}>
            {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
            {team.id ? 'Save team' : 'Add team'}
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save team details" />) : null}
    </div>)
}
