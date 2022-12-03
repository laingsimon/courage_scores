import React, { useState } from 'react';
import {ReportApi} from "../../api/report";
import {Http} from "../../api/http";
import {Settings} from "../../api/settings";
import {BootstrapDropdown} from "../common/BootstrapDropdown";

export function DivisionReports({ divisionData }) {
    const [ reportData, setReportData ] = useState(null);
    const [ gettingData, setGettingData ] = useState(false);
    const [ activeReport, setActiveReport ] = useState(null);
    const api = new ReportApi(new Http(new Settings()));

    async function getReports() {
        setGettingData(true);

        try {
            const result = await api.get(divisionData.id, divisionData.season.id);
            setReportData(result);
            if (result.reports.length > 0) {
                setActiveReport(result.reports[0].name);
            } else {
                setActiveReport(null);
            }
        } finally {
            setGettingData(false);
        }
    }

    function renderReportNames() {
        if (!reportData.reports.length) {
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
            {report.rows.length === 0
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
        if (!reportData.messages.length) {
            return null;
        }

        var index = 0;
        return (<ul>
            {reportData.messages.map(msg => (<li key={index++}>{msg}</li>))}
        </ul>)
    }

    return (<div className="light-background p-3">
        <p>Run reports for the <strong>{divisionData.name}</strong> division and <strong>{divisionData.season.name}</strong> season</p>
        <button onClick={getReports} className="btn btn-primary">
            {gettingData ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
            Analyse fixtures...
        </button>
        <div className="my-3">
            {reportData && ! gettingData ? renderMessages() : null}
            {reportData && ! gettingData ? renderReportNames() : null}
            {reportData && ! gettingData ? renderActiveReport() : null}
        </div>
    </div>);
}