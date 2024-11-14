import {sum} from "../../helpers/collections";
import {ifNaN, round2dp} from "../../helpers/rendering";
import {valueChanged} from "../../helpers/events";
import {useState} from "react";
import {EditThrow} from "./EditThrow";
import {LegDto} from "../../interfaces/models/dtos/Game/Sayg/LegDto";
import {LegThrowDto} from "../../interfaces/models/dtos/Game/Sayg/LegThrowDto";
import {LegCompetitorScoreDto} from "../../interfaces/models/dtos/Game/Sayg/LegCompetitorScoreDto";
import {ILegDisplayOptions} from "./ILegDisplayOptions";
import {UntypedPromise} from "../../interfaces/UntypedPromise";
import {isLegWinner} from "../../helpers/superleague";

export interface ILegStatisticsProps {
    leg: LegDto;
    home: string;
    away?: string;
    legNumber: number;
    singlePlayer?: boolean;
    oneDartAverage?: boolean;
    onChangeLeg?(newLeg: LegDto): UntypedPromise;
    updateLegDisplayOptions(options: ILegDisplayOptions): UntypedPromise;
    legDisplayOptions: ILegDisplayOptions;
}

interface IEditableLegThrowDto extends LegThrowDto {
    index: number;
    competitor: 'home' | 'away';
}

interface ILegStatisticsDetail {
    thisScore: number;
    thisNoOfDarts: number;
    totalScore: number;
    noOfDarts: number;
    remaining: number;
    threeDartRunningAverage: number;
    oneDartRunningAverage: number;
    checkout: boolean;
}

export function LegStatistics({leg, home, away, legNumber, singlePlayer, oneDartAverage, onChangeLeg, updateLegDisplayOptions, legDisplayOptions }: ILegStatisticsProps) {
    const homeStats: LegCompetitorScoreDto = leg.home;
    const awayStats: LegCompetitorScoreDto = leg.away;
    const [throwUnderEdit, setThrowUnderEdit] = useState<IEditableLegThrowDto>(null);

    if (homeStats.noOfDarts + awayStats.noOfDarts === 0) {
        return null;
    }

    function getLegStatistics(throws: LegThrowDto[]): ILegStatisticsDetail[] {
        let score: number = 0;
        let noOfDarts: number = 0;

        return throws.map((thr: LegThrowDto) => {
            score += (score + thr.score) > leg.startingScore
                ? 0 /* bust */
                : thr.score;
            noOfDarts += thr.noOfDarts;
            const threeDartAverage = score / (noOfDarts / 3);

            return {
                thisScore: thr.score,
                thisNoOfDarts: thr.noOfDarts,
                totalScore: score,
                noOfDarts: noOfDarts,
                remaining: leg.startingScore - score,
                threeDartRunningAverage: threeDartAverage,
                oneDartRunningAverage: threeDartAverage / 3,
                checkout: score === leg.startingScore,
            };
        });
    }

    function editThrow(index: number, competitor: string) {
        if (!onChangeLeg) {
            return;
        }

        const thr = leg[competitor].throws[index];
        const throwUnderEdit: IEditableLegThrowDto = Object.assign({
            index,
            competitor,
        }, thr);
        setThrowUnderEdit(throwUnderEdit);
    }

    async function saveThrowChange() {
        const newLeg: LegDto = Object.assign({}, leg);
        const competitor: LegCompetitorScoreDto = Object.assign({}, leg[throwUnderEdit.competitor]);
        const newThrow: IEditableLegThrowDto = Object.assign({}, throwUnderEdit);
        delete newThrow.competitor;
        delete newThrow.index;

        newLeg[throwUnderEdit.competitor] = competitor;
        competitor.throws = competitor.throws
            .map((thr: LegThrowDto, index: number) => index === throwUnderEdit.index ? newThrow : thr)
            .filter((thr: LegThrowDto) => thr.noOfDarts > 0);
        competitor.score = sum(competitor.throws, (thr: LegThrowDto) => thr.score);
        competitor.noOfDarts = sum(competitor.throws, (thr: LegThrowDto) => thr.noOfDarts);

        await onChangeLeg(newLeg);
        setThrowUnderEdit(null);
    }

    function renderThrows(throws: LegThrowDto[], competitor: string) {
        const legStatistics: ILegStatisticsDetail[] = getLegStatistics(throws);

        return (<table className="table-sm">
            <thead>
            <tr>
                <th>Threw</th>
                <th>Score</th>
                <th>{legDisplayOptions.showAverage ? 'Avg' : 'Darts'}</th>
            </tr>
            </thead>
            <tbody>
            {legStatistics.map((stats: ILegStatisticsDetail, index: number) => <tr key={index} className={stats.checkout ? 'bg-winner' : ''} onClick={() => editThrow(index, competitor)}>
                <td className={`${stats.thisScore >= 100 ? ' text-danger' : ''}${stats.thisScore === 180 ? ' fw-bold' : ''}`}>
                    {stats.thisScore}
                </td>
                <td>{stats.remaining}</td>
                <td>
                    {legDisplayOptions.showAverage
                        ? ifNaN((oneDartAverage ? round2dp(stats.oneDartRunningAverage) : round2dp(stats.threeDartRunningAverage)), '-')
                        : stats.thisNoOfDarts}
                </td>
            </tr>)}
            </tbody>
        </table>);
    }

    async function toggleShowAverage() {
        const options: ILegDisplayOptions = Object.assign({}, legDisplayOptions);
        options.showAverage = !legDisplayOptions.showAverage;
        await updateLegDisplayOptions(options);
    }

    const homeWinner = isLegWinner(leg, 'home');
    const awayWinner = isLegWinner(leg, 'away');

    return (<tr>
        <td>
            Leg: {legNumber}<br/>
            {(homeWinner || awayWinner) && !singlePlayer
                ? (<>Winner: <strong className="text-primary">{homeWinner ? home : away}</strong></>)
                : null}
            {updateLegDisplayOptions ? (<div className="form-check form-switch margin-right">
                <input className="form-check-input" type="checkbox" name="showThrows" id={`showThrows_${legNumber}`}
                       checked={legDisplayOptions.showThrows} onChange={valueChanged(legDisplayOptions, updateLegDisplayOptions)} />
                <label className="form-check-label small" htmlFor={`showThrows_${legNumber}`}>Details</label>
            </div>) : null}
            {legDisplayOptions.showThrows && updateLegDisplayOptions ? (<button className="btn btn-sm btn-outline-primary margin-right" onClick={toggleShowAverage}>
                {legDisplayOptions.showAverage ? (<span>Click to show <strong>No. of darts</strong></span>) : null}
                {!legDisplayOptions.showAverage ? (<span>Click to show <strong>running average</strong></span>) : null}
            </button>) : (legDisplayOptions.showThrows ? (<span>
                {!legDisplayOptions.showAverage ? (<span>No. of darts</span>) : null}
                {legDisplayOptions.showAverage ? (<span>running average</span>) : null}
            </span>) : null)}
            {throwUnderEdit
                ? (<EditThrow
                    {...throwUnderEdit}
                    home={home}
                    away={away}
                    onSave={saveThrowChange}
                    onChange={valueChanged(throwUnderEdit, setThrowUnderEdit)}
                    onClose={async () => setThrowUnderEdit(null)} />)
                : null}
        </td>
        <td className={(homeWinner || leg.home.score === leg.startingScore) ? 'bg-winner' : ''}>
            <span>Average: <strong>{ifNaN(round2dp(homeStats.score / (homeStats.noOfDarts / 3) / (oneDartAverage ? 3 : 1)), '-')}</strong> ({homeStats.noOfDarts} darts)<br/>
            {homeWinner
                ? (<div>Checkout: <strong>{leg.home.throws[leg.home.throws.length - 1].score}</strong></div>)
                : (<div>Remaining: <strong>{leg.startingScore - homeStats.score}</strong></div>)}
            </span>
            {legDisplayOptions.showThrows ? (renderThrows(leg.home.throws, 'home')) : null}
        </td>
        {singlePlayer ? null : (<td className={(awayWinner || leg.away.score === leg.startingScore) ? 'bg-winner' : ''}>
            <span>Average: <strong>{ifNaN(round2dp(awayStats.score / (awayStats.noOfDarts / 3) / (oneDartAverage ? 3 : 1)), '-')}</strong> ({awayStats.noOfDarts} darts)<br/>
            {awayWinner
                ? (<div>Checkout: <strong>{leg.away.throws[leg.away.throws.length - 1].score}</strong></div>)
                : (<div>Remaining: <strong>{leg.startingScore - awayStats.score}</strong></div>)}</span>
            {legDisplayOptions.showThrows ? (renderThrows(leg.away.throws, 'away')) : null}
        </td>)}
    </tr>);
}