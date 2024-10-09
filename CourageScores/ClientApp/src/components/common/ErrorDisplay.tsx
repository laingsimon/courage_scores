import {useState} from 'react';
import {Dialog} from "./Dialog";
import {useApp} from "./AppContainer";
import {UntypedPromise} from "../../interfaces/UntypedPromise";
import {IServerSideException} from "../../interfaces/IServerSideException";
import {IServerSideError} from "../../interfaces/IServerSideError";

export interface IErrorDisplayProps {
    errors?: any;
    messages?: string[];
    warnings?: string[];
    onClose(): UntypedPromise;
    title?: string;
    Exception?: IServerSideException;
}

export interface IServerSideValidationErrors {
    [ key: string ]: string[];
}

export function ErrorDisplay({errors, messages, warnings, onClose, title, Exception}: IErrorDisplayProps) {
    const [errorReported, setErrorReported] = useState<boolean>(false);
    const {reportClientSideException} = useApp();

    function renderValidationErrors(errors: IServerSideValidationErrors, key?: number) {
        return (<ol className="text-danger" key={key}>
            {Object.keys(errors).map((key: string) => {
                return (<li key={key}>{key} {errors[key].map(((e: string, index: number) => (<p key={index}>{e}</p>)))}</li>)
            })}
        </ol>)
    }

    function renderServerSideException(exc: IServerSideException, key?: number) {
        const type = exc.Type;
        const stack = exc.StackTrace;
        const message = exc.Message;

        return (<div key={key}>
            <h5>Server side error</h5>
            <p><strong>{type}</strong>: {message}</p>
            <pre>{stack ? stack.join('\n') : ''
            }</pre>
        </div>);
    }

    function renderError(e: string | null | IServerSideException | IServerSideValidationErrors | IServerSideError, key: number) {
        if (!e) {
            return null;
        }

        if ((typeof e) === "string") {
            const message: string = e as string;
            return (<p key={key + '_error'} className="text-danger">{message}</p>);
        }

        const serverSideException: IServerSideError = e as IServerSideError;
        if (serverSideException.Exception) {
            return renderServerSideException(serverSideException.Exception, key);
        }

        return renderValidationErrors(e as IServerSideValidationErrors, key);
    }

    if (errors && !errorReported) {
        setErrorReported(true);
        if (errors.length === undefined) {
            reportClientSideException({
                message: Object.keys(errors).map((key: string) => `${key}: ${errors[key]}`).join('\n '),
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
                ? errors.map((e: string, index: number) => {
                    return renderError(e, index);
                })
                : null}
            {errors && errors.length === undefined
                ? (renderValidationErrors(errors as IServerSideValidationErrors))
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
