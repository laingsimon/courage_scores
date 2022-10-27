import React from 'react';
import {useParams} from "react-router-dom";

export function DivisionPlayers(props) {
    const {divisionId} = useParams();
    const division = props.divisions[divisionId];

    return (<div>
        Players...
    </div>);
}
