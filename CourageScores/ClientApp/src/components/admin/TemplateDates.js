import {TemplateDate} from "./TemplateDate";
import {renderDate} from "../../helpers/rendering";

export function TemplateDates({ dates, onUpdate, divisionSharedAddresses, templateSharedAddresses }) {
    function updateDate(update, updateIndex) {
        onUpdate(dates.map((a, index) => index === updateIndex ? update : a));
    }

    function addDate() {
        const newDate = {
            fixtures: [],
        };
        onUpdate(dates.concat([ newDate ]));
    }

    function deleteDate(index) {
        onUpdate(dates.filter((a, i) => index !== i));
    }

    function moveDate(index, movement) {
        const date = dates[index];
        const newDates = dates.flatMap((d, i) => {
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
        onUpdate(newDates);
    }

    function getDisplayDate(startDate, index) {
        const date = new Date(startDate.valueOf());
        date.setDate(date.getDate() + (index * 7));
        return date;
    }

    const startDate = new Date(2000, 0, 1);
    return (<ul className="list-group mb-3">
        <li className="list-group-item bg-info text-light">
            Weeks
            <small className="d-block">League fixtures (or byes) per-week</small>
        </li>
        {dates.map((d, index) => <li className="list-group-item position-relative" key={index}>
            <small className="position-absolute left-0 ps-0 pt-1 text-end width-10">{index+1} </small>
            <span className="text-secondary-50 position-absolute right-60 me-5 pt-1 small">
                {renderDate(getDisplayDate(startDate, index))}
            </span>
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