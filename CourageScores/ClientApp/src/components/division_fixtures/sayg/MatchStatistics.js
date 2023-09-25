import {sum} from "../../../helpers/collections";
import {MatchDartCount} from "./MatchDartCount";
import {MatchAverage} from "./MatchAverage";
import {LegStatistics} from "./LegStatistics";
import {useEffect, useState} from "react";
import {useSayg} from "./SaygLoadingContainer";
import {BootstrapDropdown} from "../../common/BootstrapDropdown";
import {LoadingSpinnerSmall} from "../../common/LoadingSpinnerSmall";

export function MatchStatistics({legs, homeScore, awayScore, home, away, singlePlayer, legChanged, numberOfLegs,
                                    refreshAllowed, initialRefreshInterval}) {
    const [oneDartAverage, setOneDartAverage] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState(initialRefreshInterval || 0);
    const { refresh } = useSayg();
    const [ refreshing, setRefreshing ] = useState(false);
    const [legDisplayOptionsState, setLegDisplayOptions] = useState(getLegDisplayOptions(legs));
    const finished = (homeScore >= numberOfLegs / 2.0) || (awayScore >= numberOfLegs / 2.0);
    const canRefresh = refreshAllowed && !finished;
    const legDisplayOptions = refreshInterval
        ? getLegDisplayOptions(legs, true)
        : legDisplayOptionsState;

    function getLegDisplayOptions(legs, showThrowsOnLastLeg) {
        const options = {};
        let lastLegIndex = null;
        Object.keys(legs).forEach(legIndex => {
            options[legIndex] = {
                showThrows: false,
                showAverage: false,
            };

            const leg = legs[legIndex];
            if (leg.home.score || leg.away.score) {
                // leg has started
                lastLegIndex = legIndex;
            }
        });

        if (showThrowsOnLastLeg && lastLegIndex) {
            options[lastLegIndex].showThrows = true;
            options[lastLegIndex].showAverage = true; // TODO: make this configurable
        }

        return options;
    }

    function updateLegDisplayOptions(legIndex, options) {
        const newLegDisplayOptions = Object.assign({}, legDisplayOptions);
        newLegDisplayOptions[legIndex] = options;
        setLegDisplayOptions(newLegDisplayOptions);
    }

    useEffect(() => {
        if (refreshInterval <= 0) {
            return;
        }

        const handle = window.setInterval(refreshSaygData, refreshInterval);

        return () => {
            window.clearInterval(handle);
        }
    },
    // eslint-disable-next-line
    [refreshInterval]);

    async function refreshSaygData() {
        // call out to loading container to refresh the data
        setRefreshing(true);
        try {
            await refresh();
        } finally {
            setRefreshing(false);
        }
    }

    function sumOf(player, prop) {
        return sum(Object.values(legs), leg => leg[player][prop]);
    }

    function getRefreshOptions() {
        return [
            { value: 0, text: '⏸️ No refresh' },
            { value: 1000, text: '⏩ Live: Extra-Fast' },
            { value: 10000, text: '▶️ Live: Fast' },
            { value: 60000, text: '🔃 Live: Medium' },
        ];
    }

    return (<div>
        <h4 className="text-center">
            Match statistics
            {canRefresh
                ? (<>
                    <BootstrapDropdown
                        className="margin-left"
                        options={getRefreshOptions()}
                        onChange={v => setRefreshInterval(v)}
                        value={refreshInterval} />
                    <span className="width-20 d-inline-block ms-2 text-secondary-50">{refreshing ? <LoadingSpinnerSmall /> : null}</span>
                </>)
                : refreshAllowed ? (<span className="width-20 d-inline-block ms-2 text-secondary-50">⏸️</span>) : null}
        </h4>
        <table className="table">
            <thead>
            {singlePlayer ? null : (<tr>
                <th></th>
                <th className={homeScore > awayScore ? 'text-primary' : ''}>{home}</th>
                <th className={homeScore > awayScore ? '' : 'text-primary'}>{away}</th>
            </tr>)}
            </thead>
            <tbody>
            <tr>
                <td>Score</td>
                <td className={`${homeScore > awayScore ? 'bg-winner text-primary' : ''} text-center`}>
                    <strong>{homeScore || '0'}</strong></td>
                {singlePlayer
                    ? null
                    : (<td className={`${homeScore > awayScore ? '' : 'bg-winner text-primary'} text-center`}>
                        <strong>{awayScore || '0'}</strong>
                    </td>)}
            </tr>
            {Object.keys(legs).map(legIndex => {
                return (<LegStatistics
                    key={legIndex}
                    legNumber={Number.parseInt(legIndex) + 1}
                    leg={legs[legIndex]}
                    home={home}
                    away={away}
                    singlePlayer={singlePlayer}
                    oneDartAverage={oneDartAverage}
                    legDisplayOptions={legDisplayOptions[legIndex]}
                    updateLegDisplayOptions={refreshInterval ? null : (options) => updateLegDisplayOptions(legIndex, options)}
                    onChangeLeg={legChanged ? ((newLeg) => legChanged(newLeg, legIndex)) : null}
                />);
            })}
            </tbody>
            <tfoot>
            <MatchAverage
                homeAverage={sumOf('home', 'score') / (sumOf('home', 'noOfDarts') / 3)}
                awayAverage={sumOf('away', 'score') / (sumOf('away', 'noOfDarts') / 3)}
                singlePlayer={singlePlayer}
                oneDartAverage={oneDartAverage}
                setOneDartAverage={setOneDartAverage}/>
            <MatchDartCount
                homeCount={sumOf('home', 'noOfDarts')}
                awayCount={sumOf('away', 'noOfDarts')}
                singlePlayer={singlePlayer}/>
            </tfoot>
        </table>
    </div>);
}