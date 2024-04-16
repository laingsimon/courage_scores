import {useDependencies} from "../common/IocContainer";
import {useApp} from "../common/AppContainer";
import {useEffect, useState} from "react";
import {ConfiguredFeatureDto} from "../../interfaces/models/dtos/ConfiguredFeatureDto";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {EditFeature} from "./EditFeature";

export function FeatureAdmin() {
    const {featureApi} = useDependencies();
    const {onError} = useApp();
    const [features, setFeatures] = useState<ConfiguredFeatureDto[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    async function loadFeatures() {
        try {
            /* istanbul ignore next */
            if (loading) {
                /* istanbul ignore next */
                return;
            }
            setLoading(true);

            const features: ConfiguredFeatureDto[] = await featureApi.getFeatures();
            setFeatures(features);
            setLoading(false);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    useEffect(() => {
            // noinspection JSIgnoredPromiseFromCall
            loadFeatures();
        },
        // eslint-disable-next-line
        []);

    return (<div className="content-background p-3">
        <h3>Manage features</h3>
        {loading || loading === null
            ? (<p><LoadingSpinnerSmall/> Loading features...</p>)
            : <ul className="list-group mb-2" datatype="templates">
                {features.map(f => (<EditFeature key={f.id} feature={f} onChanged={loadFeatures} />))}
            </ul>}
    </div>);
}