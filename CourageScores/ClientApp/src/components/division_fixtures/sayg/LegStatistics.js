import {isEmpty} from "../../../helpers/collections";
import {round2dp} from "../../../helpers/rendering";
import {stateChanged} from "../../../helpers/events";
import React, {useState} from "react";

export function LegStatistics({leg, home, away, legNumber, singlePlayer, oneDartAverage}) {
    const homeStats = leg.home;
    const awayStats = leg.away;
    const [showThrows, setShowThrows] = useState(false);
    const [showAverage, setShowAverage] = useState(false);

    if (homeStats.noOfDarts + awayStats.noOfDarts === 0) {
        return null;
    }

    function getLegStatistics(throws) {
        let score = 0;
        let noOfDarts = 0;

        return throws.map(thr => {
            score += thr.bust ? 0 : thr.score;
            noOfDarts += thr.noOfDarts;
            const threeDartAverage = score / (noOfDarts / 3);

            return {
                thisScore: thr.score,
                thisNoOfDarts: thr.noOfDarts,
                bust: thr.bust,
                totalScore: score,
                noOfDarts: noOfDarts,
                remaining: leg.startingScore - score,
                threeDartRunningAverage: threeDartAverage,
                oneDartRunningAverage: threeDartAverage / 3,
                checkout: score === leg.startingScore && !thr.bust,
            };
        });
    }

    function renderThrows(throws) {
        if (isEmpty(throws)) {
            return (<p>No throws</p>);
        }

        const legStatistics = getLegStatistics(throws);

        return (<table className="table-sm">
            <thead>
            <tr>
                <th>Threw</th>
                <th>Score</th>
                <th>{showAverage ? 'Avg' : 'Darts'}</th>
            </tr>
            </thead>
            <tbody>
            {legStatistics.map((stats, index) => <tr key={index} className={stats.checkout ? 'bg-winner' : ''}>
                <td className={`${stats.bust ? ' text-decoration-line-through' : ''}${stats.thisScore >= 100 ? ' text-danger' : ''}${stats.thisScore === 180 ? ' fw-bold' : ''}`}>
                    {stats.thisScore}
                </td>
                <td>{stats.remaining}</td>
                <td>
                    {showAverage
                        ? (oneDartAverage ? round2dp(stats.oneDartRunningAverage) : round2dp(stats.threeDartRunningAverage))
                        : stats.thisNoOfDarts}
                </td>
            </tr>)}
            </tbody>
        </table>);
    }

    function toggleShowAverage() {
        setShowAverage(!showAverage);
    }

    return (<tr>
        <td>
            Leg: {legNumber}<br/>
            {leg.winner && !singlePlayer
                ? (<>Winner: <strong className="text-primary">{leg.winner === 'home' ? home : away}</strong></>)
                : null}
            <div className="form-check form-switch margin-right">
                <input className="form-check-input" type="checkbox" id={`showThrows_${legNumber}`}
                       checked={showThrows} onChange={stateChanged(setShowThrows)}/>
                <label className="form-check-label small" htmlFor={`showThrows_${legNumber}`}>Details</label>
            </div>
            {showThrows ? (<button className="btn btn-sm btn-outline-primary margin-right" onClick={toggleShowAverage}>
                {showAverage ? (<span>Click to show <strong>No. of darts</strong></span>) : null}
                {!showAverage ? (<span>Click to show <strong>running average</strong></span>) : null}
            </button>) : null}
        </td>
        <td className={leg.winner === 'home' ? 'bg-winner' : ''}>
            Average: <strong>{round2dp(homeStats.score / (homeStats.noOfDarts / 3) / (oneDartAverage ? 3 : 1))}</strong> ({homeStats.noOfDarts} darts)<br/>
            {leg.winner === 'home'
                ? (<div>Checkout: <strong>{leg.home.throws[leg.home.throws.length - 1].score}</strong></div>)
                : (<div>Remaining: <strong>{leg.startingScore - homeStats.score}</strong></div>)}
            {showThrows ? (renderThrows(leg.home.throws)) : null}
        </td>
        {singlePlayer ? null : (<td className={leg.winner === 'away' ? 'bg-winner' : ''}>
            Average: <strong>{round2dp(awayStats.score / (awayStats.noOfDarts / 3) / (oneDartAverage ? 3 : 1))}</strong> ({awayStats.noOfDarts} darts)<br/>
            {leg.winner === 'away'
                ? (<div>Checkout: <strong>{leg.away.throws[leg.away.throws.length - 1].score}</strong></div>)
                : (<div>Remaining: <strong>{leg.startingScore - awayStats.score}</strong></div>)}
            {showThrows ? (renderThrows(leg.away.throws)) : null}
        </td>)}
    </tr>);
}