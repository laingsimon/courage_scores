import {SummaryDataRow} from "./SummaryDataRow";
import {useApp} from "../../common/AppContainer";
import {any, sum} from "../../../helpers/collections";
import {
    countMatch100,
    countMatch140,
    countMatch180,
    matchTons,
    playerOverallAverage,
    sumOverThrows
} from "../../../helpers/superleague";
import {ifNaN, round2dp} from "../../../helpers/rendering";
import {ISuperleagueSaygMatchMapping} from "./ISuperleagueSaygMatchMapping";

export interface ISummaryProps {
    showWinner: boolean;
    saygMatches: ISuperleagueSaygMatchMapping[];
    noOfLegs: number;
    host: string;
    opponent: string;
}

export function Summary({showWinner, saygMatches, noOfLegs, host, opponent}: ISummaryProps) {
    const {onError} = useApp();

    function renderDartsForWindowsAverage(side: string) {
        const sumOfScores = sum(saygMatches, (s: ISuperleagueSaygMatchMapping) => sumOverThrows(s.saygData, side, 'score'));
        const sumOfDarts = sum(saygMatches, (s: ISuperleagueSaygMatchMapping) => sumOverThrows(s.saygData, side, 'noOfDarts'));

        return (<td title={round2dp(sumOfScores) + ' / ' + round2dp(sumOfDarts)}>
            {ifNaN(round2dp(sumOfScores / sumOfDarts), '-')}
        </td>);
    }

    function renderPlayerAverage(side: string) {
        const average = sum(saygMatches, (map: ISuperleagueSaygMatchMapping) => playerOverallAverage(map.saygData, side));

        return (<td title={round2dp(average) + ' / ' + noOfLegs}>
            {ifNaN(round2dp(average / noOfLegs), '-')}
        </td>);
    }

    if (!any(saygMatches)) {
        return (<div className="page-break-after">
            <h2>Summary</h2>
            <p>No matches</p>
        </div>)
    }

    try {
        return (<div className="page-break-after" datatype="summary">
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
                {saygMatches.map((map: ISuperleagueSaygMatchMapping, index: number) => (<SummaryDataRow
                    key={index}
                    saygData={map.saygData}
                    matchNo={index + 1}
                    showWinner={showWinner}
                    hostPlayerName={map.match.sideA.name}
                    hostScore={map.match.scoreA}
                    opponentPlayerName={map.match.sideB.name}
                    opponentScore={map.match.scoreB}/>))}
                <tr className="fw-bold">
                    <td></td>
                    <td>Total</td>
                    <td>{ifNaN(sum(saygMatches, (map: ISuperleagueSaygMatchMapping) => map.match.scoreA), '-')}</td>
                    <td>{ifNaN(sum(saygMatches, (map: ISuperleagueSaygMatchMapping) => matchTons(map.saygData, 'home')), '-')}</td>
                    <td>{ifNaN(sum(saygMatches, (map: ISuperleagueSaygMatchMapping) => countMatch100(map.saygData, 'home')), '-')}</td>
                    <td>{ifNaN(sum(saygMatches, (map: ISuperleagueSaygMatchMapping) => countMatch140(map.saygData, 'home')), '-')}</td>
                    <td>{ifNaN(sum(saygMatches, (map: ISuperleagueSaygMatchMapping) => countMatch180(map.saygData, 'home')), '-')}</td>
                    <td>{ifNaN(round2dp(sum(saygMatches, (map: ISuperleagueSaygMatchMapping) => playerOverallAverage(map.saygData, 'home'))), '-')}</td>
                    <td>Total</td>
                    <td>{ifNaN(sum(saygMatches, (map: ISuperleagueSaygMatchMapping) => map.match.scoreB), '-')}</td>
                    <td>{ifNaN(sum(saygMatches, (map: ISuperleagueSaygMatchMapping) => matchTons(map.saygData, 'away')), '-')}</td>
                    <td>{ifNaN(sum(saygMatches, (map: ISuperleagueSaygMatchMapping) => countMatch100(map.saygData, 'away')), '-')}</td>
                    <td>{ifNaN(sum(saygMatches, (map: ISuperleagueSaygMatchMapping) => countMatch140(map.saygData, 'away')), '-')}</td>
                    <td>{ifNaN(sum(saygMatches, (map: ISuperleagueSaygMatchMapping) => countMatch180(map.saygData, 'away')), '-')}</td>
                    <td>{ifNaN(round2dp(sum(saygMatches, (map: ISuperleagueSaygMatchMapping) => playerOverallAverage(map.saygData, 'away'))), '-')}</td>
                </tr>
                </tbody>
                <tfoot>
                <tr>
                    <td colSpan={2}></td>
                    <td colSpan={5} className="text-end">Rounded average</td>
                    {renderPlayerAverage('home')}
                    <td colSpan={1}></td>
                    <td colSpan={5} className="text-end">Rounded average</td>
                    {renderPlayerAverage('away')}
                </tr>
                <tr>
                    <td colSpan={2}></td>
                    <td colSpan={5} className="text-end">Darts for windows average</td>
                    {renderDartsForWindowsAverage('home')}
                    <td colSpan={1}></td>
                    <td colSpan={5} className="text-end">Darts for windows average</td>
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
