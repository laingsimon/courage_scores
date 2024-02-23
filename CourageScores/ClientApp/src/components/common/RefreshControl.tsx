import {BootstrapDropdown, IBootstrapDropdownItem} from "./BootstrapDropdown";
import {useLive} from "../../live/LiveContainer";
import {useApp} from "./AppContainer";
import {ISubscriptionRequest} from "../../live/ISubscriptionRequest";

export interface IRefreshControlProps extends ISubscriptionRequest {
}

export function RefreshControl({ id, type }: IRefreshControlProps) {
    const {enableLiveUpdates, subscriptions} = useLive();
    const {account} = useApp();

    function getRefreshOptions(): IBootstrapDropdownItem[] {
        return [
            { value: false, text: '⏸️ Paused', collapsedText: '⏸️' },
            { value: true, text: '▶️ Live', collapsedText: '▶️' },
        ];
    }

    if (!account || !account.access.useWebSockets) {
        return null;
    }

    return (<>
        <BootstrapDropdown
            className="margin-left float-end"
            options={getRefreshOptions()}
            onChange={async (v: boolean) => enableLiveUpdates(v, { id, type })}
            value={!!subscriptions[id]}
            slim={true} />
    </>);
}