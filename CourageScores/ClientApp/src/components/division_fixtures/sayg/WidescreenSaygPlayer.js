import {WidescreenSaygRecentThrow} from "./WidescreenSaygRecentThrow";
import {reverse} from "../../../helpers/collections";

export function WidescreenSaygPlayer({ legs, player, scoreFirst }) {
    const orderedLegKeys = Object.keys(legs).sort((keyA, keyB) => Number.parseInt(keyA) - Number.parseInt(keyB));
    const lastLegKey = orderedLegKeys[orderedLegKeys.length - 1];
    const lastLeg = legs[lastLegKey];
    const noOfThrowsMax = 5;

    function throwsInLastLegFor(max, player) {
        const throws = lastLeg[player].throws;
        const startIndex = Math.max(throws.length - max, 0);
        return reverse(throws.slice(startIndex, startIndex + max));
    }

    const score = (<div className="d-flex flex-row flex-grow-1 justify-content-center align-content-center flex-wrap">
        <h1 style={{ fontSize: '15rem'}}>{lastLeg.startingScore - lastLeg[player].score}</h1>
    </div>);

    return (<div className="d-flex flex-row flex-grow-1 align-content-stretch">
        {scoreFirst ? score : null}
        <div className="d-flex flex-column flex-grow-0 justify-content-around bg-light">
            {throwsInLastLegFor(noOfThrowsMax, player).map((thr, index) =>
                (<WidescreenSaygRecentThrow key={index} score={thr.score} bust={thr.bust} throwNumber={index + 1} />))}
        </div>
        {scoreFirst ? null : score}
    </div>)
}