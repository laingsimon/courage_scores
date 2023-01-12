import {PlayerSelection} from "../../division_players/PlayerSelection";
import React from "react";
import {nameSort} from "../../../Utilities";

export function ManOfTheMatchInput({ account, allPlayers, fixtureData, access, saving, setFixtureData }) {
    function manOfTheMatchChanged(player, team) {
        const newFixtureData = Object.assign({}, fixtureData);
        newFixtureData[team].manOfTheMatch = player ? player.id : undefined;

        setFixtureData(newFixtureData);
    }

    function applicablePlayers() {
        const players = {
        };

        for (let index = 0; index < fixtureData.matches.length; index++) {
            const match = fixtureData.matches[index];

            (match.homePlayers || []).forEach(player => {
                players[player.id] = player;
            });

            (match.awayPlayers || []).forEach(player => {
                players[player.id] = player;
            });
        }

        return Object.values(players).sort(nameSort);
    }

    return (<tr>
        <td colSpan="2" className="text-end">
            {account.teamId === fixtureData.home.id || access === 'admin' ? (<PlayerSelection
                players={applicablePlayers()}
                disabled={access === 'readonly'}
                readOnly={saving}
                selected={{id: fixtureData.home.manOfTheMatch}}
                onChange={(elem, player) => manOfTheMatchChanged(player, 'home')}/>) : (<span>n/a</span>)}
        </td>
        <td className="width-1 p-0"></td>
        <td colSpan="2">
            {account.teamId === fixtureData.away.id || access === 'admin' ? (<PlayerSelection
                players={applicablePlayers()}
                disabled={access === 'readonly'}
                readOnly={saving}
                selected={{id: fixtureData.away.manOfTheMatch}}
                onChange={(elem, player) => manOfTheMatchChanged(player, 'away')}/>) : (<span>n/a</span>)}
        </td>
    </tr>);
}