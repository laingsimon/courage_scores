import {useParams} from "react-router";
import {SaygLoadingContainer} from "./SaygLoadingContainer";
import {ILiveOptions} from "../../live/ILiveOptions";
import {LiveDataType} from "../../interfaces/models/dtos/Live/LiveDataType";

export function LiveSayg() {
    const { id } = useParams();
    const liveOptions: ILiveOptions = {
        publish: false,
        canSubscribe: true,
        subscribeAtStartup: [{ id: id!, type: LiveDataType.sayg }],
    };

    return (<div className="content-background p-3 pb-1">
        <SaygLoadingContainer
            id={id!}
            matchStatisticsOnly={true}
            autoSave={false}
            liveOptions={liveOptions}
            lastLegDisplayOptions={ { showThrows: true, showAverage: true } }
            />
    </div>);
}