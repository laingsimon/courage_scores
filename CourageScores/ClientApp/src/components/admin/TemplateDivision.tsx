import {SharedAddresses} from "./SharedAddresses";
import {TemplateDates} from "./TemplateDates";
import {useState} from "react";
import {IDivisionTemplateDto} from "../../interfaces/serverSide/Season/Creation/IDivisionTemplateDto";
import {IDateTemplateDto} from "../../interfaces/serverSide/Season/Creation/IDateTemplateDto";

export interface ITemplateDivisionProps {
    divisionNo: number;
    division: IDivisionTemplateDto;
    onUpdate: (update: IDivisionTemplateDto) => Promise<any>;
    onDelete: () => Promise<any>;
    templateSharedAddresses: string[];
}

export function TemplateDivision({ divisionNo, division, onUpdate, onDelete, templateSharedAddresses }: ITemplateDivisionProps) {
    const [ expanded, setExpanded ] = useState<boolean>(true);

    async function updateSharedAddresses(updatedAddresses: string[][]) {
        const newDivision: IDivisionTemplateDto = Object.assign({}, division);
        newDivision.sharedAddresses = updatedAddresses;
        await onUpdate(newDivision);
    }

    async function updateDates(updatedDates: IDateTemplateDto[]) {
        const newDivision: IDivisionTemplateDto = Object.assign({}, division);
        newDivision.dates = updatedDates;
        await onUpdate(newDivision);
    }

    return (<div>
        <h6 title="Click to expand/collapse"
            className="hover-highlight py-1"
            onClick={() => setExpanded(!expanded)}>
            {expanded ? '⬆️' : '⬇️'} Division {divisionNo}
            {expanded ? ' (click to collapse)' : ' (click to expand)'}
        </h6>
        {expanded ? (<SharedAddresses
            addresses={division.sharedAddresses}
            onUpdate={updateSharedAddresses}
            className="bg-secondary" />) : null}
        {expanded ? (<TemplateDates
            dates={division.dates}
            onUpdate={updateDates}
            divisionSharedAddresses={division.sharedAddresses.flatMap((a: string[]) => a)}
            templateSharedAddresses={templateSharedAddresses} />) : null}
        {expanded ? (<button className="btn btn-sm btn-outline-danger float-end" onClick={onDelete}>🗑️ Remove division</button>) : null}
    </div>);
}