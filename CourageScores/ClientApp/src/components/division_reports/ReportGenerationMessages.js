import {isEmpty} from "../../Utilities";
import React from "react";

export function ReportGenerationMessages({ messages }) {
    if (isEmpty(messages)) {
        return null;
    }

    let index = 0;
    return (<ul className="d-print-none">
        {messages.map(msg => (<li key={index++}>{msg}</li>))}
    </ul>);
}