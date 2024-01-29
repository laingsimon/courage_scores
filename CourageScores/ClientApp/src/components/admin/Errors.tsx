import React, {useState} from "react";
import {sortBy} from "../../helpers/collections";
import {stateChanged} from "../../helpers/events";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {IErrorDetailDto} from "../../interfaces/dtos/IErrorDetailDto";

export function Errors() {
    const [since, setSince] = useState<string>(new Date().toISOString().substring(0, 10));
    const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<IErrorDetailDto[]>([]);
    const [focusedError, setFocusedError] = useState<string | null>(null);
    const {errorApi} = useDependencies();
    const {onError} = useApp();

    async function retrieveErrors() {
        /* istanbul ignore next */
        if (loading) {
            /* istanbul ignore next */
            return;
        }

        setLoading(true);

        try {
            setFocusedError(null);

            const result = await errorApi.getRecent(since);
            setErrors(result);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setLoading(false);
        }
    }

    let errorToShow = null;
    return (<div className="content-background p-3">
        <h3>View recent errors</h3>
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Since</span>
            </div>
            <input type="date" disabled={loading} className="form-control" value={since}
                   onChange={stateChanged(setSince)}/>
            <button className="btn btn-primary margin-right" onClick={retrieveErrors} disabled={loading}>
                {loading
                    ? (<LoadingSpinnerSmall/>)
                    : null}
                Refresh
            </button>
        </div>
        <div>
            <ul className="list-group mb-3">
                {errors.sort(sortBy('time', true)).map(error => {
                    const time = new Date(error.time);
                    const isFocused = focusedError === error.id;
                    if (isFocused) {
                        errorToShow = error;
                    }

                    return (
                        <li className={`list-group-item d-flex justify-content-between align-items-center${isFocused ? ' active' : ''}`}
                            onClick={() => setFocusedError(isFocused ? null : error.id)} key={error.id}>
                            {time.toLocaleDateString()} @ {time.toLocaleTimeString()} - {error.message}
                            <span
                                className={`badge rounded-pill ${error.source === 'Api' ? 'bg-primary' : 'bg-secondary'}`}>
                                {error.source}
                            </span>
                        </li>);
                })}
            </ul>
        </div>
        {focusedError && errorToShow ? (<div className="overflow-auto">
            <h6>Error details @ {new Date(errorToShow.time).toLocaleString()}</h6>
            {errorToShow.url ? (<p>Url: <a href={errorToShow.url}>{errorToShow.url}</a></p>) : null}
            {errorToShow.type ? (<p>Type: {errorToShow.type}</p>) : null}
            {errorToShow.stack ? (<ol>
                {errorToShow.stack.map((frame: string, index: number) => <li key={index} className="no-wrap">{frame}</li>)}
            </ol>) : null}
        </div>) : null}
    </div>);
}
