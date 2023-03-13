import React, { useState } from 'react';
import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {useDependencies} from "../../IocContainer";

export function EditPlayerDetails({ id, name, captain, emailAddress, teamId, onSaved, onChange, onCancel, seasonId, teams, gameId }) {
    const [ saving, setSaving ] = useState(false);
    const [ saveError, setSaveError ] = useState(null);
    const { playerApi } = useDependencies();

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
            const playerDetails = {
                name: name,
                captain: captain,
                emailAddress: emailAddress
            };

            if (id && gameId) {
                playerDetails.gameId = gameId;
            }

            const response = id
                ? await playerApi.update(seasonId, teamId, id, playerDetails)
                : await playerApi.create(seasonId, teamId, playerDetails);

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
            if (event.target.type === 'checkbox') {
                await onChange(event.target.name, event.target.checked);
                return;
            }

            await onChange(event.target.name, event.target.value);
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
                    options={[{ value: '', text: 'Select team' }].concat(teams.map(t => { return { value: t.id, text: t.name } }))} />
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
            <div className="input-group-prepend">
                <span className="input-group-text">Email address (optional)</span>
            </div>
            <input disabled={saving} type="text" className="form-control"
                   name="emailAddress" value={emailAddress || ''} placeholder="Email address hidden, enter address to update" onChange={valueChanged}/>
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
        <button className="btn btn-secondary" onClick={async () => onCancel ? await onCancel() : null}>Cancel</button>
        {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save player details" />) : null}
    </div>)
}
