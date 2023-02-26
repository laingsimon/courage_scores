import {SeasonApi} from "../api/season";
import {Http} from "../api/http";
import {Settings} from "../api/settings";
import React, {useState} from "react";
import {valueChanged} from "../Utilities";

export function EditSeason({ onClose, reloadAll, setSaveError, data, onUpdateData }) {
    const [ saving, setSaving ] = useState(false);

    async function saveSeason() {
        if (saving) {
            return;
        }

        if (!data.name) {
            window.alert('Enter a season name');
            return;
        }

        try {
            setSaving(true);
            const api = new SeasonApi(new Http(new Settings()));
            const result = await api.update({
                id: data.id || undefined,
                name: data.name,
                startDate: data.startDate,
                endDate: data.endDate
            });

            if (result.success) {
                await reloadAll();
            } else {
                setSaveError(result);
            }
        } finally {
            setSaving(false);
        }
    }

    return (<div>
        <div className="input-group">
            <div className="input-group-prepend">
                <span className="input-group-text">Name</span>
            </div>
            <input readOnly={saving} name="name" onChange={valueChanged(data, onUpdateData)} value={data.name || ''} className="form-control margin-right" />
        </div>
        <div className="input-group">
            <div className="input-group-prepend">
                <span className="input-group-text">From</span>
            </div>
            <input readOnly={saving} name="startDate" onChange={valueChanged(data, onUpdateData)} value={data.startDate} type="date" className="border-0 margin-right"/>
        </div>
        <div className="input-group">
            <div className="input-group-prepend">
                <span className="input-group-text">To</span>
            </div>
            <input readOnly={saving} name="endDate" onChange={valueChanged(data, onUpdateData)} value={data.endDate} type="date" className="border-0 margin-right"/>
        </div>
        <div className="mt-3 text-end">
            <button className="btn btn-primary margin-right" onClick={onClose}>Close</button>
            <button className="btn btn-primary margin-right" onClick={saveSeason}>
                {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                {data.id ? 'Update season' : 'Create season'}
            </button>
        </div>
    </div>);
}
