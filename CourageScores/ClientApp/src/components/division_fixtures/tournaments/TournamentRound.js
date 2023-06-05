import React, {useState} from 'react';
import {BootstrapDropdown} from "../../common/BootstrapDropdown";
import {valueChanged} from "../../../helpers/events";
import {all, any, elementAt, isEmpty, toMap} from "../../../helpers/collections";
import {TournamentRoundMatch} from "./TournamentRoundMatch";
import {getRoundNameFromSides, hasScore, sideSelection} from "../../../helpers/tournaments";

export function TournamentRound({ round, onChange, sides, readOnly, depth, onHiCheck, on180 }) {
    const [ newMatch, setNewMatch ] = useState({});
    // noinspection JSUnresolvedVariable
    const allMatchesHaveAScore = round.matches && all(round.matches, current => hasScore(current.scoreA) && hasScore(current.scoreB));
    const sideMap = toMap(sides);
    const matchOptionDefaults = {
        startingScore: 501,
        numberOfLegs: 5,
    };
    const [changeRoundName, setChangeRoundName] = useState(false);

    function setNewSide(sideId, property) {
        const newNewMatch = Object.assign({}, newMatch);
        newNewMatch[property] = sideMap[sideId];
        setNewMatch(newNewMatch);
    }

    function exceptSelected(side, matchIndex, property) {
        let allowedSideId = null;

        if (matchIndex === undefined) {
            allowedSideId = newMatch[property] ? newMatch[property].id : null;
        }
        else if (round.matches) {
            allowedSideId = round.matches[matchIndex][property].id;
        }

        if (allowedSideId !== null && side.id === allowedSideId) {
            return true;
        }

        if ((newMatch.sideA && newMatch.sideA.id === side.id) || (newMatch.sideB && newMatch.sideB.id === side.id)) {
            return false;
        }

        if (round.matches) {
            if (any(round.matches, match => (match.sideA && match.sideA.id === side.id) || (match.sideB && match.sideB.id === side.id))) {
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

        const newRound = Object.assign({}, round);
        newRound.matches = round.matches || [];
        newRound.matches.push(newMatch);
        setNewMatch({});

        if (onChange) {
            await onChange(newRound);
        }
    }

    async function subRoundChange(subRound) {
        const newRound = Object.assign({}, round);
        newRound.nextRound = subRound;

        if (onChange) {
            await onChange(newRound);
        }
    }

    function sidesForTheNextRound() {
        const sidesForTheNextRound = sides.filter(side => {
            const isPlaying = any(round.matches, m => m.sideA.id === side.id || m.sideB.id === side.id);
            return !isPlaying;
        });

        return sidesForTheNextRound.concat(round.matches.flatMap(match => {
            const scoreA = Number.parseInt(match.scoreA);
            const scoreB = Number.parseInt(match.scoreB);

            if (scoreA > scoreB) {
                return [ match.sideA ];
            } else if (scoreB > scoreA) {
                return [ match.sideB ];
            }

            return [];
        }));
    }

    async function onMatchOptionsChanged(newMatchOptions, matchIndex) {
        const newRound = Object.assign({}, round);
        newRound.matchOptions[matchIndex] = newMatchOptions;

        if (onChange) {
            await onChange(newRound);
        }
    }

    const allSidesSelected = round.matches && round.matches.length * 2 === sides.length;
    const hasNextRound = round.nextRound && round.nextRound.matches && any(round.nextRound.matches);

    if ((!round.matches || isEmpty(round.matches)) && readOnly) {
        return <div className="alert-warning p-3 mb-2">No matches defined</div>
    }

    return (<div className="mt-3">
        {changeRoundName && !readOnly
            ? (<input type="text" name="name" onChange={valueChanged(round, onChange)} value={round.name === null ? getRoundNameFromSides(round, sides.length, depth) : round.name} onBlur={() => setChangeRoundName(false)} />)
            : (<strong title="Click to change" onClick={() => setChangeRoundName(true)}>{getRoundNameFromSides(round, sides.length, depth)}</strong>)}
        <table className={`table${readOnly || hasNextRound ? ' layout-fixed' : ''} table-sm`}><tbody>
        {(round.matches || []).map((match, matchIndex) => {
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
                onMatchOptionsChanged={(newMatchOptions) => onMatchOptionsChanged(newMatchOptions, matchIndex)}
                on180={on180} onHiCheck={onHiCheck} />);
        })}
        {readOnly || allSidesSelected || hasNextRound ? null : (<tr className="bg-yellow p-1">
            <td>
                <BootstrapDropdown value={newMatch.sideA ? newMatch.sideA.id : null}
                   onChange={(side) => setNewSide(side, 'sideA')}
                   options={sides.filter(s => exceptSelected(s, undefined, 'sideA')).map(sideSelection)}
                   className="margin-right" />
            </td>
            <td></td>
            <td>vs</td>
            <td></td>
            <td>
                <BootstrapDropdown value={newMatch.sideB ? newMatch.sideB.id : null}
                   onChange={(side) => setNewSide(side, 'sideB')}
                   options={sides.filter(s => exceptSelected(s, undefined, 'sideB')).map(sideSelection)}
                   className="margin-right" />
            </td>
            <td>
                <button disabled={readOnly} className="btn btn-primary btn-sm" onClick={addMatch}>➕</button>
            </td>
        </tr>)}
        </tbody></table>
        {hasNextRound || (allMatchesHaveAScore && any(round.matches) && sidesForTheNextRound().length > 1)
            ? (<TournamentRound round={round.nextRound || {}} onChange={subRoundChange} readOnly={readOnly}
                                depth={(depth + 1)} sides={sidesForTheNextRound()} on180={on180} onHiCheck={onHiCheck} />)
            : null}
    </div>);
}