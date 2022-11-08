import React from 'react';
import {Link, useParams} from "react-router-dom";

export function DivisionFixtures(props) {
    const {divisionId} = useParams();
    const divisionData = props.divisionData[divisionId];
    const account = props.account;
    const isAdmin = account && account.access && account.access.leagueAdmin;

    return (<div className="light-background p-3">{
        divisionData.fixtures.map(date => (<div key={date.date}>
       <h4>{new Date(date.date).toDateString()}</h4>
       <table className="table">
          <tbody>
             {date.fixtures.map(f => (<tr key={f.id}>
                   <td>{f.homeTeam}</td>
                   <td>{f.homeScore}</td>
                   <td>vs</td>
                   <td>{f.awayTeam || 'Bye'}</td>
                   <td>{f.awayScore}</td>
                   <td>{f.awayTeam ? <Link to={`/score/${f.id}`}>{isAdmin ? 'Edit' : 'View'}</Link> : null}</td>
                </tr>))}
          </tbody>
       </table>
    </div>))}</div>);
}
