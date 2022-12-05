import React from 'react';
import {MultiPlayerSelection} from "../scores/MultiPlayerSelection";

export function KnockoutSide({ seasonId, side, onChange, teams, otherSides }) {
    const team = { };
    const teamsAndPlayers = teams
        .map(t => {
            const teamSeason = t.seasons.filter(ts => ts.seasonId === seasonId)[0];

            if (side && side.players) {
                const playerFound = side.players.reduce((prev, sidePlayer) => prev || teamSeason.players.filter(p => sidePlayer.id === p.id).length > 0, false);
                if (!playerFound) {
                    // the side contains a player, only allow other players from the same team.
                    return [];
                }

                team.id = t.id;
                team.name = t.name;
                team.players = teamSeason.players;
            }

            if (otherSides) {
                for (let index = 0; index < otherSides.length; index++) {
                    const otherSide = otherSides[index];
                    const playerFound = otherSide.players.reduce((prev, sidePlayer) => prev || teamSeason.players.filter(p => sidePlayer.id === p.id).length > 0, false);
                    if (playerFound) {
                        // don't allow teams from another selected side to be picked
                        return [];
                    }
                }
            }

            return teamSeason ? teamSeason.players.map(p => { return { player: p, team: t }; }) : [];
        })
        .flatMap(mapping => mapping);

    async function onAddPlayer(player) {
        const newSide = Object.assign({}, side);
        newSide.players = newSide.players || [];
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

    if (!side) {
        return (<div className="bg-yellow p-1 m-1">
            <strong>Add a side</strong>
            <MultiPlayerSelection
                allPlayers={teamsAndPlayers.map(toSelectablePlayer)}
                onAddPlayer={onAddPlayer}
                onRemovePlayer={onRemovePlayer} />
        </div>);
    }

    return (<div className="bg-light p-1 m-1">
        <strong>{side.name}</strong>
        <MultiPlayerSelection
            players={side.players || []}
            allPlayers={teamsAndPlayers.filter(exceptSelectedPlayer).map(toSelectablePlayer)}
            onAddPlayer={onAddPlayer}
            onRemovePlayer={onRemovePlayer} />
    </div>);
}