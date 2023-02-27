import {DivisionApi} from "../api/division";
import {Http} from "../api/http";
import {Settings} from "../api/settings";
import React, {useState} from "react";
import {valueChanged} from "../Utilities";

export function EditDivision({ onClose, reloadAll, setSaveError, data, onUpdateData }) {
    const [ saving, setSaving ] = useState(false);
    const [ deleting, setDeleting ] = useState(false);

    async function saveDivision() {
        if (saving || deleting) {
            return;
        }

        if (!data.name) {
            window.alert('Enter a division name');
            return;
        }

        try {
            setSaving(true);
            const api = new DivisionApi(new Http(new Settings()));
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

    async function deleteDivision() {
        if (deleting || saving) {
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the ${data.name} division?`)) {
            return;
        }

        try {
            setDeleting(true);
            const api = new DivisionApi(new Http(new Settings()));
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

    return (<div>
        <div className="input-group">
            <div className="input-group-prepend">
                <span className="input-group-text">Name</span>
            </div>
            <input readOnly={saving} value={data.name || ''} onChange={valueChanged(data, onUpdateData)} name="name" className="form-control margin-right" />
        </div>
        <div className="mt-3 text-end">
            <button className="btn btn-primary margin-right" onClick={onClose}>Close</button>
            {data.id ? (<button className="btn btn-danger margin-right" onClick={deleteDivision}>
                {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                Delete division
            </button>) : null}
            <button className="btn btn-success margin-right" onClick={saveDivision}>
                {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                {data.id ? 'Update division' : 'Create division'}
            </button>
        </div>
    </div>);
}
