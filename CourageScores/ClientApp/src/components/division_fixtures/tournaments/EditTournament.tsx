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
import {ITournamentRoundDto} from "../../../interfaces/serverSide/Game/ITournamentRoundDto";
import {ITournamentMatchDto} from "../../../interfaces/serverSide/Game/ITournamentMatchDto";
import {ITournamentSideDto} from "../../../interfaces/serverSide/Game/ITournamentSideDto";
import {ITournamentGameDto} from "../../../interfaces/serverSide/Game/ITournamentGameDto";
import {IPatchTournamentDto} from "../../../interfaces/serverSide/Game/IPatchTournamentDto";
import {IPatchTournamentRoundDto} from "../../../interfaces/serverSide/Game/IPatchTournamentRoundDto";

export interface IEditTournamentProps {
    canSave?: boolean;
    disabled?: boolean;
    saving?: boolean;
    applyPatch: (patch: IPatchTournamentDto | IPatchTournamentRoundDto, nestInRound?: boolean) => Promise<any>;
}

export function EditTournament({canSave, disabled, saving, applyPatch}: IEditTournamentProps) {
    const {account} = useApp();
    const {tournamentData, setTournamentData, allPlayers, season, division} = useTournament();
    const isAdmin: boolean = account && account.access && account.access.manageTournaments;
    const readOnly: boolean = !isAdmin || !canSave || disabled || saving;
    const hasStarted: boolean = tournamentData.round && tournamentData.round.matches && any(tournamentData.round.matches);
    const winningSideId: string = hasStarted ? getWinningSide(tournamentData.round) : null;
    const [newSide, setNewSide] = useState(null);

    function getWinningSide(round: ITournamentRoundDto): string {
        if (round && round.nextRound) {
            return getWinningSide(round.nextRound);
        }

        if (round && round.matches && round.matches.length === 1) {
            const match: ITournamentMatchDto = round.matches[0];
            if (match.scoreA !== null && match.scoreB !== null && match.sideA && match.sideB) {
                // TODO: compare scores against > 0.5*bestOf
                if (match.scoreA > match.scoreB) {
                    return match.sideA.id;
                } else if (match.scoreB > match.scoreA) {
                    return match.sideB.id;
                } else {
                    return null;
                }
            }

            return null;
        }
    }

    async function sideChanged(newSide: ITournamentSideDto, sideIndex: number) {
        const newTournamentData: ITournamentGameDto = Object.assign({}, tournamentData);
        newSide.name = (newSide.name || '').trim();
        newTournamentData.sides[sideIndex] = newSide;
        updateSideDataInRound(newTournamentData.round, newSide);
        await setTournamentData(newTournamentData);
    }

    async function removeSide(side: ITournamentSideDto) {
        const newTournamentData: ITournamentGameDto = Object.assign({}, tournamentData);
        newTournamentData.sides = tournamentData.sides.filter((s: ITournamentSideDto) => s.id !== side.id);
        await setTournamentData(newTournamentData);
        setNewSide(null);
    }

    function updateSideDataInRound(round: ITournamentRoundDto, side: ITournamentSideDto) {
        if (!round) {
            return;
        }

        if (round.matches) {
            for (let index = 0; index < round.matches.length; index++) {
                const match: ITournamentMatchDto = round.matches[index];
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
            onChange={async (side: ITournamentSideDto) => setNewSide(side)}
            onClose={async () => setNewSide(null)}
            onApply={async () => {
                const newTournamentData: ITournamentGameDto = Object.assign({}, tournamentData);
                newSide.id = newSide.id || createTemporaryId();
                newSide.name = (newSide.name || '').trim();
                newTournamentData.sides.push(newSide);
                await setTournamentData(newTournamentData);
                setNewSide(null);
            }}/>);
    }

    const canShowResults: boolean = any((tournamentData.round || {}).matches || [], (match: ITournamentMatchDto) => !!match.scoreA || !!match.scoreB) || !readOnly;
    return (<div className="d-print-none">
        <div>Playing:</div>
        <div className="my-1 d-flex flex-wrap">
            {tournamentData.sides.sort(sortBy('name')).map((side, sideIndex) => {
                return (<TournamentSide
                    key={sideIndex}
                    winner={winningSideId === side.id}
                    readOnly={readOnly}
                    side={side}
                    onChange={(newSide: ITournamentSideDto) => sideChanged(newSide, sideIndex)}
                    onRemove={() => removeSide(side)}/>);
            })}
            {!readOnly && !hasStarted
                ? (<button className="btn btn-primary" onClick={() => setNewSide({})}>➕</button>)
                : null}
            {newSide && !readOnly && !hasStarted ? renderEditNewSide() : null}
        </div>
        {canShowResults ? (<TournamentRound
            round={tournamentData.round || {}}
            sides={tournamentData.sides.filter((s: ITournamentSideDto) => !s.noShow)}
            onChange={propChanged(tournamentData, setTournamentData, 'round')}
            readOnly={readOnly}
            depth={1}
            onHiCheck={add180(tournamentData, setTournamentData)}
            on180={add180(tournamentData, setTournamentData)}
            patchData={applyPatch}
            allowNextRound={!tournamentData.singleRound}/>) : null}
        {canShowResults && any(allPlayers) ? (<table className="table">
            <tbody>
            <tr>
                <td colSpan={2} datatype="180s">
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
                <td colSpan={2} datatype="hiChecks">
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
                        showNotes={true}/>
                </td>
            </tr>
            </tbody>
        </table>) : null}
    </div>);
}
