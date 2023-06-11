import {any, sortBy} from "../../../helpers/collections";
import {propChanged} from "../../../helpers/events";
import {TournamentSide} from "./TournamentSide";
import {TournamentRound} from "./TournamentRound";
import {MultiPlayerSelection} from "../scores/MultiPlayerSelection";
import {add180, addHiCheck, remove180, removeHiCheck} from "../../common/Accolades";
import React from "react";
import {useApp} from "../../../AppContainer";
import {useTournament} from "./TournamentContainer";

export function EditTournament({ canSave, disabled, saving }) {
    const { account } = useApp();
    const { tournamentData, setTournamentData, season, alreadyPlaying, allPlayers } = useTournament();
    const isAdmin = account && account.access && account.access.manageTournaments;
    const readOnly = !isAdmin || !canSave || disabled || saving;
    const hasStarted = tournamentData.round && tournamentData.round.matches && any(tournamentData.round.matches);
    const winningSideId = hasStarted ? getWinningSide(tournamentData.round) : null;

    function getOtherSides(sideIndex) {
        return tournamentData.sides.filter((side, index) => {
            return index !== sideIndex;
        });
    }

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
        if (sideIndex === undefined) {
            newTournamentData.sides.push(newSide);
        } else {
            if (any(newSide.players) || newSide.teamId) {
                newTournamentData.sides[sideIndex] = newSide;
                updateSideDataInRound(newTournamentData.round, newSide);
            } else {
                // delete the side
                newTournamentData.sides.splice(sideIndex, 1);
            }
        }
        setTournamentData(newTournamentData);
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

    return (<div className="d-print-none">
        <div>Playing:</div>
        <div className="my-1 d-flex flex-wrap">
            {tournamentData.sides.sort(sortBy('name')).map((side, sideIndex) => {
                return (<TournamentSide
                    key={sideIndex}
                    divisionId={tournamentData.divisionId}
                    winner={winningSideId === side.id}
                    readOnly={readOnly}
                    seasonId={season.id}
                    side={side}
                    exceptPlayerIds={alreadyPlaying}
                    onChange={(newSide) => sideChanged(newSide, sideIndex)}
                    otherSides={getOtherSides(sideIndex)} />); })}
            {readOnly || hasStarted ? null : (<TournamentSide divisionId={tournamentData.divisionId} seasonId={season.id} side={null} exceptPlayerIds={alreadyPlaying} onChange={sideChanged} otherSides={tournamentData.sides} />)}
        </div>
        {tournamentData.sides.length >= 2 ? (<TournamentRound round={tournamentData.round || {}} sides={tournamentData.sides} onChange={propChanged(tournamentData, setTournamentData, 'round')} readOnly={readOnly} depth={1} onHiCheck={add180(tournamentData, setTournamentData)} on180={add180(tournamentData, setTournamentData)} />) : null}
        {tournamentData.sides.length >= 2 ? (<table className="table">
            <tbody>
            <tr>
                <td colSpan="2">
                    180s<br/>
                    <MultiPlayerSelection
                        disabled={disabled}
                        readOnly={saving}
                        allPlayers={allPlayers}
                        divisionId={tournamentData.divisionId}
                        seasonId={tournamentData.seasonId}
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
                        divisionId={tournamentData.divisionId}
                        seasonId={tournamentData.seasonId}
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
