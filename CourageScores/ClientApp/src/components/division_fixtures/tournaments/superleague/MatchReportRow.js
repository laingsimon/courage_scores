import {useApp} from "../../../../AppContainer";
import {repeat} from "../../../../helpers/projection";

export function MatchReportRow({ match, matchIndex, saygData, noOfThrows, noOfLegs }) {
    const { onError } = useApp();

    try {
        return (<>
            {repeat(noOfLegs, legIndex => {
                const leg = saygData.legs[legIndex + ''] || { home: {}, away: {} };

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
                    <td>AD</td>
                    <td>GS</td>
                    <td>SL</td>
                    <td>Tons</td>

                    {legIndex === 0 ? (<td rowSpan={noOfLegs}>ave</td>) : null}
                    {legIndex === 0 ? (<td rowSpan={noOfLegs}>{match.sideB.name}</td>) : null}
                    {repeat(noOfThrows, throwIndex => {
                        const thr = (leg.away.throws ? leg.away.throws[throwIndex] : null) || {};
                        const score = thr.bust ? 0 : thr.score;
                        return (<td className={score >= 100 ? 'text-danger' : ''} key={`${match.id}_${legIndex}_sideB_${throwIndex}`}>{score}</td>);
                    })}
                    <td>AD</td>
                    <td>GS</td>
                    <td>SL</td>
                    <td>Tons</td>
                </tr>);
            })}
        </>);
    } catch (e) {
        onError(e);
    }
}