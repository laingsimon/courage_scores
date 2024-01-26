import React, {useState} from 'react';
import {BootstrapDropdown} from "../../common/BootstrapDropdown";
import {all, any, DataMap, elementAt, isEmpty, toMap} from "../../../helpers/collections";
import {TournamentRoundMatch} from "./TournamentRoundMatch";
import {getRoundNameFromSides, hasScore, sideSelection} from "../../../helpers/tournaments";
import {useTournament} from "./TournamentContainer";
import {ITournamentMatchDto} from "../../../interfaces/serverSide/Game/ITournamentMatchDto";
import {ITournamentRoundDto} from "../../../interfaces/serverSide/Game/ITournamentRoundDto";
import {ITournamentSideDto} from "../../../interfaces/serverSide/Game/ITournamentSideDto";
import {IGameMatchOptionDto} from "../../../interfaces/serverSide/Game/IGameMatchOptionDto";
import {ITournamentPlayerDto} from "../../../interfaces/serverSide/Game/ITournamentPlayerDto";
import {IPatchTournamentRoundDto} from "../../../interfaces/serverSide/Game/IPatchTournamentRoundDto";
import {IPatchTournamentDto} from "../../../interfaces/serverSide/Game/IPatchTournamentDto";
import {createTemporaryId} from "../../../helpers/projection";

export interface ITournamentRoundProps {
    round: ITournamentRoundDto;
    onChange?: (newRound: ITournamentRoundDto) => Promise<any>;
    sides: ITournamentSideDto[];
    readOnly?: boolean;
    depth: number;
    onHiCheck: (player: ITournamentPlayerDto, score: number) => Promise<any>;
    on180: (player: ITournamentPlayerDto) => Promise<any>;
    patchData: (patch: IPatchTournamentDto | IPatchTournamentRoundDto, nestInRound?: boolean) => Promise<any>;
    allowNextRound?: boolean;
}

export function TournamentRound({ round, onChange, sides, readOnly, depth, onHiCheck, on180, patchData, allowNextRound }: ITournamentRoundProps) {
    const [newMatch, setNewMatch] = useState<ITournamentMatchDto>(createNewMatch());
    const allMatchesHaveAScore: boolean = round.matches && all(round.matches, (current: ITournamentMatchDto) => hasScore(current.scoreA) && hasScore(current.scoreB));
    const sideMap: DataMap<ITournamentSideDto> = toMap(sides);
    const {setWarnBeforeSave, matchOptionDefaults} = useTournament();

    async function setNewSide(sideId: string, property: string) {
        const newNewMatch: ITournamentMatchDto = Object.assign({}, newMatch);
        newNewMatch[property] = sideMap[sideId];
        setNewMatch(newNewMatch);
        await setWarnBeforeSave(`Add the (new) match before saving, otherwise it would be lost.

${getRoundNameFromSides(round, sides.length, depth)}: ${newNewMatch.sideA ? newNewMatch.sideA.name : ''} vs ${newNewMatch.sideB ? newNewMatch.sideB.name : ''}`);
    }

    function createNewMatch(): ITournamentMatchDto {
        return {
            sideA: null,
            sideB: null,
            id: createTemporaryId(),
        };
    }

    function exceptSelected(side: ITournamentSideDto, matchIndex: number, property: string): boolean {
        let allowedSideId = null;

        if (matchIndex === undefined) {
            allowedSideId = newMatch[property] ? newMatch[property].id : null;
        } else if (round.matches && round.matches[matchIndex] && round.matches[matchIndex][property]) {
            allowedSideId = round.matches[matchIndex][property].id;
        }

        if (allowedSideId !== null && side.id === allowedSideId) {
            return true;
        }

        if ((newMatch.sideA && newMatch.sideA.id === side.id) || (newMatch.sideB && newMatch.sideB.id === side.id)) {
            return false;
        }

        if (round.matches) {
            if (any(round.matches, (match: ITournamentMatchDto) => (match.sideA && match.sideA.id === side.id) || (match.sideB && match.sideB.id === side.id))) {
                return false;
            }
        }

        return true;
    }

    async function addMatch() {
        if (!newMatch.sideA || !newMatch.sideB) {
            window.alert('Select the sides first');
            return;
        }

        const newRound: ITournamentRoundDto = Object.assign({}, round);
        newRound.matches = round.matches || [];
        newRound.matches.push(newMatch);
        newRound.matchOptions = newRound.matchOptions || [];
        newRound.matchOptions.push(matchOptionDefaults);
        setNewMatch(createNewMatch());
        await setWarnBeforeSave(null);

        if (onChange) {
            await onChange(newRound);
        }
    }

    async function subRoundChange(subRound: ITournamentRoundDto) {
        const newRound: ITournamentRoundDto = Object.assign({}, round);
        newRound.nextRound = subRound;

        if (onChange) {
            await onChange(newRound);
        }
    }

    function sidesForTheNextRound(): ITournamentSideDto[] {
        const sidesForTheNextRound: ITournamentSideDto[] = sides.filter((side: ITournamentSideDto) => {
            const isPlaying: boolean = any(round.matches, (m: ITournamentMatchDto) => m.sideA.id === side.id || m.sideB.id === side.id);
            return !isPlaying;
        });

        return sidesForTheNextRound.concat(round.matches.flatMap((match: ITournamentMatchDto) => {
            const scoreA: number = match.scoreA;
            const scoreB: number = match.scoreB;

            if (scoreA > scoreB) {
                return [match.sideA];
            } else if (scoreB > scoreA) {
                return [match.sideB];
            }

            return [];
        }));
    }

    async function thisRoundPatch(patch: IPatchTournamentDto, nestInRound?: boolean) {
        await patchData(patch, nestInRound);
    }

    async function nestedRoundPatch(patch: IPatchTournamentRoundDto, nestInRound?: boolean) {
        await patchData(nestInRound ? {nextRound: patch} : patch, nestInRound);
    }

    async function onMatchOptionsChanged(newMatchOptions: IGameMatchOptionDto, matchIndex: number) {
        const newRound: ITournamentRoundDto = Object.assign({}, round);
        newRound.matchOptions[matchIndex] = newMatchOptions;

        if (onChange) {
            await onChange(newRound);
        }
    }

    const allSidesSelected: boolean = round.matches && round.matches.length * 2 === sides.length;
    const hasNextRound: boolean = round.nextRound && round.nextRound.matches && any(round.nextRound.matches);

    if ((!round.matches || isEmpty(round.matches)) && readOnly) {
        return <div className="alert-warning p-3 mb-2">No matches defined</div>
    }

    return (<div className="mt-3">
        <strong>{getRoundNameFromSides(round, sides.length, depth)}</strong>
        <table className={`table${readOnly || hasNextRound ? ' layout-fixed' : ''} table-sm`}>
            <tbody>
            {(round.matches || []).map((match: ITournamentMatchDto, matchIndex: number) => {
                return (<TournamentRoundMatch
                    key={matchIndex}
                    hasNextRound={hasNextRound}
                    match={match}
                    round={round}
                    readOnly={readOnly}
                    sideMap={sideMap}
                    exceptSelected={exceptSelected}
                    matchIndex={matchIndex}
                    onChange={onChange}
                    matchOptions={elementAt(round.matchOptions || [], matchIndex) || matchOptionDefaults}
                    onMatchOptionsChanged={async (newMatchOptions: IGameMatchOptionDto) => await onMatchOptionsChanged(newMatchOptions, matchIndex)}
                    on180={on180}
                    onHiCheck={onHiCheck}
                    patchData={thisRoundPatch}/>);
            })}
            {readOnly || allSidesSelected || hasNextRound ? null : (<tr className="bg-yellow p-1">
                <td>
                    <BootstrapDropdown value={newMatch.sideA ? newMatch.sideA.id : null}
                                       onChange={async (side) => setNewSide(side, 'sideA')}
                                       options={sides.filter(s => exceptSelected(s, undefined, 'sideA')).map(sideSelection)}
                                       className="margin-right"/>
                </td>
                <td></td>
                <td>vs</td>
                <td></td>
                <td>
                    <BootstrapDropdown value={newMatch.sideB ? newMatch.sideB.id : null}
                                       onChange={async (side) => setNewSide(side, 'sideB')}
                                       options={sides.filter(s => exceptSelected(s, undefined, 'sideB')).map(sideSelection)}
                                       className="margin-right"/>
                </td>
                <td>
                    <button disabled={readOnly} className="btn btn-primary btn-sm" onClick={addMatch}>➕</button>
                </td>
            </tr>)}
            </tbody>
        </table>
        {allowNextRound && (hasNextRound || (allMatchesHaveAScore && any(round.matches) && sidesForTheNextRound().length > 1))
            ? (<TournamentRound round={round.nextRound || {}} onChange={subRoundChange} readOnly={readOnly}
                                depth={(depth + 1)} sides={sidesForTheNextRound()} on180={on180} onHiCheck={onHiCheck}
                                patchData={nestedRoundPatch} allowNextRound={allowNextRound}/>)
            : null}
    </div>);
}