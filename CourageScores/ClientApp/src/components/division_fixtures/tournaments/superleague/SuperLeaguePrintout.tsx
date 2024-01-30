import {MasterDraw} from "./MasterDraw";
import {MatchLog} from "./MatchLog";
import {Summary} from "./Summary";
import {MatchReport} from "./MatchReport";
import React, {useEffect, useState} from "react";
import {any, max} from "../../../../helpers/collections";
import {useDependencies} from "../../../../IocContainer";
import {useApp} from "../../../../AppContainer";
import {useTournament} from "../TournamentContainer";
import {useLocation} from "react-router-dom";
import {getNoOfLegs, maxNoOfThrowsAllMatches} from "../../../../helpers/superleague";
import {RefreshControl} from "../../RefreshControl";
import {useLive} from "../../LiveContainer";
import {ISuperleagueSaygMatchMapping} from "../../../../interfaces/ISuperleagueSaygMatchMapping";
import {IDivisionDto} from "../../../../interfaces/models/dtos/IDivisionDto";
import {ITournamentMatchDto} from "../../../../interfaces/models/dtos/Game/ITournamentMatchDto";
import {IRecordedScoreAsYouGoDto} from "../../../../interfaces/models/dtos/Game/Sayg/IRecordedScoreAsYouGoDto";
import {ISubscription} from "../../../../interfaces/ISubscription";

export interface ISuperLeaguePrintoutProps {
    division: IDivisionDto;
}

interface ISaygDataMap {
    [saygId: string]: IRecordedScoreAsYouGoDto;
}

export function SuperLeaguePrintout({division}: ISuperLeaguePrintoutProps) {
    const {onError} = useApp();
    const {tournamentData} = useTournament();
    const {saygApi, webSocket} = useDependencies();
    const location = useLocation();
    const {subscriptions} = useLive();
    const [saygDataMap, setSaygDataMap] = useState<ISaygDataMap>({});
    const [loading, setLoading] = useState<boolean>(false);
    const matches: ITournamentMatchDto[] = (tournamentData.round || {}).matches || [];
    const unloadedIds: string[] = matches.map((m: ITournamentMatchDto) => m.saygId).filter((id: string) => id && !any(Object.keys(saygDataMap), (key: string) => key === id));
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
                    webSocket.subscribe(saygId, (newSaygData: IRecordedScoreAsYouGoDto) => {
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
            const result: IRecordedScoreAsYouGoDto = await saygApi.get(firstId);
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

    const saygMatches: ISuperleagueSaygMatchMapping[] = matches.map((m: ITournamentMatchDto): ISuperleagueSaygMatchMapping => {
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
