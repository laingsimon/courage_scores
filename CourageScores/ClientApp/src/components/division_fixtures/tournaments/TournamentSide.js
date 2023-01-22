import React, {useState} from 'react';
import {MultiPlayerSelection} from "../scores/MultiPlayerSelection";
import {toMap, nameSort, createTemporaryId} from "../../../Utilities";
import {BootstrapDropdown} from "../../common/BootstrapDropdown";

export function TournamentSide({ seasonId, side, onChange, teams, otherSides, winner, readOnly, exceptPlayerIds }) {
    const team = { };
    const [sortOption, setSortOption] = useState('team');
    const [changeSideName, setChangeSideName] = useState(false);
    const teamItems = teams.map(t => { return { value: t.id, text: t.name }; });

    const alreadySelectedOnAnotherSide = toMap(otherSides
        .filter(s => !side || s.id !== side.id)
        .flatMap(s => s.players));

    const playerToTeamMap = toMap(teams.flatMap(t => {
        const teamSeason = t.seasons.filter(ts => ts.seasonId === seasonId)[0];
        if (!teamSeason || !teamSeason.players) {
            return [];
        }

        return teamSeason.players.map(p => {
            return { id: p.id, player: p, team: t };
        });
    }));

    const sidePlayerMap = side ? toMap(side.players) : {};
    const sidePlayerTeamMapping = side && side.players && side.players.length > 0 ? playerToTeamMap[side.players[0].id] : null;

    const teamsAndPlayers = teams
        .flatMap(t => {
            if (side && sidePlayerTeamMapping && sidePlayerTeamMapping.team.id !== t.id) {
                // a player is selected from a different team. As players cannot be mixed between teams, skip this team
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

                    return { team: t, player: p };
                })
                .filter(mapping => mapping != null);
    });

    async function onAddPlayer(player) {
        const newSide = Object.assign({}, side);
        newSide.players = newSide.players || [];
        newSide.id = newSide.id || createTemporaryId();
        newSide.players.push({
            id: player.id,
            name: player.originalName
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
        newSide.name = newSide.players.length === 1 ? newSide.players[0].name : newSide.name;
        if (onChange) {
            await onChange(newSide);
        }
    }

    function exceptSelectedPlayer(tap) {
        return side.players.filter(p => p.id === tap.player.id).length === 0;
    }

    function toSelectablePlayer(tap) {
        if (side) {
            return { id: tap.player.id, name: tap.player.name, originalName: tap.player.name, team: tap.team };
        }

        return { id: tap.player.id, name: `${tap.player.name} (${tap.team.name})`, originalName: tap.player.name, team: tap.team };
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
        newSide.name = event.target.value;
        if (onChange) {
            await onChange(newSide);
        }
    }

    async function updateTeamId(teamId) {
        const newSide = Object.assign({}, side);
        newSide.teamId = teamId;
        if (onChange) {
            await onChange(newSide);
        }
    }

    if (!side && !readOnly) {
        teamsAndPlayers.sort(tapSort)
        const allPlayers = teamsAndPlayers.map(toSelectablePlayer);
        return (<div className="bg-yellow p-1 m-1">
            <strong>Add a side</strong> <label><input type="checkbox" checked={sortOption === 'player'} onChange={() => setSortOption(sortOption === 'player' ? 'team' : 'player')} /> Sort by player</label>
            <BootstrapDropdown 
                items={teamItems}
                onChange={updateTeamId} />
            <MultiPlayerSelection
                allPlayers={allPlayers}
                onAddPlayer={onAddPlayer}
                onRemovePlayer={onRemovePlayer}
                placeholder="Select player" />
        </div>);
    }

    const allPlayers = teamsAndPlayers.filter(exceptSelectedPlayer).map(toSelectablePlayer);
    allPlayers.sort(nameSort);
    return (<div className={`p-1 m-1 ${winner ? 'bg-winner' : 'bg-light'}`} style={{ flexBasis: '100px', flexGrow: 1, flexShrink: 1 }}>
        {changeSideName && !readOnly
            ? (<input type="text" onChange={updateSideName} value={side.name} onBlur={() => setChangeSideName(false)} />)
            : (<strong title="Click to change" onClick={() => setChangeSideName(true)}>{side.name}</strong>)}
        {readOnly ? (<span>{side.teamId || 'no team'}</span>) : (<BootstrapDropdown 
            items={teamItems}
            value={side.teamId}
            onChange={updateTeamId} />)}
        {readOnly ? (<ol className="no-list-indent">{side.players.map(p => <li key={p.id}>{p.name}</li>)}</ol>) : (<MultiPlayerSelection
            players={side.players || []}
            allPlayers={allPlayers}
            onAddPlayer={onAddPlayer}
            onRemovePlayer={onRemovePlayer}
            placeholder="Select player" />)}
    </div>);
}
