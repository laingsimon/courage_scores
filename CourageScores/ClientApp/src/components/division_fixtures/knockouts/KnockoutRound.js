import React, {useState} from 'react';
import {BootstrapDropdown} from "../../common/BootstrapDropdown";
import {toMap} from "../../../Utilities";

export function KnockoutRound({ round, onChange, sides, readOnly, depth }) {
    const [ newMatch, setNewMatch ] = useState({});
    const allMatchesHaveAScore = round.matches && round.matches.reduce((prev, current) => prev && current.scoreA && current.scoreB, true);
    const sideMap = toMap(sides);

    function sideSelection(side) {
        return {
            value: side.id,
            text: side.name
        };
    }

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
            for (let index = 0; index < round.matches.length; index++) {
                const match = round.matches[index];

                if ((match.sideA && match.sideA.id === side.id) || (match.sideB && match.sideB.id === side.id)) {
                    return false;
                }
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

    async function removeMatch(matchIndex) {
        if (!window.confirm('Are you sure you want to remove this match?')) {
            return;
        }

        const newRound = Object.assign({}, round);
        newRound.matches = round.matches || [];
        newRound.matches.splice(matchIndex, 1);

        if (onChange) {
            await onChange(newRound);
        }
    }

    async function updateMatch(matchIndex, property, sideId) {
        const newRound = Object.assign({}, round);
        const match = newRound.matches[matchIndex];
        match[property] = sideMap[sideId];

        if (onChange) {
            await onChange(newRound);
        }
    }

    async function changeScore(event, matchIndex, property) {
        const newRound = Object.assign({}, round);
        const match = newRound.matches[matchIndex];
        match[property] = event.target.value;

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
            const isPlaying = round.matches.filter(m => m.sideA.id === side.id || m.sideB.id === side.id).length;
            return !isPlaying;
        });

        for (let index = 0; index < round.matches.length; index++) {
            const match = round.matches[index];
            if (Number.parseInt(match.scoreA) > Number.parseInt(match.scoreB)) {
                sidesForTheNextRound.push(match.sideA);
            } else if (Number.parseInt(match.scoreB) > Number.parseInt(match.scoreA)) {
                sidesForTheNextRound.push(match.sideB);
            }
        }
        
        return sidesForTheNextRound;
    }

    let matchIndex = 0;
    const allSidesSelected = round.matches && round.matches.length * 2 === sides.length;
    const hasNextRound = round.nextRound && round.nextRound.matches && round.nextRound.matches.length > 0;

    return (<div className="my-3 p-1">
        <strong>Round: {depth}</strong>
        <table className={`table${readOnly || hasNextRound ? ' layout-fixed' : ''}`}><tbody>
        {(round.matches || []).map(match => {
            const thisMatchIndex = matchIndex++;
            return (<tr key={thisMatchIndex} className="bg-light">
                <td className={match.scoreA && match.scoreB && Number.parseInt(match.scoreA) > Number.parseInt(match.scoreB) ? 'bg-warning' : ''}>
                    {readOnly || hasNextRound ? (match.sideA.name || sideMap[match.sideA.id].name) : (<BootstrapDropdown readOnly={readOnly}
                                       value={match.sideA ? match.sideA.id : null}
                                       options={sides.filter(s => exceptSelected(s, thisMatchIndex, 'sideA')).map(sideSelection)}
                                       onChange={(side) => updateMatch(thisMatchIndex, 'sideA', side)}
                                       className="margin-right" />)}
                </td>
                <td className={match.scoreA && match.scoreB && Number.parseInt(match.scoreA) > Number.parseInt(match.scoreB) ? 'narrow-column bg-warning' : 'narrow-column'}>
                    {readOnly || hasNextRound ? (match.scoreA) : (<input type="number" value={match.scoreA || ''} max="5" min="0" onChange={(event) => changeScore(event, thisMatchIndex, 'scoreA')} />)}
                </td>
                <td className="narrow-column">vs</td>
                <td className={match.scoreA && match.scoreB && Number.parseInt(match.scoreB) > Number.parseInt(match.scoreA) ? 'narrow-column bg-warning' : 'narrow-column'}>
                    {readOnly || hasNextRound ? (match.scoreB) : (<input type="number" value={match.scoreB || ''} max="5" min="0" onChange={(event) => changeScore(event, thisMatchIndex, 'scoreB')} />)}
                </td>
                <td className={match.scoreA && match.scoreB && Number.parseInt(match.scoreB) > Number.parseInt(match.scoreA) ? 'bg-warning' : ''}>
                    {readOnly || hasNextRound ? (match.sideB.name || sideMap[match.sideB.id].name) : (<BootstrapDropdown readOnly={readOnly}
                                   value={match.sideB ? match.sideB.id : null}
                                   options={sides.filter(s => exceptSelected(s, thisMatchIndex, 'sideB')).map(sideSelection)}
                                   onChange={(side) => updateMatch(thisMatchIndex, 'sideB', side)}
                                   className="margin-right" />)}
                </td>
                {readOnly || hasNextRound ? null : (<td>
                    <button className="btn btn-danger btn-sm" onClick={() => removeMatch(thisMatchIndex)}>🗑</button>
                </td>)}
            </tr>);
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
        {hasNextRound || (allMatchesHaveAScore && round.matches.length > 1 && sidesForTheNextRound().length > 1) ? (<KnockoutRound round={round.nextRound || {}} onChange={subRoundChange} readOnly={readOnly} depth={(depth + 1)} sides={sidesForTheNextRound()} />) : null}
    </div>);
}