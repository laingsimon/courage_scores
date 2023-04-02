import React, {useState} from "react";
import {any, propChanged, sortBy, valueChanged} from "../Utilities";
import {BootstrapDropdown} from "./common/BootstrapDropdown";
import {useDependencies} from "../IocContainer";
import {useApp} from "../AppContainer";

export function EditSeason({ onClose, onSave, setSaveError, data, onUpdateData }) {
    const [ saving, setSaving ] = useState(false);
    const [ deleting, setDeleting ] = useState(false);
    const { seasonApi } = useDependencies();
    const { seasons, divisions } = useApp();

    async function saveSeason() {
        if (saving || deleting) {
            return;
        }

        if (!data.name) {
            window.alert('Enter a season name');
            return;
        }

        try {
            setSaving(true);
            const result = await seasonApi.update(data);

            if (result.success) {
                await onSave();
            } else {
                setSaveError(result);
            }
        } finally {
            setSaving(false);
        }
    }

    async function deleteSeason() {
        if (saving || deleting) {
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the ${data.name} season?`)) {
            return;
        }

        try {
            setDeleting(true);
            const result = await seasonApi.delete(data.id);

            if (result.success) {
                document.location.href = `https://${document.location.host}`;
            } else {
                setSaveError(result);
            }
        } finally {
            setDeleting(false);
        }
    }

    async function toggleDivision(divisionId) {
        const newData = Object.assign({}, data);

        if (isDivisionSelected(divisionId)) {
            newData.divisionIds = newData.divisionIds.filter(id => id !== divisionId)
        } else {
            newData.divisionIds = (newData.divisionIds || []).concat(divisionId);
        }

        await onUpdateData(newData);
    }

    function isDivisionSelected(divisionId) {
        return any((data.divisionIds || []), id => id === divisionId);
    }

    return (<div>
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Name</span>
            </div>
            <input readOnly={saving} name="name" onChange={valueChanged(data, onUpdateData)} value={data.name || ''} className="form-control margin-right" />
        </div>
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">From</span>
            </div>
            <input readOnly={saving} name="startDate" onChange={valueChanged(data, onUpdateData)} value={(data.startDate || '').substring(0, 10)} type="date" className="form-control margin-right"/>
            <div className="input-group-prepend">
                <span className="input-group-text">To</span>
            </div>
            <input readOnly={saving} name="endDate" onChange={valueChanged(data, onUpdateData)} value={(data.endDate || '').substring(0, 10)} type="date" className="form-control margin-right"/>
        </div>
        {data.id ? null : (<div className="input-group margin-right mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Use teams from season</span>
            </div>
            <BootstrapDropdown value={data.copyTeamsFromSeasonId} options={seasons.map(s => { return { text: s.name, value: s.id }; })} onChange={propChanged(data, onUpdateData, 'copyTeamsFromSeasonId')} />
        </div>)}
        <div>
            <h6>Divisions</h6>
            <ul className="list-group mb-3">
                {divisions.sort(sortBy('name')).map(d => (<li key={d.id} className={`list-group-item ${isDivisionSelected(d.id) ? 'active' : ''}`} onClick={async () => await toggleDivision(d.id)}>{d.name}</li>))}
            </ul>
        </div>
        <div className="mt-3 text-end">
            <button className="btn btn-primary margin-right" onClick={onClose}>Close</button>
            {data.id ? (<button className="btn btn-danger margin-right" onClick={deleteSeason}>
                {deleting ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                Delete season
            </button>) : null}
            <button className="btn btn-success margin-right" onClick={saveSeason}>
                {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                {data.id ? 'Update season' : 'Create season'}
            </button>
        </div>
    </div>);
}
