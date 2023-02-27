import React, { useState } from 'react';
import {ReportApi} from "../../api/report";
import {Http} from "../../api/http";
import {Settings} from "../../api/settings";
import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {any, isEmpty} from "../../Utilities";

export function DivisionReports({ divisionData }) {
    const [ reportData, setReportData ] = useState(null);
    const [ gettingData, setGettingData ] = useState(false);
    const [ topCount, setTopCount ] = useState(3);
    const [ activeReport, setActiveReport ] = useState(null);
    const api = new ReportApi(new Http(new Settings()));

    async function getReports() {
        setGettingData(true);

        try {
            const request = {
                divisionId: divisionData.id,
                seasonId: divisionData.season.id,
                topCount: topCount
            };
            const result = await api.getReport(request);
            setReportData(result);
            if (any(result.reports)) {
                setActiveReport(result.reports[0].name);
            } else {
                setActiveReport(null);
            }
        } finally {
            setGettingData(false);
        }
    }

    function renderReportNames() {
        if (isEmpty(reportData.reports)) {
            return null;
        }

        return (<div>
            <BootstrapDropdown
                onChange={(value) => setActiveReport(value)}
                options={reportData.reports.map(report => { return { value: report.name, text: report.description }})}
                value={activeReport} />
        </div>)
    }

    function renderActiveReport() {
        if (activeReport == null) {
            return null;
        }

        const report = reportData.reports.filter(r => r.name === activeReport)[0];
        if (!report) {
            return (<div className="text-warning">Report not found</div>);
        }

        let rowIndex = 0;
        return (<div>
            {isEmpty(report.rows)
                ? (<p className="text-danger fw-bold">No rows</p>)
                : (<table className="table table-striped">
                    <thead>
                    <tr>
                        <th>Player</th>
                        <th>Team</th>
                        <th>Value</th>
                    </tr>
                    </thead>
                    <tbody>
                    {report.rows.map(row => (<tr key={rowIndex++}>
                        <td>{row.playerName}</td>
                        <td>{row.teamName}</td>
                        <td>{row.value}</td>
                    </tr>))}
                    </tbody>
                   </table>)}
        </div>)
    }

    function renderMessages() {
        if (isEmpty(reportData.messages)) {
            return null;
        }

        let index = 0;
        return (<ul>
            {reportData.messages.map(msg => (<li key={index++}>{msg}</li>))}
        </ul>)
    }

    return (<div className="light-background p-3">
        <p>Run reports for the <strong>{divisionData.name}</strong> division and <strong>{divisionData.season.name}</strong> season</p>
        <div className="input-group">
            <div className="input-group-prepend">
                <span className="input-group-text">Return top </span>
            </div>
            <input type="number" min="1" max="100" value={topCount} onChange={(event) => setTopCount(event.target.value)} />
            <div className="input-group-prepend margin-right">
                <span className="input-group-text">records</span>
            </div>
            <button onClick={getReports} className="btn btn-primary">
                {gettingData ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : '📊 '}
                Analyse fixtures...
            </button>
        </div>
        <div className="my-3">
            {reportData && ! gettingData ? renderMessages() : null}
            {reportData && ! gettingData ? renderReportNames() : null}
            {reportData && ! gettingData ? renderActiveReport() : null}
        </div>
    </div>);
}
