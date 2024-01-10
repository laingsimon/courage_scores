import {TemplateDivision} from "./TemplateDivision";

export function TemplateDivisions({ divisions, onUpdate, templateSharedAddresses }) {
    function updateDivision(update, updateIndex) {
        onUpdate(divisions.map((a, index) => index === updateIndex ? update : a));
    }

    function addDivision() {
        const newDivision = {
            sharedAddresses: [],
            dates: [],
        };
        onUpdate(divisions.concat([ newDivision ]));
    }

    function deleteDivision(index) {
        onUpdate(divisions.filter((a, i) => index !== i));
    }

    return (<ul className="list-group mb-3">
        <li className="list-group-item bg-light">Divisions</li>
        {divisions.map((d, index) => <li className="list-group-item" key={index}>
            <TemplateDivision
                divisionNo={index+1}
                division={d}
                onDelete={() => deleteDivision(index)}
                onUpdate={(update) => updateDivision(update, index)}
                templateSharedAddresses={templateSharedAddresses} />
        </li>)}
        <button className="list-group-item btn-primary small" onClick={addDivision}>
            ➕ Add another division
        </button>
    </ul>);
}