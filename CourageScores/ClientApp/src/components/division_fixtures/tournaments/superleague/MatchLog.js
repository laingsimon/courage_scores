import {MatchLogRow} from "./MatchLogRow";
import {MatchLogTableHeading} from "./MatchLogTableHeading";
import {useApp} from "../../../../AppContainer";
import {getNoOfLegs, getNoOfThrows, getPlayerOverallAverage} from "../../../../helpers/superleague";
import {useTournament} from "../TournamentContainer";

export function MatchLog({ saygDataMap, showWinner }) {
    const { onError } = useApp();
    const { tournamentData } = useTournament();
    const round = tournamentData.round || {};
    const matches = round.matches || [];
    const noOfThrows = getNoOfThrows(matches, saygDataMap) + 1;
    let homeTeamAverage = 0;
    let awayTeamAverage = 0;

    try {
        return (<div className="page-break-after">
            <h2>Match log</h2>
            {matches.map(match => {
                const saygData = saygDataMap[match.saygId];

                if (!saygData || !saygData.legs) {
                    return (<p key={match.id} className="text-warning">
                        ⚠ No data available for the match between {match.sideA.name} and {match.sideB.name}
                    </p>);
                }

                const homePlayerAverage = getPlayerOverallAverage(saygData, 'home');
                const awayPlayerAverage = getPlayerOverallAverage(saygData, 'away');
                homeTeamAverage += homePlayerAverage;
                awayTeamAverage += awayPlayerAverage;

                return (<div key={match.id} className="page-break-after">
                    <table className="table">
                        <tbody>
                        <MatchLogTableHeading team={tournamentData.host} noOfThrows={noOfThrows}/>
                        {Object.keys(saygData.legs).map(legIndex => <MatchLogRow
                            key={legIndex}
                            accumulatorName="home"
                            leg={saygData.legs[legIndex]}
                            noOfThrows={noOfThrows}
                            player={match.sideA.name}
                            playerOverallAverage={homePlayerAverage}
                            noOfLegs={getNoOfLegs(saygData)}
                            legNo={Number.parseInt(legIndex) + 1}
                            showWinner={showWinner}
                            teamAverage={homeTeamAverage} />)}
                        <MatchLogTableHeading team={tournamentData.opponent} noOfThrows={noOfThrows}/>
                        {Object.keys(saygData.legs).map(legIndex => <MatchLogRow
                            key={legIndex}
                            team={tournamentData.opponent}
                            accumulatorName="away"
                            leg={saygData.legs[legIndex]}
                            noOfThrows={noOfThrows}
                            player={match.sideB.name}
                            playerOverallAverage={awayPlayerAverage}
                            noOfLegs={getNoOfLegs(saygData)}
                            legNo={Number.parseInt(legIndex) + 1}
                            showWinner={showWinner}
                            teamAverage={awayTeamAverage} />)}
                        </tbody>
                    </table>
                </div>);
            })}
        </div>);
    } catch (e) {
        onError(e);
    }
}