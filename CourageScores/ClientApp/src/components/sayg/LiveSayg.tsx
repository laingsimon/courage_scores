import {useParams, useLocation} from "react-router";
import {SaygLoadingContainer} from "./SaygLoadingContainer";
import {ILiveOptions} from "../../live/ILiveOptions";
import {LiveDataType} from "../../interfaces/models/dtos/Live/LiveDataType";
import {useState} from "react";
import {asyncCallback} from "../../helpers/events";

export function LiveSayg() {
    const { id } = useParams();
    const liveOptions: ILiveOptions = {
        publish: false,
        canSubscribe: true,
        subscribeAtStartup: [{ id: id!, type: LiveDataType.sayg }],
    };
    const [loadError, setLoadError] = useState<string | null>(null);
    const location = useLocation();
    const query: URLSearchParams = new URLSearchParams(location.hash.replace('#', ''));
    const initialOneDartAverage=query.get('average') === '1';

    return (<div className="content-background p-3 pb-1">
        {loadError ? <div className="mb-3">
            <h3>Error loading match data</h3>
            <p className="text-danger">{loadError}</p>
        </div> : null}
        <SaygLoadingContainer
            id={id!}
            matchStatisticsOnly={true}
            autoSave={false}
            liveOptions={liveOptions}
            lastLegDisplayOptions={ { showThrows: true, showAverage: true } }
            onLoadError={asyncCallback(setLoadError)}
            initialOneDartAverage={initialOneDartAverage}
            />
    </div>);
}
