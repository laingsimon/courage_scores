import {useApp} from "../../../../AppContainer";
import {getNoOfLegs, getNoOfThrows} from "../../../../helpers/superleague";
import {repeat} from "../../../../helpers/projection";
import {MatchReportRow} from "./MatchReportRow";
import {sum} from "../../../../helpers/collections";
import {useTournament} from "../TournamentContainer";

export function MatchReport({ saygDataMap, division }) {
    const { onError } = useApp();
    const { tournamentData } = useTournament();
    const round = tournamentData.round || {};
    const matches = round.matches || [];
    const noOfThrows = getNoOfThrows(matches, saygDataMap) + 1;
    const noOfLegs = tournamentData.bestOf || getMaxNoOfLegs(saygDataMap);

    function getMaxNoOfLegs(saygDataMap) {
        let max = 0;

        for (let id in saygDataMap) {
            const saygData = saygDataMap[id];
            max = Math.max(max, getNoOfLegs(saygData));
        }

        return max;
    }

    function legsWon(side) {
        return sum(matches, match => {
            const saygData = saygDataMap[match.saygId];
            if (!saygData || !saygData.legs) {
                return 0;
            }

            // no of legs won in this match
            let won = 0;
            for (let legIndex in saygData.legs) {
                const leg = saygData.legs[legIndex];
                const accumulator = leg[side];
                const winnerByScore = sum(accumulator.throws, thr => thr.score) === leg.startingScore;

                if (leg.winner === side || winnerByScore) {
                    won++;
                }
            }
            return won;
        })
    }

    try {
        return (<div className="page-break-after">
            <h2 className="text-center">SOMERSET DARTS ORGANISATION</h2>
            <h3 className="text-center">{division.name} ({tournamentData.gender})</h3>
            <table className="table">
                <thead>
                <tr>
                    <th colSpan={15+(noOfThrows * 2)} className="text-center">
                        <span className="pe-5 fs-5">{tournamentData.host}</span>
                        <span className="mx-5 fs-5">v</span>
                        <span className="ps-5 fs-5">{tournamentData.opponent}</span>
                    </th>
                </tr>
                <tr>
                    <th colSpan="4"></th>
                    <th colSpan={noOfThrows}>Scores</th>
                    <th colSpan="4"></th>
                    <th colSpan="3"></th>
                    <th colSpan={noOfThrows}>Scores</th>
                    <th colSpan="4"></th>
                </tr>
                <tr>
                    <th>Set</th>
                    <th>Ave</th>
                    <th>Players Name</th>
                    <th>Leg</th>
                    {repeat(noOfThrows, i => <th key={`sideA_throwHeading_${i}`}>{i + 1}</th>)}
                    <th>AD</th>
                    <th>GS</th>
                    <th>SL</th>
                    <th>Tons</th>
                    <th>Ave</th>
                    <th>Players Name</th>
                    {repeat(noOfThrows, i => <th key={`sideB_throwHeading_${i}`}>{i + 1}</th>)}
                    <th>AD</th>
                    <th>GS</th>
                    <th>SL</th>
                    <th>Tons</th>
                </tr>
                </thead>
                <tbody>
                {matches.map((match, matchIndex) => {
                    const saygData = saygDataMap[match.saygId];
                    return (<MatchReportRow key={matchIndex} matchIndex={matchIndex} noOfLegs={noOfLegs} match={match} saygData={saygData} noOfThrows={noOfThrows} />);
                })}
                </tbody>
            </table>
            <div className="d-flex flex-row justify-content-around">
                <div className="p-5 text-center">Legs won: {legsWon('home')}</div>
                <div className="p-5 text-center">Legs won: {legsWon('away')}</div>
            </div>
        </div>);
    } catch (e) {
        onError(e);
    }
}
