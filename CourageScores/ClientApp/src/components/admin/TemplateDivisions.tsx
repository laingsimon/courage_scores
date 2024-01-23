import {TemplateDivision} from "./TemplateDivision";
import {IDivisionTemplateDto} from "../../interfaces/serverSide/Season/Creation/IDivisionTemplateDto";

export interface ITemplateDivisionsProps {
    divisions: IDivisionTemplateDto[];
    onUpdate: (a: IDivisionTemplateDto[]) => Promise<any>;
    templateSharedAddresses: string[];
}

export function TemplateDivisions({ divisions, onUpdate, templateSharedAddresses }: ITemplateDivisionsProps) {
    async function updateDivision(update: IDivisionTemplateDto, updateIndex: number) {
        await onUpdate(divisions.map((a: IDivisionTemplateDto, index: number) => index === updateIndex ? update : a));
    }

    async function addDivision() {
        const newDivision: IDivisionTemplateDto = {
            sharedAddresses: [],
            dates: [],
        };
        await onUpdate(divisions.concat([ newDivision ]));
    }

    async function deleteDivision(index: number) {
        await onUpdate(divisions.filter((_: IDivisionTemplateDto, i: number) => index !== i));
    }

    return (<ul className="list-group mb-3">
        <li className="list-group-item bg-light">Divisions</li>
        {divisions.map((d: IDivisionTemplateDto, index: number) => <li className="list-group-item" key={index}>
            <TemplateDivision
                divisionNo={index+1}
                division={d}
                onDelete={() => deleteDivision(index)}
                onUpdate={(update: IDivisionTemplateDto) => updateDivision(update, index)}
                templateSharedAddresses={templateSharedAddresses} />
        </li>)}
        <button className="list-group-item btn-primary small" onClick={addDivision}>
            ➕ Add another division
        </button>
    </ul>);
}