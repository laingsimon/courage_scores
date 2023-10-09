import {PlayerSelection} from "../../division_players/PlayerSelection";
import React from "react";
import {distinct, sortBy} from "../../../helpers/collections";
import {useApp} from "../../../AppContainer";

export function ManOfTheMatchInput({fixtureData, access, saving, setFixtureData, disabled}) {
    const {account, onError} = useApp();

    function manOfTheMatchChanged(player, team) {
        try {
            const newFixtureData = Object.assign({}, fixtureData);
            newFixtureData[team].manOfTheMatch = player ? player.id : undefined;

            setFixtureData(newFixtureData);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    function applicablePlayers(side) {
        const property = side + 'Players';

        const players = fixtureData.matches.flatMap((match) => {
            const matchPlayers = [];

            (match[property] || []).forEach(player => {
                matchPlayers.push(player);
            });

            return matchPlayers;
        });

        return distinct(players, 'id').sort(sortBy('name'));
    }

    if (!account) {
        // man of the match cannot be displayed when logged out
        return null;
    }

    try {
        return (<tr>
            <td colSpan="2" className="text-end">
                {account.teamId === fixtureData.home.id || access === 'admin' ? (<PlayerSelection
                    players={applicablePlayers('away')}
                    disabled={disabled || access === 'readonly'}
                    readOnly={saving}
                    selected={{id: fixtureData.home.manOfTheMatch}}
                    onChange={(elem, player) => manOfTheMatchChanged(player, 'home')}/>) : (<span>n/a</span>)}
            </td>
            <td className="width-1 p-0"></td>
            <td colSpan="2">
                {account.teamId === fixtureData.away.id || access === 'admin' ? (<PlayerSelection
                    players={applicablePlayers('home')}
                    disabled={disabled || access === 'readonly'}
                    readOnly={saving}
                    selected={{id: fixtureData.away.manOfTheMatch}}
                    onChange={(elem, player) => manOfTheMatchChanged(player, 'away')}/>) : (<span>n/a</span>)}
            </td>
        </tr>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}