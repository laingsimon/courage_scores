import {round2dp} from "../../../Utilities";

export function MatchAverage({ homeAverage, awayAverage, singlePlayer }) {
    if (!homeAverage && !awayAverage) {
        return null;
    }

    return (<tr>
        <td>
            Match average
        </td>
        <td className={`${homeAverage > awayAverage ? 'bg-winner' : ''} fw-bold`}>
            {round2dp(homeAverage)}
        </td>
        {singlePlayer ? null : (<td className={`${homeAverage > awayAverage ? '' : 'bg-winner'} fw-bold`}>
            {round2dp(awayAverage)}
        </td>)}
    </tr>);
}