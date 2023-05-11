import {isEmpty} from "../../Utilities";
import React from "react";
import {NoRows} from "./NoRows";

export function Report({ rows, valueHeading }) {
    if (isEmpty(rows)) {
        return (<NoRows />);
    }

    return (<div>
        <table className="table table-striped">
            <thead>
            <tr>
                <th className="narrow-column"></th>
                <th>Player</th>
                <th>Team</th>
                <th>{valueHeading}</th>
            </tr>
            </thead>
            <tbody>
            {rows.map((row, rowIndex) => (<tr key={rowIndex}>
                <td>{rowIndex + 1}</td>
                <td>{row.playerName}</td>
                <td>{row.teamName}</td>
                <td>{row.value}</td>
            </tr>))}
            </tbody>
        </table>
    </div>);
}