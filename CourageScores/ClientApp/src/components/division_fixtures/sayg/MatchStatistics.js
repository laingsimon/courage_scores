import {sum} from "../../../helpers/collections";
import {MatchDartCount} from "./MatchDartCount";
import {MatchAverage} from "./MatchAverage";
import {LegStatistics} from "./LegStatistics";
import {useState} from "react";
import {useSayg} from "./SaygLoadingContainer";
import {RefreshControl} from "../RefreshControl";

export function MatchStatistics({legs, homeScore, awayScore, home, away, singlePlayer, legChanged, numberOfLegs }) {
    const [oneDartAverage, setOneDartAverage] = useState(false);
    const {refresh, refreshAllowed, initialRefreshInterval, lastLegDisplayOptions} = useSayg();
    const [refreshInterval, setRefreshInterval] = useState(initialRefreshInterval || 0);
    const [legDisplayOptionsState, setLegDisplayOptions] = useState(getLegDisplayOptions(legs));
    const finished = (homeScore >= numberOfLegs / 2.0) || (awayScore >= numberOfLegs / 2.0);
    const canRefresh = refreshAllowed && !finished;
    const legDisplayOptions = refreshInterval && !finished
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
            options[lastLegIndex] = lastLegDisplayOptions;
        }

        return options;
    }

    function updateLegDisplayOptions(legIndex, options) {
        const newLegDisplayOptions = Object.assign({}, legDisplayOptions);
        newLegDisplayOptions[legIndex] = options;
        setLegDisplayOptions(newLegDisplayOptions);
    }

    async function refreshSaygData() {
        const newSayg = await refresh();

        if (Object.keys(newSayg.legs).length !== Object.keys(legs).length) {
            setLegDisplayOptions(getLegDisplayOptions(newSayg.legs));
        }
    }

    function sumOf(player, prop) {
        return sum(Object.values(legs), leg => leg[player][prop]);
    }

    return (<div>
        <h4 className="text-center">
            Match statistics
            {canRefresh
                ? (<RefreshControl
                    refreshInterval={refreshInterval}
                    setRefreshInterval={setRefreshInterval}
                    refresh={refreshSaygData} />)
                : null}
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
                    updateLegDisplayOptions={refreshInterval && !finished ? null : (options) => updateLegDisplayOptions(legIndex, options)}
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
