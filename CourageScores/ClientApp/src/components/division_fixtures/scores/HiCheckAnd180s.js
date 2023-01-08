import {MultiPlayerSelection} from "./MultiPlayerSelection";
import React from "react";

export function HiCheckAnd180s({ access, saving, fixtureData, allPlayers, setFixtureData }){
    function add180(player) {
        const newFixtureData = Object.assign({}, fixtureData);
        const firstMatch = Object.assign({}, fixtureData.matches[0]);
        newFixtureData.matches[0] = firstMatch;

        if (!firstMatch.oneEighties) {
            firstMatch.oneEighties = [];
        }

        firstMatch.oneEighties.push({
            id: player.id,
            name: player.name
        });

        setFixtureData(newFixtureData);
    }

    function remove180(playerId, index) {
        const newFixtureData = Object.assign({}, fixtureData);
        const firstMatch = Object.assign({}, fixtureData.matches[0]);
        newFixtureData.matches[0] = firstMatch;

        firstMatch.oneEighties.splice(index, 1);

        setFixtureData(newFixtureData);
    }

    function addHiCheck(player, notes) {
        const newFixtureData = Object.assign({}, fixtureData);
        const firstMatch = Object.assign({}, fixtureData.matches[0]);
        newFixtureData.matches[0] = firstMatch;

        if (!firstMatch.over100Checkouts) {
            firstMatch.over100Checkouts = [];
        }

        firstMatch.over100Checkouts.push({
            id: player.id,
            name: player.name,
            notes: notes
        });

        setFixtureData(newFixtureData);
    }

    function removeHiCheck(playerId, index) {
        const newFixtureData = Object.assign({}, fixtureData);
        const firstMatch = Object.assign({}, fixtureData.matches[0]);
        newFixtureData.matches[0] = firstMatch;

        firstMatch.over100Checkouts.splice(index, 1);

        setFixtureData(newFixtureData);
    }

    return (<tr>
        <td colSpan="2">
            180s<br/>
            <MultiPlayerSelection
                disabled={access === 'readonly'}
                readOnly={saving || (fixtureData.resultsPublished && access !== 'admin')}
                allPlayers={allPlayers}
                players={fixtureData.matches[0].oneEighties || []}
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
                allPlayers={allPlayers}
                players={fixtureData.matches[0].over100Checkouts || []}
                onRemovePlayer={removeHiCheck}
                onAddPlayer={addHiCheck}
                showNotes={true}
                divisionId={fixtureData.divisionId}
                seasonId={fixtureData.seasonId} />
        </td>
    </tr>);
}