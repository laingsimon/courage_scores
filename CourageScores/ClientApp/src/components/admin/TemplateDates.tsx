import {TemplateDate} from "./TemplateDate";
import {DateTemplateDto} from "../../interfaces/models/dtos/Season/Creation/DateTemplateDto";
import {repeat} from "../../helpers/projection";
import {any} from "../../helpers/collections";

export interface ITemplateDatesProps {
    dates: DateTemplateDto[];
    onUpdate(newDates: DateTemplateDto[]): Promise<any>;
    onCopyToDivision(destinationDivisionIndex: number): Promise<any>;
    divisionSharedAddresses: string[];
    templateSharedAddresses: string[];
    divisionNo: number;
    divisionCount: number;
}

export function TemplateDates({ dates, onUpdate, divisionSharedAddresses, templateSharedAddresses, divisionCount, divisionNo, onCopyToDivision }: ITemplateDatesProps) {
    async function updateDate(update: DateTemplateDto, updateIndex: number) {
        await onUpdate(dates.map((a: DateTemplateDto, index: number) => index === updateIndex ? update : a));
    }

    async function addDate() {
        const newDate: DateTemplateDto = {
            fixtures: [],
        };
        await onUpdate(dates.concat([ newDate ]));
    }

    async function deleteDate(index: number) {
        await onUpdate(dates.filter((_: DateTemplateDto, i: number) => index !== i));
    }

    async function moveDate(index: number, movement: number) {
        const date = dates[index];
        const newDates = dates.flatMap((d: DateTemplateDto, i: number) => {
            if (i === index + movement) {
                return movement > 0
                    ? [ d, date ]
                    : [ date, d ];
            }
            if (i === index) {
                return [];
            }

            return [d];
        });
        await onUpdate(newDates);
    }

    return (<ul className="list-group mb-3">
        <li className="list-group-item bg-info text-light">
            Weeks
            {any(dates) ? repeat(divisionCount).filter(index => index !== divisionNo - 1).map(index => {
                return (<button key={index} className="btn btn-sm btn-primary float-end" onClick={async () => onCopyToDivision(index)}>Copy to division {index + 1}</button>)
            }) : null}
            <small className="d-block">League fixtures (or byes) per-week</small>
        </li>
        {dates.map((d: DateTemplateDto, index: number) => <li className="list-group-item position-relative" key={index}>
            <small className="position-absolute left-0 ps-0 pt-1 text-end width-10">{index+1} </small>
            <TemplateDate
                date={d}
                onDelete={() => deleteDate(index)}
                onUpdate={(update) => updateDate(update, index)}
                divisionSharedAddresses={divisionSharedAddresses}
                templateSharedAddresses={templateSharedAddresses}
                moveEarlier={index > 0 ? () => moveDate(index, -1) : null}
                moveLater={index < (dates.length - 1) ? () => moveDate(index, 1) : null} />
        </li>)}
        <button className="list-group-item btn-primary small" onClick={addDate}>
            ➕ Add a week
        </button>
    </ul>);
}