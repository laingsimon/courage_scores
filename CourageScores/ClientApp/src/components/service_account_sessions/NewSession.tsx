import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useDependencies } from '../common/IocContainer.tsx';
import { createTemporaryId } from '../../helpers/projection.ts';
import { CreateSessionRequestDto } from '../../interfaces/models/dtos/Identity/CreateSessionRequestDto';
import { useApp } from '../common/AppContainer.tsx';
import { LoadingSpinnerSmall } from '../common/LoadingSpinnerSmall.tsx';
import { stateChanged } from '../../helpers/events.ts';
import { ServiceAccountSessionDto } from '../../interfaces/models/dtos/Identity/ServiceAccountSessionDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto.ts';
import { isEmpty } from '../../helpers/collections.ts';
import { QRCodeSVG } from 'qrcode.react';
import { ActivateSessionRequestDto } from '../../interfaces/models/dtos/Identity/ActivateSessionRequestDto';

export function NewSession() {
    const { friendlyName } = useParams();
    const { onError, reloadAll } = useApp();
    const [pin] = useState<string>(createPin());
    const [session, setSession] = useState<
        IClientActionResultDto<ServiceAccountSessionDto> | undefined
    >(undefined);
    const [creating, setCreating] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [activating, setActivating] = useState<boolean>(false);
    const [activated, setActivated] = useState<boolean>(false);
    const { serviceAccountSessionApi } = useDependencies();
    const navigate = useNavigate();

    useEffect(() => {
        if (session?.success) {
            if (isApproved(session.result!)) {
                // noinspection JSIgnoredPromiseFromCall
                activateSession();
                return;
            }

            const handle = window.setInterval(refreshSession, 5 * 1000);

            return () => {
                window.clearInterval(handle);
            };
        }
    }, [session]);

    async function activateSession() {
        if (activating) {
            return;
        }

        try {
            setActivating(true);

            const request: ActivateSessionRequestDto = {
                pin: pin,
            };
            const response = await serviceAccountSessionApi.activate(
                session!.result!.id,
                request,
            );

            if (response.success) {
                await reloadAll();
                setActivated(true);
                return;
            }

            // not activated
            setSession(response);
        } finally {
            setActivating(false);
        }
    }

    function isApproved(session: ServiceAccountSessionDto): boolean {
        return !!session.approvedBy;
    }

    async function refreshSession() {
        if (refreshing || !session?.result?.id) {
            return;
        }

        setRefreshing(true);

        try {
            const response = await serviceAccountSessionApi.get(
                session!.result!.id,
            );
            setSession({
                success: true,
                result: response ?? undefined,
            });
        } catch (e) {
            setSession({
                success: false,
                errors: [e?.toString() || 'Error refreshing session'],
            });
        } finally {
            setRefreshing(false);
        }
    }

    function setFriendlyName(name: string) {
        navigate(`/new_session/${name}`);
    }

    function createPin() {
        const fullPin = createTemporaryId();
        return fullPin.substring(0, 4);
    }

    async function createSession() {
        if (creating) {
            return;
        }

        setCreating(true);

        try {
            const request: CreateSessionRequestDto = {
                friendlyName: friendlyName,
            };
            const session = await serviceAccountSessionApi.create(request);
            setSession(session);
        } catch (e) {
            onError(e);
        } finally {
            setCreating(false);
        }
    }

    function renderCreateSession() {
        return (
            <div>
                <h3>Create a new session</h3>
                <div className="input-group mb-3">
                    <div className="input-group-prepend">
                        <label
                            htmlFor="friendlyName"
                            className="input-group-text">
                            Friendly name
                        </label>
                    </div>
                    <input
                        id="friendlyName"
                        name="friendlyName"
                        className="form-control"
                        value={friendlyName}
                        onChange={stateChanged(setFriendlyName)}
                    />
                </div>
                <button className="btn btn-primary" onClick={createSession}>
                    {creating ? <LoadingSpinnerSmall /> : null}
                    Create session
                </button>
            </div>
        );
    }

    function renderSessionDetails() {
        if (activated) {
            return (
                <div>
                    <h3>Session approved</h3>
                    <a className="btn btn-primary" href="/">
                        Reload
                    </a>
                </div>
            );
        }

        if (session!.success) {
            const addressForApprovals = `https://${location.host}/accept_session/${session!.result!.id}`;

            return (
                <div className="position-relative">
                    <h3>Waiting for approval...</h3>
                    <div className="d-flex flex-column align-items-center">
                        <h6>{friendlyName}</h6>
                        <QRCodeSVG value={addressForApprovals} size={150} />
                        <pre className="fs-3" data-testid="session-pin">
                            {pin}
                        </pre>
                        <pre>IP address: {session!.result!.myIpAddress}</pre>
                        <a
                            href={addressForApprovals}
                            rel="noopener noreferrer"
                            target="_blank">
                            Open approval link in new tab
                        </a>
                    </div>
                    <div className="position-absolute top-0 right-0">
                        {refreshing || activating ? (
                            <LoadingSpinnerSmall />
                        ) : null}
                    </div>
                </div>
            );
        }

        return (
            <div>
                <h3>Session was not created</h3>
                {renderMessages('text-danger', session!.errors)}
                {renderMessages('text-warning', session!.warnings)}
                {renderMessages('text-secondary', session!.messages)}
            </div>
        );
    }

    function renderMessages(className: string, messages?: string[]) {
        if (isEmpty(messages)) {
            return;
        }

        return (
            <ul>
                {messages!.map((msg, index) => (
                    <li className={className} key={index}>
                        {msg}
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <div className="content-background p-3 d-flex flex-column">
            {session ? renderSessionDetails() : renderCreateSession()}
        </div>
    );
}
