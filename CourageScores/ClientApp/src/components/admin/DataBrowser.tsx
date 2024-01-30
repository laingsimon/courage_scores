import {Link, useLocation, useNavigate} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {stateChanged} from "../../helpers/events";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {useDependencies} from "../../IocContainer";
import {renderDate} from "../../helpers/rendering";
import {repeat} from "../../helpers/projection";
import {ISingleDataResultDto} from "../../interfaces/models/dtos/Data/ISingleDataResultDto";
import {IClientActionResultDto} from "../../interfaces/IClientActionResultDto";

export function DataBrowser() {
    const {dataApi} = useDependencies();
    const location = useLocation();
    const navigate = useNavigate();
    const search = new URLSearchParams(location.search);
    const [table, setTable] = useState<string>(search.has('table') ? search.get('table') : '');
    const [id, setId] = useState<string>(search.has('id') ? search.get('id') : '');
    const [loading, setLoading] = useState<boolean>(false);
    const [response, setResponse] = useState<IClientActionResultDto<ISingleDataResultDto[]> | IClientActionResultDto<ISingleDataResultDto> | null>(null);
    const pageSize = 10;
    const [lastRequest, setLastRequest] = useState<{ table: string, id: string } | null>(null);

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
        if (!newRequest.table) {
            return;
        }

        if (lastRequest && lastRequest.table === newRequest.table && lastRequest.id === newRequest.id) {
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
            const response: IClientActionResultDto<ISingleDataResultDto> | IClientActionResultDto<ISingleDataResultDto[]> = id
                ? await dataApi.getRecord(table, id)
                : await dataApi.getRows(table);
            setResponse(response);
        }
        catch (e) {
            setResponse({
                 errors: [(e as Error).message]
            });
        }
        finally {
            setLoading(false);
        }
    }

    function getPages() {
        const noOfItems = (response as IClientActionResultDto<ISingleDataResultDto[]>).result.length;
        const noOfPages = Math.ceil(noOfItems / pageSize);

        return repeat(noOfPages);
    }

    async function updateSearch(newId: string) {
        if (!table) {
            window.alert('Enter a table name (and optionally an id) first');
            return;
        }

        const idQuery = newId ? `&id=${newId}` : '';
        navigate(`/admin/browser/?table=${table}${idQuery}`);
    }

    function renderValue(_: string, value: string) {
        if (value && value.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
            return (<abbr title={value}>{renderDate(value)}</abbr>);
        }

        return value;
    }

    function renderItem(data: ISingleDataResultDto) {
        return (<table className="table table-sm">
            <tbody>
            {Object.keys(data).map((key: string) => (<tr key={key}>
                <td style={{ textTransform: 'capitalize' }}>{key}</td>
                <td>{renderValue(key, data[key])}</td>
            </tr>))}
            </tbody>
        </table>);
    }

    function renderResponse() {
        if ((response as IClientActionResultDto<ISingleDataResultDto>).result.id) {
            return renderItem((response as IClientActionResultDto<ISingleDataResultDto>).result);
        }

        const pageIndex = search.has('page') ? Number.parseInt(search.get('page')) : 0;
        const minIndexInclusive = pageIndex * pageSize;
        const maxIndexExclusive = minIndexInclusive + pageSize;
        const allItems = response as IClientActionResultDto<ISingleDataResultDto[]>;

        return (<>
            <ul className="list-group">
                {allItems.result.map((item: ISingleDataResultDto, index: number) => index >= minIndexInclusive && index < maxIndexExclusive ? (<Link to={`/admin/browser?table=${table}&id=${item.id}`} key={item.id} className="list-group-item d-flex justify-content-between" onClick={() => updateSearch(id)}>
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
                {Object.keys(response.errors).map((key: string) => (<li key={key}>{key}: {response.errors[key]}</li>))}
            </div>) : null}
        </div>)}
    </div>);
}