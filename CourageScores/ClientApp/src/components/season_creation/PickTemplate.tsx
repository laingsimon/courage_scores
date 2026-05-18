import { any } from '../../helpers/collections';
import { ViewHealthCheck } from '../division_health/ViewHealthCheck';
import { LoadingSpinnerSmall } from '../common/LoadingSpinnerSmall';
import {
    BootstrapDropdown,
    IBootstrapDropdownItem,
} from '../common/BootstrapDropdown';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { ActionResultDto } from '../../interfaces/models/dtos/ActionResultDto';
import { TemplateDto } from '../../interfaces/models/dtos/Season/Creation/TemplateDto';
import { UntypedPromise } from '../../interfaces/UntypedPromise';

export interface IPickTemplateProps {
    selectedTemplate: ActionResultDto<TemplateDto> | null;
    loading: boolean;
    setSelectedTemplate(template: ActionResultDto<TemplateDto>): UntypedPromise;
    templates: IClientActionResultDto<ActionResultDto<TemplateDto>[]>;
}

export function PickTemplate({
    selectedTemplate,
    loading,
    setSelectedTemplate,
    templates,
}: IPickTemplateProps) {
    const templateOptions: IBootstrapDropdownItem[] =
        templates && templates.result
            ? templates.result.sort(sortCompatibleFirst).map(getTemplateOption)
            : [];

    function sortCompatibleFirst(
        x: ActionResultDto<TemplateDto>,
        y: ActionResultDto<TemplateDto>,
    ) {
        const xSuccess = x.success ? 1 : 0;
        const ySuccess = y.success ? 1 : 0;

        const compatibilityEquality = ySuccess - xSuccess;

        return compatibilityEquality === 0
            ? x.result!.name!.localeCompare(y.result!.name)
            : compatibilityEquality;
    }

    function getTemplateOption(
        compatibility: ActionResultDto<TemplateDto>,
    ): IBootstrapDropdownItem {
        const text = compatibility.success ? (
            <div>
                {compatibility.result!.name}
                <small className="ps-4 d-block">
                    {compatibility.result!.description}
                </small>
            </div>
        ) : (
            <div>
                🚫 {compatibility.result!.name}
                <small className="ps-4 d-block">
                    {compatibility!.result!.description}
                </small>
            </div>
        );

        return {
            value: compatibility.result!.id,
            text: text,
        };
    }

    function renderError(e: string, i: number) {
        return (
            <li className="text-danger" key={i}>
                {e}
            </li>
        );
    }

    function renderWarning(w: string, i: number) {
        return <li key={i}>{w}</li>;
    }

    function renderMessage(m: string, i: number) {
        return (
            <li className="text-secondary" key={i}>
                {m}
            </li>
        );
    }

    return (
        <>
            <div>
                <span className="margin-right">Fixture template:</span>
                {loading ? (
                    <LoadingSpinnerSmall />
                ) : (
                    <BootstrapDropdown
                        options={templateOptions}
                        value={selectedTemplate?.result!.id}
                        onChange={(value) =>
                            setSelectedTemplate(
                                templates.result!.filter(
                                    (t: ActionResultDto<TemplateDto>) =>
                                        t.result!.id === value,
                                )[0],
                            )
                        }
                    />
                )}
            </div>
            {selectedTemplate ? (
                <div
                    className={`alert mt-3 ${selectedTemplate.success ? 'alert-success' : 'alert-warning'}`}>
                    {selectedTemplate.success ? (
                        <h4>✔ Compatible with this season</h4>
                    ) : (
                        <h4>🚫 Incompatible with this season</h4>
                    )}
                    {any(selectedTemplate.errors) ? (
                        <ol>{selectedTemplate.errors!.map(renderError)}</ol>
                    ) : null}
                    {any(selectedTemplate.warnings) ? (
                        <ol>{selectedTemplate.warnings!.map(renderWarning)}</ol>
                    ) : null}
                    {any(selectedTemplate.messages) ? (
                        <ol>{selectedTemplate.messages!.map(renderMessage)}</ol>
                    ) : null}

                    {selectedTemplate.success ? (
                        <ViewHealthCheck
                            result={selectedTemplate.result!.templateHealth!}
                        />
                    ) : null}
                </div>
            ) : null}
        </>
    );
}
