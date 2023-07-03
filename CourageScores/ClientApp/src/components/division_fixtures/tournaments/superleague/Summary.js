import {SummaryDataRow} from "./SummaryDataRow";
import {useApp} from "../../../../AppContainer";
import {any, sum} from "../../../../helpers/collections";
import {
    countMatch100,
    countMatch140,
    countMatch180,
    matchTons,
    playerOverallAverage,
    sumOverThrows
} from "../../../../helpers/superleague";
import {round2dp} from "../../../../helpers/rendering";

export function Summary({ showWinner, saygMatches, noOfLegs, host, opponent }) {
    const { onError } = useApp();

    function renderDartsForWindowsAverage(side) {
        const sumOfScores = sum(saygMatches, s => sumOverThrows(s.saygData, side, 'score'));
        const sumOfDarts = sum(saygMatches, s => sumOverThrows(s.saygData, side, 'noOfDarts', true));

        return (<td title={round2dp(sumOfScores) + ' / ' + round2dp(sumOfDarts)}>
            {round2dp(sumOfScores / sumOfDarts)}
        </td>);
    }

    function renderPlayerAverage(side) {
        const average = sum(saygMatches, map => playerOverallAverage(map.saygData, side));

        return (<td title={round2dp(average) + ' / ' + noOfLegs}>
            {round2dp(average / noOfLegs)}
        </td>);
    }

    if (!any(saygMatches)) {
        return (<div className="page-break-after">
            <h2>Summary</h2>
            <p>No matches</p>
        </div>)
    }

    try {
        return (<div className="page-break-after">
            <h2>Summary</h2>
            <table className="table">
                <thead>
                <tr>
                    <th>Match no</th>
                    <th>{host}<br/>Player</th>
                    <th>Legs won</th>
                    <th>Total tons</th>
                    <th>100+</th>
                    <th>140+</th>
                    <th>180</th>
                    <th>Player average</th>
                    <th>{opponent}<br/>Player</th>
                    <th>Legs won</th>
                    <th>Total tons</th>
                    <th>100+</th>
                    <th>140+</th>
                    <th>180</th>
                    <th>Player average</th>
                </tr>
                </thead>
                <tbody>
                {saygMatches.map((map, index) => (<SummaryDataRow
                    key={index}
                    saygData={map.saygData}
                    matchNo={index + 1}
                    showWinner={showWinner}
                    hostPlayerName={map.match.sideA.name}
                    hostScore={map.match.scoreA}
                    opponentPlayerName={map.match.sideB.name}
                    opponentScore={map.match.scoreB} />))}
                <tr className="fw-bold">
                    <td></td>
                    <td>Total</td>
                    <td>{sum(saygMatches, map => map.match.scoreA)}</td>
                    <td>{sum(saygMatches, saygData => matchTons(saygData, 'home'))}</td>
                    <td>{sum(saygMatches, saygData => countMatch100(saygData, 'home'))}</td>
                    <td>{sum(saygMatches, saygData => countMatch140(saygData, 'home'))}</td>
                    <td>{sum(saygMatches, saygData => countMatch180(saygData, 'home'))}</td>
                    <td>{round2dp(sum(saygMatches, map => playerOverallAverage(map.saygData, 'home')))}</td>
                    <td>Total</td>
                    <td>{sum(saygMatches, map => map.match.scoreB)}</td>
                    <td>{sum(saygMatches, saygData => matchTons(saygData, 'away'))}</td>
                    <td>{sum(saygMatches, saygData => countMatch100(saygData, 'away'))}</td>
                    <td>{sum(saygMatches, saygData => countMatch140(saygData, 'away'))}</td>
                    <td>{sum(saygMatches, saygData => countMatch180(saygData, 'away'))}</td>
                    <td>{round2dp(sum(saygMatches, map => playerOverallAverage(map.saygData, 'away')))}</td>
                </tr>
                </tbody>
                <tfoot>
                <tr>
                    <td colSpan="2"></td>
                    <td colSpan="5" className="text-end">Rounded average</td>
                    {renderPlayerAverage('home')}
                    <td colSpan="1"></td>
                    <td colSpan="5" className="text-end">Rounded average</td>
                    {renderPlayerAverage('away')}
                </tr>
                <tr>
                    <td colSpan="2"></td>
                    <td colSpan="5" className="text-end">Darts for windows average</td>
                    {renderDartsForWindowsAverage('home')}
                    <td colSpan="1"></td>
                    <td colSpan="5" className="text-end">Darts for windows average</td>
                    {renderDartsForWindowsAverage('away')}
                </tr>
                </tfoot>
            </table>
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
