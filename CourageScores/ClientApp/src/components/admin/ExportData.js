import React, { useState } from 'react';
import {Settings} from "../../api/settings";
import {Http} from "../../api/http";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {DataApi} from "../../api/data";

export function ExportData() {
    const api = new DataApi(new Http(new Settings()));
    const [ exporting, setExporting ] = useState(false);
    const [ exportRequest, setExportRequest ] = useState({
        includeDeletedEntries: true,
        password: ''
    });
    const [ saveError, setSaveError ] = useState(null);

    function valueChanged(event) {
        const newExportRequest = Object.assign({}, exportRequest);
        newExportRequest[event.target.name] = event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value;
        setExportRequest(newExportRequest);
    }

    async function startExport() {
        if (exporting) {
            return;
        }

        setExporting(true);
        try {
            const result = await api.export(exportRequest);
            if (result.success) {
                // trigger a save...
            } else {
                setSaveError(result);
            }
        } catch (e) {
            setSaveError(e.toString());
        }
        finally {
            setExporting(false);
        }
    }

    return (<div className="light-background p-3">
        <h3>Export data</h3>
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Password</span>
            </div>
            <input disabled={exporting} type="password" className="form-control"
                   name="password" value={exportRequest.password} onChange={valueChanged}/>
        </div>
        <div className="input-group mb-3">
            <div className="form-check form-switch input-group-prepend">
                <input disabled={exporting} type="checkbox" className="form-check-input"
                       name="includeDeletedEntries" checked={exportRequest.includeDeletedEntries} onChange={valueChanged}/>
                <label className="form-check-label" htmlFor="includeDeletedEntries">Include deleted entries</label>
            </div>
        </div>
        <div>
            <button className="btn btn-primary" onClick={startExport} disabled={exporting}>
                {exporting ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                Export data
            </button>
        </div>
        {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not export data" />) : null}
    </div>);
}