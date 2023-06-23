import {MatchLogRow} from "./MatchLogRow";
import {MatchLogTableHeading} from "./MatchLogTableHeading";

export function MatchLog({ tournamentData, fixture, saygDataMap }) {
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
                    <MatchLogTableHeading team={fixture.home} noOfThrows={noOfThrows} />
                    {Object.keys(saygData.legs).map(legIndex => <MatchLogRow
                        key={legIndex}
                        team={fixture.home}
                        accumulatorName="home"
                        leg={saygData.legs[legIndex]}
                        noOfThrows={noOfThrows}
                        player={match.sideA.name}
                        legNo={Number.parseInt(legIndex) + 1}/>)}
                    <MatchLogTableHeading team={fixture.away} noOfThrows={noOfThrows} />
                    {Object.keys(saygData.legs).map(legIndex => <MatchLogRow
                        key={legIndex}
                        team={fixture.away}
                        accumulatorName="away"
                        leg={saygData.legs[legIndex]}
                        noOfThrows={noOfThrows}
                        player={match.sideB.name}
                        legNo={Number.parseInt(legIndex) + 1}/>)}
                    </tbody>
                </table>
                <hr />
            </div>);
        })}
    </div>);
}