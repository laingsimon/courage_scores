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

export interface ISuperLeaguePrintoutProps {
    division: DivisionDto;
}

interface ISaygDataMap {
    [saygId: string]: RecordedScoreAsYouGoDto;
}

export function SuperLeaguePrintout({division}: ISuperLeaguePrintoutProps) {
    const {onError} = useApp();
    const {tournamentData} = useTournament();
    const {saygApi, webSocket} = useDependencies();
    const location = useLocation();
    const {subscriptions} = useLive();
    const [saygDataMap, setSaygDataMap] = useState<ISaygDataMap>({});
    const [loading, setLoading] = useState<boolean>(false);
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
        [loading, saygDataMap]);

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
                    webSocket.subscribe(saygId, (newSaygData: RecordedScoreAsYouGoDto) => {
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

    if (any(unloadedIds) || loading) {
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
                <RefreshControl id={tournamentData.id} />
            </div>
            <MasterDraw
                matches={matches}
                host={tournamentData.host}
                opponent={tournamentData.opponent}
                date={tournamentData.date}
                gender={tournamentData.gender}
                notes={tournamentData.notes}/>
            <MatchLog
                host={tournamentData.host}
                opponent={tournamentData.opponent}
                showWinner={showWinner}
                noOfThrows={noOfThrows}
                saygMatches={saygMatches}/>
            <Summary
                showWinner={showWinner}
                noOfLegs={noOfLegs}
                saygMatches={saygMatches}
                host={tournamentData.host}
                opponent={tournamentData.opponent}/>
            <MatchReport
                gender={tournamentData.gender}
                host={tournamentData.host}
                opponent={tournamentData.opponent}
                saygMatches={saygMatches}
                division={division}
                showWinner={showWinner}
                noOfThrows={noOfThrows}
                noOfLegs={noOfLegs}/>
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
