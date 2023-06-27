import {useApp} from "../../../../AppContainer";
import {renderDate} from "../../../../helpers/rendering";

export function MasterDraw({ matches, host, opponent, gender, date, notes }) {
    const { onError } = useApp();

    try {
        return (<div className="page-break-after">
            <h2>Master draw</h2>
            <div className="d-flex flex-row">
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
                    <div>Gender: <span className="fw-bold">{gender}</span></div>
                    <div>Date: <span className="fw-bold">{renderDate(date)}</span></div>
                    {notes ? (<div>Notes: <span className="fw-bold">{notes}</span></div>) : null}
                </div>
            </div>
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}