import {SummaryDataRow} from "./SummaryDataRow";
import {useApp} from "../../../../AppContainer";

export function Summary({ tournamentData, fixture, saygDataMap }) {
    const { onError } = useApp();
    const round = tournamentData.round || {};
    const matches = round.matches || [];

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
                    saygData={saygDataMap[m.saygId]}
                    match={m}
                    matchNo={index + 1}/>))}
                </tbody>
                <tfoot>
                <tr>
                    <td colSpan="2"></td>
                    <td colSpan="5" className="text-end">Rounded average</td>
                    <td></td>
                    <td colSpan="1"></td>
                    <td colSpan="5" className="text-end">Rounded average</td>
                    <td></td>
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