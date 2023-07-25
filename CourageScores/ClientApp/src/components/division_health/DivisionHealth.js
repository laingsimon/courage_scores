import {useEffect, useState} from "react";
import {useApp} from "../../AppContainer";
import {useDependencies} from "../../IocContainer";
import {useDivisionData} from "../DivisionDataContainer";
import {Loading} from "../common/Loading";
import {ViewHealthCheck} from "./ViewHealthCheck";

export function DivisionHealth() {
    const [ result, setResult ] = useState(null);
    const [ loading, setLoading ] = useState(false);
    const { onError } = useApp();
    const { seasonApi } = useDependencies();
    const { season } = useDivisionData();

    async function loadHealthCheck() {
        /* istanbul ignore next */
        if (loading) {
            /* istanbul ignore next */
            return;
        }

        try {
            setLoading(true);

            const result = await seasonApi.getHealth(season.id);
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
            {!loading && result ? (<div className="content-background p-3 overflow-auto"><ViewHealthCheck result={result}/></div>) : null}
            {!loading && !result ? (<div className="content-background p-3">No health check result</div>) : null}
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}