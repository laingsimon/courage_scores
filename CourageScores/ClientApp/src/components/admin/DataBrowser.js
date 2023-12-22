import {Link, useLocation, useNavigate} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {stateChanged} from "../../helpers/events";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {useDependencies} from "../../IocContainer";
import {renderDate} from "../../helpers/rendering";
import {repeat} from "../../helpers/projection";

export function DataBrowser() {
    const {dataApi} = useDependencies();
    const location = useLocation();
    const navigate = useNavigate();
    const search = new URLSearchParams(location.search);
    const [table, setTable] = useState(search.has('table') ? search.get('table') : '');
    const [id, setId] = useState(search.has('id') ? search.get('id') : '');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState(null);
    const pageSize = 10;
    const [lastRequest, setLastRequest] = useState(null);

    useEffect(() => {
        // noinspection JSIgnoredPromiseFromCall
        fetchData();
    },
    // eslint-disable-next-line
    [location]);

    async function fetchData() {
        const table = search.has('table') ? search.get('table') : '';
        const id = search.has('id') ? search.get('id') : '';

        const newRequest = {table, id: id ? id : null};
        if (lastRequest && newRequest.table && lastRequest.table === newRequest.table && lastRequest.id === newRequest.id) {
            // no change to request
            return;
        }
        setLastRequest(newRequest);
        setId(id);
        setTable(table);

        /* istanbul ignore next */
        if (loading) {
            /* istanbul ignore next */
            return;
        }

        setLoading(true);
        try {
            setResponse(null);
            const response = await dataApi.browse(table, id);
            setResponse(response);
        }
        catch (e) {
            setResponse({
                 errors: [e.message]
            });
        }
        finally {
            setLoading(false);
        }
    }

    function getPages() {
        if (!response || !response.result) {
            return [];
        }

        const noOfItems = response.result.length;
        const noOfPages = Math.ceil(noOfItems / pageSize);

        return repeat(noOfPages);
    }

    async function updateSearch(newId) {
        if (!table) {
            window.alert('Enter a table name (and optionally an id) first');
            return;
        }

        const idQuery = newId ? `&id=${newId}` : '';
        navigate(`/admin/browser/?table=${table}${idQuery}`);
    }

    function renderItem(data) {
        return (<table className="table table-sm">
            <tbody>
            {Object.keys(data).map(key => (<tr key={key}><td>{key}</td><td>{data[key]}</td></tr>))}
            </tbody>
        </table>);
    }

    function renderResponse() {
        if (response.result.id) {
            return renderItem(response.result);
        }

        const pageIndex = search.has('page') ? Number.parseInt(search.get('page')) : 0;
        const minIndexInclusive = pageIndex * pageSize;
        const maxIndexExclusive = minIndexInclusive + pageSize;

        return (<>
            <ul className="list-group">
                {response.result.map((item, index) => index >= minIndexInclusive && index < maxIndexExclusive ? (<Link to={`/admin/browser?table=${table}&id=${item.id}`} key={item.id} className="list-group-item d-flex justify-content-between" onClick={() => updateSearch(id)}>
                    <span>{item.id}</span>
                    {item.name ? (<span>{item.name}</span>) : null}
                    {item.date ? (<span>{renderDate(item.date)}</span>) : null}
                </Link>) : null)}
            </ul>
            <div className="d-flex flex-wrap flex-shrink-0 flex-grow-1" datatype="pages">
                {getPages().map(index => (<Link
                    key={index + ''}
                    to={`/admin/browser?table=${table}&page=${index}`}
                    className={`btn btn-sm ${index === pageIndex ? 'btn-primary' : 'btn-outline-primary'}`}>
                    {index + 1}
                </Link>))}
            </div>
        </>);
    }

    return (<div className="content-background p-3">
        <h3>Data Browser</h3>
        <div className="input-group mb-3">
            <div className="input-group-prepend">
                <span className="input-group-text">Table</span>
            </div>
            <input disabled={loading} className="form-control" name="table" value={table}
                   onChange={stateChanged(setTable)}/>
            <div className="input-group-prepend">
                <span className="input-group-text">Id</span>
            </div>
            <input disabled={loading} className="form-control" name="id" value={id} placeholder="optional"
                   onChange={stateChanged(setId)}/>
            <button className="btn btn-primary" disabled={loading} onClick={() => updateSearch(id)}>
                {loading ? <LoadingSpinnerSmall /> : null}
                Fetch
            </button>
        </div>
        {loading || !response ? null : (<div>
            {response.success ? renderResponse() : null}
            {response.errors && response.errors.length ? (<ol>{response.errors.map((msg, index) => (<li key={index}>{msg}</li>))}</ol>) : null}
            {response.errors && response.status ? (<div className="text-danger">
                Status: {response.status}
                {Object.keys(response.errors).map(key => (<li key={key}>{key}: {response.errors[key]}</li>))}
            </div>) : null}
        </div>)}
    </div>);
}