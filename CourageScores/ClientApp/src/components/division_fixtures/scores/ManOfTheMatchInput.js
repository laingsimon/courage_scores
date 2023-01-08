import {PlayerSelection} from "../../division_players/PlayerSelection";
import React from "react";

export function ManOfTheMatchInput({ account, allPlayers, fixtureData, access, saving, setFixtureData }) {
    function manOfTheMatchChanged(player, team) {
        const newFixtureData = Object.assign({}, fixtureData);
        newFixtureData[team].manOfTheMatch = player ? player.id : undefined;

        setFixtureData(newFixtureData);
    }

    return (<tr>
        <td colSpan="2">
            Man of the match<br/>
            {account.teamId === fixtureData.home.id || access === 'admin' ? (<PlayerSelection
                players={allPlayers}
                disabled={access === 'readonly'}
                readOnly={saving}
                selected={{id: fixtureData.home.manOfTheMatch}}
                onChange={(elem, player) => manOfTheMatchChanged(player, 'home')}/>) : (<span>n/a</span>)}
        </td>
        <td className="width-1 p-0"></td>
        <td colSpan="2">
            Man of the match<br/>
            {account.teamId === fixtureData.away.id || access === 'admin' ? (<PlayerSelection
                players={allPlayers}
                disabled={access === 'readonly'}
                readOnly={saving}
                selected={{id: fixtureData.away.manOfTheMatch}}
                onChange={(elem, player) => manOfTheMatchChanged(player, 'away')}/>) : (<span>n/a</span>)}
        </td>
    </tr>);
}