import {MatchLogRow} from "./MatchLogRow";
import {MatchLogTableHeading} from "./MatchLogTableHeading";

export function MatchLog({ tournamentData, homeTeam, awayTeam, saygDataMap }) {
    const noOfThrows = 50;
    const round = tournamentData.round || {};
    const matches = round.matches || [];

    return (<div className="page-break-after">
        <h2>Match log</h2>
        {matches.map(match => {
            const saygData = saygDataMap[match.saygId];

            if (!saygData) {
                return (<p key={match.id} className="text-warning">
                    ⚠ No data available for the match between {match.sideA.name} and {match.sideB.name}
                </p>);
            }

            return (<div key={match.id}>
                <table className="table">
                    <tbody>
                    <MatchLogTableHeading team={homeTeam} noOfThrows={noOfThrows} />
                    {Object.keys(saygData.legs).map(legIndex => <MatchLogRow
                        key={legIndex}
                        team={homeTeam}
                        accumulatorName="home"
                        leg={saygData.legs[legIndex]}
                        noOfThrows={noOfThrows}
                        player={match.sideA.name}
                        legNo={Number.parseInt(legIndex) + 1}/>)}
                    <MatchLogTableHeading team={awayTeam} noOfThrows={noOfThrows} />
                    {Object.keys(saygData.legs).map(legIndex => <MatchLogRow
                        key={legIndex}
                        team={awayTeam}
                        accumulatorName="away"
                        leg={saygData.legs[legIndex]}
                        noOfThrows={noOfThrows}
                        player={match.sideB.name}
                        legNo={Number.parseInt(legIndex) + 1}/>)}
                    </tbody>
                </table>
            </div>);
        })}
    </div>);
}