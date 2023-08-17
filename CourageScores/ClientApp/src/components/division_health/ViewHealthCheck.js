import {useApp} from "../../AppContainer";

export function ViewHealthCheck({result}) {
    const {onError} = useApp();

    function renderError(error, index) {
        return (<div key={index} className="text-secondary-50 text-nowrap">❌ {error}</div>);
    }

    function renderWarning(warning, index) {
        return (<div key={index} className="text-secondary-50 text-nowrap">⚠ {warning}</div>);
    }

    function renderMessage(message, index) {
        return (<div key={index} className="text-secondary-50 text-nowrap">{message}</div>);
    }

    try {
        return (<div datatype="view-health-check">
            <ol>
                {Object.keys(result.checks).map(check => {
                    const checkResult = result.checks[check];

                    return (<li key={check}>
                        <div>
                            {checkResult.success ? '✔' : '❌'} {check}
                        </div>
                        <div className="ps-4">
                            {checkResult.errors.map(renderError)}
                            {checkResult.warnings.map(renderWarning)}
                            {checkResult.messages.map(renderMessage)}
                        </div>
                    </li>)
                })}
            </ol>
            <div>
                {result.errors.map(renderError)}
                {result.warnings.map(renderWarning)}
                {result.messages.map(renderMessage)}
            </div>
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}