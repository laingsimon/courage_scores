import {useApp} from "../../../../AppContainer";
import {round2dp} from "../../../../helpers/rendering";
import {
    count100,
    count140, count180,
    countTons,
    getPlayerOverallAverage
} from "../../../../helpers/superleague";

export function SummaryDataRow({ matchNo, match, saygData, showWinner }) {
    const { onError } = useApp();

    try {
        return (<tr>
            <td>{matchNo}</td>
            <td className={match.scoreA > match.scoreB && showWinner ? 'bg-winner' : ''}>{match.sideA.name}</td>
            <td>{match.scoreA}</td>
            <td>{countTons(saygData, 'home')}</td>
            <td>{count100(saygData, 'home')}</td>
            <td>{count140(saygData, 'home')}</td>
            <td>{count180(saygData, 'home')}</td>
            <td>{round2dp(getPlayerOverallAverage(saygData, 'home'))}</td>
            <td className={match.scoreB > match.scoreA && showWinner ? 'bg-winner' : ''}>{match.sideB.name}</td>
            <td>{match.scoreB}</td>
            <td>{countTons(saygData, 'away')}</td>
            <td>{count100(saygData, 'away')}</td>
            <td>{count140(saygData, 'away')}</td>
            <td>{count180(saygData, 'away')}</td>
            <td>{round2dp(getPlayerOverallAverage(saygData, 'away'))}</td>
        </tr>);
    } catch (e) {
        onError(e);
    }
}