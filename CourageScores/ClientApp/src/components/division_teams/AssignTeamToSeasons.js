import React, {useState} from "react";
import {useApp} from "../../AppContainer";
import {all, any, stateChanged} from "../../Utilities";
import {useDivisionData} from "../DivisionDataContainer";
import {useDependencies} from "../../IocContainer";

export function AssignTeamToSeasons({ teamOverview, onClose }) {
    const { season: currentSeason, onReloadDivision } = useDivisionData();
    const { seasons, teams, onError, reloadAll } = useApp();
    const { teamApi } = useDependencies();
    const team = teams.filter(t => t.id === teamOverview.id)[0];
    const initialSeasonIds = team.seasons.filter(ts => !ts.deleted).map(ts => ts.seasonId);
    const [ selectedSeasonIds, setSelectedSeasonIds ] = useState(initialSeasonIds);
    const [ saving, setSaving ] = useState(false);
    const [ copyTeamFromCurrentSeason, setCopyTeamFromCurrentSeason ] = useState(true);
    const changes = getChanges(initialSeasonIds, selectedSeasonIds);

    async function saveChanges() {
        if (saving || !changes.changed) {
            return;
        }

        setSaving(true);
        try {
            const results = [];
            for (let index = 0; index < changes.removed.length; index++) {
                const seasonId = changes.removed[index];
                const result = await teamApi.delete(team.id, seasonId);
                results.push(result);
            }

            for (let index = 0; index < changes.added.length; index++) {
                const seasonId = changes.added[index];
                const result = await teamApi.add(team.id, seasonId, copyTeamFromCurrentSeason ? currentSeason.id : null);
                results.push(result);
            }

            const allSuccess = all(results, r => r.success);
            if (allSuccess) {
                await reloadAll();
                await onReloadDivision();
                onClose();
                return;
            }

            const errors = results.filter(r => !r.success);
            errors.forEach(res => console.error(res));
            window.alert(`There were ${errors.length} error/s when applying these changes; some changes may not have been saved`);
        } catch (e) {
            onError(e);
        } finally {
            setSaving(false);
        }
    }

    function getChanges(initialIds, selectedIds) {
        const added = [];
        const removed = [];

        for (let index = 0; index < initialIds.length; index++) {
            const initialId = initialIds[index];
            const hasBeenRemoved = selectedIds.filter(id => id === initialId).length === 0;
            if (hasBeenRemoved) {
                removed.push(initialId);
            }
        }

        for (let index = 0; index < selectedIds.length; index++) {
            const selectedId = selectedIds[index];
            const hasBeenRemoved = initialIds.filter(id => id === selectedId).length === 0;
            if (hasBeenRemoved) {
                added.push(selectedId);
            }
        }

        return {
            added: added,
            removed: removed,
            changed: any(added) || any(removed),
        };
    }

    function toggleSeason(seasonId) {
        const seasonSelected = any(selectedSeasonIds.filter(id => id === seasonId));
        if (seasonSelected) {
            // remove
            setSelectedSeasonIds(selectedSeasonIds.filter(id => id !== seasonId));
        } else {
            // add
            setSelectedSeasonIds(selectedSeasonIds.concat([ seasonId ]));
        }
    }

    function renderSeason(season) {
        let className = '';
        if (any(changes.added, id => id === season.id)) {
            className = ' bg-success';
        } else if (any(changes.removed, id => id === season.id)) {
            className = ' bg-danger';
        } else if (any(initialSeasonIds, id => id === season.id)) {
            className = ' active';
        }

        return (<li key={season.id} className={`list-group-item${className}`} onClick={() => toggleSeason(season.id)}>
            {season.name}
        </li>);
    }

    if (!team) {
        return (<div>Team not found: {teamOverview.name} ({teamOverview.id})</div>);
    }

    return (<div>
        <div>Associate <strong>{team.name}</strong> with the following seasons</div>
        <div className="input-group mb-3">
            <div className="form-check form-switch margin-right">
                <input disabled={saving} className="form-check-input" type="checkbox" id="copyTeamFromCurrentSeason"
                       checked={copyTeamFromCurrentSeason} onChange={stateChanged(setCopyTeamFromCurrentSeason)}/>
                <label className="form-check-label" htmlFor="copyTeamFromCurrentSeason">Copy players from <strong>{currentSeason.name}</strong></label>
            </div>
        </div>
        <ul className="list-group mb-3">
            {seasons.map(renderSeason)}
        </ul>
        <div>
            <button className="btn btn-primary margin-right" onClick={onClose}>Close</button>
            <button className="btn btn-success margin-right" onClick={saveChanges} disabled={!changes.changed}>
                {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                Apply changes
            </button>
        </div>
    </div>);
}