import {Link} from "react-router";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {useState} from "react";
import {CreateTournamentSaygDto} from "../../interfaces/models/dtos/Game/CreateTournamentSaygDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {useApp} from "../common/AppContainer";
import {useDependencies} from "../common/IocContainer";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {ILiveOptions} from "../../live/ILiveOptions";
import {Dialog} from "../common/Dialog";
import {ILoadedScoreAsYouGoDto, SaygLoadingContainer} from "../sayg/SaygLoadingContainer";
import {SuperleagueMatchHeading} from "./SuperleagueMatchHeading";
import {DebugOptions} from "../common/DebugOptions";
import {TournamentSideDto} from "../../interfaces/models/dtos/Game/TournamentSideDto";
import {count} from "../../helpers/collections";
import {useTournament} from "./TournamentContainer";
import {TournamentMatchDto} from "../../interfaces/models/dtos/Game/TournamentMatchDto";
import {GameMatchOptionDto} from "../../interfaces/models/dtos/Game/GameMatchOptionDto";
import {TournamentPlayerDto} from "../../interfaces/models/dtos/Game/TournamentPlayerDto";
import {PatchTournamentDto} from "../../interfaces/models/dtos/Game/PatchTournamentDto";
import {PatchTournamentRoundDto} from "../../interfaces/models/dtos/Game/PatchTournamentRoundDto";
import {add180, addHiCheck} from "../common/Accolades";
import {START_SCORING} from "./tournaments";
import {UntypedPromise} from "../../interfaces/UntypedPromise";
import {asyncClear} from "../../helpers/events";
import {hasAccess} from "../../helpers/conditions";

export interface IMatchSaygProps {
    match: TournamentMatchDto;
    matchIndex: number;
    matchOptions: GameMatchOptionDto;
    patchData?(patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean, saygId?: string): UntypedPromise;
    readOnly?: boolean;
    showViewSayg?: boolean;
    firstLegPlayerSequence?: ('home' | 'away')[];
    finalLegPlayerSequence?: ('home' | 'away')[];
}

export function MatchSayg({ match, matchIndex, matchOptions, patchData, readOnly, showViewSayg, firstLegPlayerSequence, finalLegPlayerSequence } : IMatchSaygProps) {
    const {tournamentData, setTournamentData, saveTournament, setPreventScroll} = useTournament();
    const {account, onError} = useApp();
    const {tournamentApi, settings} = useDependencies();
    const [saygOpen, setSaygOpen] = useState<boolean>(false);
    const [creatingSayg, setCreatingSayg] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<IClientActionResultDto<TournamentGameDto> | undefined>(undefined);
    const saygId: string = match.saygId!;
    const scoreA: number = match.scoreA!;
    const scoreB: number = match.scoreB!;
    const onHiCheck: (player: TournamentPlayerDto, score: number) => UntypedPromise = addHiCheck(tournamentData, setTournamentData!);
    const on180: (player: TournamentPlayerDto) => UntypedPromise = add180(tournamentData, setTournamentData!);

    async function changeDialogState(state: boolean) {
        setPreventScroll(state);
        setSaygOpen(state);
        const numberOfLegs: number = matchOptions.numberOfLegs!;
        const finished: boolean = (scoreA > numberOfLegs / 2.0) || (scoreB > numberOfLegs / 2.0);

        if (!state && document.fullscreenElement) {
            await leaveFullScreen();
        } else if (state && !finished) {
            // enter full screen
            await enterFullScreen();
        }
    }

    async function enterFullScreen() {
        if (document.fullscreenEnabled) {
            await document.body.requestFullscreen();
        }
    }

    async function leaveFullScreen() {
        try {
            await document.exitFullscreen();
        } catch (e: any) {
            /* istanbul ignore next */
            console.error('Unable to leave fullscreen', e);
        }
    }

    async function openSaygDialog() {
        if (saygId) {
            await changeDialogState(true);
            return;
        }

        if (!match.id) {
            alert('Save the tournament first');
            return;
        }

        /* istanbul ignore next */
        if (creatingSayg) {
            /* istanbul ignore next */
            return;
        }

        setCreatingSayg(true);

        // save any existing data, to ensure any pending changes aren't lost.
        await saveTournament!(true); // prevent a loading display; which will corrupt the state of this component instance

        try {
            const request: CreateTournamentSaygDto = {
                matchOptions: matchOptions,
                matchId: match.id,
            };
            const response: IClientActionResultDto<TournamentGameDto> = await tournamentApi.addSayg(tournamentData.id, request);
            if (response.success) {
                await setTournamentData!(response.result!);
                await changeDialogState(true);
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

    function canShowLiveSayg(): boolean {
        const hasSaygData: boolean = !!saygId;
        const hasSidesSelected: boolean = match.sideA !== null && match.sideB !== null;

        return hasSidesSelected && hasSaygData;
    }

    function canOpenSaygDialog(): boolean {
        const isPermitted: boolean = hasAccess(account, access => access.recordScoresAsYouGo);
        const hasSaygData: boolean = !!saygId;
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

        if (scoreA || scoreB) {
            // scores already recorded
            // must be after hasSaygData to ensure existing data can be edited
            return false;
        }

        if (tournamentData.singleRound) {
            // super league match, and permitted, allow it to be created
            return true;
        }

        return ((match.sideA.players || []).length === 1 && (match.sideB.players || []).length === 1)
            || (!!match.sideA.teamId && !!match.sideB.teamId);
    }

    function renderSaygDialog() {
        const numberOfLegs: number = matchOptions.numberOfLegs!;
        const finished: boolean = (scoreA > numberOfLegs / 2.0) || (scoreB > numberOfLegs / 2.0);
        const liveOptions: ILiveOptions = {
            publish: true,
        };

        return (<Dialog className="text-start" fullScreen={true}>
            <SaygLoadingContainer
                id={saygId}
                onHiCheck={recordHiCheck}
                on180={record180}
                autoSave={true}
                liveOptions={liveOptions}
                onSaved={patchData ? (async (data: ILoadedScoreAsYouGoDto) => {
                    await patchData({
                        match: {
                            sideA: match.sideA.id,
                            sideB: match.sideB.id,
                            scoreA: data.homeScore,
                            scoreB: data.awayScore,
                        }
                    }, true, saygId);
                }): undefined}
                firstLegPlayerSequence={firstLegPlayerSequence}
                finalLegPlayerSequence={finalLegPlayerSequence}
                onFinished={leaveFullScreen}
                minimisePlayerNames={false}>
                <SuperleagueMatchHeading match={match} />
            </SaygLoadingContainer>
            <div className="modal-footer px-0 pb-0 mt-3">
                <div className="left-aligned mx-0">
                    <button className="btn btn-secondary" onClick={async () => await changeDialogState(false)}>Close</button>
                </div>
                {finished
                    ? null
                    : (<a className="btn btn-success" target="_blank" rel="noreferrer" href={`/live/match/${saygId}`}>
                        👁️ Live
                    </a>)}
                <DebugOptions>
                    <a target="_blank" rel="noreferrer" href={`${settings.apiHost}/api/Sayg/${saygId}`} className="dropdown-item">
                        <strong>Sayg data</strong><small className="d-block">{saygId}</small>
                    </a>
                    <a className="dropdown-item" target="_blank" rel="noreferrer" href={`/live/match/${saygId}`}>Live match statistics</a>
                    <button disabled={!saygId} className="dropdown-item text-danger" onClick={deleteSayg}>
                        Delete sayg
                    </button>
                    <a target="_blank" rel="noreferrer" href={`${settings.apiHost}/api/Tournament/${tournamentData.id}`} className="dropdown-item">
                        <strong>Tournament data</strong><small className="d-block">{tournamentData.id}</small>
                    </a>
                </DebugOptions>
            </div>
        </Dialog>)
    }

    async function recordHiCheck(sideName: string, score: number) {
        if (readOnly) {
            return;
        }

        const side: TournamentSideDto = sideName === 'home' ? match.sideA : match.sideB;
        if (count(side.players) === 1) {
            await onHiCheck(side.players![0], score);

            if (patchData) {
                await patchData({
                    additionalOver100Checkout: Object.assign({}, side.players![0], {score}),
                });
            }
        }
    }

    async function record180(sideName: string) {
        if (readOnly) {
            return;
        }

        const side: TournamentSideDto = sideName === 'home' ? match.sideA : match.sideB;
        if (count(side.players) === 1) {
            await on180(side.players![0]);

            if (patchData) {
                await patchData({
                    additional180: side.players![0],
                });
            }
        }
    }

    async function deleteSayg() {
        if (!window.confirm('Are you sure you want to delete the sayg data for this match?')) {
            return;
        }

        try {
            const response: IClientActionResultDto<TournamentGameDto> = await tournamentApi.deleteSayg(tournamentData.id, match.id);
            if (!response.success) {
                onError(response);
                return;
            }

            const clearScores = window.confirm('Clear match score (to allow scores to be re-recorded?)');
            if (clearScores) {
                const responseRound = response.result!.round!;
                const responseMatch = responseRound.matches![matchIndex];

                responseMatch.scoreA = 0;
                responseMatch.scoreB = 0;
            }

            await setTournamentData!(response.result!);
            if (clearScores) {
                await saveTournament!(true); // prevent a loading display; which will corrupt the state of this component instance
            }
            await changeDialogState(false);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    return (<>
        {canShowLiveSayg() && !canOpenSaygDialog() && showViewSayg
            ? (<Link className="btn btn-sm float-start p-0" to={`/live/match/${saygId}`}>
                📊 {scoreA || scoreB ? (`${scoreA} - ${scoreB}`) : null}
            </Link>)
            : null}
        {canOpenSaygDialog()
            ? (<button className="btn btn-sm btn-primary float-start d-print-none" onClick={openSaygDialog}>
                {creatingSayg
                    ? (<LoadingSpinnerSmall/>)
                    : (scoreA || scoreB ? `📊 ${scoreA} - ${scoreB}` : START_SCORING)}
            </button>)
            : null}
        {saveError
            ? (<ErrorDisplay
                {...saveError}
                onClose={asyncClear(setSaveError)}
                title="Could not create sayg session"/>)
            : null}
        {saygOpen ? renderSaygDialog() : null}
    </>);
}