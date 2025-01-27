import {TemplateDivision} from "./TemplateDivision";
import {DivisionTemplateDto} from "../../interfaces/models/dtos/Season/Creation/DivisionTemplateDto";
import {DateTemplateDto} from "../../interfaces/models/dtos/Season/Creation/DateTemplateDto";
import {FixtureTemplateDto} from "../../interfaces/models/dtos/Season/Creation/FixtureTemplateDto";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface ITemplateDivisionsProps {
    divisions: DivisionTemplateDto[];
    onUpdate(a: DivisionTemplateDto[]): UntypedPromise;
    templateSharedAddresses: string[];
    highlight?: string;
    setHighlight(highlight?: string): UntypedPromise;
}

export function TemplateDivisions({ divisions, onUpdate, templateSharedAddresses, highlight, setHighlight }: ITemplateDivisionsProps) {
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

    async function onCopyToDivision(sourceDivisionIndex: number, destinationDivisionIndex: number) {
        const sourceDivision: DivisionTemplateDto = divisions[sourceDivisionIndex];

        const newDivisions: DivisionTemplateDto[] = divisions.map((division: DivisionTemplateDto, index: number) => {
            if (index === destinationDivisionIndex) {
                const newPrefix: string = (destinationDivisionIndex + 1).toString();
                const newDivision: DivisionTemplateDto = Object.assign({}, division);
                newDivision.dates = prefixDateMnemonics(sourceDivision.dates!, newPrefix);
                newDivision.sharedAddresses = prefixSharedAddressMnemonics(sourceDivision.sharedAddresses!, newPrefix);
                return newDivision;
            }

            return division;
        });

        await onUpdate(newDivisions);
    }

    function prefixDateMnemonics(dates: DateTemplateDto[], prefix: string): DateTemplateDto[] {
        return dates.map((d: DateTemplateDto): DateTemplateDto => {
            return {
                fixtures: d.fixtures!.map((f: FixtureTemplateDto): FixtureTemplateDto => {
                    return {
                        home: f.home ? prefix + f.home : f.home,
                        away: f.away ? prefix + f.away : f.away,
                    };
                }),
            };
        });
    }

    function prefixSharedAddressMnemonics(sharedAddresses: string[][], prefix: string): string[][] {
        return sharedAddresses.map((sharedAddress: string[]): string[] => {
            return sharedAddress.map((mnemonic: string) => prefix + mnemonic);
        });
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
                onCopyToDivision={async (destIndex: number) => onCopyToDivision(index, destIndex)}
                highlight={highlight}
                setHighlight={setHighlight} />
        </li>)}
        <button className="list-group-item btn-primary small" onClick={addDivision}>
            ➕ Add another division
        </button>
    </ul>);
}