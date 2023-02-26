import {SeasonApi} from "../api/season";
import {Http} from "../api/http";
import {Settings} from "../api/settings";
import React, {useState} from "react";
import {sortBy, valueChanged} from "../Utilities";

export function EditSeason({ onClose, reloadAll, setSaveError, data, onUpdateData, divisions }) {
    const [ saving, setSaving ] = useState(false);
    const [ deleting, setDeleting ] = useState(false);

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
            const api = new SeasonApi(new Http(new Settings()));
            const result = await api.update(data);

            if (result.success) {
                await reloadAll();
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

        if (!window.confirm(`Are you sure you want to delete the ${seasonData.name} season?`)) {
            return;
        }

        try {
            setDeleting(true);
            const api = new SeasonApi(new Http(new Settings()));
            const result = await api.delete(data.id);

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
        return (data.divisionIds || []).filter(id => id === divisionId).length > 0;
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
        <div>
            <h6>Divisions</h6>
            <ul className="list-group mb-3">
                {divisions.sort(sortBy('name')).map(d => (<li key={d.id} className={`list-group-item ${isDivisionSelected(d.id) ? 'active' : ''}`} onClick={async () => await toggleDivision(d.id)}>{d.name}</li>))}
            </ul>
        </div>
        <div className="mt-3 text-end">
            <button className="btn btn-primary margin-right" onClick={onClose}>Close</button>
            <button className="btn btn-primary margin-right" onClick={saveSeason}>
                {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                {data.id ? 'Update season' : 'Create season'}
            </button>
            {data.id ? (<button className="btn btn-danger margin-right" onClick={deleteSeason}>
                {deleting ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                Delete season
            </button>) : null}
        </div>
    </div>);
}
