import { useLocation, useNavigate, useParams } from 'react-router';
import { ILiveOptions } from '../../live/ILiveOptions';
import { LiveDataType } from '../../interfaces/models/dtos/Live/LiveDataType';
import { LiveContainer } from '../../live/LiveContainer';
import { LiveSuperleagueTournamentDisplay } from './LiveSuperleagueTournamentDisplay';
import { useEffect, useState } from 'react';
import { TournamentGameDto } from '../../interfaces/models/dtos/Game/TournamentGameDto';
import { useApp } from '../common/AppContainer';
import { SaygLoadingContainer } from './SaygLoadingContainer';
import { any } from '../../helpers/collections';
import { useDependencies } from '../common/IocContainer';
import { renderDate } from '../../helpers/rendering';
import { LoadingSpinnerSmall } from '../common/LoadingSpinnerSmall';
import { QRCodeSVG } from 'qrcode.react';
import { stateChanged } from '../../helpers/events';

interface IIdentifiedUpdate {
    id: string;
}

export interface IUpdateLookup {
    [id: string]: IIdentifiedUpdate;
}

export function LiveSayg() {
    const { fullScreen, divisions } = useApp();
    const { divisionApi } = useDependencies();
    const location = useLocation();
    const navigate = useNavigate();
    const { type } = useParams();
    const liveDataType: LiveDataType =
        type === 'match' ? LiveDataType.sayg : LiveDataType.tournament;
    const search: URLSearchParams = new URLSearchParams(location.search);
    const ids = search.getAll('id');
    const [pendingUpdate, setPendingUpdate] =
        useState<IIdentifiedUpdate | null>(null);
    const [updates, setUpdates] = useState<IUpdateLookup>({});
    const [statusText, setStatusText] = useState<string | null>(null);
    const [findingFixtures, setFindingFixtures] = useState<boolean>(false);
    const [fixturesIdentified, setFixturesIdentified] =
        useState<boolean>(false);
    const [refreshIds, setRefreshIds] = useState<string[]>([]);
    const liveOptions: ILiveOptions = {
        publish: false,
        canSubscribe: true,
        subscribeAtStartup: ids.map((id) => {
            return { id, type: liveDataType };
        }),
    };
    const today = new Date().toISOString().substring(0, 10);
    const date: string = search.get('date') ?? today;

    useEffect(() => {
        if (
            any(ids) ||
            !any(divisions) ||
            findingFixtures ||
            fixturesIdentified
        ) {
            return;
        }

        // noinspection JSIgnoredPromiseFromCall
        watchAllFixturesForToday();
    }, [ids, divisions, findingFixtures]);

    useEffect(() => {
        setFindingFixtures(false);
        setFixturesIdentified(false);
    }, [date, type]);

    useEffect(() => {
        if (!pendingUpdate) {
            return;
        }

        applyPendingUpdate(pendingUpdate);
    }, [pendingUpdate]);

    async function changeDate(newDate: string) {
        const newSearch = new URLSearchParams(location.search);
        if (newDate === today) {
            newSearch.delete('date');
        } else {
            newSearch.set('date', newDate);
        }
        const typeFragment = type ? `/${type}/` : '';
        setStatusText(null);
        const query = newSearch.toString();
        navigate(`/live${typeFragment}${query ? `?${query}` : ''}`);
    }

    async function watchAllFixturesForToday() {
        setFindingFixtures(true);

        try {
            if (type === 'superleague') {
                const divisionIds = divisions
                    .filter((d) => d.superleague)
                    .map((d) => d.id);
                if (divisionIds.length === 0) {
                    setFixturesIdentified(true);
                    setStatusText(`Could not find any superleague divisions`);
                    return;
                }
                setStatusText(
                    `Finding superleague tournaments on ${renderDate(date)}...`,
                );
                const divisionData = await divisionApi.data({
                    date: date,
                    divisionId: divisionIds,
                });

                const superleagueTournaments =
                    divisionData.fixtures?.flatMap(
                        (fd) => fd.tournamentFixtures,
                    ) ?? [];
                if (!any(superleagueTournaments)) {
                    setFixturesIdentified(true);
                    setStatusText(
                        `Could not find any superleague tournaments on ${renderDate(date)}`,
                    );
                    return;
                }

                setStatusText(
                    `Found ${superleagueTournaments?.length ?? 0} superleague tournaments on ${renderDate(date)}, redirecting...`,
                );
                const newSearch = new URLSearchParams(location.search);
                for (const tournament of superleagueTournaments) {
                    newSearch.append('id', tournament!.id!);
                }
                newSearch.delete('date');
                navigate(location.pathname + '?' + newSearch.toString(), {
                    replace: true,
                });
                setStatusText(null);
                setFixturesIdentified(true);
            } else if (type) {
                setStatusText(`Specify the ids for the ${type}'s`);
            }
        } finally {
            setFindingFixtures(false);
        }
    }

    function applyPendingUpdate(update: IIdentifiedUpdate) {
        const newUpdates: IUpdateLookup = Object.assign({}, updates);
        newUpdates[update.id] = update;
        setUpdates(newUpdates);
        setPendingUpdate(null);
    }

    async function dataUpdated(update: IIdentifiedUpdate) {
        setPendingUpdate(update);
    }

    async function removeId(removeId: string) {
        const newSearch = new URLSearchParams(location.search);
        const existingIds = newSearch.getAll('id');
        // this workaround is required as delete('id', id) should only remove one value from the collection
        // The test implementation removes all of them however, which doesn't match the behaviour of the browser
        newSearch.delete('id');
        existingIds
            .filter((id) => id !== removeId)
            .forEach((id) => newSearch.set('id', id));

        navigate(location.pathname + '?' + newSearch.toString());
    }

    function setType(type: string) {
        let pathname = location.pathname;
        if (pathname.endsWith('/')) {
            pathname = pathname.substring(0, pathname.lastIndexOf('/'));
        }
        navigate(pathname + `/${type}/${location.search}`);
    }

    function refresh() {
        if (any(refreshIds)) {
            /* istanbul ignore next */
            return;
        }

        setRefreshIds(ids);
    }

    return (
        <div
            id="full-screen-container"
            className={`content-background p-1 d-flex flex-column justify-content-stretch${fullScreen.isFullScreen ? '' : ' position-relative'}`}>
            {!type || fullScreen.isFullScreen || statusText ? null : (
                <button
                    className="btn btn-primary position-absolute top-0 right-0 m-2"
                    onClick={() =>
                        fullScreen.enterFullScreen(
                            document.getElementById('full-screen-container'),
                        )
                    }>
                    Full screen
                </button>
            )}
            {type && fullScreen.isFullScreen && !statusText ? (
                <button
                    className="btn btn-primary position-absolute top-0 left-0 m-2"
                    onClick={() => refresh()}>
                    {any(refreshIds) ? <LoadingSpinnerSmall /> : null}
                    Refresh
                </button>
            ) : null}
            {type && any(ids) ? (
                <LiveContainer
                    liveOptions={liveOptions}
                    onDataUpdate={dataUpdated}>
                    <div
                        className={`d-flex flex-grow-1 flex-row justify-content-evenly ${fullScreen.isFullScreen ? '' : 'overflow-auto'}`}>
                        {ids.map((id, index) => {
                            if (type === 'match' && ids.length === 1) {
                                return (
                                    <SaygLoadingContainer
                                        key={id}
                                        id={id}
                                        liveOptions={liveOptions}
                                        matchStatisticsOnly={true}
                                    />
                                );
                            }
                            if (type === 'superleague') {
                                return (
                                    <LiveSuperleagueTournamentDisplay
                                        key={id}
                                        data={updates[id] as TournamentGameDto}
                                        id={id}
                                        onRemove={
                                            fullScreen.isFullScreen
                                                ? undefined
                                                : async () => await removeId(id)
                                        }
                                        showLoading={index === 0}
                                        refreshRequired={any(
                                            refreshIds,
                                            (id) => id === id,
                                        )}
                                        refreshComplete={async () =>
                                            setRefreshIds(
                                                refreshIds.filter(
                                                    (id) => id !== id,
                                                ),
                                            )
                                        }
                                        allUpdates={updates}
                                    />
                                );
                            }

                            return (
                                <span key={id}>
                                    Unsupported type: {type}: {id}
                                </span>
                            );
                        })}
                    </div>
                    {fullScreen.isFullScreen && !statusText ? (
                        <div className="position-absolute top-0 right-0 m-2">
                            <QRCodeSVG
                                value={document.location.href}
                                size={75}
                            />
                        </div>
                    ) : null}
                </LiveContainer>
            ) : (
                <div className="p-2">
                    <div className="d-inline-block">
                        <div className="input-group">
                            <div className="input-group-prepend">
                                <span className="input-group-text">Date</span>
                            </div>
                            <input
                                name="liveDate"
                                className="form-control"
                                type="date"
                                value={date}
                                onChange={stateChanged(changeDate)}
                            />
                        </div>
                    </div>
                    {!type ? (
                        <>
                            <h6 className="m-0 py-3">
                                Pick a type of tournament
                            </h6>
                            <button
                                className="btn btn-primary"
                                onClick={() => setType('superleague')}>
                                Superleague
                            </button>
                        </>
                    ) : null}
                </div>
            )}
            {statusText ? (
                <div className="alert alert-warning">{statusText}</div>
            ) : null}
        </div>
    );
}
