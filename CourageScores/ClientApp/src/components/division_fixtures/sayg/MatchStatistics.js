import {sum} from "../../../helpers/collections";
import {MatchDartCount} from "./MatchDartCount";
import {MatchAverage} from "./MatchAverage";
import {LegStatistics} from "./LegStatistics";
import {useState} from "react";
import {useSayg} from "./SaygLoadingContainer";
import {stateChanged} from "../../../helpers/events";

export function MatchStatistics({legs, homeScore, awayScore, home, away, singlePlayer, legChanged, numberOfLegs }) {
    const [oneDartAverage, setOneDartAverage] = useState(false);
    const {refreshAllowed, lastLegDisplayOptions, liveUpdatesEnabled, enableLiveUpdates} = useSayg();
    const [legDisplayOptionsState, setLegDisplayOptions] = useState(getLegDisplayOptions(legs));
    const finished = (homeScore >= numberOfLegs / 2.0) || (awayScore >= numberOfLegs / 2.0);
    const canRefresh = refreshAllowed && !finished;
    const legDisplayOptions = liveUpdatesEnabled && !finished
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

    function sumOf(player, prop) {
        return sum(Object.values(legs), leg => leg[player][prop]);
    }

    return (<div>
        <h4 className="text-center">
            Match statistics
            {canRefresh
                ? (<span className="float-end extra-small">
                    <input id="liveUpdatesEnabled" type="checkbox" checked={liveUpdatesEnabled} onChange={stateChanged(enableLiveUpdates)} className="visually-hidden" />
                    <label htmlFor="liveUpdatesEnabled" className="btn btn-sm btn-outline-primary">{liveUpdatesEnabled ? '⏸‍ Pause' : '👁‍ Watch'}</label>
                </span>)
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
                    legDisplayOptions={legDisplayOptions[legIndex] || getLegDisplayOptions(legs)[legIndex]}
                    updateLegDisplayOptions={liveUpdatesEnabled && !finished ? null : (options) => updateLegDisplayOptions(legIndex, options)}
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
