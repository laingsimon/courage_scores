import {any} from "../../../helpers/collections";
import {ViewHealthCheck} from "../../division_health/ViewHealthCheck";
import React from "react";
import {LoadingSpinnerSmall} from "../../common/LoadingSpinnerSmall";
import {BootstrapDropdown, IBootstrapDropdownItem} from "../../common/BootstrapDropdown";
import {IClientActionResultDto} from "../../../interfaces/IClientActionResultDto";
import {IActionResultDto} from "../../../interfaces/dtos/IActionResultDto";
import {ITemplateDto} from "../../../interfaces/dtos/Season/Creation/ITemplateDto";

export interface IPickTemplateProps {
    selectedTemplate: IActionResultDto<ITemplateDto> | null;
    loading: boolean;
    setSelectedTemplate: (template: IActionResultDto<ITemplateDto>) => Promise<any>;
    templates: IClientActionResultDto<IActionResultDto<ITemplateDto>[]>;
}

export function PickTemplate({ selectedTemplate, loading, setSelectedTemplate, templates }: IPickTemplateProps) {
    const templateOptions: IBootstrapDropdownItem[] = templates && templates.result
        ? templates.result.map(getTemplateOption)
        : [];

    function getTemplateOption(compatibility: IActionResultDto<ITemplateDto>): IBootstrapDropdownItem {
        let text = compatibility.success
            ? <div>{compatibility.result.name}<small className="ps-4 d-block">{compatibility.result.description}</small></div>
            : <div>🚫 {compatibility.result.name}<small className="ps-4 d-block">{compatibility.result.description}</small></div>

        return {
            value: compatibility.result.id,
            text: text,
        };
    }

    function renderError(e: string, i: number) {
        return (<li className="text-danger" key={i}>{e}</li>);
    }

    function renderWarning(w: string, i: number) {
        return (<li key={i}>{w}</li>);
    }

    function renderMessage(m: string, i: number) {
        return (<li className="text-secondary" key={i}>{m}</li>);
    }

    return (<>
        <div>
            <span className="margin-right">Fixture template:</span>
            {loading
                ? (<LoadingSpinnerSmall/>)
                : (<BootstrapDropdown options={templateOptions}
                                      value={selectedTemplate ? selectedTemplate.result.id : null}
                                      onChange={value => setSelectedTemplate(templates.result.filter((t: IActionResultDto<ITemplateDto>) => t.result.id === value)[0])}/>)}
        </div>
        {selectedTemplate ? (<div className={`alert mt-3 ${selectedTemplate.success ? 'alert-success' : 'alert-warning'}`}>
            {selectedTemplate.success ? (<h4>✔ Compatible with this season</h4>) : (
                <h4>🚫 Incompatible with this season</h4>)}
            {any(selectedTemplate.errors)
                ? (<ol>{selectedTemplate.errors.map(renderError)}</ol>)
                : null}
            {any(selectedTemplate.warnings)
                ? (<ol>{selectedTemplate.warnings.map(renderWarning)}</ol>)
                : null}
            {any(selectedTemplate.messages)
                ? (<ol>{selectedTemplate.messages.map(renderMessage)}</ol>)
                : null}

            {selectedTemplate.success
                ? (<ViewHealthCheck result={selectedTemplate.result.templateHealth}/>)
                : null}
        </div>) : null}
    </>);
}