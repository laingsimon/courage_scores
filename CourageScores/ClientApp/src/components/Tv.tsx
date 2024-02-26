import {useDependencies} from "./common/IocContainer";
import {useEffect, useState} from "react";
import {WatchableDataDto} from "../interfaces/models/dtos/Live/WatchableDataDto";
import {LoadingSpinnerSmall} from "./common/LoadingSpinnerSmall";
import {LiveDataType} from "../interfaces/models/dtos/Live/LiveDataType";
import {PublicationMode} from "../interfaces/models/dtos/Live/PublicationMode";

export function Tv() {
    const {liveApi} = useDependencies();
    const [loading, setLoading] = useState(false);
    const [connections, setConnections] = useState(null);

    useEffect(() => {
        // noinspection JSIgnoredPromiseFromCall
        reloadConnections();
    },
    // eslint-disable-next-line
    []);

    async function reloadConnections() {
        if (loading) {
            return;
        }

        try {
            setLoading(true);
            const connections: WatchableDataDto[] = await liveApi.watch('');
            setConnections(connections);
        } finally {
            setLoading(false);
        }
    }

    function getHref(connection: WatchableDataDto) {
        if (connection.absoluteUrl) {
            return connection.absoluteUrl;
        }

        return connection.relativeUrl;
    }

    function getDataType(dataType: LiveDataType): string {
        switch (dataType) {
            case LiveDataType.sayg:
                return 'Live match';
            case LiveDataType.tournament:
                return 'Tournament';
            default:
                return dataType;
        }
    }

    function getPublicationMode(connection: WatchableDataDto): JSX.Element {
        const lastUpdateTime: string = connection.lastUpdate
            ? ' @ ' + connection.lastUpdate.substring(11).substring(0, 8)
            : null;

        switch (connection.publicationMode as PublicationMode){
            case PublicationMode.polling:
                return (<span className="badge rounded-pill bg-secondary">{lastUpdateTime}</span>);
            case PublicationMode.webSocket:
                return (<span className="badge rounded-pill bg-primary">{lastUpdateTime}</span>);
            default:
                return null;
        }
    }

    return (<div className="content-background p-3">
        <h3>Connections</h3>
        {connections ? (<div className="list-group">
            {connections.map((c: WatchableDataDto) => (<a target="_blank" rel="noreferrer" key={c.id} href={getHref(c)} className="list-group-item d-flex justify-content-between" title={`${c.id} @ ${c.lastUpdate}`}>
                {getDataType(c.dataType as LiveDataType)} - {c.userName}
                {getPublicationMode(c)}
            </a>))}
        </div>) : (<LoadingSpinnerSmall />)}
        <div className="mt-1">
            <button className="btn btn-primary" onClick={reloadConnections}>
                {loading ? <LoadingSpinnerSmall /> : null}
                Refresh
            </button>
        </div>
    </div>);
}