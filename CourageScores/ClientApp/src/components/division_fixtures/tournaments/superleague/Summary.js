import {SummaryDataRow} from "./SummaryDataRow";
import {useApp} from "../../../../AppContainer";
import {any, sum} from "../../../../helpers/collections";
import {
    count100,
    count140,
    count180,
    countTons,
    getPlayerOverallAverage, sumOfAllCheckouts,
    sumOfAllScores
} from "../../../../helpers/superleague";
import {round2dp} from "../../../../helpers/rendering";
import {useTournament} from "../TournamentContainer";

export function Summary({ saygDataMap, showWinner }) {
    const { onError } = useApp();
    const { tournamentData } = useTournament();
    const round = tournamentData.round || {};
    const matches = round.matches || [];

    if (!any(matches)) {
        return (<div className="page-break-after">
            <h2>Summary</h2>
            <p>No matches</p>
        </div>)
    }

    const saygMatches = matches.map(match => saygDataMap[match.saygId]);

    try {
        return (<div className="page-break-after">
            <h2>Summary</h2>
            <table className="table">
                <thead>
                <tr>
                    <th>Match no</th>
                    <th>{tournamentData.host}<br/>Player</th>
                    <th>Legs won</th>
                    <th>Total tons</th>
                    <th>100+</th>
                    <th>140+</th>
                    <th>180</th>
                    <th>Player average</th>
                    <th>{tournamentData.opponent}<br/>Player</th>
                    <th>Legs won</th>
                    <th>Total tons</th>
                    <th>100+</th>
                    <th>140+</th>
                    <th>180</th>
                    <th>Player average</th>
                </tr>
                </thead>
                <tbody>
                {matches.map((m, index) => (<SummaryDataRow
                    key={index}
                    saygData={saygDataMap[m.saygId]}
                    match={m}
                    matchNo={index + 1}
                    showWinner={showWinner} />))}
                <tr className="fw-bold">
                    <td></td>
                    <td>Total</td>
                    <td>{sum(matches, match => match.scoreA)}</td>
                    <td>{sum(saygMatches, saygData => countTons(saygData, 'home'))}</td>
                    <td>{sum(saygMatches, saygData => count100(saygData, 'home'))}</td>
                    <td>{sum(saygMatches, saygData => count140(saygData, 'home'))}</td>
                    <td>{sum(saygMatches, saygData => count180(saygData, 'home'))}</td>
                    <td>{round2dp(sum(saygMatches, saygData => getPlayerOverallAverage(saygData, 'home')))}</td>
                    <td>Total</td>
                    <td>{sum(matches, match => match.scoreB)}</td>
                    <td>{sum(saygMatches, saygData => countTons(saygData, 'away'))}</td>
                    <td>{sum(saygMatches, saygData => count100(saygData, 'away'))}</td>
                    <td>{sum(saygMatches, saygData => count140(saygData, 'away'))}</td>
                    <td>{sum(saygMatches, saygData => count180(saygData, 'away'))}</td>
                    <td>{round2dp(sum(saygMatches, saygData => getPlayerOverallAverage(saygData, 'away')))}</td>
                </tr>
                </tbody>
                <tfoot>
                <tr>
                    <td colSpan="2"></td>
                    <td colSpan="5" className="text-end">Rounded average</td>
                    <td>{round2dp(sum(saygMatches, saygData => getPlayerOverallAverage(saygData, 'home')) / matches.length)}</td>
                    <td colSpan="1"></td>
                    <td colSpan="5" className="text-end">Rounded average</td>
                    <td>{round2dp(sum(saygMatches, saygData => getPlayerOverallAverage(saygData, 'away')) / matches.length)}</td>
                </tr>
                <tr>
                    <td colSpan="2"></td>
                    <td colSpan="5" className="text-end">Darts for windows average</td>
                    <td title={round2dp(sum(saygMatches, s => sumOfAllScores(s, 'home'))) + ' / ' + round2dp(sum(saygMatches, s => sumOfAllCheckouts(s, 'home')))}>
                        {round2dp(sum(saygMatches, s => sumOfAllScores(s, 'home')) / sum(saygMatches, s => sumOfAllCheckouts(s, 'home')))}
                    </td>
                    <td colSpan="1"></td>
                    <td colSpan="5" className="text-end">Darts for windows average</td>
                    <td title={round2dp(sum(saygMatches, s => sumOfAllScores(s, 'home'))) + ' / ' + round2dp(sum(saygMatches, s => sumOfAllCheckouts(s, 'away')))}>
                        {round2dp(sum(saygMatches, s => sumOfAllScores(s, 'away')) / sum(saygMatches, s => sumOfAllCheckouts(s, 'away')))}
                    </td>
                </tr>
                </tfoot>
            </table>
        </div>);
    } catch (e) {
        onError(e);
    }
}
