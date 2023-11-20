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

export function SuperLeaguePrintout({division}) {
    const {onError} = useApp();
    const {tournamentData} = useTournament();
    const {saygApi, webSocket} = useDependencies();
    const location = useLocation();
    const {subscriptions} = useLive();
    const [saygDataMap, setSaygDataMap] = useState({});
    const [loading, setLoading] = useState(false);
    const matches = (tournamentData.round || {}).matches || [];
    const unloadedIds = matches.map(m => m.saygId).filter(id => id && !any(Object.keys(saygDataMap), key => key === id));
    const showWinner = location.search.indexOf('winner') !== -1;

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

    function processLiveStateChange(enabled) {
        if (enabled) {
            for (let saygId in saygDataMap) {
                if (!subscriptions[saygId]) {
                    webSocket.subscribe(saygId, (newSaygData) => {
                        const newSaygDataMap = Object.assign({}, saygDataMap);
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
                webSocket.unsubscribe(saygId);
            }
        }
    }

    async function loadSaygData(ids) {
        if (!any(ids)) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const firstId = ids[0];
            const result = await saygApi.get(firstId);
            const newSaygDataMap = Object.assign({}, saygDataMap);
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

    const saygMatches = matches.map(m => {
        return {
            match: m,
            saygData: saygDataMap[m.saygId],
        };
    });
    const noOfThrows = maxNoOfThrowsAllMatches(saygMatches);
    const noOfLegs = tournamentData.bestOf || max(saygMatches, map => getNoOfLegs(map.saygData));

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
                noOfLegs={noOfLegs}
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
