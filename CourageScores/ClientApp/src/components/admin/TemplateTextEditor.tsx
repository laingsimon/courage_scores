import React, {useState} from "react";
import {stateChanged} from "../../helpers/events";

export function TemplateTextEditor({ template, setValid, onUpdate }) {
    const [ editing, setEditing ] = useState(formatTemplateAsSingleLine(template));
    const [fixtureToFormat, setFixtureToFormat] = useState('');

    function formatTemplateAsSingleLine(t) {
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

    function excludePropertiesFromEdit(key, value) {
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

    function updateTemplate(json) {
        setEditing(json);
        try {
            const updatedTemplate = JSON.parse(json);
            setValid(true);
            onUpdate(Object.assign({}, template, updatedTemplate));
        } catch (e) {
            setValid(false);
        }
    }

    function formatFixtureInput() {
        const lines = fixtureToFormat.split('\n');
        return lines.filter(l => l.trim() !== '').map(formatFixtureLine).join(', ');
    }

    function formatFixtureLine(excelLine) {
        const fixtures = excelLine.split(/\s+/);

        const toFormat = {
            fixtures: []
        };
        let fixtureBatch = [];
        while (fixtures.length > 0) {
            const fixture = fixtures.shift();
            if (!fixture) {
                continue;
            }

            fixtureBatch.push(fixture);
            if (fixtureBatch.length === 2) {
                const fixture = {
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
          rows="15"
          value={editing}
          onChange={e => updateTemplate(e.target.value)}>
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