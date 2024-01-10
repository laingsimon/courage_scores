import {SharedAddresses} from "./SharedAddresses";
import {TemplateDates} from "./TemplateDates";
import {useState} from "react";

export function TemplateDivision({ divisionNo, division, onUpdate, onDelete, templateSharedAddresses }) {
    const [ expanded, setExpanded ] = useState(true);

    function updateSharedAddresses(updatedAddresses) {
        const newDivision = Object.assign({}, division);
        newDivision.sharedAddresses = updatedAddresses;
        onUpdate(newDivision);
    }

    function updateDates(updatedDates) {
        const newDivision = Object.assign({}, division);
        newDivision.dates = updatedDates;
        onUpdate(newDivision);
    }

    return (<div>
        <h6 title="Click to expand/collapse"
            className="hover-highlight py-1"
            onClick={() => setExpanded(!expanded)}>
            {expanded ? '⬆️' : '⬇️'} Division {divisionNo}
            {expanded ? ' (click to collapse)' : ' (click to expand)'}
        </h6>
        {expanded ? (<SharedAddresses addresses={division.sharedAddresses} onUpdate={updateSharedAddresses} className="bg-secondary" />) : null}
        {expanded ? (<TemplateDates
            dates={division.dates}
            onUpdate={updateDates}
            divisionSharedAddresses={division.sharedAddresses.flatMap(a => a)}
            templateSharedAddresses={templateSharedAddresses} />) : null}
        {expanded ? (<button className="btn btn-sm btn-outline-danger float-end" onClick={onDelete}>🗑️ Remove division</button>) : null}
    </div>);
}