import React, {useEffect, useState} from 'react';
import {ErrorDisplay} from "../common/ErrorDisplay";
import {TableSelection} from "./TableSelection";
import {propChanged, valueChanged} from "../../helpers/events";
import {useDependencies} from "../../IocContainer";
import {useAdmin} from "./AdminContainer";

export function ExportData() {
    const { dataApi } = useDependencies();
    const { tables } = useAdmin();
    const [ exporting, setExporting ] = useState(false);
    const [ exportRequest, setExportRequest ] = useState({
        includeDeletedEntries: true,
        password: '',
        tables: []
    });
    const [ zipContent, setZipContent ] = useState(null);
    const [ saveError, setSaveError ] = useState(null);

    useEffect(() => {
        if (!tables) {
            return;
        }

        const selected = tables.filter(t => t.canExport).map(t => t.name);
        setExportRequest(Object.assign({ tables: selected }, exportRequest));
    },
    // eslint-disable-next-line
    [ tables ]);

    async function startExport() {
        /* istanbul ignore next */
        if (exporting) {
            /* istanbul ignore next */
            return;
        }

        setZipContent(null);
        setExporting(true);
        try {
            const response = await dataApi.export(exportRequest);
            if (response.success) {
                setZipContent(response.result.zip);
            } else {
                setSaveError(response);
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
                   name="password" value={exportRequest.password} onChange={valueChanged(exportRequest, setExportRequest)}/>
        </div>
        <div className="input-group mb-3">
            <div className="form-check form-switch input-group-prepend">
                <input disabled={exporting} type="checkbox" className="form-check-input"
                       name="includeDeletedEntries" id="includeDeletedEntries" checked={exportRequest.includeDeletedEntries} onChange={valueChanged(exportRequest, setExportRequest)}/>
                <label className="form-check-label" htmlFor="includeDeletedEntries">Include deleted entries</label>
            </div>
        </div>
        <TableSelection allTables={tables} selected={exportRequest.tables} onTableChange={propChanged(exportRequest, setExportRequest, 'tables')} requireCanExport={true} />
        <div>
            <button className="btn btn-primary margin-right" onClick={startExport} disabled={exporting}>
                {exporting ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                Export data
            </button>
            {zipContent && !exporting && !saveError ? (<a download="export.zip"  href={'data:application/zip;base64,' + zipContent} className="btn btn-success">
                Download zip file
            </a>) : null}
        </div>
        {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not export data" />) : null}
    </div>);
}
