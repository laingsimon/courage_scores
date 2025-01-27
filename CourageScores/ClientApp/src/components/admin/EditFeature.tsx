import {ConfiguredFeatureDto} from "../../interfaces/models/dtos/ConfiguredFeatureDto";
import {ChangeEvent, useState} from "react";
import {ReconfigureFeatureDto} from "../../interfaces/models/dtos/ReconfigureFeatureDto";
import {useDependencies} from "../common/IocContainer";
import {useApp} from "../common/AppContainer";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface IEditFeatureProps {
    feature: ConfiguredFeatureDto;
    onChanged: () => UntypedPromise;
}

export function EditFeature({ feature, onChanged }: IEditFeatureProps) {
    const {featureApi} = useDependencies();
    const [reconfigure, setReconfigure] = useState<string>(feature.configuredValue || '');
    const {onError} = useApp();
    const [saving, setSaving] = useState<boolean>(false);

    async function saveConfiguration() {
        /* istanbul ignore next */
        if (saving) {
            /* istanbul ignore next */
            return;
        }

        setSaving(true);

        try {
            const request: ReconfigureFeatureDto = {
                id: feature.id,
                configuredValue: reconfigure === '' || reconfigure === feature.defaultValue
                    ? undefined
                    : reconfigure,
            };
            const result: IClientActionResultDto<ConfiguredFeatureDto> = await featureApi.updateFeature(request);

            if (result.success) {
                await onChanged();
            } else {
                onError(result.warnings);
            }
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setSaving(false);
        }
    }

    function configurationChanged(event: ChangeEvent<HTMLInputElement>) {
        const value: string = event.target.type === 'checkbox'
            ? event.target.checked.toString()
            : event.target.value;

        setReconfigure(value);
    }

    function timeSpanChanged(event: ChangeEvent<HTMLInputElement>) {
        const inputName: string = event.target.name;
        let day: string = getDays(reconfigure);
        let time: string = getTime(reconfigure);

        switch (inputName) {
            case 'day':
                day = event.target.value;
                time = time || '00:00:00';
                break;
            case 'time':
                time = event.target.value;
                break;
        }

        const newTimeSpan: string = day !== '0'
            ? `${day}.${time}`
            : time;
        setReconfigure(newTimeSpan);
    }

    function getDays(timeSpan: string): string {
        const indexOfDot: number = timeSpan.indexOf('.');
        return indexOfDot === -1
            ? '0'
            : timeSpan.substring(0, indexOfDot);
    }

    function getTime(timeSpan: string): string {
        const indexOfDot: number = timeSpan.indexOf('.');
        return indexOfDot === -1
            ? timeSpan
            : timeSpan.substring(indexOfDot + 1);
    }

    function getPlaceholder(valueType: string): string {
        switch (valueType) {
            case 'String':
                return 'text'
            case 'Decimal':
                return 'A decimal number';
            default:
                return `A ${valueType.toLowerCase()}`;
        }
    }

    return (<li className={`list-group-item flex-column${feature.configuredValue !== null ? ' bg-info' : ''}`}>
        <div className="d-flex w-100 justify-content-between">
            <label>{feature.name}</label>
            {feature.valueType === 'Boolean' ? (
                <div className="form-check form-switch margin-right">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        name="configuredValue"
                        checked={(reconfigure || feature.defaultValue || '').toLowerCase() === 'true'}
                        onChange={configurationChanged}/>
                </div>) : null}
            {feature.valueType === 'Integer' ? (<input
                name="configuredValue"
                type="number"
                value={reconfigure || feature.defaultValue || '0'}
                onChange={configurationChanged}/>) : null}
            {feature.valueType === 'TimeSpan' ? (<span>
                <input
                    name="day"
                    type="number"
                    className="width-50"
                    min="0"
                    placeholder="days"
                    value={getDays(reconfigure || feature.defaultValue || '0.00:00:00')}
                    onChange={timeSpanChanged}/>
                <input
                    name="time"
                    type="time"
                    step="1"
                    value={getTime(reconfigure || feature.defaultValue || '0.00:00:00')}
                    onChange={timeSpanChanged}/>
            </span>) : null}
            {feature.valueType !== 'Integer' && feature.valueType !== 'Boolean' && feature.valueType !== 'TimeSpan' ? (
                <input
                  name="configuredValue"
                  type="text"
                  value={reconfigure || ''}
                  placeholder={getPlaceholder(feature.valueType!)}
                  onChange={configurationChanged}/>) : null}
            <button onClick={saveConfiguration} className="btn btn-sm btn-primary">
                {saving ? <LoadingSpinnerSmall/> : '💾'}
            </button>
        </div>
        <small className="mb-1">{feature.description}</small>
    </li>);
}