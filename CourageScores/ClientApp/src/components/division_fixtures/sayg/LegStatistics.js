import {isEmpty, repeat, round2dp, stateChanged} from "../../../Utilities";
import React, {useState} from "react";

export function LegStatistics({ leg, home, away, legNumber, singlePlayer }) {
    const homeStats = leg.home;
    const awayStats = leg.away;
    const [showThrows, setShowThrows] = useState(false);
    const [showMetric, setShowMetric] = useState('throw');
    const [showAverage, setShowAverage] = useState(false);

    if (homeStats.noOfDarts + awayStats.noOfDarts === 0) {
        return null;
    }

    function renderThrows(throws) {
        let index = 0;
        let score = 0;
        let noOfDarts = 0;

        if (isEmpty(throws)) {
            return (<p>No throws</p>);
        }

        return (<ol>
            {throws.map(legThrow => {
                const newScore = score + legThrow.score;
                const bust = newScore > leg.startingScore || newScore === leg.startingScore - 1 || legThrow.bust;
                noOfDarts += legThrow.noOfDarts;
                if (!bust) {
                    score = newScore;
                }
                const runningAverage = score / (noOfDarts / 3);

                return (<li key={index++} title={`Running score: ${leg.startingScore - score}`}>
                    {showMetric === 'throw' ? legThrow.score : null}
                    {showMetric === 'remaining' ? leg.startingScore - score : null}
                    {showAverage ? (<span> (avg {round2dp(runningAverage)})</span>) : null}
                    {bust ? (<span className="opacity-25 float-end" key={index}>💥</span>) : null}
                    {!showAverage && repeat(legThrow.noOfDarts, (index) => (<span className="opacity-25 float-end" key={index}>📌</span>))}
                </li>);
            })}
        </ol>);
    }

    return (<tr>
        <td>
            Leg: {legNumber}<br />
            Winner: <strong className="text-primary">{leg.winner === 'home' ? home : away}</strong>
            <div className="form-check form-switch margin-right">
                <input className="form-check-input" type="checkbox" id={`showThrows_${legNumber}`}
                       checked={showThrows} onChange={stateChanged(setShowThrows)}/>
                <label className="form-check-label" htmlFor={`showThrows_${legNumber}`}>🔍</label>
            </div>
            {showThrows ? (<div className="form-check form-switch margin-right">
                <input className="form-check-input" type="checkbox" id={`metric_${legNumber}`}
                       checked={showMetric === 'throw'} onChange={(event) => setShowMetric(event.target.checked ? 'throw' : 'remaining')}/>
                <label className="form-check-label" htmlFor={`metric_${legNumber}`}>
                    {showMetric === 'throw' ? '🧭' : '📉'}
                </label>
            </div>) : null}
            {showThrows ? (<div className="form-check form-switch margin-right">
                <input className="form-check-input" type="checkbox" id={`average_${legNumber}`}
                       checked={showAverage} onChange={(event) => setShowAverage(event.target.checked)}/>
                <label className="form-check-label" htmlFor={`average_${legNumber}`}>
                   {showAverage ? '📊' : '📌'}
                </label>
             </div>) : null}
        </td>
        <td className={leg.winner === 'home' ? 'bg-winner' : ''}>
            Average: <strong>{round2dp(homeStats.score / (homeStats.noOfDarts / 3))}</strong> ({homeStats.noOfDarts} darts)<br />
            {leg.winner === 'home'
                ? (<div>Checkout: <strong>{leg.home.throws[leg.home.throws.length - 1].score}</strong></div>)
                : (<div>Remaining: <strong>{leg.startingScore - homeStats.score}</strong></div>)}
            {showThrows ? (renderThrows(leg.home.throws)) : null}
        </td>
        {singlePlayer ? null : (<td className={leg.winner === 'away' ? 'bg-winner' : ''}>
            Average: <strong>{round2dp(awayStats.score / (awayStats.noOfDarts / 3))}</strong> ({awayStats.noOfDarts} darts)<br />
            {leg.winner === 'away'
                ? (<div>Checkout: <strong>{leg.away.throws[leg.away.throws.length - 1].score}</strong></div>)
                : (<div>Remaining: <strong>{leg.startingScore - awayStats.score}</strong></div>)}
            {showThrows ? (renderThrows(leg.away.throws)) : null}
        </td>)}
    </tr>);
}