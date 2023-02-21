import React from 'react';
import {sortBy} from "../../Utilities";

export function TableSelection({ allTables, selected, onTableChange, requireCanExport, requireCanImport }) {
    async function toggleTable(table) {
        if (!onTableChange) {
            return;
        }

        const isSelected = selected.filter(tableName => tableName === table.name).length >= 1;
        if (isSelected) {
            await onTableChange(selected.filter(tableName => tableName !== table.name));
        } else {
            const withSelection = selected.concat(table.name);
            await onTableChange(withSelection);
        }
    }

    function renderTable(table) {
        if ((requireCanExport && !table.canExport) || (requireCanImport && !table.canImport)) {
            return (<li key={table.name} className="list-group-item disabled">
                {table.name}
            </li>);
        }

        return (<li onClick={async () => await toggleTable(table)} key={table.name} className={`list-group-item${selected.indexOf(table.name) !== -1 ? ' active' : ''}`}>
            {table.name}
        </li>);
    }

    return (<ul className="list-group mb-3">
        {allTables ? allTables.sort(sortBy('name')).map(t => renderTable(t)) : (<li className="list-group-item">Loading tables...</li>)}
    </ul>);
}