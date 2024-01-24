import {propChanged, stateChanged, valueChanged} from "../../../helpers/events";
import React, {useState} from "react";
import {Dialog} from "../../common/Dialog";
import {BootstrapDropdown, IBootstrapDropdownItem} from "../../common/BootstrapDropdown";
import {useApp} from "../../../AppContainer";
import {any, sortBy} from "../../../helpers/collections";
import {useTournament} from "./TournamentContainer";
import {EditPlayerDetails} from "../../division_players/EditPlayerDetails";
import {IEditTeamPlayerDto} from "../../../interfaces/serverSide/Team/IEditTeamPlayerDto";
import {ITeamDto} from "../../../interfaces/serverSide/Team/ITeamDto";
import {ITeamSeasonDto} from "../../../interfaces/serverSide/Team/ITeamSeasonDto";
import {ITeamPlayerDto} from "../../../interfaces/serverSide/Team/ITeamPlayerDto";
import {ITournamentSideDto} from "../../../interfaces/serverSide/Game/ITournamentSideDto";
import {ITournamentPlayerDto} from "../../../interfaces/serverSide/Game/ITournamentPlayerDto";
import {ISeasonDto} from "../../../interfaces/serverSide/Season/ISeasonDto";

export interface IEditSideProps {
    side: ITournamentSideDto;
    onChange?: (side: ITournamentSideDto) => Promise<any>;
    onClose: () => Promise<any>;
    onApply: () => Promise<any>;
    onDelete?: (side: ITournamentSideDto) => Promise<any>;
}

interface ITeamPlayerMap {
    id: string;
    name: string;
    team: ITeamDto;
}

export function EditSide({side, onChange, onClose, onApply, onDelete}: IEditSideProps) {
    const {teams: teamMap, onError, account, reloadTeams} = useApp();
    const {tournamentData, season, alreadyPlaying} = useTournament();
    const [playerFilter, setPlayerFilter] = useState('');
    const [addPlayerDialogOpen, setAddPlayerDialogOpen] = useState<boolean>(false);
    const [newPlayerDetails, setNewPlayerDetails] = useState<IEditTeamPlayerDto>({name: '', captain: false});
    const divisionId: string = tournamentData.divisionId;
    const selectATeam: IBootstrapDropdownItem = {value: '', text: 'Select team', className: 'text-warning'};
    const teamOptions: IBootstrapDropdownItem[] = [selectATeam].concat(teamMap.filter(teamSeasonForSameDivision).map((t: ITeamDto) => {
        return {value: t.id, text: t.name};
    }).sort(sortBy('text')));
    const allPossiblePlayers: ITeamPlayerMap[] = teamMap
        .filter((_: ITeamDto) => true) // turn the map back into an array
        .flatMap((t: ITeamDto) => {
            const teamSeason: ITeamSeasonDto = t.seasons.filter((ts: ITeamSeasonDto) => ts.seasonId === season.id)[0];
            if (teamSeason && isTeamSeasonForDivision(teamSeason)) {
                return teamSeason.players.map((p: ITeamPlayerDto) => {
                    return {id: p.id, name: p.name, team: t} as ITeamPlayerMap
                }) || [];
            }

            return [];
        });
    const canAddPlayers: boolean = account.access.managePlayers && !side.teamId;

    function teamSeasonForSameDivision(team: ITeamDto): boolean {
        const teamSeason: ITeamSeasonDto = team.seasons.filter((ts: ITeamSeasonDto) => ts.seasonId === season.id)[0];
        if (!teamSeason) {
            return false;
        }

        return isTeamSeasonForDivision(teamSeason);
    }

    function isTeamSeasonForDivision(teamSeason: ITeamSeasonDto): boolean {
        return !(divisionId && teamSeason.divisionId && teamSeason.divisionId !== divisionId);
    }

    function getOtherSidePlayerSelectedIn(player: ITournamentPlayerDto): ITournamentSideDto {
        return tournamentData.sides.flatMap((s: ITournamentSideDto) => {
            if (s.id === side.id) {
                // same side as being edited
                return [];
            }

            return any(s.players || [], (p: ITournamentPlayerDto) => p.id === player.id)
                ? [s]
                : [];
        })[0];
    }

    async function onDeselectPlayer(playerId: string) {
        const newSide = Object.assign({}, side);
        newSide.players = (newSide.players || []).filter(p => p.id !== playerId);

        const oldSidePlayerName = side.players.sort(sortBy('name')).map(p => p.name).join(', ');
        if (side.name === oldSidePlayerName) {
            newSide.name = newSide.players.sort(sortBy('name')).map(p => p.name).join(', ');
        }

        if (onChange) {
            await onChange(newSide);
        }
    }

    async function onSelectPlayer(player: ITournamentPlayerDto, preventOnChange?: boolean, sideOverride?: ITournamentSideDto): Promise<ITournamentSideDto> {
        const newSide: ITournamentSideDto = Object.assign({}, sideOverride || side);
        newSide.players = (newSide.players || []).concat({
            id: player.id,
            name: player.name,
            divisionId: player.divisionId
        });

        const oldSidePlayerName: string = (side.players || []).sort(sortBy('name')).map((p: ITournamentPlayerDto) => p.name).join(', ');
        if ((side.name || '') === oldSidePlayerName) {
            newSide.name = newSide.players.sort(sortBy('name')).map((p: ITournamentPlayerDto) => p.name).join(', ');
        }

        if (onChange && !preventOnChange) {
            await onChange(newSide);
        }

        return newSide;
    }

    async function updateTeamId(teamId: string) {
        const newSide: ITournamentSideDto = Object.assign({}, side);
        if (teamId) {
            newSide.name = newSide.name || teamMap[teamId].name;
        } else {
            teamId = undefined;
        }

        newSide.teamId = teamId;

        if (onChange) {
            await onChange(newSide);
        }
    }

    async function togglePlayer(player: ITournamentPlayerDto) {
        if (any(side.players || [], (p: ITournamentPlayerDto) => p.id === player.id)) {
            await onDeselectPlayer(player.id);
            return;
        }

        const otherSidePlayerSelectedIn: ITournamentSideDto = getOtherSidePlayerSelectedIn(player);
        if (!otherSidePlayerSelectedIn) {
            await onSelectPlayer(player);
        }
    }

    async function onRemoveSide() {
        if (!window.confirm(`Are you sure you want to remove ${side.name}?`)) {
            return;
        }

        await onDelete(side);
    }

    async function onSave() {
        if (!side.teamId && !any(side.players || [])) {
            window.alert('Select a team or some players');
            return;
        }

        if (!side.name) {
            window.alert('Please enter a name for this side');
            return;
        }

        await onApply();
    }

    function matchesPlayerFilter(player: ITournamentPlayerDto): boolean {
        if (!playerFilter) {
            return true;
        }

        return player.name.toLowerCase().indexOf(playerFilter.toLowerCase()) !== -1;
    }

    function renderCreatePlayerDialog(season: ISeasonDto) {
        return (<Dialog title={`Add a player...`}>
            <EditPlayerDetails
                player={newPlayerDetails}
                seasonId={season.id}
                divisionId={tournamentData.divisionId}
                onChange={propChanged(newPlayerDetails, setNewPlayerDetails)}
                onCancel={async () => setAddPlayerDialogOpen(false)}
                onSaved={reloadPlayers}
            />
        </Dialog>);
    }

    async function reloadPlayers(_: ITeamDto, newPlayers: ITeamPlayerDto[]) {
        await reloadTeams();
        setAddPlayerDialogOpen(false);
        setNewPlayerDetails({name: '', captain: false});

        let newSide: ITournamentSideDto = side;
        // select the new players
        for (let playerIndex in newPlayers) {
            const player = newPlayers[playerIndex];
            newSide = await onSelectPlayer({
                id: player.id,
                name: player.name,
                divisionId: tournamentData.divisionId,
            }, true, newSide);
        }

        await onChange(newSide);
    }

    try {
        const filteredPlayers: ITeamPlayerMap[] = allPossiblePlayers.filter(matchesPlayerFilter);

        return (<Dialog title={side.id ? 'Edit side' : 'Add side'} slim={true}>
            <div className="form-group input-group mb-3 d-print-none">
                <div className="input-group-prepend">
                    <label htmlFor="name" className="input-group-text">Name</label>
                </div>
                <input className="form-control" value={side.name || ''} name="name" id="name"
                       onChange={valueChanged(side, onChange)}/>
            </div>
            <div className="form-check form-switch margin-right my-1">
                <input type="checkbox" className="form-check-input" checked={side.noShow || false} name="noShow"
                       id="noShow"
                       onChange={valueChanged(side, onChange)}/>
                <label className="form-check-label" htmlFor="noShow">No show on the night?</label>
            </div>
            {any(side.players || []) ? null : (<div className="form-group input-group mb-3 d-print-none">
                <div className="input-group-prepend">
                    <span className="input-group-text">Team</span>
                </div>
                <BootstrapDropdown options={teamOptions} value={side.teamId} onChange={updateTeamId}/>
            </div>)}
            {side.teamId ? null : (<div>
                <div className="d-flex justify-content-between align-items-center p-2 pt-0">
                    <div>Who's playing</div>
                    <div>
                        <label htmlFor="playerFilter" className="margin-right">Filter</label>
                        <input id="playerFilter" name="playerFilter" onChange={stateChanged(setPlayerFilter)} value={playerFilter}/>
                        {playerFilter
                            ? (<span className="margin-left">
                                {filteredPlayers.length} of {allPossiblePlayers.length} player/s
                            </span>)
                            : null}
                    </div>
                </div>
                <div className="max-scroll-height overflow-auto height-250">
                    <ol className="list-group mb-3">
                        {filteredPlayers.sort(sortBy('name')).map((player: ITeamPlayerMap) => {
                            const selected: boolean = any(side.players || [], (p: ITournamentPlayerDto) => p.id === player.id);
                            const playingInAnotherTournament = alreadyPlaying[player.id];
                            const selectedInAnotherSide: ITournamentSideDto = getOtherSidePlayerSelectedIn(player);
                            const hasSameNameAsAnotherPlayer: boolean = allPossiblePlayers.filter((p: ITeamPlayerMap) => p.name === player.name).length > 1;

                            return (<li key={player.id}
                                        className={`list-group-item${selected ? ' active' : ''}${selectedInAnotherSide ? ' disabled' : ''}`}
                                        onClick={() => togglePlayer(player)}>
                                {player.name}
                                {hasSameNameAsAnotherPlayer ? ` [${player.team.name}]` : null}
                                {playingInAnotherTournament ? ' (⚠ Playing in another tournament)' : null}
                                {selectedInAnotherSide ? ` (🚫 Selected in another side)` : null}
                            </li>);
                        })}
                    </ol>
                </div>
            </div>)}
            <div className="modal-footer px-0 pb-0">
                <div className="left-aligned mx-0">
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
                {canAddPlayers
                    ? (<button className="btn btn-primary" onClick={() => setAddPlayerDialogOpen(true)}>Add player/s</button>)
                    : null}
                {side.id ? (<button className="btn btn-danger margin-right" onClick={onRemoveSide}>
                    Delete side
                </button>) : null}
                <button className="btn btn-primary" onClick={onSave}>Save</button>
            </div>
            {addPlayerDialogOpen ? renderCreatePlayerDialog(season) : null}
        </Dialog>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}