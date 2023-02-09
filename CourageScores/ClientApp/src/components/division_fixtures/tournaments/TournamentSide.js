import React, {useState} from 'react';
import {MultiPlayerSelection} from "../scores/MultiPlayerSelection";
import {toMap, nameSort, createTemporaryId, sortBy} from "../../../Utilities";
import {BootstrapDropdown} from "../../common/BootstrapDropdown";
import {Link} from "react-router-dom";

export function TournamentSide({ seasonId, side, onChange, teams, otherSides, winner, readOnly, exceptPlayerIds }) {
    const team = { };
    const [sortOption, setSortOption] = useState('team');
    const [changeSideName, setChangeSideName] = useState(false);
    const teamOptions = [{ value: '', text: 'Select team', className: 'text-warning' }].concat(teams.map(t => { return { value: t.id, text: t.name }; }).sort(sortBy('text')));
    const teamMap = toMap(teams)

    const alreadySelectedOnAnotherSide = toMap(otherSides
        .filter(s => !side || s.id !== side.id)
        .flatMap(s => s.players || []));

    const playerToTeamMap = toMap(teams.flatMap(t => {
        const teamSeason = t.seasons.filter(ts => ts.seasonId === seasonId)[0];
        if (!teamSeason || !teamSeason.players) {
            return [];
        }

        return teamSeason.players.map(p => {
            return { id: p.id, player: p, team: t };
        });
    }));

    const sidePlayerMap = side ? toMap(side.players || []) : {};
    const sidePlayerTeamMapping = side && side.players && side.players.length > 0 ? playerToTeamMap[side.players[0].id] : null;

    const teamsAndPlayers = teams
        .flatMap(t => {
            if (side && sidePlayerTeamMapping && sidePlayerTeamMapping.team.id !== t.id) {
                // a player is selected from a different team. As players cannot be mixed between teams, skip this team
                return [];
            }

            if (side && side.teamId && t.id !== side.teamId) {
                return [];
            }

            const teamSeason = t.seasons.filter(ts => ts.seasonId === seasonId)[0];
            if (!teamSeason || !teamSeason.players) {
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

        return side.players.filter(p => p.id === tap.player.id).length === 0;
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

    async function updateSideName(event) {
        const newSide = Object.assign({}, side);
        newSide.newName = event.target.value;
        if (onChange) {
            await onChange(newSide);
        }
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
               {p.divisionId && p.divisionId !== '00000000-0000-0000-0000-000000000000' ? (<Link to={`/division/${p.divisionId}/player:${p.id}/${seasonId}`}>{p.name}</Link>) : p.name}
           </li>))}
       </ol>);
    }

    function renderSideName() {
        const singlePlayer = side.players.length === 1
           ? side.players[0]
           : null;

        let name = side.name;
        if (singlePlayer && singlePlayer.divisionId && singlePlayer.divisionId !== '00000000-0000-0000-0000-000000000000') {
            name = (<Link to={`/division/${singlePlayer.divisionId}/player:${singlePlayer.id}/${seasonId}`}>{side.name}</Link>);
        } else if (side.teamId && teamMap[side.teamId]) {
            const team = side.teamId ? teamMap[side.teamId] : null;
            name = (<Link to={`/division/${team.divisionId}/team:${team.id}/${seasonId}`}>{side.name}</Link>);
        }

        return (<strong title="Click to change" onClick={() => setChangeSideName(true)}>{name}</strong>);
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
            if (onChange) {
                await onChange(newSide);
            }
        }

        setChangeSideName(false);
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
    allPlayers.sort(nameSort);
    return (<div className={`position-relative p-1 m-1 ${winner ? 'bg-winner' : 'bg-light'}`} style={{ flexBasis: '100px', flexGrow: 1, flexShrink: 1 }}>
        {changeSideName && !readOnly
            ? (<input type="text" onChange={updateSideName} value={side.newName || side.name} onBlur={completeSideNameChange} />)
            : renderSideName()}
        {readOnly
            ? renderTeamName()
            : (<div><BootstrapDropdown options={teamOptions} value={side.teamId} onChange={updateTeamId} /></div>)}
        {readOnly
            ? renderPlayers()
            : (<MultiPlayerSelection players={side.players || []} allPlayers={allPlayers} onAddPlayer={onAddPlayer} onRemovePlayer={onRemovePlayer} placeholder="Select player" />)}
        {readOnly ? null : (<button className="btn btn-sm btn-danger position-absolute-bottom-right" onClick={removeSide}>🗑</button>)}
    </div>);
}
