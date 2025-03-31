import {useLocation, useNavigate, useParams} from "react-router";
import {ILiveOptions} from "../../live/ILiveOptions";
import {LiveDataType} from "../../interfaces/models/dtos/Live/LiveDataType";
import {LiveContainer} from "../../live/LiveContainer";
import {LiveSuperleagueTournamentDisplay} from "./LiveSuperleagueTournamentDisplay";
import {useEffect, useState} from "react";
import {TournamentGameDto} from "../../interfaces/models/dtos/Game/TournamentGameDto";
import {useApp} from "../common/AppContainer";
import {SaygLoadingContainer} from "./SaygLoadingContainer";

interface IIdentifiedUpdate {
    id: string;
}

interface IUpdateLookup {
    [id: string]: IIdentifiedUpdate;
}

export function LiveSayg() {
    const {fullScreen} = useApp();
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
    const liveOptions: ILiveOptions = {
        publish: false,
        canSubscribe: true,
        subscribeAtStartup: ids.map(id => { return { id, type: liveDataType }; }),
    };

    useEffect(() => {
        if (!pendingUpdate) {
            return;
        }

        applyPendingUpdate(pendingUpdate);
    }, [pendingUpdate]);

    function applyPendingUpdate(update: IIdentifiedUpdate) {
        const newUpdates: IUpdateLookup = Object.assign({}, updates);
        newUpdates[update.id] = update;
        setUpdates(newUpdates);
        setPendingUpdate(null);
    }

    async function dataUpdated(update: IIdentifiedUpdate) {
        setPendingUpdate(update);
    }

    async function removeId(id: string) {
        const newSearch = new URLSearchParams(location.search);
        newSearch.delete('id', id);

        navigate(location.pathname + '?' + newSearch.toString());
    }

    return (<div className={`${fullScreen.isFullScreen ? 'bg-white fs-4 position-absolute top-0 left-0 right-0 bottom-0 d-flex flex-column justify-content-stretch' : 'content-background p-3 pb-1 position-relative'}`}>
        {fullScreen.isFullScreen ? null : (<button className="btn btn-primary position-absolute top-0 right-0 m-2" onClick={() => fullScreen.enterFullScreen()}>Full screen</button>)}
        <LiveContainer liveOptions={liveOptions} onDataUpdate={dataUpdated}>
            <div className={`d-flex flex-grow-1 ${fullScreen.isFullScreen ? 'flex-row justify-content-evenly' : 'overflow-auto'}`}>
            {ids.map(id => {
                if (type === 'match' && ids.length === 1) {
                    return (<SaygLoadingContainer key={id} id={id} liveOptions={liveOptions} />);
                }
                if (type === 'superleague') {
                    return (<LiveSuperleagueTournamentDisplay
                        key={id}
                        data={updates[id] as TournamentGameDto}
                        id={id}
                        onRemove={fullScreen.isFullScreen ? undefined : async () => await removeId(id)}
                    />);
                }

                return (<span key={id}>Unsupported type: {type}: {id}</span>);
            })}
            </div>
        </LiveContainer>
    </div>);
}