import {sum} from "../../../helpers/collections";
import {MatchDartCount} from "./MatchDartCount";
import {MatchAverage} from "./MatchAverage";
import {LegStatistics} from "./LegStatistics";
import {useState} from "react";

export function MatchStatistics({legs, homeScore, awayScore, home, away, singlePlayer}) {
    const [oneDartAverage, setOneDartAverage] = useState(false);

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
                    <strong>{homeScore}</strong></td>
                {singlePlayer
                    ? null
                    : (<td className={`${homeScore > awayScore ? '' : 'bg-winner text-primary'} text-center`}>
                        <strong>{awayScore}</strong>
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
                    oneDartAverage={oneDartAverage}/>);
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