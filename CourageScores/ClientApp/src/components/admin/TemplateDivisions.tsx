import {TemplateDivision} from "./TemplateDivision";
import {DivisionTemplateDto} from "../../interfaces/models/dtos/Season/Creation/DivisionTemplateDto";
import {DateTemplateDto} from "../../interfaces/models/dtos/Season/Creation/DateTemplateDto";

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

    async function onCopyToDivision(newDates: DateTemplateDto[], divisionIndex: number) {
        await onUpdate(divisions.map((division: DivisionTemplateDto, index: number) => {
            if (index === divisionIndex) {
                const newDivision: DivisionTemplateDto = Object.assign({}, division);
                newDivision.dates = newDates;
                return newDivision;
            }

            return division;
        }));
    }

    return (<ul className="list-group mb-3">
        <li className="list-group-item bg-light">Divisions</li>
        {divisions.map((d: DivisionTemplateDto, index: number) => <li className="list-group-item" key={index}>
            <TemplateDivision
                divisionNo={index+1}
                division={d}
                onDelete={() => deleteDivision(index)}
                onUpdate={(update: DivisionTemplateDto) => updateDivision(update, index)}
                templateSharedAddresses={templateSharedAddresses}
                divisionCount={divisions.length}
                onCopyToDivision={onCopyToDivision} />
        </li>)}
        <button className="list-group-item btn-primary small" onClick={addDivision}>
            ➕ Add another division
        </button>
    </ul>);
}