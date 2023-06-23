import {MasterDraw} from "./MasterDraw";
import {MatchLog} from "./MatchLog";
import {Summary} from "./Summary";
import {MatchReport} from "./MatchReport";
import {useEffect, useState} from "react";
import {any} from "../../../../helpers/collections";
import {useDependencies} from "../../../../IocContainer";

export function SuperLeaguePrintout({ tournamentData }) {
    // TODO: drive these from data
    const homeTeam = "courage league";
    const awayTeam = "marcs men";

    const { saygApi } = useDependencies();
    const [ saygDataMap, setSaygDataMap ] = useState({});
    const [loading, setLoading] = useState(false);
    const matches = (tournamentData.round || {}).matches || [];
    const unloadedIds = matches.map(m => m.saygId).filter(id => id && !any(Object.keys(saygDataMap), key => key === id));

    useEffect(() => {
        if (loading) {
            return;
        }

        // noinspection JSIgnoredPromiseFromCall
        loadSaygData(unloadedIds);
    },
    // eslint-disable-next-line
    [ loading, saygDataMap ]);

    async function loadSaygData(ids) {
        if (!any(ids)) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const firstId = ids[0];
        const result = await saygApi.get(firstId);
        const newSaygDataMap = Object.assign({}, saygDataMap);
        newSaygDataMap[firstId] = result;
        setSaygDataMap(newSaygDataMap);
        setLoading(false);
    }

    if (any(unloadedIds) || loading) {
        return (<div>Loading: {unloadedIds}</div>);
    }

    return (<div>
        <MasterDraw tournamentData={tournamentData} homeTeam={homeTeam} awayTeam={awayTeam} />
        <MatchLog tournamentData={tournamentData} saygDataMap={saygDataMap} homeTeam={homeTeam} awayTeam={awayTeam} />
        <Summary tournamentData={tournamentData} saygDataMap={saygDataMap} homeTeam={homeTeam} awayTeam={awayTeam} />
        <MatchReport tournamentData={tournamentData} saygDataMap={saygDataMap} homeTeam={homeTeam} awayTeam={awayTeam} />
    </div>);
}