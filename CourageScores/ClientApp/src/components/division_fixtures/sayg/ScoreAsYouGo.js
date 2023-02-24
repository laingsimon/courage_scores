import {PlayLeg} from "./PlayLeg";
import {MatchStatistics} from "./MatchStatistics";

export function ScoreAsYouGo({ data, home, away, onChange, onLegComplete, startingScore, numberOfLegs, awayScore, homeScore, on180, onHiCheck }) {
    function getLeg(legIndex) {
        const leg = data.legs[legIndex];
        if (leg) {
            return leg;
        }

        return addLeg(legIndex).legs[legIndex];
    }

    function addLeg(legIndex) {
        const newData = Object.assign({}, data);
        newData.legs[legIndex] = {
            playerSequence: null,
            home: { throws: [], score: 0, noOfDarts: 0 },
            away: { throws: [], score: 0, noOfDarts: 0 },
            startingScore: startingScore,
            isLastLeg: legIndex === numberOfLegs - 1
        };
        return newData;
    }

    function legChanged(newLeg, legIndex) {
        const newData = Object.assign({}, data);
        newData.legs[legIndex] = newLeg;
        onChange(newData);
    }

    async function recordWinner(winnerName) {
        const newHomeScore = winnerName === 'home' ? homeScore + 1 : (homeScore || 0);
        const newAwayScore = winnerName === 'away' ? awayScore + 1 : (awayScore || 0);

        const currentLegIndex = (homeScore || 0) + (awayScore || 0);
        const currentLeg = data.legs[currentLegIndex];

        if (!currentLeg.isLastLeg) {
            const newData = addLeg(currentLegIndex + 1);
            const newLeg = newData.legs[currentLegIndex + 1];

            newLeg.playerSequence = [ currentLeg.playerSequence[1], currentLeg.playerSequence[0] ];
            newLeg.currentThrow = newLeg.playerSequence[0].value;
            onChange(newData);
        }

        await onLegComplete(newHomeScore, newAwayScore);
    }

    const legIndex = (homeScore || 0) + (awayScore || 0);
    if ((legIndex === numberOfLegs || (homeScore > numberOfLegs / 2.0) || (awayScore > numberOfLegs / 2.0))) {
        return <MatchStatistics legs={data.legs} awayScore={awayScore} homeScore={homeScore} home={home} away={away} />
    }

    const leg = getLeg(legIndex);

    return (<PlayLeg
        leg={leg}
        home={home}
        away={away}
        onChange={(newLeg) => legChanged(newLeg, legIndex)}
        onLegComplete={recordWinner}
        on180={on180}
        onHiCheck={onHiCheck}
        homeScore={homeScore}
        awayScore={awayScore} />);
}
