import { useEffect, useState } from 'react';
import { LoadingSpinnerSmall } from '../common/LoadingSpinnerSmall.tsx';
import { useDependencies } from '../common/IocContainer.tsx';
import { ServiceAccountSessionDto } from '../../interfaces/models/dtos/Identity/ServiceAccountSessionDto';
import { RejectServiceAccountSessionDto } from '../../interfaces/models/dtos/Identity/RejectServiceAccountSessionDto';

export function ServiceAccountSessions() {
    const [loading, setLoading] = useState<boolean | undefined>(undefined);
    const [sessions, setSessions] = useState<ServiceAccountSessionDto[]>([]);
    const { serviceAccountSessionApi } = useDependencies();

    useEffect(() => {
        // noinspection JSIgnoredPromiseFromCall
        refresh();
    }, []);

    async function refresh() {
        if (loading) {
            return;
        }

        try {
            setLoading(true);

            const response = await serviceAccountSessionApi.getAll();
            setSessions(response);
        } finally {
            setLoading(false);
        }
    }

    async function reject(id: string) {
        if (loading) {
            return;
        }

        try {
            setLoading(true);

            const request: RejectServiceAccountSessionDto = {
                reason: 'Rejected by admin',
            };
            const rejected = await serviceAccountSessionApi.reject(id, request);
            if (!rejected.success) {
                const message = `Session was not rejected\n\n${rejected.errors?.join('\n')}\n${rejected.warnings?.join('\n')}`;
                window.alert(message);
            }

            const response = await serviceAccountSessionApi.getAll();
            setSessions(response);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="content-background p-3 position-relative">
            <div className="position-absolute top-0 right-0 p-3">
                <button
                    className="btn btn-primary"
                    onClick={async () => refresh()}>
                    {loading || loading === undefined ? (
                        <LoadingSpinnerSmall />
                    ) : null}
                    Refresh
                </button>
            </div>
            <h3>
                Service account sessions
                {!loading ? <span> ({sessions.length})</span> : null}
            </h3>
            <div className="list-group">
                {sessions.map((s) => (
                    <div key={s.id} className="list-group-item">
                        <div className="d-flex flex-row gap-1">
                            {s.approvedBy ? (
                                <span title={`Pin: ${s.pinFromApprover}`}>
                                    ✅ <strong>{s.approvedBy}</strong>
                                </span>
                            ) : null}
                            {s.rejectedBy ? (
                                <span>
                                    ❌ <strong>{s.rejectedBy}</strong> with pin{' '}
                                    {s.message}
                                </span>
                            ) : null}
                            {!s.approvedBy && !s.rejectedBy ? (
                                <span>🕛</span>
                            ) : null}
                            <span title={s.id}>
                                <strong>
                                    {s.id.substring(0, 4)}...
                                    {s.id.substring(32, 36)}
                                </strong>
                            </span>
                            <span>
                                Friendly name: <strong>{s.friendlyName}</strong>
                            </span>
                            <span>
                                IP: <strong>{s.serviceIpAddress}</strong>
                            </span>
                            {s.transientUsername ? (
                                <span>
                                    User?:{' '}
                                    <strong>{s.transientUsername}</strong>
                                </span>
                            ) : null}
                        </div>
                        <div className="d-flex flex-row justify-content-end gap-1">
                            {s.rejectedBy ? null : (
                                <button
                                    className="btn btn-danger"
                                    onClick={() => reject(s.id)}>
                                    Reject
                                </button>
                            )}
                            {!s.approvedBy && !s.rejectedBy ? (
                                <a
                                    className="btn btn-primary"
                                    href={`/accept_session/${s.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    Respond
                                </a>
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
