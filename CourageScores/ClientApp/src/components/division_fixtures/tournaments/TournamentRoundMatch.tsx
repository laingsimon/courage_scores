import React, {useState} from "react";
import {BootstrapDropdown, IBootstrapDropdownItem} from "../../common/BootstrapDropdown";
import {Dialog} from "../../common/Dialog";
import {EditMatchOptions} from "../EditMatchOptions";
import {useApp} from "../../../AppContainer";
import {useDependencies} from "../../../IocContainer";
import {useTournament} from "./TournamentContainer";
import {ILoadedScoreAsYouGoDto, SaygLoadingContainer} from "../sayg/SaygLoadingContainer";
import {ErrorDisplay} from "../../common/ErrorDisplay";
import {LoadingSpinnerSmall} from "../../common/LoadingSpinnerSmall";
import {count, DataMap} from "../../../helpers/collections";
import {SuperleagueMatchHeading} from "./SuperleagueMatchHeading";
import {DebugOptions} from "../../common/DebugOptions";
import {Link} from "react-router-dom";
import {ILiveOptions} from "../../../interfaces/ILiveOptions";
import {ITournamentMatchDto} from "../../../interfaces/models/dtos/Game/ITournamentMatchDto";
import {ITournamentRoundDto} from "../../../interfaces/models/dtos/Game/ITournamentRoundDto";
import {IGameMatchOptionDto} from "../../../interfaces/models/dtos/Game/IGameMatchOptionDto";
import {ITournamentSideDto} from "../../../interfaces/models/dtos/Game/ITournamentSideDto";
import {IClientActionResultDto} from "../../../interfaces/IClientActionResultDto";
import {ITournamentGameDto} from "../../../interfaces/models/dtos/Game/ITournamentGameDto";
import {ITournamentPlayerDto} from "../../../interfaces/models/dtos/Game/ITournamentPlayerDto";
import {IPatchTournamentDto} from "../../../interfaces/models/dtos/Game/IPatchTournamentDto";
import {IPatchTournamentRoundDto} from "../../../interfaces/models/dtos/Game/IPatchTournamentRoundDto";

export interface ITournamentRoundMatchProps {
    readOnly?: boolean;
    match: ITournamentMatchDto;
    hasNextRound?: boolean;
    sideMap: DataMap<ITournamentSideDto>;
    exceptSelected: (side: ITournamentSideDto, matchIndex: number, sideAOrB: string) => boolean;
    matchIndex: number;
    onChange?: (round: ITournamentRoundDto) => Promise<any>;
    round: ITournamentRoundDto;
    matchOptions: IGameMatchOptionDto;
    onMatchOptionsChanged: (newOptions: IGameMatchOptionDto) => Promise<any>;
    onHiCheck?: (player: ITournamentPlayerDto, score: number) => Promise<any>;
    on180?: (player: ITournamentPlayerDto) => Promise<any>;
    patchData: (patch: IPatchTournamentDto | IPatchTournamentRoundDto, nestInRound?: boolean) => Promise<any>;
}

export function TournamentRoundMatch({ readOnly, match, hasNextRound, sideMap, exceptSelected, matchIndex, onChange,
                                         round, matchOptions, onMatchOptionsChanged, onHiCheck, on180, patchData }: ITournamentRoundMatchProps) {
    const {account, onError} = useApp();
    const {tournamentApi, settings} = useDependencies();
    const {tournamentData, setTournamentData, saveTournament} = useTournament();
    const scoreA: number = match.scoreA;
    const scoreB: number = match.scoreB;
    const scoreARecorded: boolean = hasScore(match.scoreA);
    const scoreBRecorded: boolean = hasScore(match.scoreB);
    const hasBothScores: boolean = scoreARecorded && scoreBRecorded;
    const [matchOptionsDialogOpen, setMatchOptionsDialogOpen] = useState<boolean>(false);
    const [saygOpen, setSaygOpen] = useState<boolean>(false);
    const [creatingSayg, setCreatingSayg] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<IClientActionResultDto<ITournamentGameDto> | null>(null);

    function sideSelection(side: ITournamentSideDto): IBootstrapDropdownItem {
        return {
            value: side.id,
            text: side.name
        };
    }

    function hasScore(score: number) {
        return score !== null && score !== undefined;
    }

    async function updateMatch(property: string, sideId: string) {
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

    async function changeScore(event: React.ChangeEvent<HTMLInputElement>, property: string) {
        try {
            const newRound: ITournamentRoundDto = Object.assign({}, round);
            const match: ITournamentMatchDto = newRound.matches[matchIndex];
            match[property] = Number.parseInt(event.target.value || '0');

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

        const newRound: ITournamentRoundDto = Object.assign({}, round);
        newRound.matches = round.matches || [];
        newRound.matches.splice(matchIndex, 1);

        if (onChange) {
            await onChange(newRound);
        }
    }

    function renderMatchSettingsDialog() {
        return (<Dialog title="Edit match options" slim={true} onClose={async () => setMatchOptionsDialogOpen(false)}>
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
            const response: IClientActionResultDto<ITournamentGameDto> = await tournamentApi.deleteSayg(tournamentData.id, match.id);
            if (!response.success) {
                onError(response);
                return;
            }

            window.alert('Sayg removed from match');
            const newRound: ITournamentRoundDto = Object.assign({}, round);
            const newMatch: ITournamentMatchDto = Object.assign({}, match);
            newRound.matches[matchIndex] = newMatch;
            newMatch.saygId = null;
            await onChange(newRound);
            setSaygOpen(null);
            await setTournamentData(response.result);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    function renderSaygDialog() {
        const numberOfLegs: number = matchOptions.numberOfLegs;
        const finished: boolean = (match.scoreA > numberOfLegs / 2.0) || (match.scoreB > numberOfLegs / 2.0);
        const liveOptions: ILiveOptions = {
            publish: true,
        };

        return (<Dialog slim={true} className="text-start">
            <SaygLoadingContainer
                id={match.saygId}
                onHiCheck={recordHiCheck}
                on180={record180}
                autoSave={true}
                liveOptions={liveOptions}
                onSaved={async (data: ILoadedScoreAsYouGoDto) => {
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

    function canOpenSaygDialog(): boolean {
        const isPermitted: boolean = (account || {access: {}}).access.recordScoresAsYouGo;
        const hasSaygData: boolean = !!match.saygId;
        const hasSidesSelected: boolean = match.sideA !== null && match.sideB !== null;

        if (!hasSidesSelected) {
            return false;
        }

        if (hasSaygData && isPermitted) {
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

    function canShowLiveSayg(): boolean {
        const hasSaygData: boolean = !!match.saygId;
        const hasSidesSelected: boolean = match.sideA !== null && match.sideB !== null;

        return hasSidesSelected && hasSaygData;
    }

    async function recordHiCheck(sideName: string, score: number) {
        if (readOnly) {
            return;
        }

        const side: ITournamentSideDto = sideName === 'home' ? match.sideA : match.sideB;
        if (count(side.players) === 1) {
            if (onHiCheck) {
                await onHiCheck(side.players[0], score);
            }

            await patchData({
                additionalOver100Checkout: Object.assign({}, side.players[0], {notes: score.toString()}),
            });
        }
    }

    async function record180(sideName: string) {
        if (readOnly) {
            return;
        }

        const side: ITournamentSideDto = sideName === 'home' ? match.sideA : match.sideB;
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

            const response: IClientActionResultDto<ITournamentGameDto> = await tournamentApi.addSayg(tournamentData.id, match.id, matchOptions);
            if (response.success) {
                await setTournamentData(response.result);
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

    function isWinner(scoreA: number): boolean {
        const numberOfLegs: number = matchOptions ? matchOptions.numberOfLegs : 5;
        return scoreA > (numberOfLegs / 2.0);
    }

    return (<tr className="bg-light">
        <td className={hasBothScores && isWinner(scoreA) ? 'bg-winner' : ''}>
            {readOnly || hasNextRound
                ? (match.sideA.name || sideMap[match.sideA.id].name)
                : (<BootstrapDropdown
                    readOnly={readOnly}
                    value={match.sideA ? match.sideA.id : null}
                    options={sideMap.filter((s: ITournamentSideDto) => exceptSelected(s, matchIndex, 'sideA')).map(sideSelection)}
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
                    onClose={async () => setSaveError(null)}
                    title="Could not create sayg session"/>)
                : null}
            {saygOpen ? renderSaygDialog() : null}
        </td>
        <td className={hasBothScores && isWinner(scoreA) ? 'narrow-column bg-winner' : 'narrow-column'}>
            {readOnly || hasNextRound
                ? scoreA || (scoreARecorded ? '0' : '')
                : (<input type="number" value={scoreARecorded ? (match.scoreA || '0') : ''}
                          max={matchOptions.numberOfLegs} min="0" onChange={(event: React.ChangeEvent<HTMLInputElement>) => changeScore(event, 'scoreA')}/>)}
        </td>
        <td className="narrow-column">vs</td>
        <td className={hasBothScores && isWinner(scoreB) ? 'narrow-column bg-winner' : 'narrow-column'}>
            {readOnly || hasNextRound
                ? scoreB || (scoreBRecorded ? '0' : '')
                : (<input type="number" value={scoreBRecorded ? (match.scoreB || '0') : ''}
                          max={matchOptions.numberOfLegs} min="0" onChange={(event: React.ChangeEvent<HTMLInputElement>) => changeScore(event, 'scoreB')}/>)}
        </td>
        <td className={hasBothScores && isWinner(scoreB) ? 'bg-winner' : ''}>
            {readOnly || hasNextRound
                ? (match.sideB.name || sideMap[match.sideB.id].name)
                : (<BootstrapDropdown
                    readOnly={readOnly}
                    value={match.sideB ? match.sideB.id : null}
                    options={sideMap.filter((s: ITournamentSideDto) => exceptSelected(s, matchIndex, 'sideB')).map(sideSelection)}
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