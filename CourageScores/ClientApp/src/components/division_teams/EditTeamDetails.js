import React, {useState} from 'react';
import {ErrorDisplay} from "../common/ErrorDisplay";
import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";
import {handleChange} from "../../helpers/events";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";

export function EditTeamDetails({divisionId, onSaved, onChange, onCancel, seasonId, team}) {
    const {divisions, onError} = useApp();
    const {teamApi} = useDependencies();
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const divisionOptions = divisions.map(division => {
        return {value: division.id, text: division.name};
    });

    async function saveChanges() {
        if (!team.name) {
            window.alert('You must enter a team name');
            return;
        }

        /* istanbul ignore next */
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
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
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
                   name="name" value={team.name} onChange={handleChange(onChange)}/>
        </div>
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Address</span>
            </div>
            <input disabled={saving} type="text" className="form-control"
                   name="address" value={team.address} onChange={handleChange(onChange)}/>
        </div>
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Division</span>
            </div>
            <BootstrapDropdown
                disabled={saving || !team.id || !onChange}
                options={divisionOptions}
                value={team.newDivisionId}
                onChange={(newDivisionId) => onChange ? onChange('newDivisionId', newDivisionId) : null}/>
        </div>
        <div className="modal-footer px-0 pb-0">
            <div className="left-aligned">
                <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            </div>
            <button className="btn btn-primary" onClick={saveChanges}>
                {saving
                    ? (<LoadingSpinnerSmall/>)
                    : null}
                {team.id ? 'Save team' : 'Add team'}
            </button>
        </div>
        {saveError
            ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save team details"/>)
            : null}
    </div>)
}
