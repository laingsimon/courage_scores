import {count, sum} from "../../../../helpers/collections";
import {useApp} from "../../../../AppContainer";

export function SummaryDataRow({ matchNo, match, saygData }) {
    const { onError } = useApp();
    function countThrowsBetween(accumulatorName, lowerInclusive, upperExclusive) {
        if (!saygData || !saygData.legs) {
            return null;
        }

        return sum(Object.keys(saygData.legs).map(legIndex => {
            const leg = saygData.legs[legIndex];
            const accumulator = leg[accumulatorName];

            return count(accumulator.throws, thr => thr.score >= lowerInclusive && thr.score < upperExclusive);
        }));
    }

    function count100(accumulatorName) {
        return countThrowsBetween(accumulatorName, 100, 140);
    }

    function count140(accumulatorName) {
        return countThrowsBetween(accumulatorName, 140, 180);
    }

    function count180(accumulatorName) {
        return countThrowsBetween(accumulatorName, 180, 181);
    }

    function countTons(accumulatorName) {
        return count100(accumulatorName) + count140(accumulatorName) + (count180(accumulatorName) * 2);
    }

    try {
        return (<tr>
            <td>{matchNo}</td>
            <td>{match.sideA.name}</td>
            <td>{match.scoreA}</td>
            <td>{countTons('home')}</td>
            <td>{count100('home')}</td>
            <td>{count140('home')}</td>
            <td>{count180('home')}</td>
            <td></td>
            <td>{match.sideB.name}</td>
            <td>{match.scoreB}</td>
            <td>{countTons('away')}</td>
            <td>{count100('away')}</td>
            <td>{count140('away')}</td>
            <td>{count180('away')}</td>
            <td></td>
        </tr>);
    } catch (e) {
        onError(e);
    }
}