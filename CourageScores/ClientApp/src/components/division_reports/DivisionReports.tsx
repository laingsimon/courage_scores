import {useEffect, useState} from 'react';
import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {any, isEmpty, sortBy} from "../../helpers/collections";
import {stateChanged} from "../../helpers/events";
import {useDependencies} from "../common/IocContainer";
import {useDivisionData} from "../league/DivisionDataContainer";
import {Report} from "./Report";
import {ReportGenerationMessages} from "./ReportGenerationMessages";
import {PrintDivisionHeading} from "../league/PrintDivisionHeading";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {useApp} from "../common/AppContainer";
import {ReportCollectionDto} from "../../interfaces/models/dtos/Report/ReportCollectionDto";
import {ReportDto} from "../../interfaces/models/dtos/Report/ReportDto";
import {ReportRequestDto} from "../../interfaces/models/dtos/Report/ReportRequestDto";
import {useLocation, useNavigate} from "react-router-dom";
import {useBranding} from "../common/BrandingContainer";

export function DivisionReports() {
    const {id: divisionId, name, name: divisionName, season} = useDivisionData();
    const {onError} = useApp();
    const location = useLocation();
    const navigate = useNavigate();
    const [reportData, setReportData] = useState<ReportCollectionDto | null>(null);
    const [gettingData, setGettingData] = useState<boolean>(false);
    const {reportApi} = useDependencies();
    const topCount: number = getParameterDefault('top', 15, Number.parseInt);
    const activeReport: string = getParameterDefault<string | null>('report',null, (x: string) => x);
    const {setTitle} = useBranding();

    function getParameterDefault<T>(name: string, defaultValue: T, converter: (value: string) => T): T {
        const search: URLSearchParams = new URLSearchParams(location.search);
        if (search.has(name)) {
            const value: string = search.get(name);
            return converter(value);
        }

        return defaultValue;
    }

    function setParameter(name: string, value: string) {
        const newSearch: URLSearchParams = new URLSearchParams(location.search);
        newSearch.set(name, value);

        navigate(`/division/${divisionName}/reports/${season.name}/?${newSearch}`);
    }

    useEffect(() => {
        if (activeReport) {
            // noinspection JSIgnoredPromiseFromCall
            getReports();
        }
    },
    // eslint-disable-next-line
    []);

    function setActiveReport(report: string) {
        setParameter('report', report);
    }

    function setTopCount(top: number) {
        setParameter('top', top.toString());
    }

    async function getReports() {
        setGettingData(true);

        try {
            const request: ReportRequestDto = {
                divisionId: divisionId,
                seasonId: season.id,
                topCount: getParameterDefault('top', 15, Number.parseInt),
            };
            const result: ReportCollectionDto = await reportApi.getReport(request);
            setReportData(result);
            if (result.reports && any(result.reports)) {
                const selectedReportExists: boolean = any(result.reports, (r: ReportDto) => r.name === activeReport);
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
                options={reportData.reports.sort(sortBy('name')).map((report: ReportDto) => {
                    return {value: report.name, text: report.description}
                })}
                value={activeReport}
                className="d-print-none"/>
        </div>);
    }

    setTitle(`${name}: Reports`);

    const report: ReportDto | null = activeReport && reportData ? reportData.reports.filter((r: ReportDto) => r.name === activeReport)[0] : null;
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
            {report && !gettingData ? (<Report
                rows={report.rows}
                columns={report.columns}
            />) : null}
        </div>
    </div>);
}
