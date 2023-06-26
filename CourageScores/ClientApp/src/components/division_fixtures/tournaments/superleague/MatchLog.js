import {MatchLogRow} from "./MatchLogRow";
import {MatchLogTableHeading} from "./MatchLogTableHeading";
import {useApp} from "../../../../AppContainer";
import {getNoOfLegs, getNoOfThrows, getPlayerOverallAverage} from "../../../../helpers/superleague";
import {useTournament} from "../TournamentContainer";

export function MatchLog({ saygDataMap }) {
    const { onError } = useApp();
    const { tournamentData } = useTournament();
    const round = tournamentData.round || {};
    const matches = round.matches || [];
    const noOfThrows = getNoOfThrows(matches, saygDataMap) + 1;

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
                            playerOverallAverage={getPlayerOverallAverage(saygData, 'home')}
                            noOfLegs={getNoOfLegs(saygData)}
                            legNo={Number.parseInt(legIndex) + 1}/>)}
                        <MatchLogTableHeading team={tournamentData.opponent} noOfThrows={noOfThrows}/>
                        {Object.keys(saygData.legs).map(legIndex => <MatchLogRow
                            key={legIndex}
                            team={tournamentData.opponent}
                            accumulatorName="away"
                            leg={saygData.legs[legIndex]}
                            noOfThrows={noOfThrows}
                            player={match.sideB.name}
                            playerOverallAverage={getPlayerOverallAverage(saygData, 'away')}
                            noOfLegs={getNoOfLegs(saygData)}
                            legNo={Number.parseInt(legIndex) + 1}/>)}
                        </tbody>
                    </table>
                </div>);
            })}
        </div>);
    } catch (e) {
        onError(e);
    }
}