import React from "react";
import {BootstrapDropdown} from "../../common/BootstrapDropdown";

export function TournamentRoundMatch({ readOnly, match, hasNextRound, sideMap, exceptSelected, matchIndex, onChange, round }) {
    // noinspection JSUnresolvedVariable
    const scoreA = Number.parseInt(match.scoreA);
    // noinspection JSUnresolvedVariable
    const scoreB = Number.parseInt(match.scoreB);
    // noinspection JSUnresolvedVariable
    const scoreARecorded = hasScore(match.scoreA);
    // noinspection JSUnresolvedVariable
    const scoreBRecorded = hasScore(match.scoreB);
    const hasBothScores = scoreARecorded && scoreBRecorded;

    function sideSelection(side) {
        return {
            value: side.id,
            text: side.name
        };
    }

    function hasScore(score) {
        return score !== null && score !== undefined;
    }

    async function updateMatch(property, sideId) {
        const newRound = Object.assign({}, round);
        const match = newRound.matches[matchIndex];
        match[property] = sideMap[sideId];

        if (onChange) {
            await onChange(newRound);
        }
    }

    async function changeScore(event, property) {
        const newRound = Object.assign({}, round);
        const match = newRound.matches[matchIndex];
        match[property] = event.target.value;

        if (onChange) {
            await onChange(newRound);
        }
    }

    async function removeMatch() {
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

    return (<tr className="bg-light">
        <td className={hasBothScores && scoreA > scoreB ? 'bg-winner' : ''}>
            {readOnly || hasNextRound
                ? (match.sideA.name || sideMap[match.sideA.id].name)
                : (<BootstrapDropdown
                     readOnly={readOnly}
                     value={match.sideA ? match.sideA.id : null}
                     options={Object.values(sideMap).filter(s => exceptSelected(s, matchIndex, 'sideA')).map(sideSelection)}
                     onChange={(side) => updateMatch('sideA', side)}
                     slim={true}
                     className="margin-right" />)}
        </td>
        <td className={hasBothScores && scoreA > scoreB ? 'narrow-column bg-winner' : 'narrow-column'}>
            {readOnly || hasNextRound
                ? scoreA
                : (<input type="number" value={scoreARecorded ? scoreA : ''} max="5" min="0" onChange={(event) => changeScore(event, 'scoreA')} />)}
        </td>
        <td className="narrow-column">vs</td>
        <td className={hasBothScores && scoreB > scoreA ? 'narrow-column bg-winner' : 'narrow-column'}>
            {readOnly || hasNextRound
                ? scoreB
                : (<input type="number" value={scoreBRecorded ? scoreB : ''} max="5" min="0" onChange={(event) => changeScore(event, 'scoreB')} />)}
        </td>
        <td className={hasBothScores && scoreB > scoreA ? 'bg-winner' : ''}>
            {readOnly || hasNextRound
                ? (match.sideB.name || sideMap[match.sideB.id].name)
                : (<BootstrapDropdown
                     readOnly={readOnly}
                     value={match.sideB ? match.sideB.id : null}
                     options={Object.values(sideMap).filter(s => exceptSelected(s, matchIndex, 'sideB')).map(sideSelection)}
                     onChange={(side) => updateMatch('sideB', side)}
                     slim={true}
                     className="margin-right" />)}
        </td>
        {readOnly || hasNextRound ? null : (<td>
            <button className="btn btn-danger btn-sm" onClick={() => removeMatch()}>🗑</button>
        </td>)}
    </tr>);
}