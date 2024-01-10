import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {useLive} from "./LiveContainer";
import {useApp} from "../../AppContainer";

export function RefreshControl({ id }) {
    const {enableLiveUpdates, subscriptions, connected} = useLive();
    const {account} = useApp();

    function getRefreshOptions() {
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
            onChange={v => enableLiveUpdates(v, id)}
            value={!!subscriptions[id] && connected}
            slim={true} />
    </>);
}