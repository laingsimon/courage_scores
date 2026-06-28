import {
    BootstrapDropdown,
    IBootstrapDropdownItem,
} from './BootstrapDropdown.tsx';
import { useLive } from '../../live/LiveContainer.tsx';
import { useApp } from './AppContainer.tsx';
import { ISubscriptionRequest } from '../../live/ISubscriptionRequest.ts';
import { hasAccess } from '../../helpers/conditions.ts';
import { AccessOption } from '../../interfaces/models/dtos/Identity/AccessOption.ts';

/* eslint-disable @typescript-eslint/no-empty-object-type */
export interface IRefreshControlProps extends ISubscriptionRequest {}

export function RefreshControl({ id, type }: IRefreshControlProps) {
    const { enableLiveUpdates, subscriptions } = useLive();
    const { account } = useApp();

    function getRefreshOptions(): IBootstrapDropdownItem[] {
        return [
            { value: 'false', text: '⏸️ Paused', collapsedText: '⏸️' },
            { value: 'true', text: '▶️ Live', collapsedText: '▶️' },
        ];
    }

    if (!hasAccess(account, AccessOption.useWebSockets)) {
        return null;
    }

    return (
        <>
            <BootstrapDropdown
                className="margin-left float-end"
                options={getRefreshOptions()}
                onChange={async (v: string) =>
                    enableLiveUpdates(v === 'true', { id, type })
                }
                value={subscriptions[id] ? 'true' : 'false'}
                slim={true}
            />
        </>
    );
}
