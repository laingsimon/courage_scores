import { useState } from 'react';
import { useApp } from '../common/AppContainer';
import { sortBy } from '../../helpers/collections';
import { asyncClear, propChanged } from '../../helpers/events';
import { useDivisionData } from '../league/DivisionDataContainer';
import { useDependencies } from '../common/IocContainer';
import { DivisionTeamDto } from '../../interfaces/models/dtos/Division/DivisionTeamDto';
import { ModifyTeamSeasonDto } from '../../interfaces/models/dtos/Team/ModifyTeamSeasonDto';
import { UntypedPromise } from '../../interfaces/UntypedPromise';
import { TeamSeasonDto } from '../../interfaces/models/dtos/Team/TeamSeasonDto';
import {
    BootstrapDropdown,
    IBootstrapDropdownItem,
} from '../common/BootstrapDropdown';
import { ErrorDisplay } from '../common/ErrorDisplay';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';

export interface IAssignTeamToSeasonsProps {
    teamOverview: DivisionTeamDto;
    onClose(): UntypedPromise;
}

export function AssignTeamToSeasons({
    teamOverview,
    onClose,
}: IAssignTeamToSeasonsProps) {
    const { id: divisionId, season: currentSeason } = useDivisionData();
    const { divisions, seasons, teams, onError, reloadAll } = useApp();
    const { teamApi } = useDependencies();
    const team = teams.find((t) => t.id === teamOverview.id)!;
    const [saving, setSaving] = useState<boolean>(false);
    const [newTeamSeason, setNewTeamSeason] = useState<ModifyTeamSeasonDto>({
        id: team?.id,
        divisionId: divisionId,
        copyPlayersFromSeasonId: currentSeason?.id,
    });
    const [saveError, setSaveError] = useState<
        IClientActionResultDto<TeamDto> | undefined
    >(undefined);

    async function removeTeamSeason(teamSeason: TeamSeasonDto) {
        const season = seasons.find((s) => s.id === teamSeason.seasonId);
        const division = divisions.find((d) => d.id === teamSeason.divisionId);

        /* istanbul ignore next */
        if (saving) {
            /* istanbul ignore next */
            return;
        }

        const seasonAssignment = season?.name ?? 'Season not found';
        const divisionAssignment = teamSeason.divisionId
            ? ` and ${division?.name ?? 'Division not found'}`
            : '';
        const message = `Are you sure you want to remove ${team.name} from ${seasonAssignment}${divisionAssignment}?`;
        if (!confirm(message)) {
            return;
        }

        setSaving(true);
        try {
            // remove the teamSeason
            const response = await teamApi.delete(
                team.id,
                teamSeason.seasonId!,
            );
            if (response.success) {
                // reload all
                await reloadAll();
            } else {
                setSaveError(response);
            }
        } finally {
            setSaving(false);
        }
    }

    async function addTeamSeason() {
        if (!newTeamSeason.seasonId) {
            alert('Select a season first');
            return;
        }

        if (!confirm('Are you sure you want to associate this season?')) {
            return;
        }

        /* istanbul ignore next */
        if (saving) {
            /* istanbul ignore next */
            return;
        }

        setSaving(true);
        try {
            // remove the teamSeason
            const response = await teamApi.add(newTeamSeason);
            if (response.success) {
                // reload all
                await reloadAll();
                setNewTeamSeason({
                    id: team.id,
                    divisionId: divisionId,
                    copyPlayersFromSeasonId: currentSeason?.id,
                });
            } else {
                setSaveError(response);
            }
        } finally {
            setSaving(false);
        }
    }

    function renderSeason(teamSeason: TeamSeasonDto) {
        const season = seasons.find((s) => s.id === teamSeason.seasonId);
        const division = divisions.find((d) => d.id === teamSeason.divisionId);

        return (
            <li key={teamSeason.seasonId} data-type="existing-season">
                <button
                    className="btn btn-sm btn-danger"
                    disabled={saving}
                    onClick={() => removeTeamSeason(teamSeason)}>
                    🗑️
                    {season?.name ?? 'Season not found'}
                    {teamSeason.divisionId
                        ? ` & ${division?.name ?? 'Division not found'}`
                        : ''}
                </button>
                <span className="ms-1 no-wrap">
                    {teamSeason.players?.length} player/s
                </span>
            </li>
        );
    }

    function renderDivisionSelection(selected?: string) {
        const divisionOptions: IBootstrapDropdownItem[] = divisions
            .sort(sortBy('name'))
            .map((d) => ({
                value: d.id,
                text: d.name,
            }));
        const anyDivisionOption: IBootstrapDropdownItem = {
            value: undefined,
            text: 'Any',
        };

        return (
            <BootstrapDropdown
                className="ms-1"
                value={selected}
                readOnly={saving}
                options={[anyDivisionOption].concat(divisionOptions)}
                onChange={propChanged(
                    newTeamSeason,
                    setNewTeamSeason,
                    'divisionId',
                )}
            />
        );
    }

    function renderSeasonSelection(selected?: string) {
        const otherSelectedSeasonIds =
            team.seasons
                ?.filter((s) => !s.deleted)
                ?.map((ts) => ts.seasonId)
                .filter((id) => id !== selected) ?? [];
        const unselectedSeasons = seasons.filter(
            (s) => !otherSelectedSeasonIds.includes(s.id),
        );

        return (
            <BootstrapDropdown
                value={selected}
                readOnly={saving}
                options={unselectedSeasons
                    .sort(sortBy('startDate', true))
                    .map((s) => ({
                        value: s.id,
                        text: s.name,
                    }))}
                onChange={propChanged(
                    newTeamSeason,
                    setNewTeamSeason,
                    'seasonId',
                )}
            />
        );
    }

    if (!team) {
        return (
            <div>
                Team not found: {teamOverview.name} ({teamOverview.id})
            </div>
        );
    }

    const dontCopyPlayersOption: IBootstrapDropdownItem = {
        value: undefined,
        text: 'Nowhere',
    };
    try {
        return (
            <div>
                <div>
                    Associate <strong>{team.name}</strong> with the following
                    seasons
                </div>
                <ul className="mb-3">
                    {team.seasons
                        ?.filter((ts) => !ts.deleted)
                        .map(renderSeason)}
                    <li className="my-1" data-type="new-season">
                        {renderSeasonSelection(newTeamSeason.seasonId)}
                        {renderDivisionSelection(newTeamSeason.divisionId)}
                        <label>
                            Copy players from
                            <BootstrapDropdown
                                className="ms-1"
                                readOnly={saving}
                                value={newTeamSeason.copyPlayersFromSeasonId}
                                options={[dontCopyPlayersOption].concat(
                                    seasons.sort(sortBy('name')).map((s) => ({
                                        value: s.id,
                                        text: s.name,
                                    })),
                                )}
                                onChange={propChanged(
                                    newTeamSeason,
                                    setNewTeamSeason,
                                    'copyPlayersFromSeasonId',
                                )}
                            />
                        </label>
                        <button
                            className="btn btn-sm btn-primary ms-1"
                            disabled={saving}
                            onClick={() => addTeamSeason()}>
                            ➕
                        </button>
                    </li>
                </ul>
                {saveError ? (
                    <ErrorDisplay
                        {...saveError}
                        onClose={asyncClear(setSaveError)}
                        title="Could not modify team"
                    />
                ) : null}
                <div className="modal-footer px-0 pb-0">
                    <div className="left-aligned">
                        <button className="btn btn-secondary" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
