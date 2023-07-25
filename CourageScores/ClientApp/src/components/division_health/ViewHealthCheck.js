import {isEmpty} from "../../helpers/collections";
import {useApp} from "../../AppContainer";

export function ViewHealthCheck({ result }) {
    const { onError } = useApp();
    const healthy = result.success && isEmpty(result.errors) && isEmpty(result.warnings);

    try {
        return (<div datatype="view-health-check">
            <h3 className={healthy ? 'text-success' : 'text-warning'}>Status: {healthy ? 'Healthy' : 'Unhealthy'}</h3>
            <ol>
                {Object.keys(result.checks).map(check => {
                    const checkResult = result.checks[check];

                    return (<li key={check}>
                        <div>
                            {checkResult.success ? '✔' : '❌'} {check}
                        </div>
                        <div>
                            {checkResult.errors.map((error, index) => (<div key={index} className="text-secondary-50 no-wrap">❌ {error}</div>))}
                            {checkResult.warnings.map((warning, index) => (<div key={index} className="text-secondary-50 no-wrap">⚠ {warning}</div>))}
                            {checkResult.messages.map((message, index) => (<div key={index} className="text-secondary-50 no-wrap">{message}</div>))}
                        </div>
                    </li>)
                })}
            </ol>
            <div>
                {result.errors.map((error, index) => (<div key={index} className="text-secondary no-wrap">❌ {error}</div>))}
                {result.warnings.map((warning, index) => (<div key={index} className="text-secondary no-wrap">⚠ {warning}</div>))}
                {result.messages.map((message, index) => (<div key={index} className="text-secondary no-wrap">{message}</div>))}
            </div>
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}