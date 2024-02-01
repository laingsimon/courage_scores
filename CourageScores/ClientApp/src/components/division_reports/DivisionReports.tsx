import React, {useState} from 'react';
import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {any, isEmpty, sortBy} from "../../helpers/collections";
import {stateChanged} from "../../helpers/events";
import {useDependencies} from "../../IocContainer";
import {useDivisionData} from "../DivisionDataContainer";
import {Report} from "./Report";
import {ReportGenerationMessages} from "./ReportGenerationMessages";
import {PrintDivisionHeading} from "../PrintDivisionHeading";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {useApp} from "../../AppContainer";
import {ReportCollectionDto} from "../../interfaces/models/dtos/Report/ReportCollectionDto";
import {ReportDto} from "../../interfaces/models/dtos/Report/ReportDto";

export function DivisionReports() {
    const {id: divisionId, season} = useDivisionData();
    const [reportData, setReportData] = useState<ReportCollectionDto | null>(null);
    const [gettingData, setGettingData] = useState<boolean>(false);
    const [topCount, setTopCount] = useState<number>(15);
    const [activeReport, setActiveReport] = useState<string | null>(null);
    const {reportApi} = useDependencies();
    const {onError} = useApp();

    async function getReports() {
        setGettingData(true);

        try {
            const request = {
                divisionId: divisionId,
                seasonId: season.id,
                topCount: topCount
            };
            const result = await reportApi.getReport(request);
            setReportData(result);
            if (result.reports && any(result.reports)) {
                const selectedReportExists = any(result.reports, (r: ReportDto) => r.name === activeReport);
                if (!selectedReportExists) {
                    setActiveReport(result.reports[0].name);
                }
            } else if ((result as any).Exception) {
                onError((result as any).Exception.Message);
            } else {
                setActiveReport(null);
            }
        } catch (e) {
            // istanbul ignore next
            onError(e);
        } finally {
            setGettingData(false);
        }
    }

    function renderReportNames() {
        if (isEmpty(reportData.reports || [])) {
            return null;
        }

        return (<div className="d-print-none">
            <span className="margin-right">Show:</span>
            <BootstrapDropdown
                onChange={async (v: string) => setActiveReport(v)}
                options={reportData.reports.sort(sortBy('name')).map(report => {
                    return {value: report.name, text: report.description}
                })}
                value={activeReport}
                className="d-print-none"/>
        </div>);
    }

    const report: ReportDto | null = activeReport ? reportData.reports.filter(r => r.name === activeReport)[0] : null;
    return (<div className="content-background p-3">
        <PrintDivisionHeading hideDivision={report && !report.thisDivisionOnly}/>
        <div className="input-group d-print-none">
            <div className="input-group-prepend">
                <label htmlFor="topCount" className="input-group-text">Return top </label>
            </div>
            <input className="form-control" type="number" min="1" max="100" value={topCount} id="topCount"
                   onChange={stateChanged(setTopCount)}/>
            <div className="input-group-prepend margin-right">
                <label htmlFor="topCount" className="input-group-text">records</label>
            </div>
            <button onClick={getReports} className="btn btn-primary">
                {gettingData
                    ? (<LoadingSpinnerSmall/>)
                    : '📊 '}
                Get reports...
            </button>
        </div>
        <div>
            {reportData && !gettingData && reportData.messages ? (<ReportGenerationMessages messages={reportData.messages}/>) : null}
            {reportData && !gettingData ? renderReportNames() : null}
            {activeReport ? (<div className="d-screen-none">
                <strong className="fs-3 float-left">{activeReport}</strong>
            </div>) : null}
            {report && !gettingData ? (<Report rows={report.rows} valueHeading={report.valueHeading}/>) : null}
        </div>
    </div>);
}
