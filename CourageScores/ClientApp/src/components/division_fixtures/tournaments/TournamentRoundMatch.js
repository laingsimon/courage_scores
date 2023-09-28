import React, {useState} from "react";
import {BootstrapDropdown} from "../../common/BootstrapDropdown";
import {Dialog} from "../../common/Dialog";
import {EditMatchOptions} from "../EditMatchOptions";
import {useApp} from "../../../AppContainer";
import {useDependencies} from "../../../IocContainer";
import {useTournament} from "./TournamentContainer";
import {SaygLoadingContainer} from "../sayg/SaygLoadingContainer";
import {ErrorDisplay} from "../../common/ErrorDisplay";
import {LoadingSpinnerSmall} from "../../common/LoadingSpinnerSmall";
import {count} from "../../../helpers/collections";
import {SuperleagueMatchHeading} from "./SuperleagueMatchHeading";
import {DebugOptions} from "../../common/DebugOptions";
import {Link} from "react-router-dom";

export function TournamentRoundMatch({ readOnly, match, hasNextRound, sideMap, exceptSelected, matchIndex, onChange,
                                         round, matchOptions, onMatchOptionsChanged, onHiCheck, on180, patchData }) {
    const {account, onError} = useApp();
    const {tournamentApi, settings} = useDependencies();
    const {tournamentData, setTournamentData, saveTournament} = useTournament();
    const scoreA = Number.parseInt(match.scoreA);
    const scoreB = Number.parseInt(match.scoreB);
    const scoreARecorded = hasScore(match.scoreA);
    const scoreBRecorded = hasScore(match.scoreB);
    const hasBothScores = scoreARecorded && scoreBRecorded;
    const [matchOptionsDialogOpen, setMatchOptionsDialogOpen] = useState(false);
    const [saygOpen, setSaygOpen] = useState(false);
    const [creatingSayg, setCreatingSayg] = useState(false);
    const [saveError, setSaveError] = useState(null);

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
            /* istanbul ignore next */
            onError(e);
        }
    }

    async function changeScore(event, property) {
        try {
            const newRound = Object.assign({}, round);
            const match = newRound.matches[matchIndex];
            match[property] = event.target.value || '0';

            if (onChange) {
                await onChange(newRound);
            }
        } catch (e) {
            /* istanbul ignore next */
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

    function renderMatchSettingsDialog() {
        return (<Dialog title="Edit match options" slim={true} onClose={() => setMatchOptionsDialogOpen(false)}>
            <EditMatchOptions
                matchOptions={matchOptions}
                onMatchOptionsChanged={onMatchOptionsChanged}
                hideNumberOfPlayers={true}/>
        </Dialog>);
    }

    async function deleteSayg() {
        if (!window.confirm('Are you sure you want to delete the sayg data for this match?')) {
            return;
        }

        try {
            const response = await tournamentApi.deleteSayg(tournamentData.id, match.id);
            if (!response.success) {
                onError(response);
                return;
            }

            window.alert('Sayg removed from match');
            const newRound = Object.assign({}, round);
            const newMatch = Object.assign({}, match);
            newRound.matches[matchIndex] = newMatch;
            newMatch.saygId = null;
            onChange(newRound);
            setSaygOpen(null);
            setTournamentData(response.result);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    function renderSaygDialog() {
        const numberOfLegs = matchOptions.numberOfLegs;
        const finished = (match.scoreA >= numberOfLegs / 2.0) || (match.scoreB >= numberOfLegs / 2.0);

        return (<Dialog slim={true} className="text-start">
            <SaygLoadingContainer
                id={match.saygId}
                onHiCheck={recordHiCheck}
                on180={record180}
                autoSave={true}
                refreshAllowed={true}
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
                <SuperleagueMatchHeading match={match} />
            </SaygLoadingContainer>
            <div className="modal-footer px-0 pb-0 mt-3">
                <div className="left-aligned mx-0">
                    <button className="btn btn-secondary" onClick={() => setSaygOpen(null)}>Close</button>
                </div>
                {finished
                    ? null
                    : (<a className="btn btn-success" target="_blank" rel="noreferrer" href={`/live/match/${match.saygId}`}>
                        👁️ Live
                    </a>)}
                <DebugOptions>
                    <a target="_blank" rel="noreferrer" href={`${settings.apiHost}/api/Game/Sayg/${match.saygId}`} className="dropdown-item">
                        <strong>Sayg data</strong><small className="d-block">{match.saygId}</small>
                    </a>
                    <a className="dropdown-item" target="_blank" rel="noreferrer" href={`/live/match/${match.saygId}`}>Live match statistics</a>
                    <button disabled={!match.saygId} className="dropdown-item text-danger" onClick={deleteSayg}>
                        Delete sayg
                    </button>
                    <a target="_blank" rel="noreferrer" href={`${settings.apiHost}/api/Tournament/${tournamentData.id}`} className="dropdown-item">
                        <strong>Tournament data</strong><small className="d-block">{tournamentData.id}</small>
                    </a>
                </DebugOptions>
            </div>
        </Dialog>)
    }

    function canOpenSaygDialog() {
        const isPermitted = (account || {access: {}}).access.recordScoresAsYouGo;
        const hasSaygData = !!match.saygId;
        const hasSidesSelected = match.sideA !== null && match.sideB !== null;

        if (!hasSidesSelected) {
            return false;
        }

        if (hasSaygData) {
            // there is some data, allow it to be viewed
            return true;
        }

        if (!isPermitted) {
            // no existing data, not permitted to create new data
            return false;
        }

        if (tournamentData.singleRound) {
            // super league match, and permitted, allow it to be created
            return true;
        }

        return match.sideA.players.length === 1 && match.sideB.players.length === 1;
    }

    function canShowLiveSayg() {
        const hasSaygData = !!match.saygId;
        const hasSidesSelected = match.sideA !== null && match.sideB !== null;

        if (!hasSidesSelected) {
            return false;
        }

        return hasSaygData;
    }

    async function recordHiCheck(sideName, score) {
        if (readOnly) {
            return;
        }

        const side = sideName === 'home' ? match.sideA : match.sideB;
        if (count(side.players) === 1) {
            if (onHiCheck) {
                await onHiCheck(side.players[0], score);
            }

            await patchData({
                additionalOver100Checkout: Object.assign({}, side.players[0], {notes: score.toString()}),
            });
        }
    }

    async function record180(sideName) {
        if (readOnly) {
            return;
        }

        const side = sideName === 'home' ? match.sideA : match.sideB;
        if (count(side.players) === 1) {
            if (on180) {
                await on180(side.players[0]);
            }

            await patchData({
                additional180: side.players[0],
            });
        }
    }

    async function openSaygDialog() {
        if (match.saygId) {
            setSaygOpen(true);
            return;
        }

        if (!match.id) {
            alert('Save the tournament first');
            return;
        }

        if (match.scoreA || match.scoreB) {
            // scores already recorded
            alert('Game has already been played; cannot score as you go');
            return;
        }

        /* istanbul ignore next */
        if (creatingSayg) {
            /* istanbul ignore next */
            return;
        }

        // save any existing data, to ensure any pending changes aren't lost.
        await saveTournament(true); // prevent a loading display; which will corrupt the state of this component instance

        try {
            setCreatingSayg(true);

            const response = await tournamentApi.addSayg(tournamentData.id, match.id, matchOptions);
            if (response.success) {
                setTournamentData(response.result);
                setSaygOpen(true);
            } else {
                setSaveError(response);
            }
        } catch (e) {
            /* istanbul ignore next */
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
                    className="margin-right"/>)}

            {canShowLiveSayg() && !canOpenSaygDialog()
                ? (<Link className="btn btn-sm float-start p-0" to={`/live/match/${match.saygId}`}>👁️</Link>)
                : null}
            {canOpenSaygDialog()
                ? (<button className="btn btn-sm float-start p-0" onClick={openSaygDialog}>
                    {creatingSayg
                        ? (<LoadingSpinnerSmall/>)
                        : '📊'}
                </button>)
                : null}
            {saveError
                ? (<ErrorDisplay
                    {...saveError}
                    onClose={() => setSaveError(null)}
                    title="Could not create sayg session"/>)
                : null}
            {saygOpen ? renderSaygDialog() : null}
        </td>
        <td className={hasBothScores && scoreA > scoreB ? 'narrow-column bg-winner' : 'narrow-column'}>
            {readOnly || hasNextRound
                ? scoreA || (scoreARecorded ? '0' : '')
                : (<input type="number" value={scoreARecorded ? (match.scoreA || '0') : ''}
                          max={matchOptions.numberOfLegs} min="0" onChange={(event) => changeScore(event, 'scoreA')}/>)}
        </td>
        <td className="narrow-column">vs</td>
        <td className={hasBothScores && scoreB > scoreA ? 'narrow-column bg-winner' : 'narrow-column'}>
            {readOnly || hasNextRound
                ? scoreB || (scoreBRecorded ? '0' : '')
                : (<input type="number" value={scoreBRecorded ? (match.scoreB || '0') : ''}
                          max={matchOptions.numberOfLegs} min="0" onChange={(event) => changeScore(event, 'scoreB')}/>)}
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
                    className="margin-right"/>)}
        </td>
        {readOnly || hasNextRound ? null : (<td className="text-end">
            {matchOptionsDialogOpen ? renderMatchSettingsDialog() : null}

            <button className="btn btn-danger btn-sm" onClick={() => removeMatch()}>🗑</button>
            <button title={`${matchOptions.numberOfLegs} leg/s. Starting score: ${matchOptions.startingScore}`}
                    className="btn btn-sm" onClick={() => setMatchOptionsDialogOpen(true)}>🛠
            </button>
        </td>)}
    </tr>);
}