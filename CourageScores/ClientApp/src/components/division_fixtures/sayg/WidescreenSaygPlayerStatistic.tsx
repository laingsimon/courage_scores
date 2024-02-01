import {sum} from "../../../helpers/collections";
import {ifNaN, round2dp} from "../../../helpers/rendering";
import {LegDto} from "../../../interfaces/models/dtos/Game/Sayg/LegDto";

export interface IWidescreenSaygPlayerStatisticProps {
    legs: { [legKey: number]: LegDto };
    player: 'home' | 'away';
    oneDartAverage: boolean;
    setOneDartAverage: (newValue: boolean) => Promise<any>;
}

export function WidescreenSaygPlayerStatistic({legs, player, oneDartAverage, setOneDartAverage }: IWidescreenSaygPlayerStatisticProps) {
    const orderedLegKeys = Object.keys(legs).sort((keyA, keyB) => Number.parseInt(keyA) - Number.parseInt(keyB));
    const lastLegKey = orderedLegKeys[orderedLegKeys.length - 1];
    const lastLeg = legs[lastLegKey];
    const dartAverageMultiplier = oneDartAverage ? 3 : 1;

    function sumOf(player: string, prop: string): number {
        return sum(Object.values(legs), (leg: LegDto) => leg[player][prop]);
    }

    return (<div datatype="WidescreenSaygPlayerStatistic" className="d-flex flex-row justify-content-between text-center border-top border-secondary fs-3">
        <div>
            Darts<br />
            {lastLeg[player].noOfDarts}
        </div>
        <div onClick={() => setOneDartAverage(!oneDartAverage)}>
            Leg Avg<br/>
            {ifNaN(round2dp(lastLeg[player].score / (lastLeg[player].noOfDarts / 3) / dartAverageMultiplier), '-')}
            <sup className="text-secondary-50">{oneDartAverage ? '1' : '3'}</sup>
        </div>
        <div onClick={() => setOneDartAverage(!oneDartAverage)}>
            Match Avg<br />
            {ifNaN(round2dp(sumOf(player, 'score') / (sumOf(player, 'noOfDarts') / 3) / dartAverageMultiplier), '-')}
            <sup className="text-secondary-50">{oneDartAverage ? '1' : '3'}</sup>
        </div>
    </div>);
}