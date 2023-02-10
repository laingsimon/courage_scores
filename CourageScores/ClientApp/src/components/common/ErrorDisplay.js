import React from 'react';
import {Dialog} from "./Dialog";

export function ErrorDisplay({ errors, messages, warnings, onClose, title, Exception }) {
    let index = 0;

    function renderValidationErrors(errors) {
        return (<ol className="text-danger">
            {Object.keys(errors).map(key => {
                return (<li key={key}>{key} {errors[key].map(e => (<p key={index++}>{e}</p>))}</li>)
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
            <pre>{stack.join('\n')}</pre>
        </div>);
    }

    return (<Dialog onClose={onClose} title={title || 'There was an error'}>
        <div>
             {Exception ? renderServerSideException(Exception) : null}
             {errors && errors.length ? errors.map(e => (<p key={index++} className="text-danger">{e}</p>)) : null}
             {errors && !errors.length ? (renderValidationErrors(errors)): null}
             {warnings ? warnings.map(w => (<p key={index++} className="text-warning">{w}</p>)) : null}
             {messages ? messages.map(m => (<p key={index++} className="text-primary">{m}</p>)) : null}
       </div>
       </Dialog>);
}
