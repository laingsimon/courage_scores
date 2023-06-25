import {useApp} from "../../../../AppContainer";
import {getNoOfLegs, getNoOfThrows} from "../../../../helpers/superleague";
import {repeat} from "../../../../helpers/projection";
import {MatchReportRow} from "./MatchReportRow";

export function MatchReport({ tournamentData, fixture, saygDataMap, division }) {
    const { onError } = useApp();
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

    try {
        return (<div className="page-break-after">
            <h2 className="text-center">SOMERSET DARTS ORGANISATION</h2>
            <h3 className="text-center">{division.name}</h3>
            <table className="table">
                <thead>
                <tr>
                    <th colSpan={15+(noOfThrows * 2)} className="text-center">
                        <span className="pe-5 fs-5">{fixture.home}</span>
                        <span className="mx-5 fs-5">v</span>
                        <span className="ps-5 fs-5">{fixture.away}</span>
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
                <tfoot>
                <tr>
                    <td></td>
                    <td colSpan={7+noOfThrows} className="text-center">Legs won: ??</td>
                    <td colSpan={6+noOfThrows} className="text-center">Legs won: ??</td>
                </tr>
                </tfoot>
            </table>
        </div>);
    } catch (e) {
        onError(e);
    }
}
