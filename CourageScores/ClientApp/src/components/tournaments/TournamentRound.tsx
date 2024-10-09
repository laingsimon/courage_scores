import {useState} from 'react';
import {BootstrapDropdown, IBootstrapDropdownItem} from "../common/BootstrapDropdown";
import {any, elementAt, isEmpty} from "../../helpers/collections";
import {TournamentRoundMatch} from "./TournamentRoundMatch";
import {useTournament} from "./TournamentContainer";
import {TournamentMatchDto} from "../../interfaces/models/dtos/Game/TournamentMatchDto";
import {TournamentRoundDto} from "../../interfaces/models/dtos/Game/TournamentRoundDto";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {GameMatchOptionDto} from "../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {createTemporaryId} from "../../helpers/projection";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface ITournamentRoundProps {
    round: TournamentRoundDto;
    onChange?(newRound: TournamentRoundDto): UntypedPromise;
    sides: TournamentSideDto[];
    readOnly?: boolean;
}

export function TournamentRound({ round, onChange, sides, readOnly }: ITournamentRoundProps) {
    const [newMatch, setNewMatch] = useState<TournamentMatchDto>(createNewMatch());
    const {setWarnBeforeEditDialogClose, matchOptionDefaults} = useTournament();

    async function setNewSide(sideId: string, property: string) {
        const newNewMatch: TournamentMatchDto = Object.assign({}, newMatch);
        newNewMatch[property] = sides.filter(s => s.id === sideId)[0];
        setNewMatch(newNewMatch);
        await setWarnBeforeEditDialogClose(`Add the (new) match before saving, otherwise it would be lost.

${newNewMatch.sideA ? newNewMatch.sideA.name : ''} vs ${newNewMatch.sideB ? newNewMatch.sideB.name : ''}`);
    }

    function createNewMatch(): TournamentMatchDto {
        return {
            sideA: null,
            sideB: null,
            id: createTemporaryId(),
        };
    }

    function exceptSelected(side: TournamentSideDto, matchIndex: number, property: string): boolean {
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
            if (any(round.matches, (match: TournamentMatchDto) => (match.sideA && match.sideA.id === side.id) || (match.sideB && match.sideB.id === side.id))) {
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

        const newRound: TournamentRoundDto = Object.assign({}, round);
        newRound.matches = (round.matches || []).concat(newMatch);
        newRound.matchOptions = (newRound.matchOptions || []).concat(matchOptionDefaults);
        setNewMatch(createNewMatch());
        await setWarnBeforeEditDialogClose(null);

        if (onChange) {
            await onChange(newRound);
        }
    }

    async function onMatchOptionsChanged(newMatchOptions: GameMatchOptionDto, matchIndex: number) {
        const newRound: TournamentRoundDto = Object.assign({}, round);
        newRound.matchOptions[matchIndex] = newMatchOptions;

        if (onChange) {
            await onChange(newRound);
        }
    }

    function sideSelection(side: { id: string, name: string}): IBootstrapDropdownItem {
        return {
            value: side.id,
            text: side.name
        };
    }

    const allSidesSelected: boolean = round.matches && round.matches.length * 2 === sides.length;
    const hasNextRound: boolean = round.nextRound && round.nextRound.matches && any(round.nextRound.matches);

    if ((!round.matches || isEmpty(round.matches)) && readOnly) {
        return <div className="alert-warning p-3 mb-2">No matches defined</div>
    }

    return (<div className="mt-3">
        <table className={`table${readOnly || hasNextRound ? ' layout-fixed' : ''} table-sm`}>
            <tbody>
            {(round.matches || []).map((match: TournamentMatchDto, matchIndex: number) => {
                return (<TournamentRoundMatch
                    key={matchIndex}
                    hasNextRound={hasNextRound}
                    match={match}
                    round={round}
                    readOnly={readOnly}
                    sides={sides}
                    exceptSelected={exceptSelected}
                    matchIndex={matchIndex}
                    onChange={onChange}
                    matchOptions={elementAt(round.matchOptions || [], matchIndex) || matchOptionDefaults}
                    onMatchOptionsChanged={async (newMatchOptions: GameMatchOptionDto) => await onMatchOptionsChanged(newMatchOptions, matchIndex)}/>);
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
    </div>);
}