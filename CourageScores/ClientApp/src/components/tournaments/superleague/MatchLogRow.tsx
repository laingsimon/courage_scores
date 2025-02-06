import {repeat} from "../../../helpers/projection";
import {sum} from "../../../helpers/collections";
import {round2dp} from "../../../helpers/rendering";
import {useApp} from "../../common/AppContainer";
import {countLegThrowsBetween, isLegWinner, legTons} from "../../../helpers/superleague";
import {LegDto} from "../../../interfaces/models/dtos/Game/Sayg/LegDto";
import {LegCompetitorScoreDto} from "../../../interfaces/models/dtos/Game/Sayg/LegCompetitorScoreDto";
import {LegThrowDto} from "../../../interfaces/models/dtos/Game/Sayg/LegThrowDto";
import {getScoreFromThrows} from "../../../helpers/sayg";

export interface IMatchLogRowProps {
    leg: LegDto;
    legNo: number;
    accumulatorName: string;
    player: string;
    noOfThrows: number;
    playerOverallAverage: number;
    noOfLegs: number;
    showWinner?: boolean;
    teamAverage: number;
}

export function MatchLogRow({leg, legNo, accumulatorName, player, noOfThrows, playerOverallAverage, noOfLegs, showWinner, teamAverage}: IMatchLogRowProps) {
    const {onError} = useApp();
    const accumulator: LegCompetitorScoreDto = leg[accumulatorName];
    const lastThrow: LegThrowDto = accumulator.throws![accumulator.throws!.length - 1];
    const winner: boolean = isLegWinner(leg, accumulatorName);

    if (!accumulator.noOfDarts) {
        return null;
    }

    try {
        return (<tr className={winner && showWinner ? 'bg-winner' : ''}>
            {legNo === 1
                ? (<td rowSpan={noOfLegs} className="align-middle bg-white page-break-avoid">{player}</td>)
                : null}
            <td>{legNo}</td>
            <td datatype="actual-darts">{sum(accumulator.throws, (thr: LegThrowDto) => thr.noOfDarts!)}</td>
            <td datatype="game-shot">{winner && lastThrow ? lastThrow.score : null}</td>
            <td datatype="score-left">{winner || !lastThrow ? null : leg.startingScore! - getScoreFromThrows(leg.startingScore!, accumulator.throws)}</td>
            <td>{countLegThrowsBetween(leg, accumulatorName, 100, 140)}</td>
            <td>{countLegThrowsBetween(leg, accumulatorName, 140, 180)}</td>
            <td>{countLegThrowsBetween(leg, accumulatorName, 180)}</td>
            <td datatype="tons">{legTons(leg, accumulatorName)}</td>
            {legNo === 1
                ? (<td rowSpan={noOfLegs} className="align-middle bg-white fw-bold text-danger">
                    {round2dp(playerOverallAverage)}
                </td>)
                : null}
            {legNo === 1
                ? (<td rowSpan={noOfLegs} className="align-middle bg-white fw-bold text-danger">
                    {round2dp(teamAverage)}
                </td>)
                : null}
            <td datatype="game-dart">{winner && lastThrow ? lastThrow.noOfDarts : null}</td>
            {repeat(noOfThrows + 1, i => {
                const playerThrow = accumulator.throws![i] || {};
                const score = playerThrow.score;

                return (<td key={i} className={(score! >= 100 ? ' text-danger' : '') + (score! >= 180 ? ' fw-bold' : '')}>
                    {score}
                </td>)
            })}
        </tr>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}