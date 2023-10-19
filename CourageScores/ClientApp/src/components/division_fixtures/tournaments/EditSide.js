import {propChanged, stateChanged, valueChanged} from "../../../helpers/events";
import React, {useState} from "react";
import {Dialog} from "../../common/Dialog";
import {BootstrapDropdown} from "../../common/BootstrapDropdown";
import {useApp} from "../../../AppContainer";
import {any, sortBy} from "../../../helpers/collections";
import {useTournament} from "./TournamentContainer";
import {EditPlayerDetails} from "../../division_players/EditPlayerDetails";

export function EditSide({side, onChange, onClose, onApply, onDelete}) {
    const {teams: teamMap, onError, account, reloadTeams} = useApp();
    const {tournamentData, season, alreadyPlaying} = useTournament();
    const [playerFilter, setPlayerFilter] = useState('');
    const [addPlayerDialogOpen, setAddPlayerDialogOpen] = useState(false);
    const [newPlayerDetails, setNewPlayerDetails] = useState({name: '', captain: false});
    const divisionId = tournamentData.divisionId;
    const selectATeam = {value: '', text: 'Select team', className: 'text-warning'};
    const teamOptions = [selectATeam].concat(teamMap.filter(teamSeasonForSameDivision).map(t => {
        return {value: t.id, text: t.name};
    }).sort(sortBy('text')));
    const allPossiblePlayers = teamMap
        .filter(a => a) // turn the map back into an array
        .flatMap(t => {
            const teamSeason = t.seasons.filter(ts => ts.seasonId === season.id)[0];
            if (teamSeason && isTeamSeasonForDivision(teamSeason)) {
                return teamSeason.players.map(p => {
                    return {id: p.id, name: p.name, team: t}
                }) || [];
            }

            return [];
        });
    const canAddPlayers = account.access.managePlayers && !side.teamId;

    function teamSeasonForSameDivision(team) {
        const teamSeason = team.seasons.filter(ts => ts.seasonId === season.id)[0];
        if (!teamSeason) {
            return false;
        }

        return isTeamSeasonForDivision(teamSeason);
    }

    function isTeamSeasonForDivision(teamSeason) {
        return !(divisionId && teamSeason.divisionId && teamSeason.divisionId !== divisionId);
    }

    function getOtherSidePlayerSelectedIn(player) {
        return tournamentData.sides.flatMap(s => {
            if (s.id === side.id) {
                // same side as being edited
                return [];
            }

            return any(s.players || [], p => p.id === player.id)
                ? [s]
                : [];
        })[0];
    }

    async function onDeselectPlayer(playerId) {
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

    async function onSelectPlayer(player, preventOnChange, sideOverride) {
        const newSide = Object.assign({}, sideOverride || side);
        newSide.players = (newSide.players || []).concat({
            id: player.id,
            name: player.name,
            divisionId: player.divisionId
        });

        const oldSidePlayerName = (side.players || []).sort(sortBy('name')).map(p => p.name).join(', ');
        if ((side.name || '') === oldSidePlayerName) {
            newSide.name = newSide.players.sort(sortBy('name')).map(p => p.name).join(', ');
        }

        if (onChange && !preventOnChange) {
            await onChange(newSide);
        }

        return newSide;
    }

    async function updateTeamId(teamId) {
        const newSide = Object.assign({}, side);
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

    async function togglePlayer(player) {
        if (any(side.players || [], p => p.id === player.id)) {
            await onDeselectPlayer(player.id);
            return;
        }

        const otherSidePlayerSelectedIn = getOtherSidePlayerSelectedIn(player);
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

    function matchesPlayerFilter(player) {
        if (!playerFilter) {
            return true;
        }

        return player.name.toLowerCase().indexOf(playerFilter.toLowerCase()) !== -1;
    }

    function renderCreatePlayerDialog(season) {
        return (<Dialog title={`Add a player...`}>
            <EditPlayerDetails
                id={null}
                player={newPlayerDetails}
                seasonId={season.id}
                divisionId={tournamentData.divisionId}
                onChange={propChanged(newPlayerDetails, setNewPlayerDetails)}
                onCancel={() => setAddPlayerDialogOpen(false)}
                onSaved={reloadPlayers}
            />
        </Dialog>);
    }
    async function reloadPlayers(newTeam, newPlayers) {
        await reloadTeams();
        setAddPlayerDialogOpen(false);
        setNewPlayerDetails({name: '', captain: false});

        let newSide = side;
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
        const filteredPlayers = allPossiblePlayers.filter(matchesPlayerFilter);

        return (<Dialog title={side.id ? 'Edit side' : 'Add side'} slim={true}>
            <div className="form-group input-group mb-3 d-print-none">
                <div className="input-group-prepend">
                    <span className="input-group-text">Name</span>
                </div>
                <input className="form-control" value={side.name || ''} name="name"
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
                        <span className="margin-right">Filter</span>
                        <input name="playerFilter" onChange={stateChanged(setPlayerFilter)} value={playerFilter}/>
                        {playerFilter
                            ? (<span className="margin-left">
                                {filteredPlayers.length} of {allPossiblePlayers.length} player/s
                            </span>)
                            : null}
                    </div>
                </div>
                <div className="max-scroll-height overflow-auto height-250">
                    <ol className="list-group mb-3">
                        {filteredPlayers.sort(sortBy('name')).map(player => {
                            const selected = any(side.players || [], p => p.id === player.id);
                            const playingInAnotherTournament = alreadyPlaying[player.id];
                            const selectedInAnotherSide = getOtherSidePlayerSelectedIn(player);
                            const hasSameNameAsAnotherPlayer = allPossiblePlayers.filter(p => p.name === player.name).length > 1;

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