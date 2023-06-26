import {useApp} from "../../../../AppContainer";
import {useTournament} from "../TournamentContainer";
import {renderDate} from "../../../../helpers/rendering";

export function MasterDraw() {
    const { tournamentData } = useTournament();
    const { onError } = useApp();
    const round = tournamentData.round || {};
    const matches = round.matches || [];

    try {
        return (<div className="page-break-after">
            <h3>Master draw</h3>
            <div className="d-flex flex-row">
                <div>
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
                </div>
                <div className="px-5">
                    <div>Gender: <span className="fw-bold">{tournamentData.gender}</span></div>
                    <div>Date: <span className="fw-bold">{renderDate(tournamentData.date)}</span></div>
                    {tournamentData.notes ? (<div>Notes: <span className="fw-bold">{tournamentData.notes}</span></div>) : null}
                </div>
            </div>
        </div>);
    } catch (e) {
        onError(e);
    }
}