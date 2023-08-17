import {useApp} from "../../../../AppContainer";
import {round2dp} from "../../../../helpers/rendering";
import {
    countMatch100,
    countMatch140,
    countMatch180,
    matchTons,
    playerOverallAverage
} from "../../../../helpers/superleague";

export function SummaryDataRow({
                                   matchNo,
                                   saygData,
                                   showWinner,
                                   hostScore,
                                   opponentScore,
                                   hostPlayerName,
                                   opponentPlayerName
                               }) {
    const {onError} = useApp();

    try {
        return (<tr>
            <td>{matchNo}</td>
            <td className={hostScore > opponentScore && showWinner ? 'bg-winner' : ''}>{hostPlayerName}</td>
            <td>{hostScore}</td>
            <td>{matchTons(saygData, 'home')}</td>
            <td>{countMatch100(saygData, 'home')}</td>
            <td>{countMatch140(saygData, 'home')}</td>
            <td>{countMatch180(saygData, 'home')}</td>
            <td>{round2dp(playerOverallAverage(saygData, 'home'))}</td>
            <td className={opponentScore > hostScore && showWinner ? 'bg-winner' : ''}>{opponentPlayerName}</td>
            <td>{opponentScore}</td>
            <td>{matchTons(saygData, 'away')}</td>
            <td>{countMatch100(saygData, 'away')}</td>
            <td>{countMatch140(saygData, 'away')}</td>
            <td>{countMatch180(saygData, 'away')}</td>
            <td>{round2dp(playerOverallAverage(saygData, 'away'))}</td>
        </tr>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}