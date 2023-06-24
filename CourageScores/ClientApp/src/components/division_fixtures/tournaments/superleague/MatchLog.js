import {MatchLogRow} from "./MatchLogRow";
import {MatchLogTableHeading} from "./MatchLogTableHeading";
import {useApp} from "../../../../AppContainer";
import {getPlayerOverallAverage} from "../../../../helpers/superleague";

export function MatchLog({ tournamentData, fixture, saygDataMap }) {
    const { onError } = useApp();
    const round = tournamentData.round || {};
    const matches = round.matches || [];
    const noOfThrows = getNoOfThrows() + 1;

    function getNoOfThrows() {
        let throws = 0;

        for (let index = 0; index < matches.length; index++) {
            const match = matches[index];
            const saygData = saygDataMap[match.saygId];

            if (!saygData) {
                continue;
            }

            for (const legsKey in saygData.legs) {
                const leg = saygData.legs[legsKey];

                throws = Math.max(throws, leg.home.throws.length);
                throws = Math.max(throws, leg.away.throws.length);
            }
        }

        return throws;
    }

    try {
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
                        <MatchLogTableHeading team={fixture.home} noOfThrows={noOfThrows}/>
                        {Object.keys(saygData.legs).map(legIndex => <MatchLogRow
                            key={legIndex}
                            accumulatorName="home"
                            leg={saygData.legs[legIndex]}
                            noOfThrows={noOfThrows}
                            player={match.sideA.name}
                            playerOverallAverage={getPlayerOverallAverage(saygData, 'home')}
                            noOfLegs={Object.keys(saygData.legs).length}
                            legNo={Number.parseInt(legIndex) + 1}/>)}
                        <MatchLogTableHeading team={fixture.away} noOfThrows={noOfThrows}/>
                        {Object.keys(saygData.legs).map(legIndex => <MatchLogRow
                            key={legIndex}
                            team={fixture.away}
                            accumulatorName="away"
                            leg={saygData.legs[legIndex]}
                            noOfThrows={noOfThrows}
                            player={match.sideB.name}
                            playerOverallAverage={getPlayerOverallAverage(saygData, 'away')}
                            noOfLegs={Object.keys(saygData.legs).length}
                            legNo={Number.parseInt(legIndex) + 1}/>)}
                        </tbody>
                    </table>
                    <hr/>
                </div>);
            })}
        </div>);
    } catch (e) {
        onError(e);
    }
}