import React, {useState} from "react";
import {stateChanged} from "../../helpers/events";
import {ITemplateDto} from "../../interfaces/serverSide/Season/Creation/ITemplateDto";
import {IDateTemplateDto} from "../../interfaces/serverSide/Season/Creation/IDateTemplateDto";
import {IFixtureTemplateDto} from "../../interfaces/serverSide/Season/Creation/IFixtureTemplateDto";

export interface ITemplateTextEditorProps {
    template: ITemplateDto;
    setValid: (valid: boolean) => Promise<any>;
    onUpdate: (update: ITemplateDto) => Promise<any>;
}

export function TemplateTextEditor({ template, setValid, onUpdate }: ITemplateTextEditorProps) {
    const [ editing, setEditing ] = useState<string>(formatTemplateAsSingleLine(template));
    const [fixtureToFormat, setFixtureToFormat] = useState<string>('');

    function formatTemplateAsSingleLine(t: ITemplateDto): string {
        let jsonString = JSON.stringify(t, excludePropertiesFromEdit, '  ');

        // fixture inlining
        jsonString = jsonString.replaceAll(',\n              "away"', ', "away"');
        jsonString = jsonString.replaceAll('"\n            }', '" }');
        jsonString = jsonString.replaceAll('{\n              "', '{ "');
        jsonString = jsonString.replaceAll(', "away": null\n            }', ' }');

        // division shared address inlining
        jsonString = jsonString.replaceAll('[\n          "', '[ "');
        jsonString = jsonString.replaceAll('",\n          "', '", "');
        jsonString = jsonString.replaceAll('"\n        ]', '" ]');

        // season shared address inlining
        jsonString = jsonString.replaceAll('[\n      "', '[ "');
        jsonString = jsonString.replaceAll('",\n      "', '", "');
        jsonString = jsonString.replaceAll('"\n    ]', '" ]');

        return jsonString;
    }

    function excludePropertiesFromEdit(key: string, value: any) {
        switch (key) {
            case 'id':
            case 'created':
            case 'author':
            case 'editor':
            case 'updated':
            case 'deleted':
            case 'remover':
            case 'templateHealth':
            case 'name':
            case 'description':
                return undefined;
            default:
                return value;
        }
    }

    async function updateTemplateEvent(e: React.ChangeEvent<HTMLTextAreaElement>) {
        const json: string = e.target.value;

        setEditing(json);
        try {
            const updatedTemplate = JSON.parse(json);
            await setValid(true);
            await onUpdate(Object.assign({}, template, updatedTemplate));
        } catch (e) {
            await setValid(false);
        }
    }

    function formatFixtureInput(): string {
        const lines: string[] = fixtureToFormat.split('\n');
        return lines.filter((l: string) => l.trim() !== '').map(formatFixtureLine).join(', ');
    }

    function formatFixtureLine(excelLine: string): string {
        const fixtures: string[] = excelLine.split(/\s+/);

        const toFormat: IDateTemplateDto = {
            fixtures: []
        };
        let fixtureBatch: string[] = [];
        while (fixtures.length > 0) {
            const fixture: string = fixtures.shift();
            if (!fixture) {
                continue;
            }

            fixtureBatch.push(fixture);
            if (fixtureBatch.length === 2) {
                const fixture: IFixtureTemplateDto = {
                    home: fixtureBatch[0],
                };
                if (fixtureBatch[1] !== '-') {
                    fixture.away = fixtureBatch[1];
                }

                toFormat.fixtures.push(fixture);
                fixtureBatch = [];
            }
        }

        return JSON.stringify(toFormat, null, '    ');
    }

    return (<>
        <textarea className="width-100 min-height-100"
          rows={15}
          value={editing}
          onChange={updateTemplateEvent}>
        </textarea>
        <div className="mt-3 text-secondary">
            <div>Authoring tools: Copy fixture template from excel (per division)</div>
            <textarea value={fixtureToFormat} className="d-inline-block width-100" placeholder="Copy from excel"
                      onChange={stateChanged(setFixtureToFormat)}></textarea>
            <textarea value={formatFixtureInput()} className="d-inline-block width-100"
                      placeholder="Copy into template" readOnly={true}></textarea>
        </div>
    </>);
}