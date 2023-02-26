import {DivisionApi} from "../api/division";
import {Http} from "../api/http";
import {Settings} from "../api/settings";
import React, {useState} from "react";

export function EditDivision({ divisionId, name, onChange, onClose, reloadAll, setSaveError }) {
    const [ saving, setSaving ] = useState(false);

    async function saveDivision() {
        if (saving) {
            return;
        }

        if (!name) {
            window.alert('Enter a division name');
            return;
        }

        try {
            setSaving(true);
            const api = new DivisionApi(new Http(new Settings()));
            const result = await api.update({
                id: divisionId || undefined,
                name: name
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
            <input readOnly={saving} value={name} onChange={(event) => onChange('name', event.target.value)} className="form-control margin-right" />
        </div>
        <div className="mt-3 text-end">
            <button className="btn btn-primary margin-right" onClick={onClose}>Close</button>
            <button className="btn btn-primary margin-right" onClick={saveDivision}>
                {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                {divisionId ? 'Update division' : 'Create division'}
            </button>
        </div>
    </div>);
}