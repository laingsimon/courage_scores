import {BootstrapDropdown, IBootstrapDropdownItem} from "./BootstrapDropdown";
import {useLive} from "../../live/LiveContainer";
import {useApp} from "./AppContainer";

export interface IRefreshControlProps {
    id: string;
}

export function RefreshControl({ id }: IRefreshControlProps) {
    const {enableLiveUpdates, subscriptions, connected} = useLive();
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
            onChange={async (v: boolean) => enableLiveUpdates(v, id)}
            value={!!subscriptions[id] && connected}
            slim={true} />
    </>);
}