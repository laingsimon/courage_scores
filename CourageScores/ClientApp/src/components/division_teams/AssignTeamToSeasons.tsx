import {useState} from "react";
import {useApp} from "../common/AppContainer";
import {all, any, isEmpty, sortBy} from "../../helpers/collections";
import {stateChanged} from "../../helpers/events";
import {useDivisionData} from "../league/DivisionDataContainer";
import {useDependencies} from "../common/IocContainer";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {DivisionTeamDto} from "../../interfaces/models/dtos/Division/DivisionTeamDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {ModifyTeamSeasonDto} from "../../interfaces/models/dtos/Team/ModifyTeamSeasonDto";
import {TeamSeasonDto} from "../../interfaces/models/dtos/Team/TeamSeasonDto";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface IAssignTeamToSeasonsProps {
    teamOverview: DivisionTeamDto;
    onClose(): UntypedPromise;
}

interface IChanges {
    added: string[];
    removed: string[];
    changed: boolean;
}

export function AssignTeamToSeasons({teamOverview, onClose}: IAssignTeamToSeasonsProps) {
    const {id: divisionId, season: currentSeason, onReloadDivision} = useDivisionData();
    const {seasons, teams, onError, reloadAll} = useApp();
    const {teamApi} = useDependencies();
    const team: TeamDto = teams.filter((t: TeamDto) => t.id === teamOverview.id)[0];
    const initialSeasonIds: string[] = team ? team.seasons.filter(ts => !ts.deleted).map((ts: TeamSeasonDto) => ts.seasonId) : [];
    const [selectedSeasonIds, setSelectedSeasonIds]: [string[], (value: (((prevState: string[]) => string[]) | string[])) => void] = useState(initialSeasonIds);
    const [saving, setSaving] = useState(false);
    const [copyTeamFromCurrentSeason, setCopyTeamFromCurrentSeason] = useState(true);
    const changes: IChanges = getChanges(initialSeasonIds, selectedSeasonIds);

    async function saveChanges() {
        /* istanbul ignore next */
        if (saving || !changes.changed) {
            /* istanbul ignore next */
            return;
        }

        setSaving(true);
        try {
            const results: IClientActionResultDto<TeamDto>[] = [];
            for (const seasonId of changes.removed) {
                const result: IClientActionResultDto<TeamDto> = await teamApi.delete(team.id, seasonId);
                results.push(result);
            }

            for (const seasonId of changes.added) {
                const details: ModifyTeamSeasonDto = {
                    id: team.id,
                    seasonId: seasonId,
                    copyPlayersFromSeasonId: copyTeamFromCurrentSeason ? currentSeason.id : null,
                    divisionId: divisionId,
                };
                const result: IClientActionResultDto<TeamDto> = await teamApi.add(details);
                results.push(result);
            }

            const allSuccess: boolean = all(results, (r: IClientActionResultDto<TeamDto>) => r.success);
            if (allSuccess) {
                await reloadAll();
                await onReloadDivision();
                await onClose();
                return;
            }

            const errors: IClientActionResultDto<TeamDto>[] = results.filter((r: IClientActionResultDto<TeamDto>) => !r.success);
            for (const res of errors) {
                console.error(res);
            }
            window.alert(`There were ${errors.length} error/s when applying these changes; some changes may not have been saved`);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setSaving(false);
        }
    }

    function getChanges(initialIds: string[], selectedIds: string[]): IChanges {
        const removed: string[] = initialIds.filter(initialId => isEmpty(selectedIds, (id: string) => id === initialId));
        const added: string[] = selectedIds.filter(selectedId => isEmpty(initialIds, (id: string) => id === selectedId));

        return {
            added: added,
            removed: removed,
            changed: any(added) || any(removed),
        };
    }

    function toggleSeason(seasonId: string) {
        const seasonSelected: boolean = any(selectedSeasonIds.filter((id: string) => id === seasonId));
        if (seasonSelected) {
            // remove
            setSelectedSeasonIds(selectedSeasonIds.filter((id: string) => id !== seasonId));
        } else {
            // add
            setSelectedSeasonIds(selectedSeasonIds.concat([seasonId]));
        }
    }

    function renderSeason(season: SeasonDto) {
        let className: string = '';
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

    try {
        return (<div>
            <div>Associate <strong>{team.name}</strong> with the following seasons</div>
            <div className="input-group mb-3">
                <div className="form-check form-switch margin-right">
                    <input disabled={saving} className="form-check-input" type="checkbox" id="copyTeamFromCurrentSeason"
                           checked={copyTeamFromCurrentSeason} onChange={stateChanged(setCopyTeamFromCurrentSeason)}/>
                    <label className="form-check-label" htmlFor="copyTeamFromCurrentSeason">Copy players
                        from <strong>{currentSeason.name}</strong></label>
                </div>
            </div>
            <ul className="list-group mb-3">
                {seasons.sort(sortBy('startDate')).map(renderSeason)}
            </ul>
            <div className="modal-footer px-0 pb-0">
                <div className="left-aligned">
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
                <button className="btn btn-primary" onClick={saveChanges} disabled={!changes.changed}>
                    {saving ? (<LoadingSpinnerSmall/>) : null}
                    Apply changes
                </button>
            </div>
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}