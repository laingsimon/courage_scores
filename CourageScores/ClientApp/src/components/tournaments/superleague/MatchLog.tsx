import {MatchLogRow} from "./MatchLogRow";
import {MatchLogTableHeading} from "./MatchLogTableHeading";
import {useApp} from "../../common/AppContainer";
import {getNoOfLegs, playerOverallAverage} from "../../../helpers/superleague";
import {ISuperleagueSaygMatchMapping} from "./ISuperleagueSaygMatchMapping";

export interface IMatchLogProps {
    showWinner?: boolean;
    noOfThrows: number;
    host: string;
    opponent: string;
    saygMatches: ISuperleagueSaygMatchMapping[];
}

export function MatchLog({showWinner, noOfThrows, host, opponent, saygMatches}: IMatchLogProps) {
    const {onError} = useApp();
    let homeTeamAverage = 0;
    let awayTeamAverage = 0;

    try {
        return (<div className="page-break-after" datatype="match-log">
            <h2>Match log</h2>
            {saygMatches.map((matchDataMap, index) => {
                if (!matchDataMap.saygData || !matchDataMap.saygData.legs) {
                    return (<p key={index} className="text-warning">
                        ⚠ No data available for the match
                        between {matchDataMap.match.sideA.name} and {matchDataMap.match.sideB.name}
                    </p>);
                }

                const homePlayerAverage = playerOverallAverage(matchDataMap.saygData, 'home');
                const awayPlayerAverage = playerOverallAverage(matchDataMap.saygData, 'away');
                homeTeamAverage += homePlayerAverage;
                awayTeamAverage += awayPlayerAverage;

                return (<div key={matchDataMap.match.id} className="page-break-after">
                    <table className="table">
                        <tbody>
                        <MatchLogTableHeading team={host} noOfThrows={noOfThrows}/>
                        {Object.keys(matchDataMap.saygData.legs).map((legIndex: string) => <MatchLogRow
                            key={legIndex}
                            accumulatorName="home"
                            leg={matchDataMap.saygData.legs[legIndex]}
                            noOfThrows={noOfThrows}
                            player={matchDataMap.match.sideA.name}
                            playerOverallAverage={homePlayerAverage}
                            noOfLegs={getNoOfLegs(matchDataMap.saygData)}
                            legNo={Number.parseInt(legIndex) + 1}
                            showWinner={showWinner}
                            teamAverage={homeTeamAverage}/>)}
                        <MatchLogTableHeading team={opponent} noOfThrows={noOfThrows}/>
                        {Object.keys(matchDataMap.saygData.legs).map((legIndex: string) => <MatchLogRow
                            key={legIndex}
                            accumulatorName="away"
                            leg={matchDataMap.saygData.legs[legIndex]}
                            noOfThrows={noOfThrows}
                            player={matchDataMap.match.sideB.name}
                            playerOverallAverage={awayPlayerAverage}
                            noOfLegs={getNoOfLegs(matchDataMap.saygData)}
                            legNo={Number.parseInt(legIndex) + 1}
                            showWinner={showWinner}
                            teamAverage={awayTeamAverage}/>)}
                        </tbody>
                    </table>
                </div>);
            })}
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}