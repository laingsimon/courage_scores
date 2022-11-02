import React from 'react';
import {useParams} from "react-router-dom";

export function DivisionFixtures(props) {
    const {divisionId} = useParams();
    const divisionData = props.divisionData[divisionId];

    return (<div className="light-background p-3">{
        divisionData.fixtureDates.map(date => (<div key={date.date}>
       <h4>{new Date(date.date).toDateString()}</h4>
       <table className="table">
          <tbody>
             {date.fixtures.map(f => (<tr key={f.id}>
                   <td>{f.homeTeam}</td>
                   <td>{f.homeScore}</td>
                   <td>vs</td>
                   <td>{f.awayTeam}</td>
                   <td>{f.awayScore}</td>
                </tr>))}
          </tbody>
       </table>
    </div>))}</div>);
}
