import React, {useState} from 'react';
import {BootstrapDropdown} from "../../common/BootstrapDropdown";

export function KnockoutRound({ round, onChange, sides, readOnly, depth }) {
    const [ newMatch, setNewMatch ] = useState({});
    const allMatchesHaveAScore = round.matches && round.matches.reduce((prev, current) => prev && current.scoreA && current.scoreB, true);

    function sideSelection(side) {
        return {
            value: side.id,
            text: side.name
        };
    }

    function setNewSide(sideId, property) {
        const newNewMatch = Object.assign({}, newMatch);
        newNewMatch[property] = {
            id: sideId,
            players: sides.filter(s => s.id === sideId)[0].players
        };
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
        match[property] = sides.filter(s => s.id === sideId)[0];

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

    function winningSides() {
        let winners = [];

        for (let index = 0; index < round.matches.length; index++) {
            const match = round.matches[index];
            if (match.scoreA > match.scoreB) {
                winners.push(match.sideA);
            } else if (match.scoreB > match.scoreA) {
                winners.push(match.sideB);
            }
        }

        return winners;
    }

    let matchIndex = 0;
    const allSidesSelected = round.matches && round.matches.length * 2 === sides.length;
    return (<div className="my-3 p-1">
        <strong>Round: {depth}</strong>
        <table className="table"><tbody>
        {(round.matches || []).map(match => {
            const thisMatchIndex = matchIndex++;
            return (<tr key={thisMatchIndex} className="bg-light">
                <td>
                    <BootstrapDropdown readOnly={readOnly}
                                       value={match.sideA ? match.sideA.id : null}
                                       options={sides.filter(s => exceptSelected(s, thisMatchIndex, 'sideA')).map(sideSelection)}
                                       onChange={(side) => updateMatch(thisMatchIndex, 'sideA', side)}
                                       className="margin-right" />
                </td>
                <td>
                    <input type="number" value={match.scoreA || ''} max="5" min="0" onChange={(event) => changeScore(event, thisMatchIndex, 'scoreA')} />
                </td>
                <td>vs</td>
                <td>
                    <input type="number" value={match.scoreB || ''} max="5" min="0" onChange={(event) => changeScore(event, thisMatchIndex, 'scoreB')} />
                </td>
                <td>
                    <BootstrapDropdown readOnly={readOnly}
                                   value={match.sideB ? match.sideB.id : null}
                                   options={sides.filter(s => exceptSelected(s, thisMatchIndex, 'sideB')).map(sideSelection)}
                                   onChange={(side) => updateMatch(thisMatchIndex, 'sideB', side)}
                                   className="margin-right" />
                </td>
                <td>
                    <button className="btn btn-primary btn-sm" onClick={() => removeMatch(thisMatchIndex)}>🗑</button>
                </td>
            </tr>);
        })}
        {readOnly || allSidesSelected ? null : (<tr className="bg-yellow p-1">
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
                <button className="btn btn-primary btn-sm" onClick={addMatch}>➕</button>
            </td>
        </tr>)}
        </tbody></table>
        {round.nextRound || (allMatchesHaveAScore && allSidesSelected) ? (<KnockoutRound round={round.nextRound || {}} onChange={subRoundChange} readOnly={readOnly} depth={(depth + 1)} sides={winningSides()} />) : null}
    </div>);
}