import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {useLive} from "./LiveContainer";

export function RefreshControl({ id }) {
    const {enableLiveUpdates, subscriptions} = useLive();

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
            onChange={enableLiveUpdates}
            value={!!subscriptions[id]}
            slim={true} />
    </>);
}