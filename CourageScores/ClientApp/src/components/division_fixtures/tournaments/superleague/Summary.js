import {SummaryDataRow} from "./SummaryDataRow";
import {useApp} from "../../../../AppContainer";
import {sum} from "../../../../helpers/collections";
import {count100, count140, count180, countTons, getPlayerOverallAverage} from "../../../../helpers/superleague";
import {round2dp} from "../../../../helpers/rendering";

export function Summary({ tournamentData, fixture, saygDataMap }) {
    const { onError } = useApp();
    const round = tournamentData.round || {};
    const matches = round.matches || [];
    const saygMatches = matches.map(match => saygDataMap[match.saygId]);

    try {
        return (<div className="page-break-after">
            <h2>Summary</h2>
            <table className="table">
                <thead>
                <tr>
                    <th>Match no</th>
                    <th>{fixture.home}<br/>Player</th>
                    <th>Legs won</th>
                    <th>Total tons</th>
                    <th>100+</th>
                    <th>140+</th>
                    <th>180</th>
                    <th>Player average</th>
                    <th>{fixture.away}<br/>Player</th>
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
                    matchNo={index + 1}/>))}
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
                    <td></td>
                    <td colSpan="1"></td>
                    <td colSpan="5" className="text-end">Darts for windows average</td>
                    <td></td>
                </tr>
                </tfoot>
            </table>
        </div>);
    } catch (e) {
        onError(e);
    }
}
