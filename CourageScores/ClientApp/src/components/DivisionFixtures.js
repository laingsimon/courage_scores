import React from 'react';
import {DivisionFixture} from "./DivisionFixture";

export function DivisionFixtures(props) {
    const divisionData = props.divisionData;

    return (<div className="light-background p-3">{
        divisionData.fixtures.map(date => (<div key={date.date}>
       <h4>{new Date(date.date).toDateString()}</h4>
       <table className="table">
          <tbody>
             {date.fixtures.map(f => (<DivisionFixture key={f.id} {...props} fixture={f} date={date.date} />))}
          </tbody>
       </table>
    </div>))}</div>);
}
