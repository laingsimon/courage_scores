import {BootstrapDropdown} from "../common/BootstrapDropdown";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {useEffect, useState} from "react";

export function RefreshControl({ refreshInterval, setRefreshInterval, refresh }) {
    const [refreshing, setRefreshing] = useState(false);

    function getRefreshOptions() {
        return [
            { value: 0, text: '⏸️ Paused' },
            { value: 10000, text: '⏩ Live (Fast)' },
            { value: 60000, text: '▶️ Live' },
        ];
    }

    useEffect(() => {
            if (refreshInterval <= 0) {
                return;
            }

            const handle = window.setInterval(refreshSaygData, refreshInterval);

            return () => {
                window.clearInterval(handle);
            }
        },
        // eslint-disable-next-line
        [refreshInterval]);

    async function refreshSaygData() {
        // call out to loading container to refresh the data
        setRefreshing(true);
        try {
            await refresh();
        } finally {
            setRefreshing(false);
        }
    }

    return (<>
        <BootstrapDropdown
            className="margin-left float-end"
            options={getRefreshOptions()}
            onChange={setRefreshInterval}
            value={refreshInterval} />
        <span className="width-20 d-inline-block ms-2 text-secondary-50">{refreshing ? <LoadingSpinnerSmall /> : null}</span>
    </>);
}