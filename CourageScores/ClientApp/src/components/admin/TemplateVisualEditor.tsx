import {SharedAddresses} from "./SharedAddresses";
import {TemplateDivisions} from "./TemplateDivisions";

export function TemplateVisualEditor({ template, onUpdate }) {
    function updateTemplateSharedAddress(updatedAddresses) {
        const newTemplate = Object.assign({}, template);
        newTemplate.sharedAddresses = updatedAddresses;
        onUpdate(newTemplate);
    }

    function updateDivisions(updatedDivisions) {
        const newTemplate = Object.assign({}, template);
        newTemplate.divisions = updatedDivisions;
        onUpdate(newTemplate);
    }

    return (<div>
        <SharedAddresses
            onUpdate={updateTemplateSharedAddress}
            addresses={template.sharedAddresses}
            className="bg-warning" />
        <TemplateDivisions
            onUpdate={updateDivisions}
            divisions={template.divisions}
            templateSharedAddresses={template.sharedAddresses.flatMap(a => a)} />
    </div>);
}