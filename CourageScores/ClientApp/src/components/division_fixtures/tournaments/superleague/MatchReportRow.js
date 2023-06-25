import {useApp} from "../../../../AppContainer";
import {repeat} from "../../../../helpers/projection";
import {count, sum} from "../../../../helpers/collections";
import {getPlayerOverallAverage} from "../../../../helpers/superleague";
import {round2dp} from "../../../../helpers/rendering";

export function MatchReportRow({ match, matchIndex, saygData, noOfThrows, noOfLegs }) {
    const { onError } = useApp();

    try {
        return (<>
            {repeat(noOfLegs, legIndex => {
                if (!saygData || !saygData.legs) {
                    return null;
                }

                const leg = saygData.legs[legIndex + ''] || { home: {}, away: {} };

                function countThrowsBetween(side, lowerInclusive, upperExclusive) {
                    const accumulator = leg[side];
                    if (!accumulator || !accumulator.throws) {
                        return 0;
                    }

                    return count(accumulator.throws, thr => thr.score >= lowerInclusive && (!upperExclusive || thr.score < upperExclusive));
                }

                function actualDarts(side) {
                    const accumulator = leg[side];
                    if (!accumulator || !accumulator.throws) {
                        return 0;
                    }

                    return sum(accumulator.throws, thr => thr.noOfDarts);
                }

                function gameShot(side) {
                    const accumulator = leg[side];
                    if (!accumulator || !accumulator.throws) {
                        return null;
                    }

                    const winnerByScore = sum(accumulator.throws, thr => thr.score) === leg.startingScore;
                    const winner = leg.winner === side || winnerByScore;
                    const lastThrow = accumulator.throws[accumulator.throws.length - 1];

                    return winner && lastThrow ? lastThrow.score : null;
                }

                function scoreLeft(side) {
                    const accumulator = leg[side];
                    if (!accumulator || !accumulator.throws) {
                        return null;
                    }

                    const winnerByScore = sum(accumulator.throws, thr => thr.score) === leg.startingScore;
                    const winner = leg.winner === side || winnerByScore;

                    return winner ? null : leg.startingScore - sum(accumulator.throws, thr => thr.bust ? 0 : thr.score);
                }

                return (<tr key={`${match.id}_${legIndex}`}>
                    {legIndex === 0 ? (<td rowSpan={noOfLegs} className="align-middle">M{matchIndex + 1}</td>) : null}
                    {legIndex === 0 ? (<td rowSpan={noOfLegs} className="align-middle fw-bold vertical-text text-danger">{round2dp(getPlayerOverallAverage(saygData, 'home'))}</td>) : null}
                    {legIndex === 0 ? (<td rowSpan={noOfLegs} className={`align-middle ${matchIndex % 2 === 0 ? '' : 'bg-light'}`}>{match.sideA.name}</td>) : null}
                    <td>{legIndex + 1}</td>
                    {repeat(noOfThrows, throwIndex => {
                        const thr = (leg.home.throws ? leg.home.throws[throwIndex] : null) || {};
                        const score = thr.bust ? 0 : thr.score;
                        return (<td className={score >= 100 ? 'text-danger' : ''} key={`${match.id}_${legIndex}_sideA_${throwIndex}`}>{score}</td>);
                    })}
                    <td>{actualDarts('home')}</td>
                    <td>{gameShot('home')}</td>
                    <td>{scoreLeft('home')}</td>
                    <td>{countThrowsBetween('home', 100, 140) + countThrowsBetween('home', 140, 180) + (countThrowsBetween('home', 180) * 2)}</td>

                    {legIndex === 0 ? (<td rowSpan={noOfLegs} className="align-middle fw-bold vertical-text text-danger">{round2dp(getPlayerOverallAverage(saygData, 'away'))}</td>) : null}
                    {legIndex === 0 ? (<td rowSpan={noOfLegs} className={`align-middle ${matchIndex % 2 === 0 ? 'bg-light' : ''}`}>{match.sideB.name}</td>) : null}
                    {repeat(noOfThrows, throwIndex => {
                        const thr = (leg.away.throws ? leg.away.throws[throwIndex] : null) || {};
                        const score = thr.bust ? 0 : thr.score;
                        return (<td className={score >= 100 ? 'text-danger' : ''} key={`${match.id}_${legIndex}_sideB_${throwIndex}`}>{score}</td>);
                    })}
                    <td>{actualDarts('away')}</td>
                    <td>{gameShot('away')}</td>
                    <td>{scoreLeft('away')}</td>
                    <td>{countThrowsBetween('away', 100, 140) + countThrowsBetween('away', 140, 180) + (countThrowsBetween('away', 180) * 2)}</td>
                </tr>);
            })}
        </>);
    } catch (e) {
        onError(e);
    }
}