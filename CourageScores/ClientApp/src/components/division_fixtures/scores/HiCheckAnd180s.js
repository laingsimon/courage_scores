import {MultiPlayerSelection} from "./MultiPlayerSelection";
import React from "react";
import {nameSort} from "../../../Utilities";

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

        return Object.values(players).sort(nameSort);
    }

    function add180(player) {
        const newFixtureData = Object.assign({}, fixtureData);

        if (!newFixtureData.oneEighties) {
            newFixtureData.oneEighties = [];
        }

        newFixtureData.oneEighties.push({
            id: player.id,
            name: player.name
        });

        setFixtureData(newFixtureData);
    }

    function remove180(playerId, index) {
        const newFixtureData = Object.assign({}, fixtureData);

        newFixtureData.oneEighties.splice(index, 1);

        setFixtureData(newFixtureData);
    }

    function addHiCheck(player, notes) {
        const newFixtureData = Object.assign({}, fixtureData);

        if (!newFixtureData.over100Checkouts) {
            newFixtureData.over100Checkouts = [];
        }

        newFixtureData.over100Checkouts.push({
            id: player.id,
            name: player.name,
            notes: notes
        });

        setFixtureData(newFixtureData);
    }

    function removeHiCheck(playerId, index) {
        const newFixtureData = Object.assign({}, fixtureData);

        newFixtureData.over100Checkouts.splice(index, 1);

        setFixtureData(newFixtureData);
    }

    return (<tr>
        <td colSpan="2" className="text-end">
            180s<br/>
            <MultiPlayerSelection
                disabled={access === 'readonly'}
                readOnly={saving || (fixtureData.resultsPublished && access !== 'admin')}
                allPlayers={applicablePlayers()}
                players={fixtureData.oneEighties || []}
                onRemovePlayer={remove180}
                onAddPlayer={add180}
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
                onRemovePlayer={removeHiCheck}
                onAddPlayer={addHiCheck}
                showNotes={true}
                divisionId={fixtureData.divisionId}
                seasonId={fixtureData.seasonId}
                dropdownClassName="hi-check-player-dropdown" />
        </td>
    </tr>);
}