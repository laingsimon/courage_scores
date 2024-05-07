import {propChanged, stateChanged, valueChanged} from "../../helpers/events";
import {useState} from "react";
import {Dialog} from "../common/Dialog";
import {BootstrapDropdown, IBootstrapDropdownItem} from "../common/BootstrapDropdown";
import {useApp} from "../common/AppContainer";
import {any, sortBy} from "../../helpers/collections";
import {useTournament} from "./TournamentContainer";
import {EditPlayerDetails} from "../division_players/EditPlayerDetails";
import {EditTeamPlayerDto} from "../../interfaces/models/dtos/Team/EditTeamPlayerDto";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {TeamSeasonDto} from "../../interfaces/models/dtos/Team/TeamSeasonDto";
import {TeamPlayerDto} from "../../interfaces/models/dtos/Team/TeamPlayerDto";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {TournamentPlayerDto} from "../../interfaces/models/dtos/Game/TournamentPlayerDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";

export interface IEditSideProps {
    side: TournamentSideDto;
    onChange?(side: TournamentSideDto): Promise<any>;
    onClose(): Promise<any>;
    onApply(saveOptions: ISaveSideOptions): Promise<any>;
    onDelete?(side: TournamentSideDto): Promise<any>;
}

export interface ISaveSideOptions {
    addAsIndividuals: boolean;
}

interface ITeamPlayerMap {
    id: string;
    name: string;
    team: TeamDto;
}

interface ITournamentSideType {
    canSelectPlayers: boolean;
    canSelectTeams: boolean;
}

export function EditSide({side, onChange, onClose, onApply, onDelete}: IEditSideProps) {
    const {teams: teamMap, onError, account, reloadTeams} = useApp();
    const {tournamentData, season, alreadyPlaying} = useTournament();
    const [playerFilter, setPlayerFilter] = useState('');
    const [addPlayerDialogOpen, setAddPlayerDialogOpen] = useState<boolean>(false);
    const [saveOptions, setSaveOptions] = useState<ISaveSideOptions>({addAsIndividuals: false});
    const [newPlayerDetails, setNewPlayerDetails] = useState<EditTeamPlayerDto>({name: '', captain: false});
    const divisionId: string = tournamentData.divisionId;
    const selectATeam: IBootstrapDropdownItem = {value: '', text: 'Select team', className: 'text-warning'};
    const teamOptions: IBootstrapDropdownItem[] = [selectATeam].concat(teamMap.filter(teamSeasonForSameDivision).map((t: TeamDto) => {
        return {value: t.id, text: t.name};
    }).sort(sortBy('text')));
    const allPossiblePlayers: ITeamPlayerMap[] = teamMap
        .filter((_: TeamDto) => true) // turn the map back into an array
        .flatMap((t: TeamDto) => {
            const teamSeason: TeamSeasonDto = t.seasons.filter((ts: TeamSeasonDto) => ts.seasonId === season.id && !ts.deleted)[0];
            if (teamSeason && isTeamSeasonForDivision(teamSeason)) {
                return teamSeason.players.map((p: TeamPlayerDto): ITeamPlayerMap => {
                    return {id: p.id, name: p.name, team: t}
                }) || [];
            }

            return [];
        });
    const canAddPlayers: boolean = account && account.access && account.access.managePlayers && !side.teamId;
    const tournamentSideType: ITournamentSideType = getTournamentSideType(tournamentData);

    function getTournamentSideType(tournamentData: TournamentGameDto): ITournamentSideType {
        if (!any(tournamentData.sides)) {
            return {
                canSelectPlayers: true,
                canSelectTeams: true,
            };
        }

        return {
            canSelectTeams: any(tournamentData.sides, (s: TournamentSideDto) => !!s.teamId),
            canSelectPlayers: any(tournamentData.sides, (s: TournamentSideDto) => any(s.players || [])),
        };
    }

    function teamSeasonForSameDivision(team: TeamDto): boolean {
        const teamSeason: TeamSeasonDto = team.seasons.filter((ts: TeamSeasonDto) => ts.seasonId === season.id && !ts.deleted)[0];
        if (!teamSeason) {
            return false;
        }

        return isTeamSeasonForDivision(teamSeason);
    }

    function isTeamSeasonForDivision(teamSeason: TeamSeasonDto): boolean {
        return !(divisionId && teamSeason.divisionId && teamSeason.divisionId !== divisionId);
    }

    function getOtherSidePlayerSelectedIn(player: TournamentPlayerDto): TournamentSideDto {
        return tournamentData.sides.flatMap((s: TournamentSideDto) => {
            if (s.id === side.id) {
                // same side as being edited
                return [];
            }

            return any(s.players || [], (p: TournamentPlayerDto) => p.id === player.id)
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

    async function onSelectPlayer(player: TournamentPlayerDto, preventOnChange?: boolean, sideOverride?: TournamentSideDto): Promise<TournamentSideDto> {
        const newSide: TournamentSideDto = Object.assign({}, sideOverride || side);
        newSide.players = (newSide.players || []).concat({
            id: player.id,
            name: player.name,
            divisionId: player.divisionId
        });

        const oldSidePlayerName: string = (side.players || []).sort(sortBy('name')).map((p: TournamentPlayerDto) => p.name).join(', ');
        if ((side.name || '') === oldSidePlayerName) {
            newSide.name = newSide.players.sort(sortBy('name')).map((p: TournamentPlayerDto) => p.name).join(', ');
        }

        if (onChange && !preventOnChange) {
            await onChange(newSide);
        }

        return newSide;
    }

    async function updateTeamId(teamId: string) {
        try {
            const newSide: TournamentSideDto = Object.assign({}, side);
            if (teamId) {
                newSide.name = newSide.name || teamMap[teamId].name;
            } else {
                teamId = undefined;
            }

            newSide.teamId = teamId;

            if (onChange) {
                await onChange(newSide);
            }
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    async function togglePlayer(player: TournamentPlayerDto) {
        if (any(side.players || [], (p: TournamentPlayerDto) => p.id === player.id)) {
            await onDeselectPlayer(player.id);
            return;
        }

        const otherSidePlayerSelectedIn: TournamentSideDto = getOtherSidePlayerSelectedIn(player);
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

        await onApply(saveOptions);
    }

    function matchesPlayerFilter(player: TournamentPlayerDto): boolean {
        if (!playerFilter) {
            return true;
        }

        return player.name.toLowerCase().indexOf(playerFilter.toLowerCase()) !== -1;
    }

    function renderCreatePlayerDialog(season: SeasonDto) {
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

    async function reloadPlayers(_: TeamDto, newPlayers: TeamPlayerDto[]) {
        await reloadTeams();
        setAddPlayerDialogOpen(false);
        setNewPlayerDetails({name: '', captain: false});

        let newSide: TournamentSideDto = side;
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

        return (<Dialog title={side.id ? 'Edit side' : (saveOptions.addAsIndividuals ? 'Add players' : 'Add side')} slim={true} className="d-print-none">
            {saveOptions.addAsIndividuals ? null : (<div className="form-group input-group mb-3 d-print-none">
                <div className="input-group-prepend">
                    <label htmlFor="name" className="input-group-text">Name</label>
                </div>
                <input className="form-control" value={side.name || ''} name="name" id="name"
                       onChange={valueChanged(side, onChange)}/>
            </div>)}
            <div className="form-switch margin-right my-1 me-2">
                <input type="checkbox" className="form-check-input margin-right" checked={side.noShow || false} name="noShow"
                       id="noShow"
                       onChange={valueChanged(side, onChange)}/>
                <label className="form-check-label" htmlFor="noShow">No show on the night?</label>
            </div>
            {any(side.players || []) || !tournamentSideType.canSelectTeams ? null : (
                <div className="form-group input-group mb-3 d-print-none">
                    <div className="input-group-prepend">
                        <span className="input-group-text">Team</span>
                    </div>
                    <BootstrapDropdown options={teamOptions} value={side.teamId} onChange={updateTeamId}/>
                </div>)}
            {side.teamId || !tournamentSideType.canSelectPlayers ? null : (<div>
                <div className="d-flex justify-content-between align-items-center p-2 pt-0">
                    <div>Who's playing</div>
                    <div>
                        <label htmlFor="playerFilter" className="margin-right">Filter</label>
                        <input id="playerFilter" name="playerFilter" onChange={stateChanged(setPlayerFilter)}
                               value={playerFilter}/>
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
                            const selected: boolean = any(side.players || [], (p: TournamentPlayerDto) => p.id === player.id);
                            const playingInAnotherTournament = alreadyPlaying[player.id];
                            const selectedInAnotherSide: TournamentSideDto = getOtherSidePlayerSelectedIn(player);
                            const hasSameNameAsAnotherPlayer: boolean = allPossiblePlayers.filter((p: ITeamPlayerMap) => p.name === player.name).length > 1;

                            return (<li key={player.id}
                                        className={`list-group-item${selected ? ' active' : ''}${selectedInAnotherSide ? ' disabled' : ''}`}
                                        onClick={() => togglePlayer(player)}>
                                {player.name}
                                {hasSameNameAsAnotherPlayer ? ` [${player.team.name}]` : null}
                                {playingInAnotherTournament ? ' (⚠ Playing in another tournament)' : null}
                                {selectedInAnotherSide ? ` (🚫 Selected in "${selectedInAnotherSide.name}")` : null}
                            </li>);
                        })}
                    </ol>
                </div>
            </div>)}
            <div className="modal-footer px-0 pb-0">
                <div className="left-aligned mx-0">
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
                {!side.id && (side.players || []).length >= 2 ? (<span className="form-switch margin-right my-1">
                    <input type="checkbox" className="form-check-input margin-right" checked={saveOptions.addAsIndividuals} name="addAsIndividuals"
                           id="addAsIndividuals"
                           onChange={valueChanged(saveOptions, setSaveOptions)}/>
                    <label className="form-check-label no-wrap" htmlFor="addAsIndividuals">Add as individuals</label>
                </span>) : null}
                {canAddPlayers
                    ? (<button className="btn btn-primary" onClick={() => setAddPlayerDialogOpen(true)}>Add
                        player/s</button>)
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