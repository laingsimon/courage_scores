import React, {useEffect, useState} from 'react';
import {ErrorDisplay} from "../common/ErrorDisplay";
import {TableSelection} from "./TableSelection";
import {valueChanged} from "../../helpers/events";
import {useDependencies} from "../../IocContainer";
import {useAdmin} from "./AdminContainer";
import {any, toDictionary} from "../../helpers/collections";
import {useApp} from "../../AppContainer";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {IExportDataRequestDto} from "../../interfaces/serverSide/Data/IExportDataRequestDto";
import {IExportDataResultDto} from "../../interfaces/serverSide/Data/IExportDataResultDto";
import {ITableDto} from "../../interfaces/serverSide/Data/ITableDto";
import {IClientActionResultDto} from "../../interfaces/IClientActionResultDto";

export function ExportData() {
    const {dataApi} = useDependencies();
    const {tables} = useAdmin();
    const {onError} = useApp();
    const [exporting, setExporting] = useState<boolean>(false);
    const [exportRequest, setExportRequest] = useState<IExportDataRequestDto>({
        includeDeletedEntries: true,
        password: '',
        tables: {}
    });
    const [zipContent, setZipContent] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<IClientActionResultDto<IExportDataResultDto> | null>(null);

    useEffect(() => {
            const selected: ITableDto[] = tables.filter((t: ITableDto) => t.canExport);
            const newExportRequest: IExportDataRequestDto = Object.assign({}, exportRequest);
            newExportRequest.tables = toDictionary(selected, (t: ITableDto) => t.name, (_: ITableDto) => []);
            setExportRequest(newExportRequest);
        },
        // eslint-disable-next-line
        [tables]);

    async function startExport() {
        /* istanbul ignore next */
        if (exporting) {
            /* istanbul ignore next */
            return;
        }

        if (!any(Object.keys(exportRequest.tables))) {
            alert('Select some tables to export');
            return;
        }

        setZipContent(null);
        setExporting(true);
        try {
            const response: IClientActionResultDto<IExportDataResultDto> = await dataApi.export(exportRequest);
            if (response.success) {
                setZipContent(response.result.zip);
            } else {
                setSaveError(response);
            }
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setExporting(false);
        }
    }

    async function tableChanged(newTables: string[]) {
        const newExportRequest: IExportDataRequestDto = Object.assign({}, exportRequest);
        newExportRequest.tables = toDictionary(newTables, (t: string) => t, (_: string) => []);
        setExportRequest(newExportRequest);
    }

    return (<div className="content-background p-3">
        <h3>Export data</h3>
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Password</span>
            </div>
            <input disabled={exporting} type="password" className="form-control"
                   name="password" value={exportRequest.password}
                   onChange={valueChanged(exportRequest, setExportRequest)}/>
        </div>
        <div className="input-group mb-3">
            <div className="form-check form-switch input-group-prepend">
                <input disabled={exporting} type="checkbox" className="form-check-input"
                       name="includeDeletedEntries" id="includeDeletedEntries"
                       checked={exportRequest.includeDeletedEntries}
                       onChange={valueChanged(exportRequest, setExportRequest)}/>
                <label className="form-check-label" htmlFor="includeDeletedEntries">Include deleted entries</label>
            </div>
        </div>
        <TableSelection allTables={tables} selected={Object.keys(exportRequest.tables)} onTableChange={tableChanged}
                        requireCanExport={true}/>
        <div>
            <button className="btn btn-primary margin-right" onClick={startExport} disabled={exporting}>
                {exporting ? (<LoadingSpinnerSmall/>) : null}
                Export data
            </button>
            {zipContent && !exporting && !saveError ? (
                <a download="export.zip" href={'data:application/zip;base64,' + zipContent} className="btn btn-success">
                    Download zip file
                </a>) : null}
        </div>
        {saveError
            ? (<ErrorDisplay {...saveError} onClose={async () => setSaveError(null)} title="Could not export data"/>)
            : null}
    </div>);
}
