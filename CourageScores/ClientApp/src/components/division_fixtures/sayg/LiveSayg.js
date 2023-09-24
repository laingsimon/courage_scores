import {useParams} from "react-router-dom";
import {SaygLoadingContainer} from "./SaygLoadingContainer";

export function LiveSayg() {
    const { id } = useParams();

    return (<div className="content-background p-3 pb-1">
        <SaygLoadingContainer
            id={id}
            refreshAllowed={true}
            matchStatisticsOnly={true}
            autoSave={false}
            initialRefreshInterval={60000}
            lastLegDisplayOptions={ { showThrows: true, showAverage: true } }
            />
    </div>);
}
