import {useEffect, useState} from "react";
import {useApp} from "../common/AppContainer";
import {useDependencies} from "../common/IocContainer";
import {useDivisionData} from "../league/DivisionDataContainer";
import {Loading} from "../common/Loading";
import {ViewHealthCheck} from "./ViewHealthCheck";
import {isEmpty} from "../../helpers/collections";
import {SeasonHealthCheckResultDto} from "../../interfaces/models/dtos/Health/SeasonHealthCheckResultDto";

export function DivisionHealth() {
    const [result, setResult] = useState<SeasonHealthCheckResultDto | null>(null);
    const [loading, setLoading] = useState(false);
    const {onError} = useApp();
    const {seasonApi} = useDependencies();
    const {season} = useDivisionData();
    const healthy: boolean = result && result.success && isEmpty(result.errors) && isEmpty(result.warnings);

    async function loadHealthCheck() {
        /* istanbul ignore next */
        if (loading) {
            /* istanbul ignore next */
            return;
        }

        try {
            setLoading(true);

            const result: SeasonHealthCheckResultDto = await seasonApi.getHealth(season.id);
            setResult(result);
        } catch (e) {
            onError(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
            /* istanbul ignore next */
            if (loading) {
                /* istanbul ignore next */
                return;
            }

            // noinspection JSIgnoredPromiseFromCall
            loadHealthCheck();
        },
        // eslint-disable-next-line
        []);

    try {
        return (<div datatype="health">
            {loading ? (<Loading/>) : null}
            {!loading && result ? (<div className="content-background p-3 overflow-auto">
                <h3 className={healthy ? 'text-success' : 'text-warning'}>Status: {healthy ? 'Healthy' : 'Unhealthy'}</h3>
                <ViewHealthCheck result={result}/>
            </div>) : null}
            {!loading && !result ? (<div className="content-background p-3">No health check result</div>) : null}
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}