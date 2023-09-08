import {TemplateDate} from "./TemplateDate";

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

    return (<ul className="list-group mb-3">
        <li className="list-group-item bg-info text-light">
            Weeks
            <small className="d-block">League fixtures (or byes) per-week</small>
        </li>
        {dates.map((d, index) => <li className="list-group-item" key={index}>
            <TemplateDate
                dateNo={index+1}
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