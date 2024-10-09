import {useEffect, useState} from 'react';
import {ErrorDisplay} from "../common/ErrorDisplay";
import {TableSelection} from "./TableSelection";
import {any} from "../../helpers/collections";
import {propChanged, valueChanged} from "../../helpers/events";
import {useDependencies} from "../common/IocContainer";
import {useAdmin} from "./AdminContainer";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {ImportDataRequestDto} from "../../interfaces/models/dtos/Data/ImportDataRequestDto";
import {ImportDataResultDto} from "../../interfaces/models/dtos/Data/ImportDataResultDto";
import {TableDto} from "../../interfaces/models/dtos/Data/TableDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";

export function ImportData() {
    const {dataApi} = useDependencies();
    const {tables} = useAdmin();
    const [importing, setImporting] = useState<boolean>(false);
    const [importRequest, setImportRequest] = useState<ImportDataRequestDto>({
        password: '',
        dryRun: true,
        purgeData: false,
        tables: []
    });
    const [response, setResponse] = useState<IClientActionResultDto<ImportDataResultDto>>(null);
    const [saveError, setSaveError] = useState(null);

    useEffect(() => {
            if (!tables) {
                return;
            }

            const selected: string[] = tables.filter((t: TableDto) => t.canImport).map((t: TableDto) => t.name);
            setImportRequest(Object.assign({}, importRequest, {
                tables: selected
            }));
        },
        // eslint-disable-next-line
        [tables]);

    async function startImport() {
        /* istanbul ignore next */
        if (importing) {
            /* istanbul ignore next */
            return;
        }

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (input.files.length === 0) {
            window.alert(`Select a file first`);
            return;
        }

        if (!any(importRequest.tables)) {
            window.alert(`Select some tables to import`);
            return;
        }

        setImporting(true);
        setResponse(null);
        try {
            const response: IClientActionResultDto<ImportDataResultDto> = await dataApi.import(importRequest, input.files[0]);

            if (response.success) {
                setResponse(response);
            } else if (response.body) {
                if (response.status === 500) {
                    const textResponse = await response.text();
                    setSaveError({errors: [textResponse]});
                } else {
                    const jsonResponse = await response.json();
                    setSaveError(jsonResponse);
                }
            } else {
                setSaveError(response);
            }
        } catch (e) {
            /* istanbul ignore next */
            console.error(e);
            setSaveError(e.toString());
        } finally {
            setImporting(false);
        }
    }

    return (<div className="content-background p-3">
        <h3>Import data</h3>
        <div className="input-group mb-3">
            <input disabled={importing} type="file" className="form-control" name="file"/>
        </div>
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Password</span>
            </div>
            <input disabled={importing} type="password" className="form-control"
                   name="password" value={importRequest.password}
                   onChange={valueChanged(importRequest, setImportRequest)}/>
        </div>
        <div className="input-group mb-3">
            <div className="form-check form-switch input-group-prepend">
                <input disabled={importing} type="checkbox" className="form-check-input"
                       name="purgeData" id="purgeData" checked={importRequest.purgeData}
                       onChange={valueChanged(importRequest, setImportRequest)}/>
                <label className="form-check-label" htmlFor="purgeData">Purge data</label>
            </div>
        </div>
        <div className="input-group mb-3">
            <div className="form-check form-switch input-group-prepend">
                <input disabled={importing} type="checkbox" className="form-check-input"
                       name="dryRun" id="dryRun" checked={importRequest.dryRun}
                       onChange={valueChanged(importRequest, setImportRequest)}/>
                <label className="form-check-label" htmlFor="dryRun">Dry run</label>
            </div>
        </div>
        <TableSelection allTables={tables} selected={importRequest.tables}
                        onTableChange={propChanged(importRequest, setImportRequest, 'tables')} requireCanImport={true}/>
        <div>
            <button className="btn btn-primary margin-right" onClick={startImport} disabled={importing}>
                {importing ? (<LoadingSpinnerSmall/>) : null}
                Import data
            </button>
        </div>
        {response ? (<div className="py-3">
            <h5>Output</h5>
            <ul>
                {Object.keys(response.result.tables).map((t: string) => (
                    <li key={t}><strong>{t}</strong>: {response.result.tables[t]} row/s imported</li>))}
            </ul>
            <strong>Messages</strong>
            <div className="overflow-auto max-scroll-height">
                {response.errors.map((error, index) => (
                    <div key={index + '_error'} className="text-danger">{error}</div>))}
                {response.warnings.map((warning, index) => (
                    <div key={index + '_warning'} className="text-warning">{warning}</div>))}
                {response.messages.map((message, index) => (
                    <div key={index + '_message'} className="text-secondary">{message}</div>))}
            </div>
        </div>) : null}
        {saveError
            ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not import data"/>)
            : null}
    </div>);
}
