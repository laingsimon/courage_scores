import React from 'react';
import {useParams} from "react-router-dom";

export function DivisionFixtures(props) {
    const {divisionId} = useParams();
    const division = props.divisions[divisionId];

    return (<div>
        Fixtures...
    </div>);
}
