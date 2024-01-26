import {SharedAddresses} from "./SharedAddresses";
import {TemplateDivisions} from "./TemplateDivisions";
import {IDivisionTemplateDto} from "../../interfaces/serverSide/Season/Creation/IDivisionTemplateDto";
import {IEditTemplateDto} from "../../interfaces/serverSide/Season/Creation/IEditTemplateDto";

export interface ITemplateVisualEditorProps {
    template: IEditTemplateDto;
    onUpdate: (template: IEditTemplateDto) => Promise<any>;
}

export function TemplateVisualEditor({ template, onUpdate }: ITemplateVisualEditorProps) {
    async function updateTemplateSharedAddress(updatedAddresses: string[][]) {
        const newTemplate: IEditTemplateDto = Object.assign({}, template);
        newTemplate.sharedAddresses = updatedAddresses;
        await onUpdate(newTemplate);
    }

    async function updateDivisions(updatedDivisions: IDivisionTemplateDto[]) {
        const newTemplate: IEditTemplateDto = Object.assign({}, template);
        newTemplate.divisions = updatedDivisions;
        await onUpdate(newTemplate);
    }

    return (<div>
        <SharedAddresses
            onUpdate={updateTemplateSharedAddress}
            addresses={template.sharedAddresses}
            className="bg-warning" />
        <TemplateDivisions
            onUpdate={updateDivisions}
            divisions={template.divisions}
            templateSharedAddresses={template.sharedAddresses.flatMap((a: string[]) => a)} />
    </div>);
}