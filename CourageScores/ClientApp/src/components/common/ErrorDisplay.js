import React, {useState} from 'react';
import {Dialog} from "./Dialog";
import {useApp} from "../../AppContainer";

export function ErrorDisplay({errors, messages, warnings, onClose, title, Exception}) {
    const [errorReported, setErrorReported] = useState(false);
    const {reportClientSideException} = useApp();

    function renderValidationErrors(errors) {
        return (<ol className="text-danger">
            {Object.keys(errors).map(key => {
                return (<li key={key}>{key} {errors[key].map((e, index) => (<p key={index}>{e}</p>))}</li>)
            })}
        </ol>)
    }

    function renderServerSideException(exc) {
        const type = exc.Type;
        const stack = exc.StackTrace;
        const message = exc.Message;

        return (<div>
            <h5>Server side error</h5>
            <p><strong>{type}</strong>: {message}</p>
            <pre>{stack ? stack.join('\n') : ''
            }</pre>
        </div>);
    }

    if (errors && !errorReported) {
        setErrorReported(true);
        if (errors.length === undefined) {
            reportClientSideException({
                message: Object.keys(errors).map(key => `${key}: ${errors[key]}`).join('\n '),
                stack: null,
                type: 'Server Validation error',
            });
        } else {
            reportClientSideException({
                message: errors.join('\n'),
                stack: null,
            });
        }
    }

    return (<Dialog onClose={onClose} title={title || 'There was an error'}>
        <div>
            {Exception ? renderServerSideException(Exception) : null}
            {errors && errors.length !== undefined
                ? errors.map((e, index) => (<p key={index + '_error'} className="text-danger">{e}</p>))
                : null}
            {errors && errors.length === undefined
                ? (renderValidationErrors(errors))
                : null}
            {warnings
                ? warnings.map((w, index) => (<p key={index + '_warning'} className="text-warning">{w}</p>))
                : null}
            {messages
                ? messages.map((m, index) => (<p key={index + '_message'} className="text-primary">{m}</p>))
                : null}
        </div>
    </Dialog>);
}
