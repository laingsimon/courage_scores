import {repeat} from "../../../../helpers/projection";
import {count, sum} from "../../../../helpers/collections";
import {round2dp} from "../../../../helpers/rendering";

export function MatchLogRow({ leg, legNo, accumulatorName, player, noOfThrows, playerOverallAverage, noOfLegs }) {
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

    return (<tr className={winner ? 'bg-winner' : ''}>
        <td>{player}</td>
        <td>{legNo}</td>
        <td>{sum(accumulator.throws, thr => thr.noOfDarts)}</td>
        <td>{winner ? lastThrow.score : 0}</td>
        <td>{winner ? 0 : lastThrow.score}</td>
        <td>{countThrowsBetween(100, 140)}</td>
        <td>{countThrowsBetween(180, 180)}</td>
        <td>{countThrowsBetween(180, 181)}</td>
        <td>{countThrowsBetween(100, 140) + countThrowsBetween(140, 180) + (countThrowsBetween(180, 181) * 2)}</td>
        {playerOverallAverage === null || playerOverallAverage === undefined ? (<td>{round2dp(sumOverThrows('score') / sumOverThrows('noOfDarts'))}</td>) : null}
        {playerOverallAverage === null || playerOverallAverage === undefined || legNo > 1 ? null : (<td rowSpan={noOfLegs} className="align-middle bg-white fw-bold text-danger">{round2dp(playerOverallAverage)}</td>)}
        <td className="text-danger">team average??</td>
        <td>{lastThrow.noOfDarts}</td>
        {repeat(noOfThrows, i => {
            const playerThrow = accumulator.throws[i];

            return (<td key={i}>
                {playerThrow ? playerThrow.score : null}
            </td>)
        })}
    </tr>)
}
