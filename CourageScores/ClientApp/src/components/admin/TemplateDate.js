import {useState} from "react";
import {any} from "../../helpers/collections";
import {valueChanged} from "../../helpers/events";

export function TemplateDate({ dateNo, date, onUpdate, onDelete, divisionSharedAddresses, templateSharedAddresses }) {
    const [ newFixture, setNewFixture ] = useState({
        home: null,
        away: null,
    });

    function updateFixtures(update) {
        const newDate = Object.assign({}, date);
        newDate.fixtures = update;
        onUpdate(newDate);
    }

    function deleteFixture(index) {
        updateFixtures(date.fixtures.filter((a, i) => i !== index));
    }

    function addFixture() {
        if (!newFixture.home) {
            window.alert('Enter at least a home team');
            return;
        }

        updateFixtures(date.fixtures.concat([ newFixture ]));
        setNewFixture({
            home: null,
            away: null,
        });
    }

    function onKeyUp(event) {
        if (event.key === 'Enter') {
            addFixture();
        }
    }

    function sharedAddressClassName(address) {
        if (any(divisionSharedAddresses, a => a === address)) {
            return ' bg-secondary text-light';
        }

        if (any(templateSharedAddresses, a => a === address)) {
            return ' bg-warning text-light';
        }

        return '';
    }

    return (<div>
        <small className="position-absolute left-0 ps-0 pt-1 text-end width-10">{dateNo} </small>
        {date.fixtures.map((f, index) => (<button
            key={index}
            onClick={() => deleteFixture(index)}
            className={`btn btn-sm margin-right px-1 badge ${f.away ? 'btn-info' : 'btn-outline-info text-dark'}`}>
            <span className={`px-1 ${sharedAddressClassName(f.home)}`}>{f.home}</span>
            {f.away ? (<span> - </span>) : null}
            {f.away ? (<span className="px-1">{f.away}</span>) : null} &times;</button>))}
        <span className="margin-right badge bg-info ps-1">
            <input className="width-20 border-0 outline-0"
                   name="home"
                   onKeyUp={onKeyUp}
                   value={newFixture.home || ''}
                   onChange={valueChanged(newFixture, setNewFixture, '')} />
            <span>-</span>
            <input className="width-20 border-0 outline-0"
                   name="away"
                   onKeyUp={onKeyUp}
                   value={newFixture.away || ''}
                   onChange={valueChanged(newFixture, setNewFixture, '')} />
            <button className="ms-1 bg-info border-0 px-0" onClick={addFixture}>➕</button>
        </span>
        <button className="btn btn-sm btn-outline-danger float-end p-1" onClick={onDelete}>🗑️</button>
    </div>);
}