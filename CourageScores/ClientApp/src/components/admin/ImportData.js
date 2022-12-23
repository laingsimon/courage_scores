import React, {useEffect, useState} from 'react';
import {Settings} from "../../api/settings";
import {Http} from "../../api/http";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {DataApi} from "../../api/data";
import {TableSelection} from "./TableSelection";
import {NotPermitted} from "./NotPermitted";

export function ImportData({account}) {
    const api = new DataApi(new Http(new Settings()));
    const [importing, setImporting] = useState(false);
    const [importRequest, setImportRequest] = useState({
        password: '',
        dryRun: true,
        purgeData: true,
        tables: []
    });
    const [response, setResponse] = useState(null);
    const [saveError, setSaveError] = useState(null);
    const [ dataTables, setDataTables ] = useState(null);
    const isAdmin = account && account.access && account.access.importData;

    async function getTables() {
        if (!isAdmin) {
            return;
        }

        const tables = await api.tables();
        setDataTables(tables);

        const selected = tables.filter(t => t.canImport).map(t => t.name);
        onTableChange(selected);
    }

    useEffect(() => {
        getTables();
    },
    // eslint-disable-next-line
    []);

    function onTableChange(selection) {
        const newImportRequest = Object.assign({}, importRequest);
        newImportRequest.tables = selection;
        setImportRequest(newImportRequest);
    }

    function valueChanged(event) {
        const newImportRequest = Object.assign({}, importRequest);
        newImportRequest[event.target.name] = event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value;
        setImportRequest(newImportRequest);
    }

    async function startImport() {
        if (importing) {
            return;
        }

        const input = document.querySelector('input[type="file"]');
        if (input.files.length === 0) {
            window.alert(`Select a file first`);
            return;
        }

        setImporting(true);
        setResponse(null);
        try {
            const response = await api.import(importRequest, input.files[0]);

            if (response.success) {
                setResponse(response);
            } else if (response.body) {
                if (response.status === 500) {
                    const textResponse = await response.text();
                    setSaveError({ errors: [ textResponse ] });
                } else {
                    const jsonResponse = await response.json();
                    setSaveError(jsonResponse);
                }
            } else {
                setSaveError(response);
            }
        } catch (e) {
            console.error(e);
            setSaveError(e.toString());
        } finally {
            setImporting(false);
        }
    }

    if (!isAdmin) {
        return (<NotPermitted />);
    }

    return (<div className="light-background p-3">
        <h3>Import data</h3>
        <div className="input-group mb-3">
            <input disabled={importing} type="file" className="form-control" name="file" />
        </div>
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Password</span>
            </div>
            <input disabled={importing} type="password" className="form-control"
                   name="password" value={importRequest.password} onChange={valueChanged}/>
        </div>
        <div className="input-group mb-3">
            <div className="form-check form-switch input-group-prepend">
                <input disabled={importing} type="checkbox" className="form-check-input"
                       name="purgeData" checked={importRequest.purgeData} onChange={valueChanged}/>
                <label className="form-check-label" htmlFor="purgeData">Purge data</label>
            </div>
        </div>
        <div className="input-group mb-3">
            <div className="form-check form-switch input-group-prepend">
                <input disabled={importing} type="checkbox" className="form-check-input"
                       name="dryRun" checked={importRequest.dryRun} onChange={valueChanged}/>
                <label className="form-check-label" htmlFor="dryRun">Dry run</label>
            </div>
        </div>
        <TableSelection allTables={dataTables} selected={importRequest.tables} onTableChange={onTableChange} requireCanImport={true} />
        <div>
            <button className="btn btn-primary margin-right" onClick={startImport} disabled={importing}>
                {importing ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                Import data
            </button>
        </div>
        {response ? (<div className="py-3">
            <h5>Output</h5>
            <ul>
                {Object.keys(response.result.tables).map(t => (<li><strong>{t}</strong>: {response.result.tables[t]} row/s imported</li>))}
            </ul>
            <strong>Messages</strong>
            <div className="overflow-auto max-scroll-height">
                {response.errors.map(error => (<div className="text-danger">{error}</div>))}
                {response.warnings.map(warning => (<div className="text-warning">{warning}</div>))}
                {response.messages.map(message => (<div className="text-secondary">{message}</div>))}
            </div>
        </div>) : null}
        {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not import data" />) : null}
    </div>);
}