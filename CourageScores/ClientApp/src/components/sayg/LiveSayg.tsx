import {useParams, useLocation} from "react-router";
import {SaygLoadingContainer} from "./SaygLoadingContainer";
import {ILiveOptions} from "../../live/ILiveOptions";
import {LiveDataType} from "../../interfaces/models/dtos/Live/LiveDataType";
import {useState} from "react";
import {asyncCallback} from "../../helpers/events";
import {any} from "../../helpers/collections";

export function LiveSayg() {
    const location = useLocation();
    const { type } = useParams();
    const liveDataType: LiveDataType = type === 'match' ? LiveDataType.sayg : LiveDataType.tournament;
    const search: URLSearchParams = new URLSearchParams(location.search);
    const ids = search.getAll('id');
    const liveOptions: ILiveOptions = {
        publish: false,
        canSubscribe: true,
        subscribeAtStartup: ids.map(id => { return { id, type: liveDataType }; }),
    };
    const [loadError, setLoadError] = useState<string | null>(any(ids) ? null : 'No ids have been provided');
    const fragment: URLSearchParams = new URLSearchParams(location.hash.replace('#', ''));
    const initialOneDartAverage=fragment.get('average') === '1';

    return (<div className="content-background p-3 pb-1">
        {loadError ? <div className="mb-3">
            <h3>Error loading match data</h3>
            <p className="text-danger">{loadError}</p>
        </div> : null}
        {ids.map(id => {
            return (<SaygLoadingContainer
                        key={id}
                        id={id}
                        matchStatisticsOnly={true}
                        autoSave={false}
                        liveOptions={liveOptions}
                        lastLegDisplayOptions={ { showThrows: true, showAverage: true } }
                        onLoadError={asyncCallback(setLoadError)}
                        initialOneDartAverage={initialOneDartAverage}
                    />);
            })}
    </div>);
}
