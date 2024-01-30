import React, {useState} from 'react';
import {BootstrapDropdown, IBootstrapDropdownItem} from "../common/BootstrapDropdown";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";
import {sortBy} from "../../helpers/collections";
import {handleChange, stateChanged} from "../../helpers/events";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {ITeamDto} from "../../interfaces/models/dtos/Team/ITeamDto";
import {ITeamPlayerDto} from "../../interfaces/models/dtos/Team/ITeamPlayerDto";
import {ITeamSeasonDto} from "../../interfaces/models/dtos/Team/ITeamSeasonDto";
import {IClientActionResultDto} from "../../interfaces/IClientActionResultDto";

export interface IEditPlayerDetailsProps {
    onSaved: (team: ITeamDto, newPlayers: ITeamPlayerDto[] | null) => Promise<any>;
    onChange: (name: string, value: string) => Promise<any>;
    onCancel: () => Promise<any>;
    seasonId: string;
    team?: { id: string };
    gameId?: string;
    newTeamId?: string;
    divisionId: string;
    player: IEditPlayerDetailsPlayer;
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

interface ICreatedPlayerResponse extends IClientActionResultDto<ITeamDto> {
    playerDetails?: IEditPlayerDetailsPlayer;
}

interface IMultiPlayerCreationResult extends IClientActionResultDto<ITeamDto> {
    playerDetails: IEditPlayerDetailsPlayer[];
}

export function EditPlayerDetails({ onSaved, onChange, onCancel, seasonId, team, gameId, newTeamId, divisionId, player }: IEditPlayerDetailsProps) {
    const [saving, setSaving] = useState<boolean>(false);
    const [multiple, setMultiple] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<IClientActionResultDto<ITeamDto> | null>(null);
    const {playerApi} = useDependencies();
    const {teams, divisions, onError} = useApp();

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
        if (!(player.newDivisionId || divisionId)) {
            window.alert('Please select a division');
            return;
        }

        setSaving(true);

        try {
            const playerDetails: IEditPlayerDetailsPlayer = {
                name: player.name,
                captain: player.captain,
                emailAddress: player.emailAddress,
                newTeamId: newTeamId,
                gameId: null,
            };

            if (player.id && gameId) {
                playerDetails.gameId = gameId;
            }

            const response: IClientActionResultDto<ITeamDto> = player.id
                ? await playerApi.update(seasonId, player.teamId || team.id, player.id, playerDetails, player.updated)
                : await createMultiple();

            if (response.success) {
                if (onSaved) {
                    await onSaved(
                        response.result,
                        player.id
                            ? null
                            : getNewPlayers(response));
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

    function getNewPlayers(response: IClientActionResultDto<ITeamDto> | IMultiPlayerCreationResult): ITeamPlayerDto[] {

        try {
            const multiCreationResponse: IMultiPlayerCreationResult = response as IMultiPlayerCreationResult;
            if (!multiCreationResponse.playerDetails) {
                // this flow is for updates; single player creation is a multi-creation request with 1 player
                return [];
            }

            const teamSeason: ITeamSeasonDto = response.result.seasons.filter((ts: ITeamSeasonDto) => ts.seasonId === seasonId)[0];
            const newPlayers: ITeamPlayerDto[] = multiCreationResponse.playerDetails.map((request: IEditPlayerDetailsPlayer) => {
                return teamSeason.players.filter((p: ITeamPlayerDto) => p.name === request.name)[0];
            });

            return newPlayers.filter((p: ITeamPlayerDto) => p); // filter out any players that could not be found
        } catch (e) {
            onError(e);
            return [];
        }
    }

    async function createMultiple(): Promise<IMultiPlayerCreationResult> {
        const multiPlayerDetails = player.name.split('\n')
            .filter((name: string) => name && name.trim()) // filter out any empty lines
            .map((name: string): IEditPlayerDetailsPlayer => {
                return {
                    name: name,
                    emailAddress: multiple ? null : player.emailAddress,
                    captain: multiple ? false : player.captain,
                    newTeamId: newTeamId,
                };
            });

        const results: ICreatedPlayerResponse[] = [];
        let success: boolean = true;
        for(let index = 0; index < multiPlayerDetails.length; index++) {
            const playerDetails = multiPlayerDetails[index];
            const response: ICreatedPlayerResponse = await playerApi.create(player.newDivisionId || divisionId, seasonId, player.teamId || team.id, playerDetails);
            results.push(response);
            response.playerDetails = playerDetails;
            success = success && (response.success || false);
        }

        return {
            success: success,
            result: results[results.length - 1].result,
            errors: results.flatMap(r => r.errors),
            warnings: results.flatMap(r => r.warnings),
            messages: results.flatMap(r => r.messages),
            trace: results.flatMap(r => r.trace),
            playerDetails: results.map(r => r.playerDetails),
        };
    }

    function getTeamOptions(): IBootstrapDropdownItem[] {
        return teams
            .filter(teamSeasonForSameDivision)
            .sort(sortBy('name'))
            .map((t: ITeamDto): IBootstrapDropdownItem => {
                return {value: t.id, text: t.name}
            });
    }

    function teamSeasonForSameDivision(team: ITeamDto): boolean {
        const teamSeason = team.seasons.filter(ts => ts.seasonId === seasonId)[0];
        if (!teamSeason) {
            return false;
        }

        return !(divisionId && teamSeason.divisionId && teamSeason.divisionId !== (player.newDivisionId || divisionId));
    }

    function changeMultiple(multiple: boolean) {
        setMultiple(multiple);
        if (!multiple) {
            // noinspection JSIgnoredPromiseFromCall
            onChange('name', '');
        }
    }

    function renderSelectTeamForNewPlayer() {
        const selectTeamOption: IBootstrapDropdownItem = {value: '', text: 'Select team'};

        return (<div className="input-group mb-3">
                <div className="input-group-prepend">
                    <span className="input-group-text">Team</span>
                </div>
                <BootstrapDropdown
                    onChange={(value: string) => onChange('teamId', value)}
                    value={player.teamId || (team ? team.id : '')}
                    options={[selectTeamOption].concat(getTeamOptions())}/>
                {divisionId ? null : (<BootstrapDropdown
                    onChange={(value: string) => onChange('newDivisionId', value)}
                    value={player.newDivisionId || divisionId}
                    options={divisions.map(division => {
                        return {value: division.id, text: division.name};
                    })}/>)}
            </div>
        );
    }

    function renderSelectTeamForExistingPlayer() {
        return (<div className="input-group mb-3">
                <div className="input-group-prepend">
                    <span className="input-group-text">New Team</span>
                </div>
                <BootstrapDropdown
                    onChange={(value: string) => onChange('newTeamId', value)}
                    value={newTeamId || team.id}
                    options={getTeamOptions()}/>

                <BootstrapDropdown
                    onChange={(value: string) => onChange('newDivisionId', value)}
                    value={player.newDivisionId || divisionId}
                    options={divisions.map(division => {
                        return {value: division.id, text: division.name};
                    })}/>
            </div>
        );
    }

    return (<div>
        {player.id ? renderSelectTeamForExistingPlayer() : renderSelectTeamForNewPlayer()}
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">
                    Name
                    {player.id ? null : (<div className="form-check form-switch margin-left">
                        <input disabled={saving} type="checkbox"
                               name="multiple" id="multiple" checked={multiple} onChange={stateChanged(changeMultiple)}
                               className="form-check-input"/>
                        <label className="form-check-label" htmlFor="multiple">Multiple</label>
                    </div>)}
                </span>
            </div>
            {multiple
                ? (<textarea disabled={saving} className="form-control" name="name" value={player.name || ''} placeholder="Enter one name per line" onChange={handleChange(onChange)}></textarea>)
                : (<input disabled={saving} type="text" className="form-control"
                                     name="name" value={player.name || ''} onChange={handleChange(onChange)}/>)}
        </div>
        {multiple ? null : (<div className="input-group mb-3">
            <div className="input-group-prepend">
                <label htmlFor="emailAddress" className="input-group-text">Email address (optional)</label>
            </div>
            <input disabled={saving} type="text" className="form-control"
                   name="emailAddress" value={player.emailAddress || ''} id="emailAddress"
                   placeholder="Email address hidden, enter address to update" onChange={handleChange(onChange)}/>
        </div>)}
        {multiple ? null : (<div className="input-group mb-3">
            <div className="form-check form-switch margin-right">
                <input disabled={saving} type="checkbox"
                       name="captain" id="captain" checked={player.captain || false} onChange={handleChange(onChange)}
                       className="form-check-input"/>
                <label className="form-check-label" htmlFor="captain">Captain</label>
            </div>
        </div>)}
        <div className="modal-footer px-0 pb-0">
            <div className="left-aligned">
                <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            </div>
            <button className="btn btn-primary" onClick={saveChanges}>
                {saving
                    ? (<LoadingSpinnerSmall/>)
                    : null}
                {player.id ? 'Save player' : `Add player${multiple ? 's' : ''}`}
            </button>
        </div>
        {saveError ? (<ErrorDisplay {...saveError} onClose={async () => setSaveError(null)}
                                    title="Could not save player details"/>) : null}
    </div>)
}
