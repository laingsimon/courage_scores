import {useLocation, useNavigate, useParams} from "react-router";
import {ILiveOptions} from "../../live/ILiveOptions";
import {LiveDataType} from "../../interfaces/models/dtos/Live/LiveDataType";
import {LiveContainer} from "../../live/LiveContainer";
import {LiveSuperleagueTournamentDisplay} from "./LiveSuperleagueTournamentDisplay";
import {useEffect, useState} from "react";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {useApp} from "../common/AppContainer";
import {SaygLoadingContainer} from "./SaygLoadingContainer";
import {any} from "../../helpers/collections";
import {useDependencies} from "../common/IocContainer";
import {renderDate} from "../../helpers/rendering";

interface IIdentifiedUpdate {
    id: string;
}

interface IUpdateLookup {
    [id: string]: IIdentifiedUpdate;
}

export function LiveSayg() {
    const {fullScreen, divisions} = useApp();
    const {divisionApi} = useDependencies();
    const location = useLocation();
    const navigate = useNavigate();
    const { type } = useParams();
    const liveDataType: LiveDataType = type === 'match'
        ? LiveDataType.sayg
        : LiveDataType.tournament;
    const search: URLSearchParams = new URLSearchParams(location.search);
    const ids = search.getAll('id');
    const [pendingUpdate, setPendingUpdate] = useState<IIdentifiedUpdate | null>(null);
    const [updates, setUpdates] = useState<IUpdateLookup>({});
    const [statusText, setStatusText] = useState<string | null>(null);
    const [findingFixtures, setFindingFixtures] = useState<boolean>(false);
    const liveOptions: ILiveOptions = {
        publish: false,
        canSubscribe: true,
        subscribeAtStartup: ids.map(id => { return { id, type: liveDataType }; }),
    };

    useEffect(() => {
        if (any(ids) || !any(divisions) || findingFixtures) {
            return;
        }

        // noinspection JSIgnoredPromiseFromCall
        watchAllFixturesForToday();
    }, [ids, divisions, findingFixtures]);

    useEffect(() => {
        if (!pendingUpdate) {
            return;
        }

        applyPendingUpdate(pendingUpdate);
    }, [pendingUpdate]);

    async function watchAllFixturesForToday() {
        setFindingFixtures(true);

        if (type === 'superleague') {
            const divisionIds = divisions.filter(d => d.superleague).map(d => d.id);
            if (divisionIds.length === 0) {
                setStatusText(`Could not find any superleague divisions`);
                setFindingFixtures(false);
                return;
            }
            const today = new Date().toISOString().substring(0, 10);
            const date = search.get('date') ?? today;
            setStatusText(`Finding superleague tournaments on ${renderDate(date)}...`);
            const divisionData = await divisionApi.data({
                date: date,
                divisionId: divisionIds,
            });

            const superleagueTournaments = divisionData.fixtures?.flatMap(fd => fd.tournamentFixtures) ?? [];
            if (!any(superleagueTournaments)) {
                setStatusText(`Could not find any superleague tournaments on ${renderDate(date)}`);
                return;
            }

            setStatusText(`Found ${superleagueTournaments?.length ?? 0} superleague tournaments on ${renderDate(date)}, redirecting...`);
            const newSearch = new URLSearchParams(location.search);
            for (const tournament of superleagueTournaments) {
                newSearch.append('id', tournament!.id!);
            }
            newSearch.delete('date');
            navigate(location.pathname + '?' + newSearch.toString(), { replace: true });
            setStatusText(null);
            setFindingFixtures(false);
        } else {
            setStatusText(`Specify the ids for the ${type}'s`);
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
        // this workout is required as delete('id', id) should only remove one value from the collection
        // The test implementation removes all of them however, which doesn't match the behaviour of the browser
        newSearch.delete('id');
        existingIds.filter(id => id !== removeId).forEach(id => newSearch.set('id', id));

        navigate(location.pathname + '?' + newSearch.toString());
    }

    return (<div className={`${fullScreen.isFullScreen ? 'bg-white fs-4 position-absolute top-0 left-0 right-0 bottom-0 d-flex flex-column justify-content-stretch' : 'content-background p-1 position-relative'}`}>
        {fullScreen.isFullScreen || statusText ? null : (<button className="btn btn-primary position-absolute top-0 right-0 m-2" onClick={() => fullScreen.enterFullScreen(document.getElementById('full-screen-container'))}>Full screen</button>)}
        {statusText ? (<div className="alert alert-warning">{statusText}</div>) : null}
        <LiveContainer liveOptions={liveOptions} onDataUpdate={dataUpdated}>
            <div id="full-screen-container" className={`d-flex flex-grow-1 ${fullScreen.isFullScreen ? 'flex-row justify-content-evenly' : 'overflow-auto'}`}>
            {ids.map((id, index) => {
                if (type === 'match' && ids.length === 1) {
                    return (<SaygLoadingContainer key={id} id={id} liveOptions={liveOptions} />);
                }
                if (type === 'superleague') {
                    return (<LiveSuperleagueTournamentDisplay
                        key={id}
                        data={updates[id] as TournamentGameDto}
                        id={id}
                        onRemove={fullScreen.isFullScreen ? undefined : async () => await removeId(id)}
                        showLoading={index === 0}
                    />);
                }

                return (<span key={id}>Unsupported type: {type}: {id}</span>);
            })}
            </div>
        </LiveContainer>
    </div>);
}
