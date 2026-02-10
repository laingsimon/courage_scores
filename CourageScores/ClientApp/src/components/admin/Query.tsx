import { useAdmin } from './AdminContainer';
import { useState } from 'react';
import {
    BootstrapDropdown,
    IBootstrapDropdownItem,
} from '../common/BootstrapDropdown';
import { any, sortBy } from '../../helpers/collections';
import { LoadingSpinnerSmall } from '../common/LoadingSpinnerSmall';
import { useLocation, useNavigate } from 'react-router';
import { useDependencies } from '../common/IocContainer';
import { QueryRequestDto } from '../../interfaces/models/dtos/Query/QueryRequestDto';
import { useApp } from '../common/AppContainer';
import { QueryResponseDto } from '../../interfaces/models/dtos/Query/QueryResponseDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { stateChanged } from '../../helpers/events';
import { renderDate } from '../../helpers/rendering';
import { isGuid } from '../../helpers/projection';

export function Query() {
    const { onError } = useApp();
    const { tables: containers } = useAdmin();
    const { queryApi } = useDependencies();
    const location = useLocation();
    const navigate = useNavigate();
    const [executing, setExecuting] = useState<boolean>(false);
    const [results, setResults] = useState<
        IClientActionResultDto<QueryResponseDto> | undefined
    >(undefined);
    const containerOptions: IBootstrapDropdownItem[] =
        containers?.sort(sortBy('name')).map((t) => ({
            label: t.name,
            value: t.name,
        })) ?? [];
    const search = new URLSearchParams(location.search);
    const container = search.get('container');
    const query = search.get('query');
    const max = search.get('max');
    const [tentativeQuery, setTentativeQuery] = useState<string>(query || '');

    async function changeParams(name: string, value: string) {
        const newQuery = new URLSearchParams(location.search);
        if (value) {
            newQuery.set(name, value);
        } else {
            newQuery.delete(name);
        }

        if (name === 'container' && value && !newQuery.get('query')) {
            const alias = value.substring(0, 1);
            const query = `select *\nfrom ${value} ${alias}`;
            newQuery.set('query', query);
            setTentativeQuery(query);
        }

        navigate(`/admin/query/?${newQuery}`);
    }

    async function onExecute() {
        if (executing) {
            return;
        }

        if (!container) {
            alert('Select a container first');
            return;
        }
        if (!tentativeQuery) {
            alert('Enter a query first');
            return;
        }

        setExecuting(true);

        try {
            const request: QueryRequestDto = {
                container: container,
                query: tentativeQuery,
                max: max ? Number.parseInt(max) : undefined,
            };

            const results = await queryApi.execute(request);
            setResults(results);
        } catch (e) {
            onError(e);
        } finally {
            setExecuting(false);
        }
    }

    function renderValue(value?: object) {
        if (value === null) {
            return `null`;
        }

        if (typeof value === 'object') {
            return <pre>{JSON.stringify(value, null, 2)}</pre>;
        }

        const stringValue = value as string | undefined;
        const isALink =
            stringValue?.startsWith &&
            (stringValue.startsWith('/') || stringValue.startsWith('http'));
        if (isALink) {
            return <a href={value}>{value}</a>;
        }

        if (
            stringValue?.match &&
            stringValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+Z)?$/)
        ) {
            // date and optional time

            const datePart = renderDate(stringValue?.substring(0, 10));
            const timePart = stringValue.substring(11);
            const isDateOnly = timePart.match(/^[0:.Z]+$/);

            return (
                <abbr title={stringValue}>
                    {datePart}
                    {isDateOnly ? '' : ' @ ' + timePart.substring(0, 5)}
                </abbr>
            );
        }

        if (stringValue?.match && isGuid(stringValue)) {
            const firstPart = stringValue!.substring(0, 4);
            const lastPart = stringValue!.substring(32);

            return (
                <abbr title={stringValue}>
                    {firstPart}-{lastPart}
                </abbr>
            );
        }

        return value;
    }

    function getHeadingLookup(rows?: object[]): string[] {
        const headings: { [key: string]: number } = {};

        if (!rows) {
            return [];
        }

        for (const row of rows) {
            const rowHeadings = Object.keys(row);
            for (let rowHeading of rowHeadings) {
                if (!headings[rowHeading]) {
                    headings[rowHeading] = 1;
                }
            }
        }

        return Object.keys(headings);
    }

    const headingLookup = getHeadingLookup(results?.result?.rows);

    try {
        return (
            <div className="content-background p-3">
                <div className="input-group mb-3">
                    <div className="d-flex pe-3 align-self-center fs-5">
                        Query
                    </div>
                    <BootstrapDropdown
                        onChange={(container) =>
                            changeParams('container', container!)
                        }
                        options={containerOptions}
                        value={container || ''}
                    />
                    <div className="input-group-prepend ms-1">
                        <span className="input-group-text">Limit</span>
                    </div>
                    <input
                        type="number"
                        className="form-control"
                        placeholder="Max"
                        value={max || ''}
                        min={1}
                        onChange={(e) => changeParams('max', e.target.value)}
                    />
                    <button
                        className="btn btn-primary ms-1"
                        onClick={onExecute}>
                        {executing ? <LoadingSpinnerSmall /> : null}
                        Execute
                    </button>
                </div>
                <div>
                    <textarea
                        className="width-100 font-monospace form-control"
                        name="query"
                        value={tentativeQuery}
                        rows={8}
                        onChange={stateChanged(setTentativeQuery)}
                        onBlur={() => changeParams('query', tentativeQuery)}
                    />
                </div>
                <div>
                    {!executing &&
                    results?.success === true &&
                    results.result ? (
                        <div className="overflow-x-auto">
                            <h5>
                                {results.result.rows.length} of{' '}
                                {results.result.rowCount} rows
                            </h5>

                            <table className="table table-sm table-striped">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        {headingLookup.map((heading, index) => (
                                            <th key={index}>{heading}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.result.rows.map(
                                        (row, rowIndex) => (
                                            <tr key={rowIndex}>
                                                <td>{rowIndex + 1}</td>
                                                {headingLookup.map(
                                                    (heading, index) => (
                                                        <td key={index}>
                                                            {renderValue(
                                                                row[heading],
                                                            )}
                                                        </td>
                                                    ),
                                                )}
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                    {!executing && any(results?.errors) ? (
                        <div className="alert alert-danger">
                            {results!.errors?.map((e, i) => (
                                <li key={i}>{e}</li>
                            ))}
                        </div>
                    ) : null}
                    {!executing && any(results?.warnings) ? (
                        <div className="alert alert-warning">
                            {results!.warnings?.map((w, i) => (
                                <li key={i}>{w}</li>
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>
        );
    } catch (e) {
        onError(e);
    }
}
