import {SharedAddresses} from "./SharedAddresses";
import {TemplateDivisions} from "./TemplateDivisions";
import {ITemplateDto} from "../../interfaces/serverSide/Season/Creation/ITemplateDto";
import {IDivisionTemplateDto} from "../../interfaces/serverSide/Season/Creation/IDivisionTemplateDto";

export interface ITemplateVisualEditorProps {
    template: ITemplateDto;
    onUpdate: (template: ITemplateDto) => Promise<any>;
}

export function TemplateVisualEditor({ template, onUpdate }: ITemplateVisualEditorProps) {
    async function updateTemplateSharedAddress(updatedAddresses: string[][]) {
        const newTemplate: ITemplateDto = Object.assign({}, template);
        newTemplate.sharedAddresses = updatedAddresses;
        await onUpdate(newTemplate);
    }

    async function updateDivisions(updatedDivisions: IDivisionTemplateDto[]) {
        const newTemplate: ITemplateDto = Object.assign({}, template);
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