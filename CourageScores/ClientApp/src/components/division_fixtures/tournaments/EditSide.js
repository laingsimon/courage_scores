import {valueChanged} from "../../../helpers/events";
import React from "react";
import {Dialog} from "../../common/Dialog";
import {BootstrapDropdown} from "../../common/BootstrapDropdown";
import {useApp} from "../../../AppContainer";
import {any, sortBy} from "../../../helpers/collections";
import {useTournament} from "./TournamentContainer";

export function EditSide({ side, onChange, onClose, onApply, onDelete }) {
    const { teams: teamMap, onError } = useApp();
    const { tournamentData, season, alreadyPlaying } = useTournament();
    const divisionId = tournamentData.divisionId;
    const selectATeam = { value: '', text: 'Select team', className: 'text-warning' };
    const teamOptions = [selectATeam].concat(teamMap.filter(teamSeasonForSameDivision).map(t => { return { value: t.id, text: t.name }; }).sort(sortBy('text')));
    const allPossiblePlayers = teamMap
        .filter(a => a) // turn the map back into an array
        .flatMap(t => {
            if (side && side.teamId && t.id !== side.teamId) {
                return [];
            }

            const teamSeason = t.seasons.filter(ts => ts.seasonId === season.id)[0];
            if (teamSeason && isTeamSeasonForDivision(teamSeason)) {
                return teamSeason.players || [];
            }

            return [];
        });

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
                ? [ s ]
                : [];
        })[0];
    }

    async function onRemovePlayer(playerId) {
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

    async function onAddPlayer(player) {
        const newSide = Object.assign({}, side);
        newSide.players = (newSide.players || []).concat({
            id: player.id,
            name: player.name,
            divisionId: player.divisionId
        });

        const oldSidePlayerName = (side.players || []).sort(sortBy('name')).map(p => p.name).join(', ');
        if (side.name === oldSidePlayerName) {
            newSide.name = newSide.players.sort(sortBy('name')).map(p => p.name).join(', ');
        }

        if (onChange) {
            await onChange(newSide);
        }
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
        if (side.players && any(side.players, p => p.id === player.id)) {
            await onRemovePlayer(player.id);
            return;
        }

        const playingInAnotherTournament = alreadyPlaying[player.id];
        const otherSidePlayerSelectedIn = getOtherSidePlayerSelectedIn(player);
        if (!playingInAnotherTournament && !otherSidePlayerSelectedIn) {
            await onAddPlayer(player);
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

    try {
        return (<Dialog title={side.id ? 'Edit side' : 'Add side'} slim={true}>
            <div className="form-group input-group mb-3 d-print-none">
                <div className="input-group-prepend">
                    <span className="input-group-text">Name</span>
                </div>
                <input id="type-text" className="form-control" value={side.name || ''} name="name"
                       onChange={valueChanged(side, onChange)}/>
            </div>
            {any(side.players || []) ? null : (<div className="form-group input-group mb-3 d-print-none">
                <div className="input-group-prepend">
                    <span className="input-group-text">Team</span>
                </div>
                <BootstrapDropdown options={teamOptions} value={side.teamId} onChange={updateTeamId} />
            </div>)}
            {side.teamId ? null : (<div>
                <p>Who's playing</p>
                <div className="max-scroll-height overflow-auto">
                    <ol className="list-group mb-3">
                        {allPossiblePlayers.sort(sortBy('name')).map(player => {
                            const selected = side.players && any(side.players, p => p.id === player.id);
                            const playingInAnotherTournament = alreadyPlaying[player.id];
                            const selectedInAnotherSide = getOtherSidePlayerSelectedIn(player);
                            return (<li key={player.id}
                                        className={`list-group-item${selected ? ' active' : ''}${playingInAnotherTournament || selectedInAnotherSide ? ' disabled' : ''}`}
                                        onClick={() => togglePlayer(player)}>
                                {player.name}
                                {playingInAnotherTournament ? ' (🚫 Playing in another tournament)' : null}
                                {selectedInAnotherSide ? ` (🚫 Selected in another side)` : null}
                            </li>);
                        })}
                    </ol>
                </div>
            </div>)}
            <div className="modal-footer px-0">
                <div className="left-aligned">
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
                {side.id ? (<button className="btn btn-danger margin-right" onClick={onRemoveSide}>
                    Delete side
                </button>) : null}
                <button className="btn btn-primary" onClick={onSave}>Save</button>
            </div>
        </Dialog>);
    } catch (e) {
        onError(e);
    }
}