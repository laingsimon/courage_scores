import { useApp } from '../../common/AppContainer';
import { repeat } from '../../../helpers/projection';
import {
    getMatchWinner,
    legActualDarts,
    legGameShot,
    legScoreLeft,
    legTonsSplit,
    playerOverallAverage,
} from '../../../helpers/superleague';
import { ifNaN, round2dp } from '../../../helpers/rendering';
import { ScoreAsYouGoDto } from '../../../interfaces/models/dtos/Game/Sayg/ScoreAsYouGoDto';

export interface IMatchReportRowProps {
    matchIndex: number;
    saygData: ScoreAsYouGoDto;
    noOfThrows: number;
    noOfLegs: number;
    showWinner?: boolean;
    hostPlayerName: string;
    opponentPlayerName: string;
}

export function MatchReportRow({
    matchIndex,
    saygData,
    noOfThrows,
    noOfLegs,
    showWinner,
    hostPlayerName,
    opponentPlayerName,
}: IMatchReportRowProps) {
    const { onError } = useApp();

    try {
        if (!saygData || !saygData.legs) {
            return null;
        }

        const winner = getMatchWinner(saygData);
        return (
            <>
                {repeat(noOfLegs, (legIndex: number) => {
                    const leg = saygData.legs[legIndex.toString()] || {
                        home: {},
                        away: {},
                    };

                    return (
                        <tr key={matchIndex + '_' + legIndex}>
                            {legIndex === 0 ? (
                                <td rowSpan={noOfLegs} className="align-middle">
                                    M{matchIndex + 1}
                                </td>
                            ) : null}
                            {legIndex === 0 ? (
                                <td
                                    rowSpan={noOfLegs}
                                    className="align-middle fw-bold text-danger page-break-avoid">
                                    {ifNaN(
                                        round2dp(
                                            playerOverallAverage(
                                                saygData,
                                                'home',
                                            ) || 0,
                                        ),
                                        '-',
                                    )}
                                </td>
                            ) : null}
                            {legIndex === 0 ? (
                                <td
                                    rowSpan={noOfLegs}
                                    className={`align-middle page-break-avoid ${winner === 'home' && showWinner ? ' bg-winner' : matchIndex % 2 === 0 ? '' : 'bg-light'}`}>
                                    {hostPlayerName}
                                </td>
                            ) : null}
                            <td>{legIndex + 1}</td>
                            {repeat(noOfThrows + 1, (throwIndex) => {
                                const thr =
                                    (leg.home.throws
                                        ? leg.home.throws[throwIndex]
                                        : null) || {};
                                const score = thr.score;
                                return (
                                    <td
                                        className={
                                            (score >= 100
                                                ? ' text-danger'
                                                : '') +
                                            (score >= 180 ? ' fw-bold' : '')
                                        }
                                        key={`${matchIndex}_${legIndex}_sideA_${throwIndex}`}>
                                        {score}
                                    </td>
                                );
                            })}
                            <td>{legActualDarts(leg, 'home')}</td>
                            <td
                                className={
                                    (legGameShot(leg, 'home') || 0) >= 100
                                        ? 'text-danger'
                                        : ''
                                }>
                                {legGameShot(leg, 'home')}
                            </td>
                            <td>{legScoreLeft(leg, 'home')}</td>
                            <td>{legTonsSplit(leg, 'home')}</td>

                            {legIndex === 0 ? (
                                <td
                                    rowSpan={noOfLegs}
                                    className="align-middle fw-bold text-danger page-break-avoid">
                                    {ifNaN(
                                        round2dp(
                                            playerOverallAverage(
                                                saygData,
                                                'away',
                                            ) || 0,
                                        ),
                                        '-',
                                    )}
                                </td>
                            ) : null}
                            {legIndex === 0 ? (
                                <td
                                    rowSpan={noOfLegs}
                                    className={`align-middle page-break-avoid ${winner === 'away' && showWinner ? ' bg-winner' : matchIndex % 2 === 0 ? 'bg-light' : ''}`}>
                                    {opponentPlayerName}
                                </td>
                            ) : null}
                            {repeat(noOfThrows + 1, (throwIndex) => {
                                const thr =
                                    (leg.away.throws
                                        ? leg.away.throws[throwIndex]
                                        : null) || {};
                                const score = thr.score;
                                return (
                                    <td
                                        className={
                                            (score >= 100
                                                ? ' text-danger'
                                                : '') +
                                            (score >= 180 ? ' fw-bold' : '')
                                        }
                                        key={`${matchIndex}_${legIndex}_sideB_${throwIndex}`}>
                                        {score}
                                    </td>
                                );
                            })}
                            <td>{legActualDarts(leg, 'away')}</td>
                            <td
                                className={
                                    (legGameShot(leg, 'away') || 0) >= 100
                                        ? 'text-danger'
                                        : ''
                                }>
                                {legGameShot(leg, 'away')}
                            </td>
                            <td>{legScoreLeft(leg, 'away')}</td>
                            <td>{legTonsSplit(leg, 'away')}</td>
                        </tr>
                    );
                })}
            </>
        );
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
