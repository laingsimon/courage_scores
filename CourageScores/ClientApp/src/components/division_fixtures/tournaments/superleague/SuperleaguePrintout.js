import {MasterDraw} from "./MasterDraw";
import {MatchLog} from "./MatchLog";
import {Summary} from "./Summary";
import {MatchReport} from "./MatchReport";
import {useEffect, useState} from "react";
import {any} from "../../../../helpers/collections";
import {useDependencies} from "../../../../IocContainer";
import {useApp} from "../../../../AppContainer";
import {useTournament} from "../TournamentContainer";

export function SuperLeaguePrintout({ division }) {
    const { onError } = useApp();
    const { tournamentData } = useTournament();
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
        return (<div className="d-screen-none">Loading...</div>);
    }

    try {
        return (<div className="d-screen-none">
            <MasterDraw />
            <MatchLog saygDataMap={saygDataMap} />
            <Summary saygDataMap={saygDataMap} />
            <MatchReport saygDataMap={saygDataMap} division={division} />
        </div>);
    } catch (e) {
        onError(e);
    }
}
