import {sum} from "../../helpers/collections";
import {MatchDartCount} from "./MatchDartCount";
import {MatchAverage} from "./MatchAverage";
import {LegStatistics} from "./LegStatistics";
import {useState} from "react";
import {useSayg} from "./SaygLoadingContainer";
import {RefreshControl} from "../common/RefreshControl";
import {useLive} from "../../live/LiveContainer";
import {ILegDisplayOptions} from "./ILegDisplayOptions";
import {LegDto} from "../../interfaces/models/dtos/Game/Sayg/LegDto";
import {LiveDataType} from "../../interfaces/models/dtos/Live/LiveDataType";

export interface IMatchStatisticsProps {
    saygId: string;
    legs: { [key: number]: LegDto };
    homeScore: number;
    awayScore: number;
    home: string;
    away?: string;
    singlePlayer?: boolean;
    legChanged?(leg: LegDto, index: number): Promise<any>;
    numberOfLegs: number;
    changeStatisticsView(widescreen: boolean): Promise<any>;
}

interface ILegDisplayOptionsLookup {
    [key: number]: ILegDisplayOptions
}

export function MatchStatistics({legs, homeScore, awayScore, home, away, singlePlayer, legChanged, numberOfLegs, changeStatisticsView, saygId }: IMatchStatisticsProps) {
    const [oneDartAverage, setOneDartAverage] = useState<boolean>(false);
    const {lastLegDisplayOptions} = useSayg();
    const {subscriptions, liveOptions} = useLive();
    const [legDisplayOptionsState, setLegDisplayOptions] = useState<ILegDisplayOptionsLookup>(getLegDisplayOptions(legs));
    const finished: boolean = (homeScore > numberOfLegs / 2.0) || (awayScore > numberOfLegs / 2.0);
    const isSubscribed: boolean = !!(saygId && subscriptions[saygId]);
    const legDisplayOptions: ILegDisplayOptionsLookup = isSubscribed && !finished
        ? getLegDisplayOptions(legs, true)
        : legDisplayOptionsState;

    function getLegDisplayOptions(legs: { [key: number]: LegDto }, showThrowsOnLastLeg?: boolean): ILegDisplayOptionsLookup {
        const options: ILegDisplayOptionsLookup = {};
        let lastLegIndex = null;
        for (let legIndex of Object.keys(legs)) {
            options[legIndex] = {
                showThrows: false,
                showAverage: false,
            };

            const leg = legs[legIndex];
            if (leg.home.score || leg.away.score) {
                // leg has started
                lastLegIndex = legIndex;
            }
        }

        if (showThrowsOnLastLeg && lastLegIndex) {
            options[lastLegIndex] = lastLegDisplayOptions;
        }

        return options;
    }

    function updateLegDisplayOptions(legIndex: number, options: ILegDisplayOptions) {
        const newLegDisplayOptions: ILegDisplayOptionsLookup = Object.assign({}, legDisplayOptions);
        newLegDisplayOptions[legIndex] = options;
        setLegDisplayOptions(newLegDisplayOptions);
    }

    function sumOf(player: 'home' | 'away', prop: string) {
        return sum(Object.values(legs), (leg: LegDto) => leg[player][prop]);
    }

    return (<div>
        <h4 className="text-center">
            Match statistics
            {liveOptions.canSubscribe && !finished ? <RefreshControl id={saygId} type={LiveDataType.sayg} /> : null}
            {liveOptions.canSubscribe && !finished ? <button className="btn btn-sm btn-outline-primary border-dark float-end" onClick={() => changeStatisticsView(true)}>🖥</button> : null}
        </h4>
        <table className="table">
            <thead>
            {singlePlayer ? null : (<tr>
                <th></th>
                <th className={homeScore > awayScore ? 'text-primary' : ''}>{home}</th>
                <th className={homeScore > awayScore ? '' : 'text-primary'}>{away}</th>
            </tr>)}
            </thead>
            <tbody>
            <tr>
                <td>Score</td>
                <td className={`${homeScore > awayScore ? 'bg-winner text-primary' : ''} text-center`}>
                    <strong>{homeScore || '0'}</strong></td>
                {singlePlayer
                    ? null
                    : (<td className={`${homeScore > awayScore ? '' : 'bg-winner text-primary'} text-center`}>
                        <strong>{awayScore || '0'}</strong>
                    </td>)}
            </tr>
            {Object.keys(legs).map((legIndex: string) => {
                const legKey: number = Number.parseInt(legIndex);

                return (<LegStatistics
                    key={legIndex}
                    legNumber={legKey + 1}
                    leg={legs[legIndex]}
                    home={home}
                    away={away}
                    singlePlayer={singlePlayer}
                    oneDartAverage={oneDartAverage}
                    legDisplayOptions={legDisplayOptions[legKey] || getLegDisplayOptions(legs)[legKey]}
                    updateLegDisplayOptions={isSubscribed && !finished ? null : async (options: ILegDisplayOptions) => updateLegDisplayOptions(legKey, options)}
                    onChangeLeg={legChanged ? ((newLeg: LegDto) => legChanged(newLeg, legKey)) : null}
                />);
            })}
            </tbody>
            <tfoot>
            <MatchAverage
                homeAverage={sumOf('home', 'score') / (sumOf('home', 'noOfDarts') / 3)}
                awayAverage={sumOf('away', 'score') / (sumOf('away', 'noOfDarts') / 3)}
                singlePlayer={singlePlayer}
                oneDartAverage={oneDartAverage}
                setOneDartAverage={async (option: boolean) => setOneDartAverage(option)}/>
            <MatchDartCount
                homeCount={sumOf('home', 'noOfDarts')}
                awayCount={sumOf('away', 'noOfDarts')}
                singlePlayer={singlePlayer}/>
            </tfoot>
        </table>
    </div>);
}
