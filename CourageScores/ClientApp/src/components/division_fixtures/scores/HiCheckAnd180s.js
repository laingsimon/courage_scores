import {MultiPlayerSelection} from "./MultiPlayerSelection";
import React from "react";
import {sortBy} from "../../../Utilities";
import {add180, addHiCheck, remove180, removeHiCheck} from "../../common/Accolades";

export function HiCheckAnd180s({ access, saving, fixtureData, setFixtureData }){
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

    return (<tr>
        <td colSpan="2" className="text-end">
            180s<br/>
            <MultiPlayerSelection
                disabled={access === 'readonly'}
                readOnly={saving || (fixtureData.resultsPublished && access !== 'admin')}
                allPlayers={applicablePlayers()}
                players={fixtureData.oneEighties || []}
                onRemovePlayer={remove180(fixtureData, setFixtureData)}
                onAddPlayer={add180(fixtureData, setFixtureData)}
                divisionId={fixtureData.divisionId}
                seasonId={fixtureData.seasonId} />
        </td>
        <td className="width-1 p-0"></td>
        <td colSpan="2">
            100+ c/o<br/>
            <MultiPlayerSelection
                disabled={access === 'readonly'}
                readOnly={saving || (fixtureData.resultsPublished && access !== 'admin')}
                allPlayers={applicablePlayers()}
                players={fixtureData.over100Checkouts || []}
                onRemovePlayer={removeHiCheck(fixtureData, setFixtureData)}
                onAddPlayer={addHiCheck(fixtureData, setFixtureData)}
                showNotes={true}
                divisionId={fixtureData.divisionId}
                seasonId={fixtureData.seasonId}
                dropdownClassName="hi-check-player-dropdown" />
        </td>
    </tr>);
}