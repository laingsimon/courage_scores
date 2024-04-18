import {ConfiguredFeatureDto} from "../../interfaces/models/dtos/ConfiguredFeatureDto";
import {ChangeEvent, useState} from "react";
import {ReconfigureFeatureDto} from "../../interfaces/models/dtos/ReconfigureFeatureDto";
import {useDependencies} from "../common/IocContainer";
import {useApp} from "../common/AppContainer";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {IClientActionResultDto} from "../common/IClientActionResultDto";

export interface IEditFeatureProps {
    feature: ConfiguredFeatureDto;
    onChanged: () => Promise<any>;
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
                    ? null
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

    function getPlaceholder(valueType: string): string {
        switch (valueType) {
            case 'TimeSpan':
                return '[day.]hh:mm:ss'
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
                        checked={(reconfigure || '').toLowerCase() === 'true'}
                        onChange={configurationChanged}/>
                </div>) : null}
            {feature.valueType === 'Integer' ? (<input
                name="configuredValue"
                type="number"
                value={reconfigure || '0'}
                onChange={configurationChanged}/>) : null}
            {feature.valueType !== 'Integer' && feature.valueType !== 'Boolean' ? (<input
              name="configuredValue"
              type="text"
              value={reconfigure || ''}
              placeholder={getPlaceholder(feature.valueType)}
              onChange={configurationChanged}/>) : null}
            <button onClick={saveConfiguration} className="btn btn-sm btn-primary">
                {saving ? <LoadingSpinnerSmall/> : '💾'}
            </button>
        </div>
        <small className="mb-1">{feature.description}</small>
    </li>);
}