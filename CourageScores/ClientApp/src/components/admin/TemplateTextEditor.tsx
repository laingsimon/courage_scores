import React, {useState} from "react";
import {stateChanged} from "../../helpers/events";
import {DateTemplateDto} from "../../interfaces/models/dtos/Season/Creation/DateTemplateDto";
import {FixtureTemplateDto} from "../../interfaces/models/dtos/Season/Creation/FixtureTemplateDto";
import {EditTemplateDto} from "../../interfaces/models/dtos/Season/Creation/EditTemplateDto";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface ITemplateTextEditorProps {
    template: EditTemplateDto;
    setValid(valid: boolean): UntypedPromise;
    onUpdate(update: EditTemplateDto): UntypedPromise;
}

export function TemplateTextEditor({ template, setValid, onUpdate }: ITemplateTextEditorProps) {
    const [ editing, setEditing ] = useState<string>(formatTemplateAsSingleLine(template));
    const [fixtureToFormat, setFixtureToFormat] = useState<string>('');

    function formatTemplateAsSingleLine(t: EditTemplateDto): string {
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

        function* generateFixtures(fixtures: string[]) {
            let fixtureBatch: string[] = [];
            for (const fixture of fixtures) {
                if (!fixture) {
                    continue;
                }

                fixtureBatch.push(fixture);
                if (fixtureBatch.length === 2) {
                    const fixture: FixtureTemplateDto = {
                        home: fixtureBatch[0],
                    };
                    if (fixtureBatch[1] !== '-') {
                        fixture.away = fixtureBatch[1];
                    }

                    fixtureBatch = [];
                    yield fixture;
                }
            }
        }

        const toFormat: DateTemplateDto = {
            fixtures: [...generateFixtures(fixtures)]
        };

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