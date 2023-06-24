import {repeat} from "../../../../helpers/projection";
import {count, sum} from "../../../../helpers/collections";
import {round2dp} from "../../../../helpers/rendering";
import {useApp} from "../../../../AppContainer";

export function MatchLogRow({ leg, legNo, accumulatorName, player, noOfThrows, playerOverallAverage, noOfLegs }) {
    const { onError } = useApp();
    const accumulator = leg[accumulatorName];
    const lastThrow = accumulator.throws[accumulator.throws.length - 1];
    const startingScore = leg.startingScore;
    const winnerByScore = sum(accumulator.throws, thr => thr.score) === startingScore;
    const winner = leg.winner === accumulatorName || winnerByScore;

    function countThrowsBetween(lowerInclusive, upperExclusive) {
        return count(accumulator.throws, thr => thr.score >= lowerInclusive && thr.score < upperExclusive);
    }

    function sumOverThrows(prop) {
        return sum(accumulator.throws, thr => thr[prop]);
    }

    try {
        return (<tr className={winner ? 'bg-winner' : ''}>
            {legNo === 1 ? (<td rowSpan={noOfLegs} className="align-middle bg-white">{player}</td>) : null}
            <td>{legNo}</td>
            <td>{sum(accumulator.throws, thr => thr.noOfDarts)}</td>
            <td>{winner && lastThrow ? lastThrow.score : 0}</td>
            <td>{winner || !lastThrow ? 0 : lastThrow.score}</td>
            <td>{countThrowsBetween(100, 140)}</td>
            <td>{countThrowsBetween(180, 180)}</td>
            <td>{countThrowsBetween(180, 181)}</td>
            <td>{countThrowsBetween(100, 140) + countThrowsBetween(140, 180) + (countThrowsBetween(180, 181) * 2)}</td>
            {playerOverallAverage === null || playerOverallAverage === undefined ? (
                <td>{round2dp(sumOverThrows('score') / sumOverThrows('noOfDarts'))}</td>) : null}
            {playerOverallAverage === null || playerOverallAverage === undefined || legNo > 1 ? null : (
                <td rowSpan={noOfLegs}
                    className="align-middle bg-white fw-bold text-danger">{round2dp(playerOverallAverage)}</td>)}
            {legNo === 1 ? (
                <td rowSpan={noOfLegs} className="align-middle bg-white text-danger">team average??</td>) : null}
            <td>{lastThrow ? lastThrow.noOfDarts : null}</td>
            {repeat(noOfThrows, i => {
                const playerThrow = accumulator.throws[i];

                return (<td key={i}>
                    {playerThrow ? playerThrow.score : null}
                </td>)
            })}
        </tr>);
    } catch (e) {
        onError(e);
    }
}
