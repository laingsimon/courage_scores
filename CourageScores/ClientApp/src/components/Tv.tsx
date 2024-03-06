import {useDependencies} from "./common/IocContainer";
import {useEffect, useState} from "react";
import {WatchableDataDto} from "../interfaces/models/dtos/Live/WatchableDataDto";
import {LoadingSpinnerSmall} from "./common/LoadingSpinnerSmall";
import {LiveDataType} from "../interfaces/models/dtos/Live/LiveDataType";
import {PublicationMode} from "../interfaces/models/dtos/Live/PublicationMode";
import {useApp} from "./common/AppContainer";
import {useLocation} from "react-router-dom";

export function Tv() {
    const {liveApi, settings} = useDependencies();
    const {account, appLoading} = useApp();
    const [loading, setLoading] = useState(false);
    const [connections, setConnections] = useState(null);
    const location = useLocation();

    useEffect(() => {
        // noinspection JSIgnoredPromiseFromCall
        reloadConnections();
    },
    // eslint-disable-next-line
    []);

    function getAccountUrl(action: string) {
        const currentLink: string = 'https://' + document.location.host + location.pathname + location.search;

        return `${settings.apiHost}/api/Account/${action}/?redirectUrl=${currentLink}`;
    }

    async function reloadConnections() {
        /* istanbul ignore next */
        if (loading || !account || !account.access || !account.access.useWebSockets) {
            /* istanbul ignore next */
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
        const lastUpdate: Date = connection.lastUpdate
            ? new Date(connection.lastUpdate)
            : null;
        const lastUpdateTime: string = lastUpdate
            ? ' @ ' + lastUpdate.toLocaleTimeString()
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
            {(connections || []).map((c: WatchableDataDto) => (<a target="_blank" rel="noreferrer" key={c.id} href={getHref(c)} className="list-group-item d-flex justify-content-between" title={`${c.id} @ ${c.lastUpdate}`}>
                {!c.eventDetails ? (getDataType(c.dataType as LiveDataType)) : null}
                {c.dataType === LiveDataType.sayg && c.eventDetails
                    ? (<span>
                        🎯 {c.eventDetails.opponents[0]} vs {c.eventDetails.opponents[1]}{c.eventDetails.venue ? ` at ${c.eventDetails.venue}` : ''}
                    </span>)
                    : null}
                {c.dataType === LiveDataType.tournament && c.eventDetails
                    ? (<span>
                        🏆 {c.eventDetails.type} at {c.eventDetails.venue}
                    </span>)
                    : null}
                {getPublicationMode(c)}
            </a>))}
        </div>) : null}
        {account && !appLoading && (!account.access || !account.access.useWebSockets) ? (<div>No access</div>) : null}
        <div className="mt-1">
            {account && account.access && account.access.useWebSockets && !appLoading ? (<button className="btn btn-primary" onClick={reloadConnections}>
                {loading ? <LoadingSpinnerSmall /> : null}
                Refresh
            </button>) : null}
            {!account && !appLoading ? (<a className="btn btn-primary" href={getAccountUrl('Login')}>Login</a>) : null}
            {appLoading ? (<LoadingSpinnerSmall />) : null}
    </div>
</div>)
    ;
}