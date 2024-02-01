import {any, sortBy} from "../../helpers/collections";
import {TableDto} from "../../interfaces/models/dtos/Data/TableDto";

export interface ITableSelectionProps {
    allTables?: TableDto[];
    selected: string[];
    onTableChange?: (tables: string[]) => Promise<any>;
    requireCanExport?: boolean;
    requireCanImport?: boolean;
}

export function TableSelection({allTables, selected, onTableChange, requireCanExport, requireCanImport}: ITableSelectionProps) {
    async function toggleTable(table: TableDto) {
        if (!onTableChange) {
            return;
        }

        const isSelected = any(selected, (tableName: string) => tableName === table.name);
        if (isSelected) {
            await onTableChange(selected.filter((tableName: string) => tableName !== table.name));
        } else {
            const withSelection: string[] = selected.concat(table.name);
            await onTableChange(withSelection);
        }
    }

    function renderTable(table: TableDto) {
        if ((requireCanExport && !table.canExport) || (requireCanImport && !table.canImport)) {
            return (<li key={table.name} className="list-group-item disabled">
                {table.name}
            </li>);
        }

        return (<li onClick={async () => await toggleTable(table)} key={table.name}
                    className={`list-group-item${selected.indexOf(table.name) !== -1 ? ' active' : ''}`}>
            {table.name}
        </li>);
    }

    return (<ul className="list-group mb-3">
        {allTables ? allTables.sort(sortBy('name')).map(t => renderTable(t)) : (
            <li className="list-group-item">Loading tables...</li>)}
    </ul>);
}