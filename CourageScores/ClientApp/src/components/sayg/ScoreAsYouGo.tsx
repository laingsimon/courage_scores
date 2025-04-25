import {PlayLeg} from "./PlayLeg";
import {MatchStatistics} from "./MatchStatistics";
import {useApp} from "../common/AppContainer";
import {WidescreenMatchStatistics} from "./WidescreenMatchStatistics";
import {Location, useLocation} from "react-router";
import {useState} from "react";
import {LegDto} from "../../interfaces/models/dtos/Game/Sayg/LegDto";
import {UpdateRecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto";
import {ScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/ScoreAsYouGoDto";
import {IBrowserType} from "../common/IBrowserType";
import {ILegDisplayOptions} from "./ILegDisplayOptions";
import {UntypedPromise} from "../../interfaces/UntypedPromise";
import {asyncCallback} from "../../helpers/events";
import {LegPlayerSequenceDto} from "../../interfaces/models/dtos/Game/Sayg/LegPlayerSequenceDto";
import {hasAccess} from "../../helpers/conditions";

export interface IScoreAsYouGoProps {
    data: UpdateRecordedScoreAsYouGoDto;
    home: string;
    away?: string;
    onChange?(data: ScoreAsYouGoDto): UntypedPromise;
    onLegComplete?(homeScore: number, awayScore: number): UntypedPromise;
    startingScore: number;
    numberOfLegs: number;
    awayScore?: number;
    homeScore?: number;
    on180?(accumulatorName: string): UntypedPromise;
    onHiCheck?(accumulatorName: string, score: number): UntypedPromise;
    singlePlayer?: boolean;
    lastLegDisplayOptions?: ILegDisplayOptions;
    matchStatisticsOnly?: boolean;
    saveDataAndGetId?(useData?: ScoreAsYouGoDto): Promise<string | undefined>;
    firstLegPlayerSequence?: ('home' | 'away')[];
    finalLegPlayerSequence?: ('home' | 'away')[];
    onFinished?(): UntypedPromise;
    initialOneDartAverage?: boolean;
    showFullNames?: boolean;
}

export function ScoreAsYouGo({
                                 data, home, away, onChange, onLegComplete, startingScore, numberOfLegs, awayScore,
                                 homeScore, on180, onHiCheck, singlePlayer, lastLegDisplayOptions, matchStatisticsOnly,
                                 saveDataAndGetId, firstLegPlayerSequence, finalLegPlayerSequence, onFinished, initialOneDartAverage, showFullNames
                             }: IScoreAsYouGoProps) {
    const {onError, account, browser} = useApp();
    const canEditThrows: boolean = hasAccess(account, access => access.recordScoresAsYouGo);
    const location: Location = useLocation();
    const [useWidescreenStatistics, setUseWidescreenStatistics] = useState<boolean>(shouldUseWidescreenStatistics(location, browser));

    function shouldUseWidescreenStatistics(location: Location, browser: IBrowserType): boolean {
        return browser.tv || location.search.indexOf('widescreen=true') !== -1;
    }

    function getLeg(legIndex: number): LegDto {
        const leg: LegDto = data.legs[legIndex];
        if (leg) {
            return leg;
        }

        return addLeg(legIndex).legs[legIndex];
    }

    function addLeg(legIndex: number): ScoreAsYouGoDto {
        const newData: ScoreAsYouGoDto = Object.assign({}, data);
        const playerSequence = legIndex === 0 || singlePlayer
            ? getPlayerSequence()
            : [];
        newData.legs[legIndex] = {
            playerSequence,
            home: {throws: [], score: 0, noOfDarts: 0},
            away: {throws: [], score: 0, noOfDarts: 0},
            startingScore: startingScore,
            isLastLeg: legIndex === numberOfLegs - 1,
            currentThrow: playerSequence ? playerSequence[0]?.value : undefined,
        };
        return newData;
    }

    function getPlayerSequence(): LegPlayerSequenceDto[] {
        if (singlePlayer) {
            return [{value: 'home', text: home}, {value: 'away',text: 'unused-single-player'}];
        }

        if (firstLegPlayerSequence) {
            return firstLegPlayerSequence.map((key: string) => {
                return { value: key, text: key === 'home' ? home : away };
            });
        }

        return [];
    }

    async function legChanged(newLeg: LegDto, legIndex: number): Promise<ScoreAsYouGoDto> {
        const newData: ScoreAsYouGoDto = Object.assign({}, data);
        if (data.legs) {
            newData.legs = Object.assign({}, data.legs);
        }
        newData.legs[legIndex] = newLeg;
        if (onChange) {
            await onChange(newData);
        }
        return newData;
    }

    async function saveChangedLeg(newLeg: LegDto, legIndex: number): UntypedPromise {
        const newData: ScoreAsYouGoDto = await legChanged(newLeg, legIndex);
        if (saveDataAndGetId) {
            await saveDataAndGetId(newData);
        }
    }

    async function recordWinner(winnerName: string, currentLeg: LegDto) {
        try {
            const newHomeScore: number = winnerName === 'home' ? (homeScore || 0) + 1 : (homeScore || 0);
            const newAwayScore: number = winnerName === 'away' ? (awayScore || 0) + 1 : (awayScore || 0);
            const currentLegIndex: number = (homeScore || 0) + (awayScore || 0);
            const unbeatable: boolean = newHomeScore > (numberOfLegs / 2) || newAwayScore > (numberOfLegs / 2);

            if (!currentLeg.isLastLeg && !unbeatable) {
                const newData: ScoreAsYouGoDto = addLeg(currentLegIndex + 1);
                newData.legs[currentLegIndex] = currentLeg; // ensure any updated leg data isn't lost (data may not have been updated)
                const newLeg: LegDto = newData.legs[currentLegIndex + 1];

                if (!singlePlayer) {
                    newLeg.playerSequence = [currentLeg.playerSequence![1], currentLeg.playerSequence![0]];
                    newLeg.currentThrow = newLeg.playerSequence[0].value;
                }

                if (newLeg.isLastLeg && newHomeScore === newAwayScore && newHomeScore > 0) {
                    if (finalLegPlayerSequence) {
                        newLeg.playerSequence = finalLegPlayerSequence.map(key => {
                            return { value: key, text: key === 'home' ? home : away };
                        });
                    }
                    else {
                        // prompt for who should throw first.
                        newLeg.currentThrow = undefined;
                    }
                }

                if (onChange) {
                    await onChange(newData);
                }
            }

            if (onLegComplete) {
                await onLegComplete(newHomeScore, newAwayScore);
            }

            if (!hasFinished() && hasFinished(newHomeScore, newAwayScore) && onFinished) {
                await onFinished();
            }
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    function hasFinished(home?: number, away?: number) {
        return ((home || homeScore || 0) > numberOfLegs / 2.0) || ((away || awayScore || 0) > numberOfLegs / 2.0);
    }

    const legIndex: number = (homeScore || 0) + (awayScore || 0);
    const previousLeg: LegDto | undefined = legIndex > 0 ? data.legs[legIndex - 1] : undefined;
    if (matchStatisticsOnly || (singlePlayer && homeScore === numberOfLegs) || (!singlePlayer && (legIndex === numberOfLegs || hasFinished()))) {
        if (useWidescreenStatistics) {
            return <WidescreenMatchStatistics
                saygId={data.id!}
                legs={data.legs}
                awayScore={awayScore || 0}
                homeScore={homeScore || 0}
                home={home}
                away={away}
                singlePlayer={singlePlayer}
                numberOfLegs={numberOfLegs}
                changeStatisticsView={asyncCallback(setUseWidescreenStatistics)}
                lastLegDisplayOptions={lastLegDisplayOptions || {}}
                initialOneDartAverage={initialOneDartAverage} />
        }

        return <MatchStatistics
            saygId={data.id!}
            legs={data.legs}
            awayScore={awayScore}
            homeScore={homeScore || 0}
            home={home}
            away={away}
            singlePlayer={singlePlayer}
            numberOfLegs={numberOfLegs}
            legChanged={canEditThrows ? saveChangedLeg : undefined}
            changeStatisticsView={asyncCallback(setUseWidescreenStatistics)}
            lastLegDisplayOptions={lastLegDisplayOptions || {}}
            initialOneDartAverage={initialOneDartAverage} />
    }

    const leg: LegDto = getLeg(legIndex);

    return (<PlayLeg
            leg={leg}
            home={home}
            away={away || ''}
            onChange={(newLeg: LegDto) => legChanged(newLeg, legIndex)}
            onChangePrevious={(newLeg: LegDto) => legChanged(newLeg, legIndex - 1)}
            onLegComplete={recordWinner}
            on180={on180}
            onHiCheck={onHiCheck}
            homeScore={homeScore || 0}
            awayScore={awayScore}
            singlePlayer={singlePlayer}
            previousLeg={previousLeg}
            showFullNames={showFullNames} />);
}