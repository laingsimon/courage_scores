import {useApp} from "../../AppContainer";
import {SeasonHealthCheckResultDto} from "../../interfaces/models/dtos/Health/SeasonHealthCheckResultDto";
import {HealthCheckResultDto} from "../../interfaces/models/dtos/Health/HealthCheckResultDto";

export interface IViewHealthCheckProps {
    result: SeasonHealthCheckResultDto
}

export function ViewHealthCheck({result}: IViewHealthCheckProps) {
    const {onError} = useApp();

    function renderError(error: string, index: number) {
        return (<div key={index} className="text-secondary-50 text-nowrap">❌ {error}</div>);
    }

    function renderWarning(warning: string, index: number) {
        return (<div key={index} className="text-secondary-50 text-nowrap">⚠ {warning}</div>);
    }

    function renderMessage(message: string, index: number) {
        return (<div key={index} className="text-secondary-50 text-nowrap">{message}</div>);
    }

    try {
        return (<div datatype="view-health-check">
            <ol>
                {Object.keys(result.checks).map((check: string) => {
                    const checkResult: HealthCheckResultDto = result.checks[check];

                    return (<li key={check}>
                        <div>
                            {checkResult.success ? '✔' : '❌'} {check}
                        </div>
                        <div className="ps-4 small">
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