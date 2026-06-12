import { useParams } from 'react-router';
import { stateChanged } from '../../helpers/events.ts';
import { useEffect, useState } from 'react';
import {
    BootstrapDropdown,
    IBootstrapDropdownItem,
} from '../common/BootstrapDropdown.tsx';
import { AccessDto } from '../../interfaces/models/dtos/Identity/AccessDto';
import { ServiceAccountSessionDto } from '../../interfaces/models/dtos/Identity/ServiceAccountSessionDto';
import { LoadingSpinnerSmall } from '../common/LoadingSpinnerSmall.tsx';
import { useDependencies } from '../common/IocContainer.tsx';
import { ApproveServiceAccountSessionDto } from '../../interfaces/models/dtos/Identity/ApproveServiceAccountSessionDto';
import { RejectServiceAccountSessionDto } from '../../interfaces/models/dtos/Identity/RejectServiceAccountSessionDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto.ts';
import { isEmpty } from '../../helpers/collections.ts';
import { useApp } from '../common/AppContainer.tsx';
import { Loading } from '../common/Loading.tsx';

interface AccessTemplate {
    name: string;
    description: string;
    access: AccessDto;
}

const accessTemplates: AccessTemplate[] = [
    {
        name: 'Superleague Tablet',
        description: 'Superleague Tablet, for entering scores',
        access: {
            useWebSockets: true,
            showDebugOptions: true,
            enterTournamentResults: true,
            recordScoresAsYouGo: true,
            kioskMode: true,
        },
    },
    {
        name: 'Superleague TV',
        description: 'Superleague TV for displaying live results',
        access: {
            showDebugOptions: true,
            useWebSockets: true,
        },
    },
];

const accessTemplateOptions: IBootstrapDropdownItem[] = accessTemplates.map(
    (t) => ({ value: t.name, text: t.description }),
);

type Mode = 'approve' | 'reject';

export function SessionResponse() {
    const { id } = useParams();
    const { account, appLoading } = useApp();
    const { settings, serviceAccountSessionApi } = useDependencies();
    const [pin, setPin] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');
    const [mode, setMode] = useState<Mode | undefined>();
    const [accessTemplateId, setAccessTemplateId] = useState<string>('');
    const [session, setSession] = useState<
        ServiceAccountSessionDto | undefined
    >(undefined);
    const [responding, setResponding] = useState<string | undefined>(undefined);
    const [response, setResponse] = useState<
        IClientActionResultDto<ServiceAccountSessionDto> | undefined
    >(undefined);

    useEffect(() => {
        // noinspection JSIgnoredPromiseFromCall
        loadSession();
    }, []);

    function updatePin(value: string) {
        setPin(value.toUpperCase());
    }

    async function loadSession() {
        /* istanbul ignore next */
        if (loading) {
            /* istanbul ignore next */
            return;
        }

        setLoading(true);

        try {
            const response = await serviceAccountSessionApi.get(id!);
            setSession(response || undefined);
        } finally {
            setLoading(false);
        }
    }

    async function approveSession() {
        /* istanbul ignore next */
        if (responding) {
            /* istanbul ignore next */
            return;
        }

        if (!accessTemplateId) {
            alert('Select the level of access first');
            return;
        }

        try {
            setResponding('approving');

            const request: ApproveServiceAccountSessionDto = {
                pin: pin,
                access: accessTemplates.find(
                    (t) => t.name === accessTemplateId,
                )!.access,
            };
            const response = await serviceAccountSessionApi.approve(
                id!,
                request,
            );
            setResponse(response);
            await loadSession();
        } finally {
            setResponding(undefined);
        }
    }

    async function rejectSession() {
        /* istanbul ignore next */
        if (responding) {
            /* istanbul ignore next */
            return;
        }

        if (!message) {
            alert('Enter a rejection reason first');
            return;
        }

        try {
            setResponding('rejecting');

            const request: RejectServiceAccountSessionDto = {
                reason: message,
            };
            const response = await serviceAccountSessionApi.reject(
                id!,
                request,
            );
            setResponse(response);
            await loadSession();
        } finally {
            setResponding(undefined);
        }
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

    function renderSelection(sameIpAddress?: boolean) {
        return (
            <>
                <div className="d-flex justify-content-center gap-1">
                    <button
                        className="btn btn-primary"
                        onClick={() => setMode('approve')}
                        disabled={!sameIpAddress}>
                        Approve...
                        {sameIpAddress ? null : (
                            <div>🚫 Your ip address is different</div>
                        )}
                    </button>
                    <button
                        className="btn btn-danger"
                        onClick={() => setMode('reject')}>
                        Reject...
                    </button>
                </div>
            </>
        );
    }

    function renderApprove() {
        return (
            <>
                <div>
                    <h4>Approve</h4>
                    <p>
                        On the original device (the tablet or the tv), beneath
                        the QR code there should be a PIN. Enter this value in
                        the input below and select the access level for the
                        device.
                    </p>
                    <div className="d-flex flex-row align-items-center input-group">
                        <div className="input-group-prepend">
                            <label className="input-group-text" htmlFor="pin">
                                Pin
                            </label>
                        </div>
                        <div className="flex-grow-0">
                            <input
                                id="pin"
                                value={pin}
                                maxLength={4}
                                placeholder="Under QR code"
                                onChange={stateChanged(updatePin)}
                                className="form-control width-75"
                            />
                        </div>
                        <span className="mx-2">Access</span>
                        <div className="flex-grow-1">
                            <BootstrapDropdown
                                value={accessTemplateId}
                                onChange={async (opt) =>
                                    setAccessTemplateId(opt!)
                                }
                                options={accessTemplateOptions}
                            />
                        </div>
                    </div>
                </div>
                <div className="d-flex justify-content-end gap-1 mt-2">
                    <button
                        className="btn btn-secondary"
                        onClick={() => setMode(undefined)}>
                        &larr; Back
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={approveSession}>
                        {responding === 'approving' ? (
                            <LoadingSpinnerSmall />
                        ) : null}
                        Approve
                    </button>
                </div>
            </>
        );
    }

    function renderReject() {
        return (
            <>
                <div>
                    <h4>Reject</h4>
                    <div>
                        <label>Reason</label>
                        <textarea
                            name="message"
                            value={message}
                            onChange={stateChanged(setMessage)}
                            className="form-control min-height-50"
                        />
                    </div>
                </div>
                <div className="d-flex justify-content-end gap-1 mt-2">
                    <button
                        className="btn btn-secondary"
                        onClick={() => setMode(undefined)}>
                        &larr; Back
                    </button>
                    <button className="btn btn-primary" onClick={rejectSession}>
                        {responding === 'rejecting' ? (
                            <LoadingSpinnerSmall />
                        ) : null}
                        Reject
                    </button>
                </div>
            </>
        );
    }

    function getLoginUrl() {
        return `${settings.apiHost}/api/Account/Login/?redirectUrl=${getRedirectUrl()}`;
    }

    function getRedirectUrl() {
        const currentLink: string = location.pathname + location.search;

        return encodeURIComponent(currentLink);
    }

    if (appLoading) {
        return <Loading />;
    }

    if (account?.access?.loginServiceAccounts !== true) {
        return (
            <div className="content-background p-3">
                <h3>Service account session</h3>
                {account ? (
                    <p>Not permitted</p>
                ) : (
                    <a className="btn btn-primary" href={getLoginUrl()}>
                        Login
                    </a>
                )}
            </div>
        );
    }

    const responded = !!session?.approvedBy || !!session?.rejectedBy;
    const sameIpAddress = session?.myIpAddress === session?.serviceIpAddress;
    return (
        <div className="content-background p-3 position-relative">
            <h3>Service account session</h3>
            <div className="position-absolute top-0 right-0 p-3">
                {loading ? <LoadingSpinnerSmall /> : null}
            </div>
            <div className="justify-content-center border-1 border-secondary border-bottom mb-3 pb-3 d-flex gap-1">
                {session ? (
                    <>
                        <div>
                            <span className="fw-bold">Friendly name:</span>{' '}
                            {session.friendlyName}
                        </div>
                        <div>
                            <span className="fw-bold">Ip address:</span>{' '}
                            {session.serviceIpAddress}
                            {sameIpAddress ? (
                                '✅'
                            ) : (
                                <span className="text-danger no-wrap">
                                    ❌ - your ip = {session.myIpAddress}
                                </span>
                            )}
                        </div>
                    </>
                ) : null}
            </div>
            {!responded ? (
                <div>
                    {!mode && !loading ? renderSelection(sameIpAddress) : null}
                    {mode === 'approve' ? renderApprove() : null}
                    {mode === 'reject' ? renderReject() : null}
                </div>
            ) : null}
            {responded ? (
                <div>
                    {session?.rejectedBy ? (
                        <div>Rejected by {session.rejectedBy}</div>
                    ) : null}
                    {session?.approvedBy ? (
                        <div>Approved by {session.approvedBy}</div>
                    ) : null}
                </div>
            ) : null}
            {response ? (
                <div>
                    {renderMessages('text-danger', response!.errors)}
                    {renderMessages('text-warning', response!.warnings)}
                </div>
            ) : null}
        </div>
    );
}
