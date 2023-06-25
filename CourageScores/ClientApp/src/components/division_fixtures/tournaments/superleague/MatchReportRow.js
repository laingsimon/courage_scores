import {useApp} from "../../../../AppContainer";
import {repeat} from "../../../../helpers/projection";
import {count, sum} from "../../../../helpers/collections";

export function MatchReportRow({ match, matchIndex, saygData, noOfThrows, noOfLegs }) {
    const { onError } = useApp();

    try {
        return (<>
            {repeat(noOfLegs, legIndex => {
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

                return (<tr key={`${match.id}_${legIndex}`}>
                    {legIndex === 0 ? (<td rowSpan={noOfLegs}>M{matchIndex + 1}</td>) : null}
                    {legIndex === 0 ? (<td rowSpan={noOfLegs}>ave</td>) : null}
                    {legIndex === 0 ? (<td rowSpan={noOfLegs}>{match.sideA.name}</td>) : null}
                    <td>{legIndex + 1}</td>
                    {repeat(noOfThrows, throwIndex => {
                        const thr = (leg.home.throws ? leg.home.throws[throwIndex] : null) || {};
                        const score = thr.bust ? 0 : thr.score;
                        return (<td className={score >= 100 ? 'text-danger' : ''} key={`${match.id}_${legIndex}_sideA_${throwIndex}`}>{score}</td>);
                    })}
                    <td>{actualDarts('home')}</td>
                    <td>GS</td>
                    <td>SL</td>
                    <td>{countThrowsBetween('home', 100, 140) + countThrowsBetween('home', 140, 180) + (countThrowsBetween('home', 180) * 2)}</td>

                    {legIndex === 0 ? (<td rowSpan={noOfLegs}>ave</td>) : null}
                    {legIndex === 0 ? (<td rowSpan={noOfLegs}>{match.sideB.name}</td>) : null}
                    {repeat(noOfThrows, throwIndex => {
                        const thr = (leg.away.throws ? leg.away.throws[throwIndex] : null) || {};
                        const score = thr.bust ? 0 : thr.score;
                        return (<td className={score >= 100 ? 'text-danger' : ''} key={`${match.id}_${legIndex}_sideB_${throwIndex}`}>{score}</td>);
                    })}
                    <td>{actualDarts('away')}</td>
                    <td>GS</td>
                    <td>SL</td>
                    <td>{countThrowsBetween('away', 100, 140) + countThrowsBetween('away', 140, 180) + (countThrowsBetween('away', 180) * 2)}</td>
                </tr>);
            })}
        </>);
    } catch (e) {
        onError(e);
    }
}