import {sum} from "../../../helpers/collections";
import {MatchDartCount} from "./MatchDartCount";
import {MatchAverage} from "./MatchAverage";
import {LegStatistics} from "./LegStatistics";
import {useState} from "react";

export function MatchStatistics({legs, homeScore, awayScore, home, away, singlePlayer, legChanged}) {
    const [oneDartAverage, setOneDartAverage] = useState(false);
    const [legDisplayOptions, setLegDisplayOptions] = useState(getLegDisplayOptions(legs));

    function getLegDisplayOptions(legs) {
        const options = {};
        let lastLegIndex = null;
        Object.keys(legs).forEach(legIndex => {
            options[legIndex] = {
                showThrows: false,
                showAverage: false,
            };
            lastLegIndex = legIndex;
        });

        // optionally show the throws for the last leg
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
        <h4 className="text-center">Match statistics</h4>
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
                    updateLegDisplayOptions={(options) => updateLegDisplayOptions(legIndex, options)}
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