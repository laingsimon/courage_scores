import {ifNaN, round2dp} from "../../helpers/rendering";
import {stateChanged} from "../../helpers/events";

export interface IMatchAverageProps {
    homeAverage: number;
    awayAverage: number;
    singlePlayer?: boolean;
    oneDartAverage?: boolean;
    setOneDartAverage: (onDartAverage: boolean) => Promise<any>;
}

export function MatchAverage({homeAverage, awayAverage, singlePlayer, oneDartAverage, setOneDartAverage}: IMatchAverageProps) {
    if (!homeAverage && !awayAverage) {
        return null;
    }

    return (<tr>
        <td>
            Match average
            <div className="form-check form-switch margin-right">
                <input className="form-check-input" type="checkbox" id="oneDartAverage"
                       checked={oneDartAverage} onChange={stateChanged(setOneDartAverage)}/>
                <label className="form-check-label" htmlFor="oneDartAverage">{oneDartAverage ? '1️⃣' : '3️⃣'}</label>
            </div>
        </td>
        <td className={`${homeAverage > awayAverage ? 'bg-winner' : ''} fw-bold`}>
            {ifNaN(round2dp(homeAverage / (oneDartAverage ? 3 : 1)), '-')}
        </td>
        {singlePlayer ? null : (<td className={`${homeAverage > awayAverage ? '' : 'bg-winner'} fw-bold`}>
            {ifNaN(round2dp(awayAverage / (oneDartAverage ? 3 : 1)), '-')}
        </td>)}
    </tr>);
}