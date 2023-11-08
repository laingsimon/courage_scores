import React, {useEffect, useState} from "react";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {any, sortBy} from "../../helpers/collections";

export function SocketAdmin() {
    const {liveApi} = useDependencies();
    const {onError} = useApp();
    const [sockets, setSockets] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!sockets) {
            // noinspection JSIgnoredPromiseFromCall
            loadSockets();
        }
    },
    // eslint-disable-next-line
    [])

    async function loadSockets() {
        /* istanbul ignore next */
        if (loading) {
            /* istanbul ignore next */
            return;
        }

        setLoading(true);

        try {
            const response = await liveApi.getAll();
            if (response.success) {
                setSockets(response.result);
            } else {
                onError(response.errors.join(','));
            }
        } finally {
            setLoading(false);
        }
    }

    async function closeSocket(id) {
        if (!window.confirm('Are you sure you want to close this socket')) {
            return;
        }

        try {
            const response = await liveApi.close(id);
            if (response.success) {
                await loadSockets();
            } else {
                onError(response.errors.join(','));
            }
        } finally {
            setLoading(false);
        }
    }

    function renderTime(time) {
        if (!time) {
            return time;
        }

        const date = new Date(time);
        return date.toLocaleTimeString();
    }

    try {
        return (<div className="content-background p-3">
            <h3>Manage sockets</h3>
            {loading ? <LoadingSpinnerSmall /> : null}
            {loading || !sockets ? null : (<div className="list-group">
                {sockets.sort(sortBy('connected', true)).map((socket) => (<li key={socket.id} title={socket.id} className="list-group-item">
                    <button className="btn btn-sm btn-danger margin-right" onClick={() => closeSocket(socket.id)}>🗑</button>
                    <span>{socket.userName || 'Logged out user'}</span>
                    <span className="float-end">
                        <span className="margin-left" title={socket.connected}>▶ {renderTime(socket.connected)}</span>
                        <span className="margin-left" title={socket.lastReceipt}>⬆ {renderTime(socket.lastReceipt) || 'never'}</span>
                        <span className="margin-left" title={socket.lastSent}>⬇ {renderTime(socket.lastSent) || 'never'}</span>
                    </span>
                </li>))}
            </div>)}
            {!loading && !any(sockets || []) ? (<span>No open sockets</span>) : null}
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}