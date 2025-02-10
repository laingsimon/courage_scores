import {SharedAddresses} from "./SharedAddresses";
import {TemplateDivisions} from "./TemplateDivisions";
import {DivisionTemplateDto} from "../../interfaces/models/dtos/Season/Creation/DivisionTemplateDto";
import {EditTemplateDto} from "../../interfaces/models/dtos/Season/Creation/EditTemplateDto";
import {useState} from "react";
import {UntypedPromise} from "../../interfaces/UntypedPromise";
import {asyncCallback} from "../../helpers/events";

export interface ITemplateVisualEditorProps {
    template: EditTemplateDto;
    onUpdate(template: EditTemplateDto): UntypedPromise;
}

export function TemplateVisualEditor({ template, onUpdate }: ITemplateVisualEditorProps) {
    const [highlight, setHighlight] = useState<string | undefined>(undefined);

    async function updateTemplateSharedAddress(updatedAddresses: string[][]) {
        const newTemplate: EditTemplateDto = Object.assign({}, template);
        newTemplate.sharedAddresses = updatedAddresses;
        await onUpdate(newTemplate);
    }

    async function updateDivisions(updatedDivisions: DivisionTemplateDto[]) {
        const newTemplate: EditTemplateDto = Object.assign({}, template);
        newTemplate.divisions = updatedDivisions;
        await onUpdate(newTemplate);
    }

    return (<div>
        <SharedAddresses
            onUpdate={updateTemplateSharedAddress}
            addresses={template.sharedAddresses!}
            highlight={highlight!}
            setHighlight={asyncCallback(setHighlight)}
            className="bg-warning" />
        <TemplateDivisions
            onUpdate={updateDivisions}
            divisions={template.divisions!}
            templateSharedAddresses={template.sharedAddresses!.flatMap((a: string[]) => a)}
            highlight={highlight}
            setHighlight={asyncCallback(setHighlight)} />
    </div>);
}