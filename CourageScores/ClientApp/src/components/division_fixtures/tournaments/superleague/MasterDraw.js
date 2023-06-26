import {useApp} from "../../../../AppContainer";
import {useTournament} from "../TournamentContainer";

export function MasterDraw() {
    const { tournamentData } = useTournament();
    const { onError } = useApp();
    const round = tournamentData.round || {};
    const matches = round.matches || [];

    try {
        return (<div className="page-break-after">
            <h3>Master draw</h3>
            <table className="table">
                <thead>
                <tr>
                    <th>#</th>
                    <th>{tournamentData.host}</th>
                    <th>v</th>
                    <th>{tournamentData.opponent}</th>
                </tr>
                </thead>
                <tbody>
                {matches.map((m, index) => {
                    return (<tr key={index}>
                        <td>{index + 1}</td>
                        <td>{m.sideA.name}</td>
                        <td>v</td>
                        <td>{m.sideB.name}</td>
                    </tr>);
                })}
                </tbody>
            </table>
        </div>);
    } catch (e) {
        onError(e);
    }
}