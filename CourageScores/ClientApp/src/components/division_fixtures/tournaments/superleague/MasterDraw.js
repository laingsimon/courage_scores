export function MasterDraw({ tournamentData, fixture }) {
    const round = tournamentData.round || {};
    const matches = round.matches || [];

    return (<div className="page-break-after">
        <h3>Master draw</h3>
        <table className="table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>{fixture.home}</th>
                    <th>v</th>
                    <th>{fixture.away}</th>
                </tr>
            </thead>
            <tbody>
            {matches.map((m, index) => {
                return (<tr key={index}>
                    <td>{index+1}</td>
                    <td>{m.sideA.name}</td>
                    <td>v</td>
                    <td>{m.sideB.name}</td>
                </tr>);
            })}
            </tbody>
        </table>
    </div>);
}