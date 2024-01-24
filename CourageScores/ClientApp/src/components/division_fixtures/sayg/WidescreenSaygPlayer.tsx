import {WidescreenSaygRecentThrow} from "./WidescreenSaygRecentThrow";
import {reverse} from "../../../helpers/collections";
import {useSayg} from "./SaygLoadingContainer";
import {useLive} from "../LiveContainer";
import {RefreshControl} from "../RefreshControl";
import {ILegDto} from "../../../interfaces/serverSide/Game/Sayg/ILegDto";
import {ILegThrowDto} from "../../../interfaces/serverSide/Game/Sayg/ILegThrowDto";

export interface IWidescreenSaygPlayerProps {
    legs: { [legKey: number]: ILegDto };
    player: 'home' | 'away';
    scoreFirst?: boolean;
    finished: boolean;
    changeStatisticsView?: (widescreen: boolean) => Promise<any>;
    showOptions?: boolean;
}

export function WidescreenSaygPlayer({ legs, player, scoreFirst, finished, changeStatisticsView, showOptions }: IWidescreenSaygPlayerProps) {
    const {sayg} = useSayg();
    const {liveOptions} = useLive();
    const orderedLegKeys: string[] = Object.keys(legs).sort((keyA, keyB) => Number.parseInt(keyA) - Number.parseInt(keyB));
    const lastLegKey: string = orderedLegKeys[orderedLegKeys.length - 1];
    const lastLeg = legs[lastLegKey];
    const noOfThrowsMax: number = 5;

    function throwsInLastLegFor(max: number, player: 'home' | 'away'): ILegThrowDto[] {
        const throws: ILegThrowDto[] = lastLeg[player].throws;
        const startIndex: number = Math.max(throws.length - max, 0);
        return reverse(throws.slice(startIndex, startIndex + max));
    }

    const score = (<div className="d-flex flex-row flex-grow-1 justify-content-center align-content-center flex-wrap">
        <h1 style={{ fontSize: '15rem'}}>{finished && lastLeg[player].score === lastLeg.startingScore ? '🎉' : lastLeg.startingScore - lastLeg[player].score}</h1>
    </div>);

    return (<div datatype="WidescreenSaygPlayer" className="d-flex flex-row flex-grow-1 align-content-stretch">
        {scoreFirst ? score : null}
        <div className="d-flex flex-column flex-grow-0 justify-content-around bg-light">
            {throwsInLastLegFor(noOfThrowsMax, player).map((thr: ILegThrowDto, index: number) =>
                (<WidescreenSaygRecentThrow key={index} score={thr.score} bust={thr.bust} throwNumber={index + 1} />))}
        </div>
        {scoreFirst ? null : score}
        {showOptions ? (<div className="position-absolute p-1">
            {liveOptions.canSubscribe && !finished ? <RefreshControl id={sayg.id}/> : null}
            {changeStatisticsView ?
                <button className="btn btn-sm btn-outline-primary border-dark" onClick={() => changeStatisticsView(false)}>
                    📊
                </button> : null}
        </div>) : null}
    </div>)
}
