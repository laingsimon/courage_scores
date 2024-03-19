import {isEmpty} from "../../helpers/collections";
import {NoRows} from "./NoRows";
import {ReportRowDto} from "../../interfaces/models/dtos/Report/ReportRowDto";
import {ReportCellDto} from "../../interfaces/models/dtos/Report/ReportCellDto";
import {repeat} from "../../helpers/projection";

export interface IReportProps {
    rows: ReportRowDto[];
    columns: string[];
}

export function Report({rows, columns}: IReportProps) {
    if (isEmpty(rows)) {
        return (<NoRows/>);
    }

    const maxColumnWidth: number = columns.length;
    return (<div className="clear-float">
        <table className="table table-striped">
            <thead>
            <tr>
                <th className="narrow-column"></th>
                {columns.map((col: string, index: number) => (<th key={index}>{col}</th>))}
            </tr>
            </thead>
            <tbody>
            {rows.map((row: ReportRowDto, rowIndex: number) => (<tr key={rowIndex}>
                <td>{rowIndex + 1}</td>
                {row.cells.map((cell: ReportCellDto, cellIndex: number) => (<td key={cellIndex}>{cell.text}</td>))}
                {repeat(maxColumnWidth - row.cells.length, (index: number) => <td key={`empty_${index}`}></td>)}
            </tr>))}
            </tbody>
        </table>
    </div>);
}