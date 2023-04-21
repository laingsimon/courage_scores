import {PlayerSelection} from "../../division_players/PlayerSelection";
import React from "react";
import {sortBy} from "../../../Utilities";
import {useApp} from "../../../AppContainer";

export function ManOfTheMatchInput({ fixtureData, access, saving, setFixtureData }) {
    const { account, onError } = useApp();
    function manOfTheMatchChanged(player, team) {
        try {
            const newFixtureData = Object.assign({}, fixtureData);
            newFixtureData[team].manOfTheMatch = player ? player.id : undefined;

            setFixtureData(newFixtureData);
        } catch (e) {
            onError(e);
        }
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

        return Object.values(players).sort(sortBy('name'));
    }

    try {
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
    } catch (e) {
        onError(e);
    }
}