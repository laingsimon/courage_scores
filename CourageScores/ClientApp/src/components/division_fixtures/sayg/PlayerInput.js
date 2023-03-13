import {round2dp, stateChanged} from "../../../Utilities";
import {useState} from "react";

export function PlayerInput({ home, away, homeScore, awayScore, on180, onHiCheck, onChange, onLegComplete, leg, singlePlayer }) {
    const [ score, setScore ] = useState('');
    const accumulator = leg.currentThrow ? leg[leg.currentThrow] : null;
    const remainingScore = accumulator ? leg.startingScore - accumulator.score : -1;

    const playerLookup = {
        home: home,
        away: away
    }

    async function keyUp(event) {
        if (event.key === 'Enter') {
            await addThrow(score, 3);
            return false;
        }
    }

    function opposite(player) {
        return player === 'home' ? 'away' : 'home';
    }

    async function addThrow(scoreInput, noOfDarts) {
        const score = Number.parseInt(scoreInput);
        if (!Number.isFinite(score)) {
            window.alert('Invalid score');
            return;
        }

        const accumulatorName = leg.currentThrow;
        const newLeg = Object.assign({}, leg);
        const accumulator = newLeg[accumulatorName];
        accumulator.throws.push({
            score,
            noOfDarts,
        });

        accumulator.noOfDarts += noOfDarts;
        accumulator.bust = false;

        const remainingScore = leg.startingScore - (accumulator.score + score);
        if ((remainingScore !== 0 && remainingScore <= 1) || (remainingScore === 0 && score % 2 !== 0 && noOfDarts === 1)) {
            accumulator.bust = true;
            // bust
        } else {
            accumulator.score += score;

            if (score === 180) {
                // Assume these don't count if the score is bust, as it was by accident, not design
                if (on180) {
                    await on180(accumulatorName);
                }
            }

            if (accumulator.score === leg.startingScore) {
                // checked out
                newLeg.winner = accumulatorName;

                if (score >= 100) {
                    // hicheck
                    if (onHiCheck) {
                        await onHiCheck(accumulatorName, score);
                    }
                }
            }
        }

        newLeg.currentThrow = singlePlayer
            ? newLeg.currentThrow
            : opposite(accumulatorName);
        await onChange(newLeg);

        if (newLeg.winner) {
            await onLegComplete(accumulatorName);
        }

        setScore('');
    }

    return (<div className="text-center">
        <h4>
            <strong>{playerLookup[leg.currentThrow]} </strong> requires <strong className="text-primary">{leg.startingScore - accumulator.score}</strong>
        </h4>
        {singlePlayer ? (<h5>Leg {homeScore + 1}</h5>) : (<h5>{homeScore} - {awayScore}</h5>)}
        {accumulator.noOfDarts ? (<p>
            thrown
            <strong> {accumulator.noOfDarts} </strong>
            darts, average: <strong>{round2dp(accumulator.score / (accumulator.noOfDarts / 3))}</strong>
        </p>) : null}
        <h4>
            <label>
                <span className="margin-right">Score</span>
                <input autoFocus type="number" min="1" max="180" className="no-spinner margin-right width-50" value={score} onChange={stateChanged(setScore)} onKeyUp={keyUp} />
            </label>
        </h4>
        <p className="my-3">
            {remainingScore <= 60
                ? (<button className="btn btn-primary margin-right" onClick={() => addThrow(score, 1)}>📌</button>)
                : (<button className="btn btn-secondary margin-right" disabled>📌</button>)}
            {remainingScore <= 120
                ? (<button className="btn btn-primary margin-right" onClick={() => addThrow(score, 2)}>📌📌</button>)
                : (<button className="btn btn-secondary margin-right" disabled>📌📌</button>)}
            <button className="btn btn-primary margin-right" onClick={() => addThrow(score, 3)}>📌📌📌</button>
        </p>
    </div>);
}
