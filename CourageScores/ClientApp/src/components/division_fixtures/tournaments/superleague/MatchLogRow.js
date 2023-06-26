import {repeat} from "../../../../helpers/projection";
import {count, sum} from "../../../../helpers/collections";
import {round2dp} from "../../../../helpers/rendering";
import {useApp} from "../../../../AppContainer";

export function MatchLogRow({ leg, legNo, accumulatorName, player, noOfThrows, playerOverallAverage, noOfLegs, showWinner }) {
    const { onError } = useApp();
    const accumulator = leg[accumulatorName];
    const lastThrow = accumulator.throws[accumulator.throws.length - 1];
    const startingScore = leg.startingScore;
    const winnerByScore = sum(accumulator.throws, thr => thr.score) === startingScore;
    const winner = leg.winner === accumulatorName || winnerByScore;

    function countThrowsBetween(lowerInclusive, upperExclusive) {
        return count(accumulator.throws, thr => thr.score >= lowerInclusive && (!upperExclusive || thr.score < upperExclusive));
    }

    function countTons() {
        return countThrowsBetween(100, 140)
            + countThrowsBetween(140, 180)
            + (countThrowsBetween(180) * 2);
    }

    function sumOverThrows(prop) {
        return sum(accumulator.throws, thr => thr[prop]);
    }

    if (accumulator.noOfDarts === 0) {
        return null;
    }

    try {
        return (<tr className={winner && showWinner ? 'bg-winner' : ''}>
            {legNo === 1 ? (<td rowSpan={noOfLegs} className="align-middle bg-white">{player}</td>) : null}
            <td>{legNo}</td>
            <td>{sum(accumulator.throws, thr => thr.noOfDarts)}</td>
            <td>{winner && lastThrow ? lastThrow.score : null}</td>
            <td>{winner || !lastThrow ? null : startingScore - sum(accumulator.throws, thr => thr.bust ? 0 : thr.score)}</td>
            <td>{countThrowsBetween(100, 140)}</td>
            <td>{countThrowsBetween(140, 180)}</td>
            <td>{countThrowsBetween(180, 181)}</td>
            <td>{countTons()}</td>
            {playerOverallAverage === null || playerOverallAverage === undefined ? (
                <td>{round2dp(sumOverThrows('score') / sumOverThrows('noOfDarts'))}</td>) : null}
            {playerOverallAverage === null || playerOverallAverage === undefined || legNo > 1 ? null : (
                <td rowSpan={noOfLegs}
                    className="align-middle bg-white fw-bold text-danger">{round2dp(playerOverallAverage)}</td>)}
            {legNo === 1 ? (
                <td rowSpan={noOfLegs} className="align-middle bg-white fw-bold text-danger">team<br />average<br />??</td>) : null}
            <td>{lastThrow ? lastThrow.noOfDarts : null}</td>
            {repeat(noOfThrows, i => {
                const playerThrow = accumulator.throws[i] || {};
                const score = playerThrow.bust ? 0 : playerThrow.score;

                return (<td key={i} className={(score >= 100 ? ' text-danger' : '') + (score >= 180 ? ' fw-bold' : '')}>{score}</td>)
            })}
        </tr>);
    } catch (e) {
        onError(e);
    }
}
