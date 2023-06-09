import {MultiPlayerSelection} from "./MultiPlayerSelection";
import React from "react";
import {any, distinct, sortBy} from "../../../helpers/collections";
import {add180, addHiCheck, remove180, removeHiCheck} from "../../common/Accolades";
import {useApp} from "../../../AppContainer";

export function HiCheckAnd180s({ access, saving, fixtureData, setFixtureData }){
    const { onError } = useApp();

    function getApplicablePlayers() {
        const players = fixtureData.matches.flatMap((match) => {
            const matchPlayers = [];

            (match.homePlayers || []).forEach(player => {
                matchPlayers.push(player);
            });

            (match.awayPlayers || []).forEach(player => {
                matchPlayers.push(player);
            });

            return matchPlayers;
        });

        return distinct(players, 'id').sort(sortBy('name'));
    }

    try {
        const applicablePlayers = getApplicablePlayers();

        if (!any(applicablePlayers)) {
            return (<tr>
                <td colSpan="5" className="text-center">
                    Select some player/s to add 180s and hi-checks
                </td>
            </tr>)
        }

        return (<tr>
            <td colSpan="2" className="text-end">
                180s<br/>
                <MultiPlayerSelection
                    disabled={access === 'readonly'}
                    readOnly={saving || (fixtureData.resultsPublished && access !== 'admin')}
                    allPlayers={applicablePlayers}
                    players={fixtureData.oneEighties || []}
                    onRemovePlayer={remove180(fixtureData, setFixtureData)}
                    onAddPlayer={add180(fixtureData, setFixtureData)}
                    divisionId={fixtureData.divisionId}
                    seasonId={fixtureData.seasonId}/>
            </td>
            <td className="width-1 p-0"></td>
            <td colSpan="2">
                100+ c/o<br/>
                <MultiPlayerSelection
                    disabled={access === 'readonly'}
                    readOnly={saving || (fixtureData.resultsPublished && access !== 'admin')}
                    allPlayers={applicablePlayers}
                    players={fixtureData.over100Checkouts || []}
                    onRemovePlayer={removeHiCheck(fixtureData, setFixtureData)}
                    onAddPlayer={addHiCheck(fixtureData, setFixtureData)}
                    showNotes={true}
                    divisionId={fixtureData.divisionId}
                    seasonId={fixtureData.seasonId}
                    dropdownClassName="hi-check-player-dropdown"/>
            </td>
        </tr>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}