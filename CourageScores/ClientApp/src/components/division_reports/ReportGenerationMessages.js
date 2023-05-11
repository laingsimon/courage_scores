import {isEmpty} from "../../Utilities";
import React from "react";

export function ReportGenerationMessages({ messages }) {
    if (isEmpty(messages)) {
        return null;
    }

    return (<ul className="d-print-none">
        {messages.map((msg, index) => (<li key={index}>{msg}</li>))}
    </ul>);
}