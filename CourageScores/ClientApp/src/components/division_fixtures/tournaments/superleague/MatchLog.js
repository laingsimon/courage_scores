import {MatchLogTable} from "./MatchLogTable";

export function MatchLog({ tournamentData, homeTeam, awayTeam, saygDataMap }) {
    const noOfThrows = 50;
    const round = tournamentData.round || {};
    const matches = round.matches || [];

    return (<div>
        <h2>Match log</h2>
        {matches.map(match => {
            const saygData = saygDataMap[match.saygId];

            if (!saygData) {
                return (<p key={match.id} className="text-warning">
                    ⚠ No data available for the match between {match.sideA.name} and {match.sideB.name}
                </p>);
            }

            return (<div key={match.id}>
                <MatchLogTable
                    saygData={saygData}
                    team={homeTeam}
                    noOfThrows={noOfThrows}
                    player={match.sideA.name}
                    accumulatorName="home"/>

                <MatchLogTable
                    saygData={saygData}
                    team={awayTeam}
                    noOfThrows={noOfThrows}
                    player={match.sideB.name}
                    accumulatorName="away"/>
            </div>);
        })}
    </div>);
}