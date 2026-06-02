import { useEffect, useState } from 'react';
import { useDependencies } from '../common/IocContainer.tsx';
import { useApp } from '../common/AppContainer.tsx';
import { LoadingSpinnerSmall } from '../common/LoadingSpinnerSmall.tsx';
import { any, sortBy } from '../../helpers/collections.ts';
import { IClientActionResultDto } from '../common/IClientActionResultDto.ts';
import { WebSocketDto } from '../../interfaces/models/dtos/Live/WebSocketDto.ts';

export function SocketAdmin() {
    const { liveApi } = useDependencies();
    const { onError } = useApp();
    const [sockets, setSockets] = useState<WebSocketDto[] | undefined>(
        undefined,
    );
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(
        () => {
            if (!sockets) {
                // noinspection JSIgnoredPromiseFromCall
                loadSockets();
            }
        },
        // eslint-disable-next-line
        [],
    );

    async function loadSockets() {
        /* istanbul ignore next */
        if (loading) {
            /* istanbul ignore next */
            return;
        }

        setLoading(true);

        try {
            const response: IClientActionResultDto<WebSocketDto[]> =
                await liveApi.getAll();
            if (response.success) {
                setSockets(response.result!);
            } else {
                onError(response.errors!.join(','));
            }
        } finally {
            setLoading(false);
        }
    }

    async function closeSocket(id: string) {
        if (!window.confirm('Are you sure you want to close this socket')) {
            return;
        }

        try {
            const response: IClientActionResultDto<WebSocketDto> =
                await liveApi.close(id);
            if (response.success) {
                await loadSockets();
            } else {
                onError(response.errors!.join(','));
            }
        } finally {
            setLoading(false);
        }
    }

    function renderTime(time?: string): string {
        if (!time) {
            return '-';
        }

        const date: Date = new Date(time);
        return date.toLocaleTimeString();
    }

    try {
        return (
            <div className="content-background p-3">
                <h3>Manage sockets</h3>
                {loading ? <LoadingSpinnerSmall /> : null}
                {loading || !sockets ? null : (
                    <div className="list-group">
                        {sockets
                            .sort(sortBy('connected', true))
                            .map((socket) => (
                                <li
                                    key={socket.id}
                                    title={socket.id}
                                    className="list-group-item">
                                    <button
                                        className="btn btn-sm btn-danger margin-right"
                                        onClick={() => closeSocket(socket.id!)}>
                                        🗑
                                    </button>
                                    <span>
                                        {socket.userName || 'Logged out user'}
                                    </span>
                                    <span className="float-end">
                                        <span
                                            className="margin-left"
                                            title={socket.connected}>
                                            ▶ {renderTime(socket.connected)}
                                        </span>
                                        <br />
                                        <span
                                            className="margin-left"
                                            title={socket.lastReceipt}>
                                            ⬆ {socket.receivedMessages}
                                        </span>
                                        <span
                                            className="margin-left"
                                            title={socket.lastSent}>
                                            ⬇ {socket.sentMessages}
                                        </span>
                                    </span>
                                </li>
                            ))}
                    </div>
                )}
                {!loading && !any(sockets) ? (
                    <span>No open sockets</span>
                ) : null}
            </div>
        );
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
