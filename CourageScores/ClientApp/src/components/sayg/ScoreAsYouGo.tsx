import {PlayLeg} from "./PlayLeg";
import {MatchStatistics} from "./MatchStatistics";
import {useApp} from "../common/AppContainer";
import {useSayg} from "./SaygLoadingContainer";
import {WidescreenMatchStatistics} from "./WidescreenMatchStatistics";
import {Location, useLocation} from "react-router-dom";
import {useState} from "react";
import {LegDto} from "../../interfaces/models/dtos/Game/Sayg/LegDto";
import {UpdateRecordedScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto";
import {ScoreAsYouGoDto} from "../../interfaces/models/dtos/Game/Sayg/ScoreAsYouGoDto";

export interface IScoreAsYouGoProps {
    data: UpdateRecordedScoreAsYouGoDto;
    home: string;
    away?: string;
    onChange(data: ScoreAsYouGoDto): Promise<any>;
    onLegComplete(homeScore: number, awayScore: number): Promise<any>;
    startingScore: number;
    numberOfLegs: number;
    awayScore?: number;
    homeScore?: number;
    on180(accumulatorName: string): Promise<any>;
    onHiCheck(accumulatorName: string, score: number): Promise<any>;
    singlePlayer?: boolean;
}

export function ScoreAsYouGo({
                                 data, home, away, onChange, onLegComplete, startingScore, numberOfLegs, awayScore,
                                 homeScore, on180, onHiCheck, singlePlayer
                             }: IScoreAsYouGoProps) {
    const {onError, account} = useApp();
    const {saveDataAndGetId, matchStatisticsOnly} = useSayg();
    const canEditThrows: boolean = account && account.access && account.access.recordScoresAsYouGo;
    const location: Location = useLocation();
    const [useWidescreenStatistics, setUseWidescreenStatistics] = useState<boolean>(shouldUseWidescreenStatistics(location));

    function shouldUseWidescreenStatistics(location: Location): boolean {
        return location.search.indexOf('widescreen=true') !== -1;
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
        newData.legs[legIndex] = {
            playerSequence: singlePlayer ? [{value: 'home', text: home}, {
                value: 'away',
                text: 'unused-single-player'
            }] : null,
            home: {throws: [], score: 0, noOfDarts: 0},
            away: {throws: [], score: 0, noOfDarts: 0},
            startingScore: startingScore,
            isLastLeg: legIndex === numberOfLegs - 1,
            currentThrow: singlePlayer ? 'home' : null
        };
        return newData;
    }

    async function legChanged(newLeg: LegDto, legIndex: number): Promise<ScoreAsYouGoDto> {
        const newData: ScoreAsYouGoDto = Object.assign({}, data);
        if (data.legs) {
            newData.legs = Object.assign({}, data.legs);
        }
        newData.legs[legIndex] = newLeg;
        await onChange(newData);
        return newData;
    }

    async function saveChangedLeg(newLeg: LegDto, legIndex: number): Promise<any> {
        const newData: ScoreAsYouGoDto = await legChanged(newLeg, legIndex);
        await saveDataAndGetId(newData);
    }

    async function recordWinner(winnerName: string) {
        try {
            const newHomeScore = winnerName === 'home' ? homeScore + 1 : (homeScore || 0);
            const newAwayScore = winnerName === 'away' ? awayScore + 1 : (awayScore || 0);

            const currentLegIndex = (homeScore || 0) + (awayScore || 0);
            const currentLeg = data.legs[currentLegIndex];

            const unbeatable = newHomeScore > (numberOfLegs / 2) || newAwayScore > (numberOfLegs / 2);
            if (!currentLeg.isLastLeg && !unbeatable) {
                const newData: ScoreAsYouGoDto = addLeg(currentLegIndex + 1);
                const newLeg: LegDto = newData.legs[currentLegIndex + 1];

                if (!singlePlayer) {
                    newLeg.playerSequence = [currentLeg.playerSequence[1], currentLeg.playerSequence[0]];
                    newLeg.currentThrow = newLeg.playerSequence[0].value;
                }

                if (newLeg.isLastLeg && newHomeScore === newAwayScore && newHomeScore > 0) {
                    // prompt for who should throw first.
                    newLeg.currentThrow = null;
                }

                await onChange(newData);
            }

            await onLegComplete(newHomeScore, newAwayScore);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    const legIndex: number = (homeScore || 0) + (awayScore || 0);
    const hasFinished: boolean = (homeScore > numberOfLegs / 2.0) || (awayScore > numberOfLegs / 2.0);
    if (matchStatisticsOnly || (singlePlayer && homeScore === numberOfLegs) || (!singlePlayer && (legIndex === numberOfLegs || hasFinished))) {
        if (useWidescreenStatistics) {
            return <WidescreenMatchStatistics
                legs={data.legs}
                awayScore={awayScore}
                homeScore={homeScore}
                home={home}
                away={away}
                singlePlayer={singlePlayer}
                numberOfLegs={numberOfLegs}
                changeStatisticsView={async (op: boolean) => setUseWidescreenStatistics(op)} />
        }

        return <MatchStatistics
            legs={data.legs}
            awayScore={awayScore}
            homeScore={homeScore}
            home={home}
            away={away}
            singlePlayer={singlePlayer}
            numberOfLegs={numberOfLegs}
            legChanged={canEditThrows ? saveChangedLeg : null}
            changeStatisticsView={async (op: boolean) => setUseWidescreenStatistics(op)} />
    }

    const leg: LegDto = getLeg(legIndex);

    return (<PlayLeg
            leg={leg}
            home={home}
            away={away}
            onChange={(newLeg: LegDto) => legChanged(newLeg, legIndex)}
            onLegComplete={recordWinner}
            on180={on180}
            onHiCheck={onHiCheck}
            homeScore={homeScore}
            awayScore={awayScore}
            singlePlayer={singlePlayer}/>);
}
