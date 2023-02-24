import {round2dp} from "../../../Utilities";

export function PreviousPlayerScore({ home, away, leg, undoLastThrow }) {
    const oppositePlayer = opposite(leg.currentThrow);
    const accumulator = leg[oppositePlayer];
    const lastThrow = accumulator.throws[accumulator.throws.length - 1];
    const playerLookup = {
        home: home,
        away: away
    }

    function opposite(player) {
        return player === 'home' ? 'away' : 'home';
    }

    if (!leg[oppositePlayer].score) {
        return null;
    }

    async function changeScore() {
        if (!window.confirm('Are you sure you want to change this score?')) {
            return;
        }

        await undoLastThrow();
    }

    return (<div className="text-secondary-50 text-center">
        <p className="my-0">
            <strong>{playerLookup[oppositePlayer]} </strong> requires <strong className="text-dark">{leg.startingScore - accumulator.score}</strong>
        </p>
        <p className="my-0" onClick={changeScore} title="Click to change score">
            thrown <strong>{accumulator.noOfDarts}</strong> darts
            {accumulator.noOfDarts ? (<span>, average: <strong>{round2dp(accumulator.score / (accumulator.noOfDarts / 3))}</strong>
                </span>) : null}
        </p>
        <p className="my-0" onClick={changeScore} title="Click to change score">
            Last score: <strong className="text-dark">{lastThrow.score}</strong>
            {accumulator.bust ? (<strong> 💥 </strong>) : null}
        </p>
        <hr />
    </div>);
}