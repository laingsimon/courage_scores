import {useDependencies} from "../../IocContainer";
import React, {useEffect, useState} from "react";
import {useApp} from "../../AppContainer";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {ViewHealthCheck} from "../division_health/ViewHealthCheck";
import {stateChanged} from "../../helpers/events";

export function Templates() {
    const EMPTY_TEMPLATE = {};

    const { templateApi } = useDependencies();
    const { onError } = useApp();
    const [ templates, setTemplates ] = useState(null);
    const [ loading, setLoading ] = useState(null);
    const [ editing, setEditing ] = useState(null);
    const [ selected, setSelected ] = useState(null);
    const [ saving, setSaving ] = useState(false);
    const [ deleting, setDeleting ] = useState(false);
    const [ valid, setValid ] = useState(null);
    const [ saveError, setSaveError ] = useState(null);
    const [ fixtureToFormat, setFixtureToFormat ] = useState('');

    async function loadTemplates() {
        try {
            const templates = await templateApi.getAll();
            setTemplates(templates);
            setLoading(false);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        }
    }

    useEffect(() => {
        /* istanbul ignore next */
        if (loading) {
            /* istanbul ignore next */
            return;
        }

        setLoading(true);
        // noinspection JSIgnoredPromiseFromCall
        loadTemplates();
    },
    // eslint-disable-next-line
    []);

    function toggleSelected(t) {
        return () => {
            if (isSelected(t)) {
                setEditing(null);
                setSelected(null);
                return;
            }

            setSelected(t);
            setEditingTemplate(t);
        }
    }

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

        setEditing(jsonString);
        setValid(true);
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
                return undefined;
            default:
                return value;
        }
    }

    function isSelected(t) {
        if (!editing || !selected) {
            return false;
        }

        return selected.id === t.id;
    }

    function renderTemplates() {
        return (<ul className="list-group mb-2">
            {templates.map(t => (<li key={t.id} className={`list-group-item d-flex justify-content-between align-items-center${isSelected(t) ? ' active' : ''}`} onClick={toggleSelected(t)}>
                <label>{t.name}</label>
                {renderBadge(t.templateHealth)}
            </li>))}
        </ul>);
    }

    function renderBadge(templateHealth) {
        if (!templateHealth) {
            return null;
        }

        const success = Object.values(templateHealth.checks).filter(c => c.success).length;
        const fail = Object.values(templateHealth.checks).filter(c => !c.success && c.errors.length === 0).length;
        const error = Object.values(templateHealth.checks).filter(c => c.errors.length > 0).length + templateHealth.errors.length;

        return (<span>
            {success ? (<span className="badge rounded-pill bg-success margin-left">{success}</span>) : null}
            {fail ? (<span className="badge rounded-pill bg-warning margin-left">{fail}</span>) : null}
            {error ? (<span className="badge rounded-pill bg-danger margin-left">{error}</span>) : null}
        </span>);
    }

    async function saveTemplate() {
        /* istanbul ignore next */
        if (saving) {
            /* istanbul ignore next */
            return;
        }

        setSaving(true);

        try {
            const template = JSON.parse(editing);
            if (selected) {
                template.lastUpdated = selected.updated;
                template.id = selected.id;
            }
            const result = await templateApi.update(template);
            if (result.success) {
                setEditing(null);
                await loadTemplates();
            } else {
                setSaveError(result);
            }
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setSaving(false);
        }
    }

    async function deleteTemplate() {
        if (!selected || deleting) {
            return;
        }

        if (!window.confirm('Are you sure you want to delete this template?')) {
            return;
        }

        setDeleting(true);
        try {
            const result = await templateApi.delete(selected.id);
            if (result.success) {
                setEditing(null);
                await loadTemplates();
            } else {
                setSaveError(result);
            }
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setDeleting(false);
        }
    }

    function updateTemplate(json) {
        setEditing(json);
        try {
            JSON.parse(json);
            setValid(true);
        } catch (e) {
            setValid(false);
        }
    }

    function formatFixtureInput() {
        const lines = fixtureToFormat.split('\n');
        return lines.filter(l => l.trim() !== '').map(formatFixtureLine).join(', ');
    }

    function formatFixtureLine(excelLine) {
        if (!excelLine) {
            return '';
        }

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
            if (fixtureBatch.length === 2){
                toFormat.fixtures.push({
                    home: fixtureBatch[0],
                    away: fixtureBatch[1],
                });
                fixtureBatch = [];
            }
        }

        return JSON.stringify(toFormat, null, '    ');
    }

    try {
        return (<div className="content-background p-3">
            <h3>Manage templates</h3>
            {loading || loading === null
                ? (<p><span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span> Loading templates...</p>)
                : renderTemplates()}
            {editing !== null ? <div>
                <p>Template definition</p>
                <textarea className="width-100 min-height-100" rows="15" value={editing} onChange={e => updateTemplate(e.target.value)}></textarea>
                <div>
                    <button className="btn btn-primary margin-right" onClick={saveTemplate} disabled={!valid}>
                        {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                        Save
                    </button>
                    {selected && selected.id ? (<button className="btn btn-danger margin-right" onClick={deleteTemplate}>
                        {deleting ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                        Delete
                    </button>) : null}
                </div>
                {selected && selected.templateHealth ? (<div>
                    <ViewHealthCheck result={selected.templateHealth} />
                </div>) : null}
                <div className="mt-3 text-secondary">
                    <div>Authoring tools: Copy fixture template from excel (per division)</div>
                    <textarea value={fixtureToFormat} className="d-inline-block width-100" placeholder="Copy from excel" onChange={stateChanged(setFixtureToFormat)} />
                    <textarea value={formatFixtureInput()} className="d-inline-block width-100" placeholder="Copy into template" readOnly={true}></textarea>
                </div>
            </div> : (<div>
                <button className="btn btn-primary margin-right" onClick={() => setEditingTemplate(EMPTY_TEMPLATE)}>Add</button>
            </div>)}
            {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save template" />) : null}
        </div>);
    }
    catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}