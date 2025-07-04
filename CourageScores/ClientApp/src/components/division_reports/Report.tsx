import { isEmpty } from '../../helpers/collections';
import { NoRows } from './NoRows';
import { ReportRowDto } from '../../interfaces/models/dtos/Report/ReportRowDto';
import { ReportCellDto } from '../../interfaces/models/dtos/Report/ReportCellDto';
import { Link } from 'react-router';
import { useDivisionData } from '../league/DivisionDataContainer';
import { repeat } from '../../helpers/projection';
import { ReactNode } from 'react';

export interface IReportProps {
    rows: ReportRowDto[];
    columns: string[];
}

export function Report({ rows, columns }: IReportProps) {
    const { season } = useDivisionData();

    if (isEmpty(rows)) {
        return <NoRows />;
    }

    function renderReportCell(cell: ReportCellDto, cellIndex: number) {
        let content: string | ReactNode = cell.text;

        const player: string | undefined = cell.playerName || cell.playerId;
        const team: string | undefined = cell.teamName || cell.teamId;
        const division: string | undefined =
            cell.divisionName || cell.divisionId;

        if (cell.tournamentId) {
            content = (
                <Link to={`/tournament/${cell.tournamentId}`}>{cell.text}</Link>
            );
        } else if (player && team && division) {
            content = (
                <Link
                    to={`/division/${division}/player:${player}@${team}/${season!.name}`}>
                    {cell.text}
                </Link>
            );
        } else if (team && division) {
            content = (
                <Link to={`/division/${division}/team:${team}/${season!.name}`}>
                    {cell.text}
                </Link>
            );
        }

        return <td key={cellIndex}>{content}</td>;
    }

    const maxColumnWidth: number = columns.length;
    return (
        <div className="clear-float">
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th className="narrow-column"></th>
                        {columns.map((col: string, index: number) => (
                            <th key={index}>{col}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row: ReportRowDto, rowIndex: number) => (
                        <tr key={rowIndex}>
                            <td>{rowIndex + 1}</td>
                            {row.cells!.map(renderReportCell)}
                            {repeat(
                                maxColumnWidth - row.cells!.length,
                                (index: number) => (
                                    <td key={`empty_${index}`}></td>
                                ),
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
