import {useApp} from "../../common/AppContainer";
import {renderDate} from "../../../helpers/rendering";
import {TournamentMatchDto} from "../../../interfaces/models/dtos/Game/TournamentMatchDto";
import {Dialog} from "../../common/Dialog";
import {TournamentDetails} from "../TournamentDetails";
import {TournamentGameDto} from "../../../interfaces/models/dtos/Game/TournamentGameDto";
import {useTournament} from "../TournamentContainer";

export interface IMasterDrawProps {
    matches: TournamentMatchDto[];
    host: string;
    opponent: string;
    gender: string;
    date: string;
    notes: string;
}

export function MasterDraw({matches, host, opponent, gender, date, notes}: IMasterDrawProps) {
    const {onError} = useApp();
    const {tournamentData, setTournamentData, saving, editTournament, setEditTournament } = useTournament();

    try {
        return (<div className="page-break-after" datatype="master-draw">
            <h2 onClick={setEditTournament ? async () => await setEditTournament(true) : null}>Master draw</h2>
            <div className="d-flex flex-row" onClick={setEditTournament ? async () => await setEditTournament(true) : null}>
                <div>
                    <table className="table">
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>{host}</th>
                            <th>v</th>
                            <th>{opponent}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {matches.map((m: TournamentMatchDto, index: number) => {
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
                    <div>Gender: <span className="fw-bold">{gender}</span></div>
                    <div>Date: <span className="fw-bold">{renderDate(date)}</span></div>
                    {notes ? (<div>Notes: <span className="fw-bold">{notes}</span></div>) : null}
                </div>
            </div>
            {editTournament
                ? (<Dialog title="Edit tournament details" onClose={async () => await setEditTournament(false)}>
                    <TournamentDetails
                        tournamentData={tournamentData}
                        disabled={saving}
                        setTournamentData={async (data: TournamentGameDto) => setTournamentData(data)} />
                </Dialog>)
                : null}
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}