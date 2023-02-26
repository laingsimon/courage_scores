import {SeasonApi} from "../api/season";
import {Http} from "../api/http";
import {Settings} from "../api/settings";
import React, {useState} from "react";

export function EditSeason({ seasonId, name, startDate, endDate, onChange, onClose, reloadAll, setSaveError }) {
    const [ saving, setSaving ] = useState(false);

    async function saveSeason() {
        if (saving) {
            return;
        }

        if (!name) {
            window.alert('Enter a season name');
            return;
        }

        try {
            setSaving(true);
            const api = new SeasonApi(new Http(new Settings()));
            const result = await api.update({
                id: seasonId || undefined,
                name: name,
                startDate: startDate,
                endDate: endDate
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
            <input readOnly={saving} value={name || ''} onChange={(event) => onChange('name', event.target.value)} className="form-control margin-right" />
        </div>
        <div className="input-group">
            <div className="input-group-prepend">
                <span className="input-group-text">From</span>
            </div>
            <input readOnly={saving} onChange={(event) => onChange('startDate', event.target.value)} name="startDate" value={startDate} type="date" className="border-0 margin-right"/>
        </div>
        <div className="input-group">
            <div className="input-group-prepend">
                <span className="input-group-text">To</span>
            </div>
            <input readOnly={saving} onChange={(event) => onChange('endDate', event.target.value)} name="endDate" value={endDate} type="date" className="border-0 margin-right"/>
        </div>
        <div className="mt-3 text-end">
            <button className="btn btn-primary margin-right" onClick={onClose}>Close</button>
            <button className="btn btn-primary margin-right" onClick={saveSeason}>
                {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                {seasonId ? 'Update season' : 'Create season'}
            </button>
        </div>
    </div>);
}
