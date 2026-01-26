import { useApp } from './common/AppContainer';
import { useEffect, useState } from 'react';
import { useDependencies } from './common/IocContainer';
import { useNavigate, useParams, useLocation } from 'react-router';
import { stateChanged } from '../helpers/events';
import { createTemporaryId } from '../helpers/projection';
import { QRCodeSVG } from 'qrcode.react';
import { RemoteControlUpdateDto } from '../interfaces/models/dtos/RemoteControl/RemoteControlUpdateDto';
import { LoadingSpinnerSmall } from './common/LoadingSpinnerSmall';
import { Loading } from './common/Loading';

export interface IRemoteControlProps {
    pinGenerator?: () => string;
}

export function defaultPinGenerator() {
    return createTemporaryId().substring(0, 8);
}

export function RemoteControl({ pinGenerator }: IRemoteControlProps) {
    const { settings, remoteControlApi } = useDependencies();
    const { account, onError, appLoading } = useApp();
    const [url, setUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState(false);
    const [updated, setUpdated] = useState(false);
    const { id, pin } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const showLoginPrompt = !account && query.get('login') === 'prompt';
    const headlessDevice = (!account && !appLoading) || query.has('showQrCode');
    const showQrCode = !!(headlessDevice && id && pin);

    useEffect(() => {
        if (id && pin && showQrCode) {
            const handle = window.setInterval(remoteControlPoll, 1000);

            return () => window.clearInterval(handle);
        }
    }, [id, pin, showQrCode]);

    useEffect(() => {
        if (!appLoading && !id && !pin && headlessDevice) {
            // noinspection JSIgnoredPromiseFromCall
            getRemoteControlCode();
        }
    }, [appLoading]);

    async function remoteControlPoll() {
        const detail = await remoteControlApi.get(id!, pin!);
        if (!detail?.success) {
            // cancel the poll
            navigate('/rc');
            return;
        }

        const url = detail?.result?.url;

        if (url) {
            await remoteControlApi.delete(id!, pin!);

            navigate(url);
        }
    }

    async function updateRemoteControlUrl(overrideUrl?: string) {
        try {
            /* istanbul ignore next */
            if (updating) {
                /* istanbul ignore next */
                return;
            }

            setUpdating(true);

            const update: RemoteControlUpdateDto = {
                pin,
                url: overrideUrl || url,
            };

            const result = await remoteControlApi.update(id!, update);
            if (!result?.success) {
                setError(
                    `Unable to update remote device: ${result?.errors?.join('\n')}${result?.warnings?.join('\n')}`,
                );
            } else {
                setError(null);
                setUpdated(true);
            }
        } catch (error) {
            /* istanbul ignore next */
            setError(null);
            /* istanbul ignore next */
            onError(error);
        } finally {
            setUpdating(false);
        }
    }

    async function getRemoteControlCode() {
        try {
            const pin: string = (pinGenerator ?? defaultPinGenerator)();

            const code = await remoteControlApi.create(pin);
            if (code?.success) {
                const query = account ? `?showQrCode=true` : '';
                navigate(`/rc/${code?.result?.id}/${pin}${query}`);
            } else {
                setError(
                    code?.warnings?.concat(code?.errors ?? [])?.join('\n') ??
                        'Unable to create a code',
                );
            }
        } catch (error) {
            /* istanbul ignore next */
            onError(error);
        }
    }

    function renderGetCodeButton() {
        return (
            <button
                disabled={appLoading}
                onClick={getRemoteControlCode}
                className="btn btn-primary">
                {appLoading ? <LoadingSpinnerSmall /> : null}
                Get a code
            </button>
        );
    }

    function getAccountUrl(action: string) {
        const currentLink: string =
            'https://' +
            document.location.host +
            location.pathname +
            location.search;

        return `${settings.apiHost}/api/Account/${action}/?redirectUrl=${encodeURIComponent(currentLink)}`;
    }

    function renderUrlOption(linkUrl: string, text?: string) {
        async function setAndGo() {
            /* istanbul ignore next */
            if (updated || updating) {
                /* istanbul ignore next */
                return;
            }

            setUrl(linkUrl);
            await updateRemoteControlUrl(linkUrl);
        }

        return (
            <li
                className={`list-group-item${linkUrl === url ? ' active' : ''}`}
                onClick={() => setAndGo()}
                title={linkUrl}>
                {text || linkUrl}
            </li>
        );
    }

    function renderControlOfRemoteDevice() {
        if (showLoginPrompt) {
            return appLoading ? (
                <Loading />
            ) : (
                <a className="btn btn-primary" href={getAccountUrl('Login')}>
                    Login to control device
                </a>
            );
        }

        return (
            <>
                {id && pin ? (
                    <>
                        <p>Enter the address for the device</p>
                        <p className="text-center fs-3 font-monospace">{pin}</p>
                        <div className="input-group mb-3">
                            <div className="input-group-prepend">
                                <span className="input-group-text">
                                    Address
                                </span>
                            </div>
                            <input
                                name="url"
                                className="form-control"
                                value={url}
                                disabled={updating || updated}
                                onChange={stateChanged(setUrl)}
                            />
                        </div>
                        <ul
                            className="list-group mb-3"
                            onClick={() => setUrl('/live')}>
                            {renderUrlOption('/live', 'Live tournaments')}
                            {renderUrlOption(
                                `/live/superleague/?date=${new Date().toISOString().substring(0, 10)}`,
                                "Today's Superleague boards",
                            )}
                            {renderUrlOption(
                                `/fixtures/?date=${new Date().toISOString().substring(0, 10)}`,
                                "Today's fixtures",
                            )}
                        </ul>
                        <button
                            className={`btn ${updated ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => updateRemoteControlUrl()}
                            disabled={updating || updated}>
                            {updating ? <LoadingSpinnerSmall /> : null}
                            Go
                        </button>
                    </>
                ) : (
                    renderGetCodeButton()
                )}
            </>
        );
    }

    function renderControlOfThisDevice() {
        return (
            <>
                {id && pin ? (
                    <>
                        <p>
                            Scan the QR code on a logged in device to control
                            this device
                        </p>
                        <p className="text-center">
                            <QRCodeSVG
                                value={`https://${document.location.hostname}/rc/${id}/${pin}/?login=prompt`}
                            />
                        </p>
                        <p className="text-center fs-3 font-monospace">{pin}</p>
                    </>
                ) : (
                    renderGetCodeButton()
                )}
            </>
        );
    }

    return (
        <div className="content-background p-3">
            <h3>Remote control</h3>
            {headlessDevice && !showLoginPrompt
                ? renderControlOfThisDevice()
                : renderControlOfRemoteDevice()}
            {error ? (
                <div className="mt-3 alert alert-danger">{error}</div>
            ) : null}
            {updated ? (
                <div className="mt-3 alert alert-success">
                    Device will update
                </div>
            ) : null}
        </div>
    );
}
