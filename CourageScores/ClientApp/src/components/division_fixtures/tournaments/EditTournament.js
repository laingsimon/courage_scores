import {any, sortBy} from "../../../helpers/collections";
import {propChanged} from "../../../helpers/events";
import {TournamentSide} from "./TournamentSide";
import {TournamentRound} from "./TournamentRound";
import {MultiPlayerSelection} from "../scores/MultiPlayerSelection";
import {add180, addHiCheck, remove180, removeHiCheck} from "../../common/Accolades";
import React, {useState} from "react";
import {useApp} from "../../../AppContainer";
import {useTournament} from "./TournamentContainer";
import {EditSide} from "./EditSide";
import {createTemporaryId} from "../../../helpers/projection";

export function EditTournament({ canSave, disabled, saving, applyPatch }) {
    const { account } = useApp();
    const { tournamentData, setTournamentData, allPlayers, season, division } = useTournament();
    const isAdmin = account && account.access && account.access.manageTournaments;
    const readOnly = !isAdmin || !canSave || disabled || saving;
    const hasStarted = tournamentData.round && tournamentData.round.matches && any(tournamentData.round.matches);
    const winningSideId = hasStarted ? getWinningSide(tournamentData.round) : null;
    const [ newSide, setNewSide ] = useState(null);

    function getWinningSide(round) {
        if (round && round.nextRound) {
            return getWinningSide(round.nextRound);
        }

        if (round && round.matches && round.matches.length === 1) {
            const match = round.matches[0];
            if (match.scoreA !== null && match.scoreB !== null && match.sideA && match.sideB) {
                if (Number.parseInt(match.scoreA) > Number.parseInt(match.scoreB)) {
                    return match.sideA.id;
                } else if (Number.parseInt(match.scoreB) > Number.parseInt(match.scoreA)) {
                    return match.sideB.id;
                } else {
                    return null;
                }
            }

            return null;
        }
    }

    async function sideChanged(newSide, sideIndex) {
        const newTournamentData = Object.assign({}, tournamentData);
        newSide.name = (newSide.name || '').trim();
        newTournamentData.sides[sideIndex] = newSide;
        updateSideDataInRound(newTournamentData.round, newSide);
        setTournamentData(newTournamentData);
    }

    async function removeSide(side) {
        const newTournamentData = Object.assign({}, tournamentData);
        newTournamentData.sides = tournamentData.sides.filter(s => s.id !== side.id);
        setTournamentData(newTournamentData);
        setNewSide(null);
    }

    function updateSideDataInRound(round, side) {
        if (!round) {
            return;
        }

        if (round.matches) {
            for (let index = 0; index < round.matches.length; index++) {
                const match = round.matches[index];
                if (match.sideA && match.sideA.id === side.id) {
                    match.sideA = side;
                } else if (match.sideB && match.sideB.id === side.id) {
                    match.sideB = side;
                }
            }
        }

        updateSideDataInRound(round.nextRound, side);
    }

    function renderEditNewSide() {
        return (<EditSide
            side={newSide}
            onChange={(side) => setNewSide(side)}
            onClose={() => setNewSide(null)}
            onApply={async () => {
                const newTournamentData = Object.assign({}, tournamentData);
                newSide.id = newSide.id || createTemporaryId();
                newSide.name = (newSide.name || '').trim();
                newTournamentData.sides.push(newSide);
                setTournamentData(newTournamentData);
                setNewSide(null);
            }} />);
    }

    const canShowResults = any((tournamentData.round || {}).matches || [], match => match.scoreA || match.scoreB) || !readOnly;
    return (<div className="d-print-none">
        <div>Playing:</div>
        <div className="my-1 d-flex flex-wrap">
            {tournamentData.sides.sort(sortBy('name')).map((side, sideIndex) => {
                return (<TournamentSide
                    key={sideIndex}
                    winner={winningSideId === side.id}
                    readOnly={readOnly}
                    side={side}
                    onChange={(newSide) => sideChanged(newSide, sideIndex)}
                    onRemove={() => removeSide(side)} />); })}
            {!readOnly && !hasStarted ? (<button className="btn btn-primary" onClick={() => setNewSide({})}>➕</button>) : null}
            {newSide && !readOnly && !hasStarted ? renderEditNewSide() : null}
        </div>
        {canShowResults ? (<TournamentRound
            round={tournamentData.round || {}}
            sides={tournamentData.sides.filter(s => !s.noShow)}
            onChange={propChanged(tournamentData, setTournamentData, 'round')}
            readOnly={readOnly}
            depth={1}
            onHiCheck={add180(tournamentData, setTournamentData)}
            on180={add180(tournamentData, setTournamentData)}
            patchData={applyPatch}
            allowNextRound={!tournamentData.singleRound} />) : null}
        {canShowResults ? (<table className="table">
            <tbody>
            <tr>
                <td colSpan="2">
                    180s<br/>
                    <MultiPlayerSelection
                        disabled={disabled}
                        readOnly={saving}
                        allPlayers={allPlayers}
                        division={division}
                        season={season}
                        players={tournamentData.oneEighties || []}
                        onRemovePlayer={remove180(tournamentData, setTournamentData)}
                        onAddPlayer={add180(tournamentData, setTournamentData)}/>
                </td>
                <td colSpan="2">
                    100+ c/o<br/>
                    <MultiPlayerSelection
                        disabled={disabled}
                        readOnly={saving}
                        allPlayers={allPlayers}
                        division={division}
                        season={season}
                        players={tournamentData.over100Checkouts || []}
                        onRemovePlayer={removeHiCheck(tournamentData, setTournamentData)}
                        onAddPlayer={addHiCheck(tournamentData, setTournamentData)}
                        showNotes={true} />
                </td>
            </tr>
            </tbody>
        </table>) : null}
    </div>);
}
