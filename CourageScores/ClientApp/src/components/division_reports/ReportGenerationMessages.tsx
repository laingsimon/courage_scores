import {isEmpty} from "../../helpers/collections";
import React from "react";

export interface IReportGenerationMessagesProps {
    messages: string[];
}

export function ReportGenerationMessages({messages}: IReportGenerationMessagesProps) {
    if (isEmpty(messages)) {
        return null;
    }

    return (<div className="d-print-none alert alert-success my-2">
        <ul className="my-0">
            {messages.map((msg: string, index: number) => (<li key={index}>{msg}</li>))}
        </ul>
    </div>);
}