import {PlayLeg} from "./PlayLeg";
import {MatchStatistics} from "./MatchStatistics";
import {useApp} from "../../../AppContainer";

export function ScoreAsYouGo({ data, home, away, onChange, onLegComplete, startingScore, numberOfLegs, awayScore,
                                 homeScore, on180, onHiCheck, singlePlayer }) {
    const { onError } = useApp();

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
            playerSequence: singlePlayer ? [ { value: 'home', text: home }, { value: 'away', text: 'unused-single-player' } ] : null,
            home: { throws: [], score: 0, noOfDarts: 0 },
            away: { throws: [], score: 0, noOfDarts: 0 },
            startingScore: startingScore,
            isLastLeg: legIndex === numberOfLegs - 1,
            currentThrow: singlePlayer ? 'home' : null
        };
        return newData;
    }

    async function legChanged(newLeg, legIndex) {
        const newData = Object.assign({}, data);
        if (data.legs) {
            newData.legs = Object.assign({}, data.legs);
        }
        newData.legs[legIndex] = newLeg;
        await onChange(newData);
    }

    async function recordWinner(winnerName) {
        try {
            const newHomeScore = winnerName === 'home' ? homeScore + 1 : (homeScore || 0);
            const newAwayScore = winnerName === 'away' ? awayScore + 1 : (awayScore || 0);

            const currentLegIndex = (homeScore || 0) + (awayScore || 0);
            const currentLeg = data.legs[currentLegIndex];

            const unbeatable = newHomeScore > (numberOfLegs / 2) || newAwayScore > (numberOfLegs > 2);
            if (!currentLeg.isLastLeg && !unbeatable) {
                const newData = addLeg(currentLegIndex + 1);
                const newLeg = newData.legs[currentLegIndex + 1];

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

    const legIndex = (homeScore || 0) + (awayScore || 0);
    if ((singlePlayer && homeScore === numberOfLegs) || (!singlePlayer && (legIndex === numberOfLegs || (homeScore > numberOfLegs / 2.0) || (awayScore > numberOfLegs / 2.0)))) {
        return <MatchStatistics
            legs={data.legs}
            awayScore={awayScore}
            homeScore={homeScore}
            home={home}
            away={away}
            singlePlayer={singlePlayer} />
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
        awayScore={awayScore}
        singlePlayer={singlePlayer} />);
}
