import React from 'react';
import {useParams} from "react-router-dom";

export function DivisionFixtures(props) {
    const {divisionId} = useParams();
    const divisionData = props.divisionData[divisionId];

    if (!divisionData) {
        props.apis.reloadDivision(divisionId); // don't await the async?
        return (<div>Loading division data</div>);
    }

    if (!divisionData.fixtureDates) {
        return (<div>No fixtures found</div>);
    }

    return (<div className="light-background">{
        divisionData.fixtureDates.map(date => (<div key={date.date}>
       <h4>{date.date}</h4>
       <table>
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
