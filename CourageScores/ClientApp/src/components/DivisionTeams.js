import React from 'react';
import {useParams} from "react-router-dom";

export function DivisionTeams(props) {
    const {divisionId} = useParams();
    const divisionData = props.divisionData[divisionId];

    if (!divisionData) {
        props.apis.reloadDivision(divisionId); // don't await the async?
        return (<div>Loading division data</div>);
    }

    return (<div>
        {JSON.stringify(divisionData.teams)}
    </div>);
}
