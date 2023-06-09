import React, {useState} from 'react';
import {MultiPlayerSelection} from "../scores/MultiPlayerSelection";
import {createTemporaryId, EMPTY_ID} from "../../../helpers/projection";
import {valueChanged} from "../../../helpers/events";
import {toMap, sortBy, any, isEmpty} from "../../../helpers/collections";
import {BootstrapDropdown} from "../../common/BootstrapDropdown";
import {Link} from "react-router-dom";
import {useApp} from "../../../AppContainer";

export function TournamentSide({ seasonId, side, onChange, otherSides, winner, readOnly, exceptPlayerIds, divisionId }) {
    const team = { };
    const selectATeam = { value: '', text: 'Select team', className: 'text-warning' };
    const { teams: teamMap } = useApp();
    const [sortOption, setSortOption] = useState('team');
    const [changeSideName, setChangeSideName] = useState(false);
    const teamOptions = [selectATeam].concat(teamMap.filter(teamSeasonForSameDivision).map(t => { return { value: t.id, text: t.name }; }).sort(sortBy('text')));

    const alreadySelectedOnAnotherSide = toMap(otherSides
        .filter(s => !side || s.id !== side.id)
        .flatMap(s => s.players || []));

    const playerToTeamMap = toMap(teamMap
        .filter(a => a)  // turn the map back into an array
        .flatMap(t => {
            const teamSeason = t.seasons.filter(ts => ts.seasonId === seasonId)[0];
            if (!teamSeason || !teamSeason.players) {
                return [];
            }

            return teamSeason.players.map(p => {
                return { id: p.id, player: p, team: t };
            });
        }));

    const sidePlayerMap = side ? toMap(side.players || []) : {};
    const sidePlayerTeamMapping = side && side.players && any(side.players) ? playerToTeamMap[side.players[0].id] : null;

    const teamsAndPlayers = teamMap
        .filter(a => a) // turn the map back into an array
        .flatMap(t => {
            if (side && sidePlayerTeamMapping && sidePlayerTeamMapping.team.id !== t.id) {
                // a player is selected from a different team. As players cannot be mixed between teams, skip this team
                return [];
            }

            if (side && side.teamId && t.id !== side.teamId) {
                return [];
            }

            const teamSeason = t.seasons.filter(ts => ts.seasonId === seasonId)[0];
            if (!teamSeason || !teamSeason.players || !isTeamSeasonForDivision(teamSeason)) {
                return [];
            }

            return teamSeason.players
                .filter(p => !alreadySelectedOnAnotherSide[p.id] && !exceptPlayerIds[p.id])
                .map(p => {
                    if (side && sidePlayerMap[p.id] && !team.id) {
                        // this player&team have already been selected for this side, retain some details of the team
                        // so the name of the side can be the teams' name if multiple players are selected
                        team.id = t.id;
                        team.name = t.name;
                        team.players = t.players;
                    }

                    return { team: t, player: Object.assign({}, p, { divisionId: t.divisionId }) };
                });
    });

    function teamSeasonForSameDivision(team) {
        const teamSeason = team.seasons.filter(ts => ts.seasonId === seasonId)[0];
        if (!teamSeason) {
            return false;
        }

        return isTeamSeasonForDivision(teamSeason);
    }

    function isTeamSeasonForDivision(teamSeason) {
        return !(divisionId && teamSeason.divisionId && teamSeason.divisionId !== divisionId);
    }

    async function onAddPlayer(player) {
        const newSide = Object.assign({}, side);
        newSide.players = newSide.players || [];
        newSide.id = newSide.id || createTemporaryId();
        newSide.players.push({
            id: player.id,
            name: player.originalName,
            divisionId: player.divisionId
        });
        newSide.name = newSide.players.length === 1 ? newSide.players[0].name : player.team.name;
        if (onChange) {
            await onChange(newSide);
        }
    }

    async function onRemovePlayer(playerId) {
        const newSide = Object.assign({}, side);
        newSide.players = newSide.players || [];
        newSide.players = newSide.players.filter(p => p.id !== playerId);

        switch (newSide.players.length) {
            case 1:
                newSide.name = newSide.players[0].name;
                break;
            case 0:
                if (teamMap[newSide.teamId]) {
                    newSide.name = teamMap[newSide.teamId].name;
                } else {
                    newSide.team = null;
                }
                break;
            default:
                break;
        }

        if (onChange) {
            await onChange(newSide);
        }
    }

    function exceptSelectedPlayer(tap) {
        if (!side.players) {
            return true;
        }

        return isEmpty(side.players, p => p.id === tap.player.id);
    }

    function toSelectablePlayer(tap) {
        return {
            id: tap.player.id,
            name: side
                ? tap.player.name
                : `${tap.player.name} (${tap.team.name})`,
            originalName: tap.player.name,
            team: tap.team,
            divisionId: tap.player.divisionId
        };
    }

    function tapSort(x, y) {
        if (sortOption === 'team') {
            if (x.team.name === y.team.name) {
                if (x.player.name === y.player.name) {
                    return 0;
                }

                return x.player.name > y.player.name ? 1 : -1;
            }

            return x.team.name > y.team.name ? 1 : -1;
        } else if (sortOption === 'player') {
            if (x.player.name === y.player.name) {
                return 0;
            }

            return x.player.name > y.player.name ? 1 : -1;
        }

        return 0;
    }

    async function updateTeamId(teamId) {
        const newSide = Object.assign({}, side);
        if (teamId) {
            newSide.name = teamMap[teamId].name;
        } else {
            teamId = undefined;
        }
        newSide.teamId = teamId;
        if (onChange) {
            await onChange(newSide);
        }
    }

    function renderTeamName() {
        const team = side.teamId ? teamMap[side.teamId] : null;
        if (!team || team.name === side.name) {
            return null;
        }

        return (<div><Link to={`/division/${team.divisionId}/team:${team.id}/${seasonId}`}>{team.name}</Link></div>);
    }

    function renderPlayers () {
        if (!side.players) {
            return null;
        }

        if (side.players.length === 1 && side.players[0].name === side.name) {
            return null;
        }

        return (<ol className="no-list-indent">
            {side.players.map(p => (<li key={p.id}>
                {p.divisionId && p.divisionId !== EMPTY_ID ? (<Link to={`/division/${p.divisionId}/player:${p.id}/${seasonId}`}>{p.name}</Link>) : p.name}
            </li>))}
        </ol>);
    }

    function renderSideName() {
        const singlePlayer = side.players && side.players.length === 1
           ? side.players[0]
           : null;

        let name = side.name;
        if (singlePlayer && singlePlayer.divisionId && singlePlayer.divisionId !== EMPTY_ID) {
            name = (<Link to={`/division/${singlePlayer.divisionId}/player:${singlePlayer.id}/${seasonId}`}>{side.name}</Link>);
        } else if (side.teamId && teamMap[side.teamId]) {
            const team = side.teamId ? teamMap[side.teamId] : null;
            name = (<Link to={`/division/${team.divisionId}/team:${team.id}/${seasonId}`}>{side.name}</Link>);
        }

        return (<strong>{name}</strong>);
    }

    async function removeSide() {
        if (!window.confirm(`Are you sure you want to remove ${side.name}?`)) {
            return;
        }

        const newSide = Object.assign({}, side);
        newSide.name = undefined;
        newSide.players = [];
        newSide.teamId = null;
        if (onChange) {
            await onChange(newSide);
        }
    }

    async function completeSideNameChange() {
        if (side.name !== (side.newName || side.name)) {
            const newSide = Object.assign({}, side);
            newSide.name = side.newName;
            delete newSide.newName;
            if (onChange) {
                await onChange(newSide);
            }
        }

        setChangeSideName(false);
    }

    async function onChangeSideName() {
        if (changeSideName) {
            await completeSideNameChange();
            setChangeSideName(false);
        } else {
            setChangeSideName(true);
        }
    }

    if (!side && !readOnly) {
        teamsAndPlayers.sort(tapSort)
        const allPlayers = teamsAndPlayers.map(toSelectablePlayer);
        return (<div className="bg-yellow p-1 m-1">
            <strong>Add a side</strong> <label><input type="checkbox" checked={sortOption === 'player'} onChange={() => setSortOption(sortOption === 'player' ? 'team' : 'player')} /> Sort by player</label>
            <div>
                <BootstrapDropdown
                    options={teamOptions}
                    onChange={updateTeamId}
                    value={''}/>
            </div>
            <MultiPlayerSelection
                allPlayers={allPlayers}
                onAddPlayer={onAddPlayer}
                onRemovePlayer={onRemovePlayer}
                placeholder="Select player" />
        </div>);
    }

    const allPlayers = teamsAndPlayers.filter(exceptSelectedPlayer).map(toSelectablePlayer);
    allPlayers.sort(sortBy('name'));
    return (<div className={`position-relative p-1 m-1 ${winner ? 'bg-winner' : 'bg-light'}`} style={{ flexBasis: '100px', flexGrow: 1, flexShrink: 1 }}>
        {changeSideName && !readOnly
            ? (<input autoFocus type="text" name="newName" onChange={valueChanged(side, onChange)} value={side.newName || side.name || ''} />)
            : renderSideName()}
        {changeSideName ? null : readOnly
            ? renderTeamName()
            : (<div><BootstrapDropdown options={teamOptions} value={side.teamId} onChange={updateTeamId} /></div>)}
        {changeSideName ? null : readOnly
            ? renderPlayers()
            : (<MultiPlayerSelection players={side.players || []} allPlayers={allPlayers} onAddPlayer={onAddPlayer} onRemovePlayer={onRemovePlayer} placeholder="Select player" />)}
        {readOnly ? null : (<div className="position-absolute-bottom-right">
            <button className={`btn btn-sm ${changeSideName ? 'btn-success' : 'btn-primary'}`} onClick={onChangeSideName}>
                {changeSideName ? '✅' : '✏️'}
            </button>
            {changeSideName ? null : (<button className="btn btn-sm btn-danger" onClick={removeSide}>🗑</button>)}
        </div>)}
    </div>);
}
