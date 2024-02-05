import {useApp} from "../../common/AppContainer";
import {legsWon} from "../../../helpers/superleague";
import {repeat} from "../../../helpers/projection";
import {MatchReportRow} from "./MatchReportRow";
import {ISuperleagueSaygMatchMapping} from "./ISuperleagueSaygMatchMapping";
import {DivisionDto} from "../../../interfaces/models/dtos/DivisionDto";

export interface IMatchReportProps {
    division: DivisionDto;
    showWinner: boolean;
    noOfThrows: number;
    noOfLegs: number;
    gender: string;
    host: string;
    opponent: string;
    saygMatches: ISuperleagueSaygMatchMapping[];
}

export function MatchReport({division, showWinner, noOfThrows, noOfLegs, gender, host, opponent, saygMatches}: IMatchReportProps) {
    const {onError} = useApp();

    try {
        return (<div className="page-break-after" datatype="match-report">
            <h2 className="text-center">SOMERSET DARTS ORGANISATION</h2>
            <h3 className="text-center">{division.name} ({gender})</h3>
            <table className="table">
                <thead>
                <tr>
                    <th colSpan={15 + ((noOfThrows + 1) * 2)} className="text-center">
                        <span className="pe-5 fs-5">{host}</span>
                        <span className="mx-5 fs-5">v</span>
                        <span className="ps-5 fs-5">{opponent}</span>
                    </th>
                </tr>
                <tr>
                    <th colSpan={4}></th>
                    <th colSpan={noOfThrows + 1}>Scores</th>
                    <th colSpan={4}></th>
                    <th colSpan={2}></th>
                    <th colSpan={noOfThrows + 1}>Scores</th>
                    <th colSpan={4}></th>
                </tr>
                <tr>
                    <th>Set</th>
                    <th>Ave</th>
                    <th>Players Name</th>
                    <th>Leg</th>
                    {repeat(noOfThrows + 1, i => <th key={`sideA_throwHeading_${i}`}>{i + 1}</th>)}
                    <th>AD</th>
                    <th>GS</th>
                    <th>SL</th>
                    <th>Tons</th>
                    <th>Ave</th>
                    <th>Players Name</th>
                    {repeat(noOfThrows + 1, i => <th key={`sideB_throwHeading_${i}`}>{i + 1}</th>)}
                    <th>AD</th>
                    <th>GS</th>
                    <th>SL</th>
                    <th>Tons</th>
                </tr>
                </thead>
                <tbody>
                {saygMatches.map((map: ISuperleagueSaygMatchMapping, matchIndex: number) => {
                    return (<MatchReportRow
                        key={matchIndex}
                        showWinner={showWinner}
                        matchIndex={matchIndex}
                        noOfLegs={noOfLegs}
                        saygData={map.saygData}
                        noOfThrows={noOfThrows}
                        hostPlayerName={map.match.sideA!.name}
                        opponentPlayerName={map.match.sideB!.name}/>);
                })}
                </tbody>
            </table>
            <div className="d-flex flex-row justify-content-around">
                <div className="p-5 text-center">Legs won: {legsWon(saygMatches, 'home')}</div>
                <div className="p-5 text-center">Legs won: {legsWon(saygMatches, 'away')}</div>
            </div>
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
