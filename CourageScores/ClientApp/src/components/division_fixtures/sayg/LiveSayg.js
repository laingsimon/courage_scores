import {useParams} from "react-router-dom";
import {SaygLoadingContainer} from "./SaygLoadingContainer";

export function LiveSayg() {
    const { id } = useParams();
    const liveOptions = {
        publish: false,
        canSubscribe: true,
        subscribeAtStartup: [id],
    };

    return (<div className="content-background p-3 pb-1">
        <SaygLoadingContainer
            id={id}
            matchStatisticsOnly={true}
            autoSave={false}
            liveOptions={liveOptions}
            lastLegDisplayOptions={ { showThrows: true, showAverage: true } }
            />
    </div>);
}
