import {isEmpty} from "../../helpers/collections";
import React from "react";

export function ReportGenerationMessages({ messages }) {
    if (isEmpty(messages)) {
        return null;
    }

    return (<div className="d-print-none alert alert-success my-2">
        <ul className="my-0">
            {messages.map((msg, index) => (<li key={index}>{msg}</li>))}
        </ul>
    </div>);
}