import React, {useState} from "react";

export function TemplateTextEditor({ template, setValid, onUpdate }) {
    const [ editing, setEditing ] = useState(setEditingTemplate(template));

    function setEditingTemplate(t) {
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

    return (<textarea className="width-100 min-height-100"
          rows="15"
          value={editing}
          onChange={e => updateTemplate(e.target.value)}>
    </textarea>);
}