import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {useLive} from "./LiveContainer";

export function RefreshControl({ id }) {
    const {enableLiveUpdates, subscriptions, connected} = useLive();

    function getRefreshOptions() {
        return [
            { value: false, text: '⏸️ Paused', collapsedText: '⏸️' },
            { value: true, text: '▶️ Live', collapsedText: '▶️' },
        ];
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