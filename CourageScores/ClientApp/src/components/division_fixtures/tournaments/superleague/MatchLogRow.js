import {repeat} from "../../../../helpers/projection";
import {sum} from "../../../../helpers/collections";
import {round2dp} from "../../../../helpers/rendering";
import {useApp} from "../../../../AppContainer";
import {countLegThrowsBetween, isLegWinner, legTons} from "../../../../helpers/superleague";

export function MatchLogRow({
                                leg,
                                legNo,
                                accumulatorName,
                                player,
                                noOfThrows,
                                playerOverallAverage,
                                noOfLegs,
                                showWinner,
                                teamAverage
                            }) {
    const {onError} = useApp();
    const accumulator = leg[accumulatorName];
    const lastThrow = accumulator.throws[accumulator.throws.length - 1];
    const winner = isLegWinner(leg, accumulatorName);

    if (accumulator.noOfDarts === 0) {
        return null;
    }

    try {
        return (<tr className={winner && showWinner ? 'bg-winner' : ''}>
            {legNo === 1
                ? (<td rowSpan={noOfLegs} className="align-middle bg-white page-break-avoid">{player}</td>)
                : null}
            <td>{legNo}</td>
            <td>{sum(accumulator.throws, thr => thr.noOfDarts)}</td>
            <td>{winner && lastThrow ? lastThrow.score : null}</td>
            <td>{winner || !lastThrow ? null : leg.startingScore - sum(accumulator.throws, thr => thr.bust ? 0 : thr.score)}</td>
            <td>{countLegThrowsBetween(leg, accumulatorName, 100, 140)}</td>
            <td>{countLegThrowsBetween(leg, accumulatorName, 140, 180)}</td>
            <td>{countLegThrowsBetween(leg, accumulatorName, 180)}</td>
            <td>{legTons(leg, accumulatorName)}</td>
            {legNo > 1
                ? null
                : (<td rowSpan={noOfLegs} className="align-middle bg-white fw-bold text-danger">
                    {round2dp(playerOverallAverage)}
                </td>)}
            {legNo === 1
                ? (<td rowSpan={noOfLegs} className="align-middle bg-white fw-bold text-danger">
                    {round2dp(teamAverage)}
                </td>)
                : null}
            <td>{lastThrow ? lastThrow.noOfDarts : null}</td>
            {repeat(noOfThrows + 1, i => {
                const playerThrow = accumulator.throws[i] || {};
                const score = playerThrow.bust ? 0 : playerThrow.score;

                return (<td key={i} className={(score >= 100 ? ' text-danger' : '') + (score >= 180 ? ' fw-bold' : '')}>
                    {score}
                </td>)
            })}
        </tr>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
