import {MasterDraw} from "./MasterDraw";
import {MatchLog} from "./MatchLog";
import {Summary} from "./Summary";
import {MatchReport} from "./MatchReport";
import {useEffect, useState} from "react";
import {any, max} from "../../../helpers/collections";
import {useDependencies} from "../../common/IocContainer";
import {useApp} from "../../common/AppContainer";
import {useTournament} from "../TournamentContainer";
import {useLocation} from "react-router-dom";
import {getNoOfLegs, maxNoOfThrowsAllMatches} from "../../../helpers/superleague";
import {RefreshControl} from "../../common/RefreshControl";
import {useLive} from "../../../live/LiveContainer";
import {ISuperleagueSaygMatchMapping} from "./ISuperleagueSaygMatchMapping";
import {DivisionDto} from "../../../interfaces/models/dtos/DivisionDto";
import {TournamentMatchDto} from "../../../interfaces/models/dtos/Game/TournamentMatchDto";
import {RecordedScoreAsYouGoDto} from "../../../interfaces/models/dtos/Game/Sayg/RecordedScoreAsYouGoDto";
import {ISubscription} from "../../../live/ISubscription";
import {PatchTournamentDto} from "../../../interfaces/models/dtos/Game/PatchTournamentDto";
import {PatchTournamentRoundDto} from "../../../interfaces/models/dtos/Game/PatchTournamentRoundDto";
import {LiveDataType} from "../../../interfaces/models/dtos/Live/LiveDataType";

export interface ISuperLeaguePrintoutProps {
    division: DivisionDto;
    patchData?(patch: PatchTournamentDto | PatchTournamentRoundDto, nestInRound?: boolean): Promise<boolean>;
    readOnly?: boolean;
}

interface ISaygDataMap {
    [saygId: string]: RecordedScoreAsYouGoDto;
}

export function SuperLeaguePrintout({division, patchData, readOnly}: ISuperLeaguePrintoutProps) {
    const {onError} = useApp();
    const {tournamentData, preventScroll} = useTournament();
    const {saygApi, webSocket} = useDependencies();
    const location = useLocation();
    const {subscriptions} = useLive();
    const [saygDataMap, setSaygDataMap] = useState<ISaygDataMap>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [finishedLoading, setFinishedLoading] = useState<boolean>(false);
    const matches: TournamentMatchDto[] = (tournamentData.round || {}).matches || [];
    const unloadedIds: string[] = matches.map((m: TournamentMatchDto) => m.saygId).filter((id: string) => id && !any(Object.keys(saygDataMap), (key: string) => key === id));
    const showWinner: boolean = location.search.indexOf('winner') !== -1;

    useEffect(() => {
            if (loading) {
                return;
            }

            // noinspection JSIgnoredPromiseFromCall
            loadSaygData(unloadedIds);
        },
        // eslint-disable-next-line
        [loading, saygDataMap, unloadedIds]);

    useEffect(() => {
            if (loading) {
                return;
            }

            processLiveStateChange(subscriptions[tournamentData.id]);
        },
        // eslint-disable-next-line
        [subscriptions, loading]);

    function processLiveStateChange(enabled: ISubscription) {
        if (enabled) {
            for (let saygId in saygDataMap) {
                if (!subscriptions[saygId]) {
                    // noinspection JSIgnoredPromiseFromCall
                    webSocket.subscribe({ id: saygId, type: LiveDataType.sayg }, (newSaygData: RecordedScoreAsYouGoDto) => {
                        const newSaygDataMap: ISaygDataMap = Object.assign({}, saygDataMap);
                        newSaygDataMap[newSaygData.id] = newSaygData;
                        setSaygDataMap(newSaygDataMap);
                    }, onError);
                }
            }

            return;
        }

        // foreach socket in saygSockets, close and remove it
        for (let saygId in saygDataMap) {
            if (subscriptions[saygId]) {
                // noinspection JSIgnoredPromiseFromCall
                webSocket.unsubscribe(saygId);
            }
        }
    }

    async function loadSaygData(ids: string[]) {
        if (!any(ids)) {
            setLoading(false);
            setFinishedLoading(true);
            return;
        }

        try {
            setLoading(true);
            const firstId: string = ids[0];
            const result: RecordedScoreAsYouGoDto = await saygApi.get(firstId);
            const newSaygDataMap: ISaygDataMap = Object.assign({}, saygDataMap);
            newSaygDataMap[firstId] = result;
            setSaygDataMap(newSaygDataMap);
            setLoading(false);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    if ((any(unloadedIds) || loading) && !finishedLoading) {
        return (<div>Loading...</div>);
    }

    const saygMatches: ISuperleagueSaygMatchMapping[] = matches.map((m: TournamentMatchDto): ISuperleagueSaygMatchMapping => {
        return {
            match: m,
            saygData: saygDataMap[m.saygId],
        };
    });
    const noOfThrows: number = maxNoOfThrowsAllMatches(saygMatches);
    const noOfLegs: number = tournamentData.bestOf || max(saygMatches, (map: ISuperleagueSaygMatchMapping) => getNoOfLegs(map.saygData) || 0);

    try {
        return (<div className="overflow-auto no-overflow-on-print">
            <div className="float-end">
                <RefreshControl id={tournamentData.id} type={LiveDataType.tournament} />
            </div>
            <MasterDraw
                matches={matches}
                host={tournamentData.host}
                opponent={tournamentData.opponent}
                date={tournamentData.date}
                gender={tournamentData.gender}
                notes={tournamentData.notes}
                patchData={patchData}
                readOnly={readOnly} />
            {preventScroll ? null : (<MatchLog
                host={tournamentData.host}
                opponent={tournamentData.opponent}
                showWinner={showWinner}
                noOfThrows={noOfThrows}
                saygMatches={saygMatches}/>)}
            {preventScroll ? null : (<Summary
                showWinner={showWinner}
                noOfLegs={noOfLegs}
                saygMatches={saygMatches}
                host={tournamentData.host}
                opponent={tournamentData.opponent}/>)}
            {preventScroll ? null : (<MatchReport
                gender={tournamentData.gender}
                host={tournamentData.host}
                opponent={tournamentData.opponent}
                saygMatches={saygMatches}
                division={division}
                showWinner={showWinner}
                noOfThrows={noOfThrows}
                noOfLegs={noOfLegs}/>)}
            {preventScroll ? (<div>Content hidden to prevent vertical scrolling whilst entering scores</div>) : null}
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
