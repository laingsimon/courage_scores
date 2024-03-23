import {Link, useLocation, useNavigate} from "react-router-dom";
import {useEffect, useState, ChangeEvent} from "react";
import {stateChanged} from "../../helpers/events";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {useDependencies} from "../common/IocContainer";
import {renderDate} from "../../helpers/rendering";
import {repeat} from "../../helpers/projection";
import {SingleDataResultDto} from "../../interfaces/models/dtos/Data/SingleDataResultDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {useApp} from "../common/AppContainer";

export function DataBrowser() {
    const {onError} = useApp();
    const {dataApi} = useDependencies();
    const location = useLocation();
    const navigate = useNavigate();
    const search = new URLSearchParams(location.search);
    const [table, setTable] = useState<string>(search.has('table') ? search.get('table') : '');
    const [id, setId] = useState<string>(search.has('id') ? search.get('id') : '');
    const [loading, setLoading] = useState<boolean>(false);
    const [response, setResponse] = useState<IClientActionResultDto<SingleDataResultDto[]> | IClientActionResultDto<object> | null>(null);
    const [lastRequest, setLastRequest] = useState<{ table: string, id: string } | null>(null);
    const pageSize: number = getViewParameter('pageSize', 10);
    const showEmptyValues = getViewParameter('showEmptyValues', false);
    const showAuditValues = getViewParameter('showAuditValues', false);
    const showVersion = getViewParameter('showVersion', false);
    const showIdsUptoDepth: number = getViewParameter('showIdsUptoDepth', 1);

    useEffect(() => {
        // noinspection JSIgnoredPromiseFromCall
        fetchData();
    },
    // eslint-disable-next-line
    [location]);

    function getViewParameter<T>(name: string, defaultValue: T): T {
        if (!search.has(name) || !search.get(name)) {
            return defaultValue;
        }

        const value: string = search.get(name).toLowerCase().trim();
        if (typeof defaultValue === 'boolean') {
            return (value === 'true' || value === '1') as any;
        }
        if (typeof defaultValue === 'number') {
            const numberValue = Number.parseInt(value);
            if (Number.isFinite(numberValue)) {
                return numberValue as any;
            }
        }

        return value as any;
    }

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
            const response: IClientActionResultDto<object> | IClientActionResultDto<SingleDataResultDto[]> = id
                ? await dataApi.view(table, id)
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
        const noOfItems = (response as IClientActionResultDto<SingleDataResultDto[]>).result.length;
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

    function renderValue(value: any, depth: number) {
        if (typeof value === "string" && value.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
            return (<abbr title={value} onClick={() => window.alert(value)}>{renderDate(value)}</abbr>);
        }

        if (value && typeof value === "object") {
            return renderItem(value, depth + 1);
        }

        return value;
    }

    function shouldShowProperty(key: string, value: any, depth: number): boolean {
        if (key.startsWith('_')) {
            return false;
        }

        switch (key) {
            case 'Remover':
            case 'Deleted':
            case 'Updated':
            case 'Editor':
            case 'Created':
            case 'Author':
                return !!value && showAuditValues;
            case 'Version':
                return value !== '1' && showVersion;
            case 'id':
                return depth <= showIdsUptoDepth;
        }

        return value || showEmptyValues;
    }

    function renderViewToggleOption(name: string, currentValue: boolean, description: string, defaultValue: boolean) {
        async function updateViewOption(event: ChangeEvent<HTMLInputElement>) {
            const checkedState: boolean = event.target.checked;
            const currentSearch: URLSearchParams = search;
            if (checkedState === defaultValue) {
                currentSearch.delete(name);
            } else {
                currentSearch.set(name, checkedState ? 'true' : 'false');
            }

            navigate(location.pathname + '/?' + currentSearch);
        }

        return (<div className="input-group mb-3">
            <div className="form-check form-switch margin-right">
                <input className="form-check-input" type="checkbox" id={name} name={name} checked={currentValue} onChange={updateViewOption} />
                <label className="form-check-label" htmlFor={name}>
                    {description}
                </label>
            </div>
        </div>);
    }

    function renderViewOptions() {
        return (<tr>
            <td colSpan={2}>
                <div className="d-flex flex-row">
                {renderViewToggleOption('showAuditValues', showAuditValues, 'Show audit values', false)}
                {renderViewToggleOption('showEmptyValues', showEmptyValues, 'Show empty values', false)}
                {renderViewToggleOption('showVersion', showVersion, 'Show version', false)}
                </div>
            </td>
        </tr>);
    }

    function renderItem(data: object, depth: number) {
        return (<table className="table table-sm">
            {depth === 1 ? (<thead>{renderViewOptions()}</thead>) : null}
            <tbody>
            {Object.keys(data).filter(key => shouldShowProperty(key, data[key], depth)).map((key: string) => (<tr key={key}>
                <td style={{ textTransform: 'capitalize' }}>{key}</td>
                <td>{renderValue(data[key], depth)}</td>
            </tr>))}
            </tbody>
        </table>);
    }

    function renderResponse() {
        const maybeSingleResponse: IClientActionResultDto<object & { id: string }> = response as IClientActionResultDto<object & { id: string }>;
        if (maybeSingleResponse && maybeSingleResponse.result && maybeSingleResponse.result.id) {
            return renderItem((response as IClientActionResultDto<object>).result, 1);
        }

        const pageIndex = search.has('page') ? Number.parseInt(search.get('page')) : 0;
        const minIndexInclusive = pageIndex * pageSize;
        const maxIndexExclusive = minIndexInclusive + pageSize;
        const allItems = response as IClientActionResultDto<SingleDataResultDto[]>;

        return (<>
            <ul className="list-group">
                {allItems.result.map((item: SingleDataResultDto, index: number) => index >= minIndexInclusive && index < maxIndexExclusive ? (<Link to={`/admin/browser?table=${table}&id=${item.id}`} key={item.id} className="list-group-item d-flex justify-content-between" onClick={() => updateSearch(id)}>
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

    try {
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
                    {loading ? <LoadingSpinnerSmall/> : null}
                    Fetch
                </button>
            </div>
            {loading || !response ? null : (<div>
                {response.success ? renderResponse() : null}
                {response.errors && response.errors.length ? (
                    <ol>{response.errors.map((msg, index) => (<li key={index}>{msg}</li>))}</ol>) : null}
                {response.errors && response.status ? (<div className="text-danger">
                    Status: {response.status}
                    {Object.keys(response.errors).map((key: string) => (
                        <li key={key}>{key}: {response.errors[key]}</li>))}
                </div>) : null}
            </div>)}
        </div>);
    } catch (e) {
        onError(e);
    }
}