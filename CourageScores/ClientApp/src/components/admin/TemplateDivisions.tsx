import {TemplateDivision} from "./TemplateDivision";
import {DivisionTemplateDto} from "../../interfaces/models/dtos/Season/Creation/DivisionTemplateDto";

export interface ITemplateDivisionsProps {
    divisions: DivisionTemplateDto[];
    onUpdate(a: DivisionTemplateDto[]): Promise<any>;
    templateSharedAddresses: string[];
}

export function TemplateDivisions({ divisions, onUpdate, templateSharedAddresses }: ITemplateDivisionsProps) {
    async function updateDivision(update: DivisionTemplateDto, updateIndex: number) {
        await onUpdate(divisions.map((a: DivisionTemplateDto, index: number) => index === updateIndex ? update : a));
    }

    async function addDivision() {
        const newDivision: DivisionTemplateDto = {
            sharedAddresses: [],
            dates: [],
        };
        await onUpdate(divisions.concat([ newDivision ]));
    }

    async function deleteDivision(index: number) {
        await onUpdate(divisions.filter((_: DivisionTemplateDto, i: number) => index !== i));
    }

    return (<ul className="list-group mb-3">
        <li className="list-group-item bg-light">Divisions</li>
        {divisions.map((d: DivisionTemplateDto, index: number) => <li className="list-group-item" key={index}>
            <TemplateDivision
                divisionNo={index+1}
                division={d}
                onDelete={() => deleteDivision(index)}
                onUpdate={(update: DivisionTemplateDto) => updateDivision(update, index)}
                templateSharedAddresses={templateSharedAddresses} />
        </li>)}
        <button className="list-group-item btn-primary small" onClick={addDivision}>
            ➕ Add another division
        </button>
    </ul>);
}