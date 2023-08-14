import React, { useState } from 'react';
import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";
import {sortBy} from "../../helpers/collections";
import {handleChange} from "../../helpers/events";

export function EditPlayerDetails({ onSaved, onChange, onCancel, seasonId, team, gameId, newTeamId, divisionId, newDivisionId, player }) {
    const [ saving, setSaving ] = useState(false);
    const [ saveError, setSaveError ] = useState(null);
    const { playerApi } = useDependencies();
    const { teams, divisions, onError } = useApp();

    async function saveChanges() {
        /* istanbul ignore next */
        if (saving) {
            /* istanbul ignore next */
            return;
        }

        if ((!team || !team.id) && !player.teamId) {
            window.alert('Please select a team');
            return;
        }
        if (!player.name) {
            window.alert('Please enter a name');
            return;
        }

        setSaving(true);

        try {
            const playerDetails = {
                name: player.name,
                captain: player.captain,
                emailAddress: player.emailAddress,
                newTeamId: newTeamId
            };

            if (player.id && gameId) {
                playerDetails.gameId = gameId;
            }

            const response = player.id
                ? await playerApi.update(seasonId, player.teamId || team.id, player.id, playerDetails, player.updated)
                : await playerApi.create(divisionId, seasonId, player.teamId || team.id, playerDetails);

            if (response.success) {
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

    function getTeamOptions() {
        return teams
            .filter(teamSeasonForSameDivision)
            .sort(sortBy('name'))
            .map(t => { return { value: t.id, text: t.name } });
    }

    function teamSeasonForSameDivision(team) {
        const teamSeason = team.seasons.filter(ts => ts.seasonId === seasonId)[0];
        if (!teamSeason) {
            return false;
        }

        return !(divisionId && teamSeason.divisionId && teamSeason.divisionId !== (newDivisionId || divisionId));
    }

    function renderSelectTeamForNewPlayer() {
        return (<div className="input-group mb-3">
                <div className="input-group-prepend">
                    <span className="input-group-text">Team</span>
                </div>
                <BootstrapDropdown
                    onChange={value => onChange('teamId', value)}
                    value={player.teamId || (team ? team.id : '')}
                    options={[{ value: '', text: 'Select team' }].concat(getTeamOptions())} />
            </div>
        );
    }

    function renderSelectTeamForExistingPlayer() {
        return (<div className="input-group mb-3">
                <div className="input-group-prepend">
                    <span className="input-group-text">New Team</span>
                </div>
                <BootstrapDropdown
                    onChange={value => onChange('newTeamId', value)}
                    value={newTeamId || team.id}
                    options={getTeamOptions()} />

                <BootstrapDropdown
                    onChange={value => onChange('newDivisionId', value)}
                    value={newDivisionId || divisionId}
                    options={divisions.map(division => { return { value: division.id, text: division.name }; })} />
            </div>
        );
    }

    return (<div>
        {player.id ? renderSelectTeamForExistingPlayer() : renderSelectTeamForNewPlayer()}
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Name</span>
            </div>
            <input disabled={saving} type="text" className="form-control"
                   name="name" value={player.name || ''} onChange={handleChange(onChange)}/>
        </div>
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Email address (optional)</span>
            </div>
            <input disabled={saving} type="text" className="form-control"
                   name="emailAddress" value={player.emailAddress || ''} placeholder="Email address hidden, enter address to update" onChange={handleChange(onChange)}/>
        </div>
        <div className="input-group mb-3">
            <div className="form-check form-switch margin-right">
                <input disabled={saving} type="checkbox"
                   name="captain" id="captain" checked={player.captain || false} onChange={handleChange(onChange)} className="form-check-input" />
                <label className="form-check-label" htmlFor="captain">Captain</label>
            </div>
        </div>
        <div className="modal-footer px-0 pb-0">
            <div className="left-aligned">
                <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            </div>
            <button className="btn btn-primary" onClick={saveChanges}>
                {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                {player.id ? 'Save player' : 'Add player'}
            </button>
        </div>
        {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save player details" />) : null}
    </div>)
}
