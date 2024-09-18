import {SharedAddresses} from "./SharedAddresses";
import {TemplateDates} from "./TemplateDates";
import {useState} from "react";
import {DivisionTemplateDto} from "../../interfaces/models/dtos/Season/Creation/DivisionTemplateDto";
import {DateTemplateDto} from "../../interfaces/models/dtos/Season/Creation/DateTemplateDto";

export interface ITemplateDivisionProps {
    divisionNo: number;
    division: DivisionTemplateDto;
    onUpdate(update: DivisionTemplateDto): Promise<any>;
    onCopyToDivision(destinationDivisionIndex: number): Promise<any>;
    onDelete(): Promise<any>;
    templateSharedAddresses: string[];
    divisionCount: number;
    highlight?: string;
    setHighlight(highlight?: string): Promise<any>;
}

export function TemplateDivision({ divisionNo, division, onUpdate, onDelete, templateSharedAddresses, divisionCount, onCopyToDivision, highlight, setHighlight }: ITemplateDivisionProps) {
    const [ expanded, setExpanded ] = useState<boolean>(true);

    async function updateSharedAddresses(updatedAddresses: string[][]) {
        const newDivision: DivisionTemplateDto = Object.assign({}, division);
        newDivision.sharedAddresses = updatedAddresses;
        await onUpdate(newDivision);
    }

    async function updateDates(updatedDates: DateTemplateDto[]) {
        const newDivision: DivisionTemplateDto = Object.assign({}, division);
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
            className="bg-secondary"
            highlight={highlight}
            setHighlight={setHighlight} />) : null}
        {expanded ? (<TemplateDates
            dates={division.dates}
            onUpdate={updateDates}
            divisionSharedAddresses={division.sharedAddresses.flatMap((a: string[]) => a)}
            templateSharedAddresses={templateSharedAddresses}
            divisionNo={divisionNo}
            divisionCount={divisionCount}
            onCopyToDivision={onCopyToDivision}
            highlight={highlight}
            setHighlight={setHighlight} />) : null}
        {expanded ? (<button className="btn btn-sm btn-outline-danger float-end" onClick={onDelete}>🗑️ Remove division</button>) : null}
    </div>);
}