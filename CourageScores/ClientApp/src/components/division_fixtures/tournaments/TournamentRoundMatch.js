import React, {useState} from "react";
import {BootstrapDropdown} from "../../common/BootstrapDropdown";
import {Dialog} from "../../common/Dialog";
import {EditMatchOptions} from "../EditMatchOptions";
import {useApp} from "../../../AppContainer";
import {useDependencies} from "../../../IocContainer";
import {useTournament} from "./TournamentContainer";
import {SaygLoadingContainer} from "../sayg/SaygLoadingContainer";

export function TournamentRoundMatch({ readOnly, match, hasNextRound, sideMap, exceptSelected, matchIndex, onChange, round, matchOptions, onMatchOptionsChanged, onHiCheck, on180, patchData }) {
    const { account, onError } = useApp();
    const { tournamentApi } = useDependencies();
    const { tournamentData, setTournamentData } = useTournament();
    const scoreA = Number.parseInt(match.scoreA);
    const scoreB = Number.parseInt(match.scoreB);
    const scoreARecorded = hasScore(match.scoreA);
    const scoreBRecorded = hasScore(match.scoreB);
    const hasBothScores = scoreARecorded && scoreBRecorded;
    const [ matchOptionsDialogOpen, setMatchOptionsDialogOpen ] = useState(false);
    const [ saygOpen, setSaygOpen ] = useState(false);
    const [ creatingSayg, setCreatingSayg ] = useState(false);

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

        async function recordHiCheck(sideName, score) {
            if (readOnly) {
                return;
            }

            const side = sideName === 'home' ? match.sideA : match.sideB;
            if (side.players.length === 1) {
                if (onHiCheck) {
                    await onHiCheck(side.players[0], score);
                }

                await patchData({
                    additionalOver100Checkout: Object.assign({}, side.players[0], { notes: score.toString() }),
                });
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

                await patchData({
                    additional180: side.players[0],
                });
            }
        }

        return (<Dialog slim={true} title={`${home} vs ${away} - best of ${matchOptions.numberOfLegs}`} onClose={() => setSaygOpen(null)} className="text-start">
            <SaygLoadingContainer
                id={match.saygId}
                onHiCheck={recordHiCheck}
                on180={record180}
                autoSave={true}
                onSaved={async (data) => {
                    await patchData({
                        match: {
                            sideA: match.sideA.id,
                            sideB: match.sideB.id,
                            scoreA: data.homeScore,
                            scoreB: data.awayScore,
                        }
                    }, true);
                }}>
            </SaygLoadingContainer>
        </Dialog>)
    }

    function canOpenSayg() {
        return match.sideA !== null
            && match.sideB !== null
            && (match.saygId || (account || { access: {} }).access.recordScoresAsYouGo);
    }

    async function openSaygDialog() {
        if (match.saygId) {
            setSaygOpen(true);
            return;
        }

        /* istanbul ignore next */
        if (creatingSayg) {
            /* istanbul ignore next */
            return;
        }

        // TODO: trigger a save? otherwise unsaved data could be lost

        try {
            setCreatingSayg(true);

            const response = await tournamentApi.addSayg(tournamentData.id, match.id, matchOptions);
            if (response.success) {
                setTournamentData(response.result);
                setSaygOpen(true);
            } else {
                // TODO: show as a HTML error
                window.alert('Could not create sayg session: ' + JSON.stringify(response));
            }
        } catch (e) {
            onError(e);
        } finally {
            setCreatingSayg(false);
        }
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

            {canOpenSayg() ? (<button className="btn btn-sm float-start p-0" onClick={openSaygDialog}>
                {creatingSayg
                    ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>)
                    : '📊'}
            </button>) : null}
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