import React, {useState} from "react";
import {BootstrapDropdown} from "../../common/BootstrapDropdown";
import {Dialog} from "../../common/Dialog";
import {EditMatchOptions} from "../EditMatchOptions";
import {ScoreAsYouGo} from "../sayg/ScoreAsYouGo";
import {useApp} from "../../../AppContainer";

export function TournamentRoundMatch({ readOnly, match, hasNextRound, sideMap, exceptSelected, matchIndex, onChange, round, matchOptions, onMatchOptionsChanged, onHiCheck, on180 }) {
    const { account, onError } = useApp();
    const scoreA = Number.parseInt(match.scoreA);
    const scoreB = Number.parseInt(match.scoreB);
    const scoreARecorded = hasScore(match.scoreA);
    const scoreBRecorded = hasScore(match.scoreB);
    const hasBothScores = scoreARecorded && scoreBRecorded;
    const [ matchOptionsDialogOpen, setMatchOptionsDialogOpen ] = useState(false);
    const [ saygOpen, setSaygOpen ] = useState(false);

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
        try {
            const newRound = Object.assign({}, round);
            const match = newRound.matches[matchIndex];
            match[property] = sideMap[sideId];

            if (onChange) {
                await onChange(newRound);
            }
        } catch (e) {
            onError(e);
        }
    }

    async function changeScore(event, property) {
        try {
            const newRound = Object.assign({}, round);
            const match = newRound.matches[matchIndex];
            match[property] = event.target.value;

            if (onChange) {
                await onChange(newRound);
            }
        } catch (e) {
            onError(e);
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

    function renderMatchSettingsDialog(){
        return (<Dialog title="Edit match options" slim={true} onClose={() => setMatchOptionsDialogOpen(false)}>
            <EditMatchOptions matchOptions={matchOptions} onMatchOptionsChanged={onMatchOptionsChanged} hideNumberOfPlayers={true} />
        </Dialog>);
    }

    function renderSaygDialog(match) {
        const home = match.sideA.name;
        const away = match.sideB.name;

        const updateMatchScore = async (sideAScore, sideBScore) => {
            const newRound = Object.assign({}, round);
            const newMatch = Object.assign({}, newRound.matches[matchIndex]);
            newMatch.scoreA = sideAScore;
            newMatch.scoreB = sideBScore;
            newRound.matches[matchIndex] = newMatch;
            if (onChange) {
                await onChange(newRound);
            }
        }

        async function recordHiCheck(sideName, score) {
            if (readOnly) {
                return;
            }

            const side = sideName === 'home' ? match.sideA : match.sideB;
            if (side.players.length === 1) {
                if (onHiCheck) {
                    await onHiCheck(side.players[0], score);
                }
            }
        }

        async function record180(sideName) {
            if (readOnly) {
                return;
            }

            const side = sideName === 'home' ? match.sideA : match.sideB;
            if (side.players.length === 1) {
                if (on180) {
                    await on180(side.players[0]);
                }
            }
        }

        async function setMatchProp(prop, newData) {
            const newRound = Object.assign({}, round);
            const newMatch = Object.assign({}, newRound.matches[matchIndex]);
            newMatch[prop] = newData;
            newRound.matches[matchIndex] = newMatch;
            if (onChange) {
                await onChange(newRound);
            }
        }

        return (<Dialog slim={true} title={`${home} vs ${away} - best of ${matchOptions.numberOfLegs}`} onClose={() => setSaygOpen(null)} className="text-start">
            <ScoreAsYouGo
                data={match.sayg || { legs: {} }}
                home={home}
                away={away}
                onChange={newData => setMatchProp('sayg', newData)}
                onLegComplete={updateMatchScore}
                startingScore={matchOptions.startingScore}
                numberOfLegs={matchOptions.numberOfLegs}
                homeScore={match.scoreA}
                awayScore={match.scoreB}
                onHiCheck={recordHiCheck}
                on180={record180} />
        </Dialog>)
    }

    function canOpenSayg() {
        return match.sideA !== null
            && match.sideB !== null
            && (match.sayg || (account || { access: {} }).access.recordScoresAsYouGo);
    }

    return (<tr className="bg-light">
        <td className={hasBothScores && scoreA > scoreB ? 'bg-winner' : ''}>
            {readOnly || hasNextRound
                ? (match.sideA.name || sideMap[match.sideA.id].name)
                : (<BootstrapDropdown
                     readOnly={readOnly}
                     value={match.sideA ? match.sideA.id : null}
                     options={sideMap.filter(s => exceptSelected(s, matchIndex, 'sideA')).map(sideSelection)}
                     onChange={(side) => updateMatch('sideA', side)}
                     slim={true}
                     className="margin-right" />)}

            {canOpenSayg() ? (<button className="btn btn-sm float-start p-0" onClick={() => setSaygOpen(!saygOpen)}>📊</button>) : null}
            {saygOpen ? renderSaygDialog(match) : null}
        </td>
        <td className={hasBothScores && scoreA > scoreB ? 'narrow-column bg-winner' : 'narrow-column'}>
            {readOnly || hasNextRound
                ? scoreA || ''
                : (<input type="number" value={scoreARecorded ? scoreA || '' : ''} max={matchOptions.numberOfLegs} min="0" onChange={(event) => changeScore(event, 'scoreA')} />)}
        </td>
        <td className="narrow-column">vs</td>
        <td className={hasBothScores && scoreB > scoreA ? 'narrow-column bg-winner' : 'narrow-column'}>
            {readOnly || hasNextRound
                ? scoreB || ''
                : (<input type="number" value={scoreBRecorded ? scoreB || '' : ''} max={matchOptions.numberOfLegs} min="0" onChange={(event) => changeScore(event, 'scoreB')} />)}
        </td>
        <td className={hasBothScores && scoreB > scoreA ? 'bg-winner' : ''}>
            {readOnly || hasNextRound
                ? (match.sideB.name || sideMap[match.sideB.id].name)
                : (<BootstrapDropdown
                     readOnly={readOnly}
                     value={match.sideB ? match.sideB.id : null}
                     options={sideMap.filter(s => exceptSelected(s, matchIndex, 'sideB')).map(sideSelection)}
                     onChange={(side) => updateMatch('sideB', side)}
                     slim={true}
                     className="margin-right" />)}
        </td>
        {readOnly || hasNextRound ? null : (<td className="text-end">
            {matchOptionsDialogOpen ? renderMatchSettingsDialog() : null}

            <button className="btn btn-danger btn-sm" onClick={() => removeMatch()}>🗑</button>
            <button title={`${matchOptions.numberOfLegs} leg/s. Starting score: ${matchOptions.startingScore}`} className="btn btn-sm" onClick={() => setMatchOptionsDialogOpen(true)}>🛠</button>
        </td>)}
    </tr>);
}