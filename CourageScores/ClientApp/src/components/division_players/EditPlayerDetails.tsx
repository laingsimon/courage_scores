import { useState } from 'react';
import {
    BootstrapDropdown,
    IBootstrapDropdownItem,
} from '../common/BootstrapDropdown';
import { ErrorDisplay } from '../common/ErrorDisplay';
import { useDependencies } from '../common/IocContainer';
import { useApp } from '../common/AppContainer';
import { any, sortBy } from '../../helpers/collections';
import { handleChange, stateChanged } from '../../helpers/events';
import { LoadingSpinnerSmall } from '../common/LoadingSpinnerSmall';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';
import { TeamPlayerDto } from '../../interfaces/models/dtos/Team/TeamPlayerDto';
import { TeamSeasonDto } from '../../interfaces/models/dtos/Team/TeamSeasonDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { EditTeamPlayerDto } from '../../interfaces/models/dtos/Team/EditTeamPlayerDto';
import { UntypedPromise } from '../../interfaces/UntypedPromise';
import { getTeamSeasons } from '../../helpers/teams';

export interface IEditPlayerDetailsProps {
    onSaved(team: TeamDto, newPlayers: TeamPlayerDto[] | null): UntypedPromise;
    onChange(name: string, value: string): UntypedPromise;
    onCancel(): UntypedPromise;
    seasonId: string;
    team?: { id: string };
    gameId?: string;
    newTeamId?: string;
    divisionId?: string;
    player: IEditPlayerDetailsPlayer;
    initialMultiple?: boolean;
}

export interface IEditPlayerDetailsPlayer {
    teamId?: string;
    newTeamId?: string;
    name: string;
    newDivisionId?: string;
    captain?: boolean;
    emailAddress?: string;
    id?: string;
    gameId?: string;
    updated?: string;
}

interface ICreatedPlayerResponse extends IClientActionResultDto<TeamDto> {
    playerDetails?: IEditPlayerDetailsPlayer;
}

interface IMultiPlayerCreationResult extends IClientActionResultDto<TeamDto> {
    playerDetails: IEditPlayerDetailsPlayer[];
}

export function EditPlayerDetails({
    onSaved,
    onChange,
    onCancel,
    seasonId,
    team,
    gameId,
    newTeamId,
    divisionId,
    player,
    initialMultiple,
}: IEditPlayerDetailsProps) {
    const [saving, setSaving] = useState<boolean>(false);
    const [multiple, setMultiple] = useState<boolean>(initialMultiple || false);
    const [saveError, setSaveError] =
        useState<IClientActionResultDto<TeamDto> | null>(null);
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
            const playerDetails: EditTeamPlayerDto = {
                name: player.name,
                captain: player.captain,
                emailAddress: player.emailAddress,
                newTeamId: newTeamId,
            };

            if (player.id) {
                playerDetails.lastUpdated = player.updated;
            }

            if (player.id && gameId) {
                playerDetails.gameId = gameId;
            }

            const response: IClientActionResultDto<TeamDto> = player.id
                ? await playerApi.update(
                      seasonId,
                      player.teamId || team!.id,
                      player.id,
                      playerDetails,
                  )
                : await createMultiple();

            if (response.success) {
                if (onSaved) {
                    await onSaved(
                        response.result!,
                        player.id ? null : getNewPlayers(response),
                    );
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

    function getNewPlayers(
        response: IClientActionResultDto<TeamDto> | IMultiPlayerCreationResult,
    ): TeamPlayerDto[] {
        try {
            const multiCreationResponse: IMultiPlayerCreationResult =
                response as IMultiPlayerCreationResult;
            if (!multiCreationResponse.playerDetails) {
                // this flow is for updates; single player creation is a multi-creation request with 1 player
                return [];
            }

            const teamSeason: TeamSeasonDto = getTeamSeasons(
                response.result!,
                seasonId,
            )[0];
            const newPlayers: TeamPlayerDto[] =
                multiCreationResponse.playerDetails.map(
                    (request: IEditPlayerDetailsPlayer) => {
                        return teamSeason.players!.filter(
                            (p: TeamPlayerDto) => p.name === request.name,
                        )[0];
                    },
                );

            return newPlayers.filter((p: TeamPlayerDto) => !!p); // filter out any players that could not be found
        } catch (e) {
            onError(e);
            return [];
        }
    }

    function getDivisionIdForTeam(): string {
        const teamId = newTeamId || (team ? team.id : null) || player.teamId;
        const found = teams.find((t: TeamDto) => t.id === teamId);
        const teamSeason = found ? getTeamSeasons(found, seasonId)[0] : null;
        if (teamSeason && teamSeason.divisionId) {
            return teamSeason.divisionId;
        }

        throw new Error(
            'Unable to determine division for newly created player',
        );
    }

    async function createMultiple(): Promise<IMultiPlayerCreationResult> {
        const multiPlayerDetails = player.name
            .split('\n')
            .filter((name: string) => name && name.trim()) // filter out any empty lines
            .map((name: string): IEditPlayerDetailsPlayer => {
                return {
                    name: name,
                    emailAddress: multiple ? undefined : player.emailAddress,
                    captain: multiple ? false : player.captain,
                    newTeamId: newTeamId,
                };
            });

        const results: ICreatedPlayerResponse[] = [];
        let success: boolean = true;
        for (const playerDetails of multiPlayerDetails) {
            const createForDivisionId: string = getDivisionIdForTeam();
            const response: ICreatedPlayerResponse = await playerApi.create(
                createForDivisionId,
                seasonId,
                player.teamId || team!.id,
                playerDetails,
            );
            results.push(response);
            response.playerDetails = playerDetails;
            success = success && (response.success || false);
        }

        return {
            success: success,
            result: results[results.length - 1].result,
            errors: results.flatMap((r) => r.errors || []),
            warnings: results.flatMap((r) => r.warnings || []),
            messages: results.flatMap((r) => r.messages || []),
            trace: results.flatMap((r) => r.trace || []),
            playerDetails: results.map((r) => r.playerDetails!),
        };
    }

    function getTeamOptions(): IBootstrapDropdownItem[] {
        return teams
            .filter(teamSeasonForSameDivision)
            .sort(sortBy('name'))
            .map((t: TeamDto): IBootstrapDropdownItem => {
                return { value: t.id, text: t.name };
            });
    }

    function teamSeasonForSameDivision(team: TeamDto): boolean {
        return any(
            getTeamSeasons(team, seasonId, player.newDivisionId ?? divisionId),
        );
    }

    function changeMultiple(multiple: boolean) {
        setMultiple(multiple);
        if (!multiple) {
            // noinspection JSIgnoredPromiseFromCall
            onChange('name', '');
        }
    }

    function renderSelectTeamForNewPlayer() {
        const selectTeamOption: IBootstrapDropdownItem = {
            value: '',
            text: 'Select team',
        };

        return (
            <div className="input-group mb-3">
                <div className="input-group-prepend">
                    <span className="input-group-text">Team</span>
                </div>
                <BootstrapDropdown
                    datatype="team-selection-team"
                    onChange={(value: string) => onChange('teamId', value)}
                    value={player.teamId || (team ? team.id : '')}
                    options={[selectTeamOption].concat(getTeamOptions())}
                />
                {divisionId || !player.id ? null : (
                    <BootstrapDropdown
                        datatype="team-selection-division"
                        onChange={(value: string) =>
                            onChange('newDivisionId', value)
                        }
                        value={player.newDivisionId || divisionId}
                        options={divisions.map((division) => {
                            return { value: division.id, text: division.name };
                        })}
                    />
                )}
            </div>
        );
    }

    function renderSelectTeamForExistingPlayer() {
        return (
            <div className="input-group mb-3">
                <div className="input-group-prepend">
                    <span className="input-group-text">New Team</span>
                </div>
                <BootstrapDropdown
                    datatype="team-selection-team"
                    onChange={(value: string) => onChange('newTeamId', value)}
                    value={newTeamId || team!.id}
                    options={getTeamOptions()}
                />
                <BootstrapDropdown
                    datatype="team-selection-division"
                    onChange={(value: string) =>
                        onChange('newDivisionId', value)
                    }
                    value={player.newDivisionId || divisionId}
                    options={divisions.map((division) => {
                        return { value: division.id, text: division.name };
                    })}
                />
            </div>
        );
    }

    return (
        <div>
            {player.id
                ? renderSelectTeamForExistingPlayer()
                : renderSelectTeamForNewPlayer()}
            <div className="input-group mb-3">
                <div className="input-group-prepend">
                    <span className="input-group-text">
                        Name
                        {player.id ? null : (
                            <div className="form-check form-switch margin-left">
                                <input
                                    disabled={saving}
                                    type="checkbox"
                                    name="multiple"
                                    id="multiple"
                                    checked={multiple}
                                    onChange={stateChanged(changeMultiple)}
                                    className="form-check-input"
                                />
                                <label
                                    className="form-check-label"
                                    htmlFor="multiple">
                                    Multiple
                                </label>
                            </div>
                        )}
                    </span>
                </div>
                {multiple ? (
                    <textarea
                        disabled={saving}
                        className="form-control"
                        name="name"
                        value={player.name || ''}
                        placeholder="Enter one name per line"
                        onChange={handleChange(onChange)}></textarea>
                ) : (
                    <input
                        disabled={saving}
                        type="text"
                        className="form-control"
                        name="name"
                        value={player.name || ''}
                        onChange={handleChange(onChange)}
                    />
                )}
            </div>
            {multiple ? null : (
                <div className="input-group mb-3">
                    <div className="input-group-prepend">
                        <label
                            htmlFor="emailAddress"
                            className="input-group-text">
                            Email address (optional)
                        </label>
                    </div>
                    <input
                        disabled={saving}
                        type="text"
                        className="form-control"
                        name="emailAddress"
                        value={player.emailAddress || ''}
                        id="emailAddress"
                        placeholder="Email address hidden, enter address to update"
                        onChange={handleChange(onChange)}
                    />
                </div>
            )}
            {multiple ? null : (
                <div className="input-group mb-3">
                    <div className="form-check form-switch margin-right">
                        <input
                            disabled={saving}
                            type="checkbox"
                            name="captain"
                            id="captain"
                            checked={player.captain || false}
                            onChange={handleChange(onChange)}
                            className="form-check-input"
                        />
                        <label className="form-check-label" htmlFor="captain">
                            Captain
                        </label>
                    </div>
                </div>
            )}
            <div className="modal-footer px-0 pb-0">
                <div className="left-aligned">
                    <button className="btn btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                </div>
                <button className="btn btn-primary" onClick={saveChanges}>
                    {saving ? <LoadingSpinnerSmall /> : null}
                    {player.id
                        ? 'Save player'
                        : `Add player${multiple ? 's' : ''}`}
                </button>
            </div>
            {saveError ? (
                <ErrorDisplay
                    {...saveError}
                    onClose={async () => setSaveError(null)}
                    title="Could not save player details"
                />
            ) : null}
        </div>
    );
}
