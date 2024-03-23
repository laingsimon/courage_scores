import {WidescreenSaygRecentThrow} from "./WidescreenSaygRecentThrow";
import {reverse} from "../../helpers/collections";
import {useSayg} from "./SaygLoadingContainer";
import {useLive} from "../../live/LiveContainer";
import {RefreshControl} from "../common/RefreshControl";
import {LegDto} from "../../interfaces/models/dtos/Game/Sayg/LegDto";
import {LegThrowDto} from "../../interfaces/models/dtos/Game/Sayg/LegThrowDto";
import {useApp} from "../common/AppContainer";
import {LiveDataType} from "../../interfaces/models/dtos/Live/LiveDataType";

export interface IWidescreenSaygPlayerProps {
    legs: { [legKey: number]: LegDto };
    player: 'home' | 'away';
    scoreFirst?: boolean;
    finished: boolean;
    changeStatisticsView?(widescreen: boolean): Promise<any>;
    showOptions?: boolean;
}

export function WidescreenSaygPlayer({ legs, player, scoreFirst, finished, changeStatisticsView, showOptions }: IWidescreenSaygPlayerProps) {
    const {onError} = useApp();
    const {sayg} = useSayg();
    const {liveOptions} = useLive();
    const orderedLegKeys: string[] = Object.keys(legs).sort((keyA, keyB) => Number.parseInt(keyA) - Number.parseInt(keyB));
    const lastLegKey: string = orderedLegKeys[orderedLegKeys.length - 1];
    const lastLeg = legs[lastLegKey];
    const noOfThrowsMax: number = 5;

    function throwsInLastLegFor(max: number, player: 'home' | 'away'): LegThrowDto[] {
        if (!lastLeg) {
            return [];
        }

        const throws: LegThrowDto[] = lastLeg[player].throws;
        const startIndex: number = Math.max(throws.length - max, 0);
        return reverse(throws.slice(startIndex, startIndex + max));
    }

    const score = lastLeg ? (<div className="d-flex flex-row flex-grow-1 justify-content-center align-content-center flex-wrap">
        <h1 style={{ fontSize: '15rem'}}>{finished && lastLeg[player].score === lastLeg.startingScore
            ? '🎉'
            : lastLeg.startingScore - lastLeg[player].score}</h1>
    </div>) : null;

    try {
        return (<div datatype="WidescreenSaygPlayer" className="d-flex flex-row flex-grow-1 align-content-stretch">
            {scoreFirst ? score : null}
            <div className="d-flex flex-column flex-grow-0 justify-content-around bg-light">
                {throwsInLastLegFor(noOfThrowsMax, player).map((thr: LegThrowDto, index: number) =>
                    (<WidescreenSaygRecentThrow key={index} score={thr.score} bust={thr.bust}
                                                throwNumber={index + 1}/>))}
            </div>
            {scoreFirst ? null : score}
            {showOptions ? (<div className="position-absolute p-1">
                {liveOptions.canSubscribe && !finished ? <RefreshControl id={sayg.id} type={LiveDataType.sayg} /> : null}
                {changeStatisticsView ?
                    <button className="btn btn-sm btn-outline-primary border-dark"
                            onClick={() => changeStatisticsView(false)}>
                        📊
                    </button> : null}
            </div>) : null}
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
