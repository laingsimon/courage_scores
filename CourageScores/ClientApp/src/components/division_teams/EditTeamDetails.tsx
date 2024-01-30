import React, {useState} from 'react';
import {ErrorDisplay} from "../common/ErrorDisplay";
import {BootstrapDropdown, IBootstrapDropdownItem} from "../common/BootstrapDropdown";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";
import {handleChange} from "../../helpers/events";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {ITeamDto} from "../../interfaces/models/dtos/Team/ITeamDto";
import {IDivisionDto} from "../../interfaces/models/dtos/IDivisionDto";
import {IEditTeamDto} from "../../interfaces/models/dtos/Team/IEditTeamDto";
import {IClientActionResultDto} from "../../interfaces/IClientActionResultDto";

export interface IEditTeamDetailsProps {
    divisionId: string;
    onSaved: (team: ITeamDto) => Promise<any>;
    onChange?: (name: string, value: string) => Promise<any>;
    onCancel: () => Promise<any>;
    seasonId: string;
    team: IEditTeamDto;
    lastUpdated?: string;
}

export function EditTeamDetails({divisionId, onSaved, onChange, onCancel, seasonId, team, lastUpdated}: IEditTeamDetailsProps) {
    const {divisions, onError} = useApp();
    const {teamApi} = useDependencies();
    const [saving, setSaving] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<any>(null);
    const divisionOptions: IBootstrapDropdownItem[] = divisions.map((division: IDivisionDto) => {
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
            const response: IClientActionResultDto<ITeamDto> = await teamApi.update({
                id: team.id || undefined,
                name: team.name,
                address: team.address,
                divisionId: divisionId,
                seasonId: seasonId,
                newDivisionId: team.newDivisionId,
                lastUpdated: lastUpdated,
            });

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
                <label htmlFor="name" className="input-group-text">Name</label>
            </div>
            <input disabled={saving} type="text" className="form-control"
                   id="name" name="name" value={team.name} onChange={handleChange(onChange)}/>
        </div>
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <label htmlFor="address" className="input-group-text">Address</label>
            </div>
            <input disabled={saving} type="text" className="form-control"
                   id="address" name="address" value={team.address} onChange={handleChange(onChange)}/>
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
