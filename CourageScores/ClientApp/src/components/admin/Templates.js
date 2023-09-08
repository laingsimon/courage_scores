import {useDependencies} from "../../IocContainer";
import React, {useEffect, useState} from "react";
import {useApp} from "../../AppContainer";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {ViewHealthCheck} from "../division_health/ViewHealthCheck";
import {stateChanged, valueChanged} from "../../helpers/events";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {TemplateTextEditor} from "./TemplateTextEditor";
import {TemplateVisualEditor} from "./TemplateVisualEditor";

export function Templates() {
    const EMPTY_TEMPLATE = {
        sharedAddresses: [],
        divisions: [],
    };

    const {templateApi} = useDependencies();
    const {onError} = useApp();
    const [templates, setTemplates] = useState(null);
    const [loading, setLoading] = useState(null);
    const [selected, setSelected] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [valid, setValid] = useState(null);
    const [saveError, setSaveError] = useState(null);
    const [fixtureToFormat, setFixtureToFormat] = useState('');
    const [editorFormat, setEditorFormat] = useState('visual');

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
                setSelected(null);
                return;
            }

            setSelected(Object.assign({}, t));
            setEditingTemplate(t);
        }
    }

    function setEditingTemplate(t) {
        setValid(true);
        setSelected(t);
    }

    function isSelected(t) {
        if (!selected) {
            return false;
        }

        return selected.id === t.id;
    }

    function renderTemplates() {
        return (<ul className="list-group mb-2" datatype="templates">
            {templates.map(t => (<li key={t.id}
                                     className={`list-group-item flex-column${isSelected(t) ? ' active' : ''}`}
                                     onClick={toggleSelected(t)}>
                <div className="d-flex w-100 justify-content-between">
                    <label>{t.name}</label>
                    {renderBadge(t.templateHealth)}
                </div>
                {t.description ? (<small className="mb-1">{t.description}</small>) : null}
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
            const template = Object.assign({}, selected);
            template.lastUpdated = selected.updated;
            const result = await templateApi.update(template);
            if (result.success) {
                setSelected(null);
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
        /* istanbul ignore next */
        if (deleting) {
            /* istanbul ignore next */
            return;
        }

        if (!window.confirm('Are you sure you want to delete this template?')) {
            return;
        }

        setDeleting(true);
        try {
            const result = await templateApi.delete(selected.id);
            if (result.success) {
                setSelected(null);
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

    try {
        return (<div className="content-background p-3">
            <h3>Manage templates</h3>
            {loading || loading === null
                ? (<p><LoadingSpinnerSmall/> Loading templates...</p>)
                : renderTemplates()}
            {selected ? <div>
                <p>Template definition</p>
                <div className="input-group mb-3">
                    <div className="input-group-prepend">
                        <span className="input-group-text">Name</span>
                    </div>
                    <input name="name" className="form-control" value={selected.name} onChange={valueChanged(selected, setSelected)} />
                </div>
                <div className="input-group mb-3">
                    <div className="input-group-prepend">
                        <span className="input-group-text">Description</span>
                    </div>
                    <input name="description" className="form-control" value={selected.description || ''} onChange={valueChanged(selected, setSelected)} />
                </div>
                <div className="form-check form-switch input-group-prepend mb-2">
                    <input type="checkbox" className="form-check-input"
                           name="editorFormat" id="editorFormat"
                           checked={editorFormat === 'visual'}
                           onChange={event => setEditorFormat(event.target.checked ? 'visual' : 'text')}/>
                    <label className="form-check-label" htmlFor="editorFormat">Visual editor</label>
                </div>
                {editorFormat === 'text' ? (<TemplateTextEditor template={selected} setValid={setValid} onUpdate={setSelected} />) : null}
                {editorFormat === 'visual' ? (<TemplateVisualEditor template={selected} setValid={setValid} onUpdate={setSelected} />) : null}
                <div>
                    <button className="btn btn-primary margin-right" onClick={saveTemplate} disabled={!valid}>
                        {saving
                            ? (<LoadingSpinnerSmall/>)
                            : null}
                        Save
                    </button>
                    {selected && selected.id ? (
                        <button className="btn btn-danger margin-right" onClick={deleteTemplate}>
                            {deleting
                                ? (<LoadingSpinnerSmall/>)
                                : null}
                            Delete
                        </button>) : null}
                </div>
                {selected.templateHealth ? (<div className="alert alert-success mt-3 p-1 pt-3">
                    <ViewHealthCheck result={selected.templateHealth}/>
                </div>) : null}
                {editorFormat === 'text' ? (<div className="mt-3 text-secondary">
                    <div>Authoring tools: Copy fixture template from excel (per division)</div>
                    <textarea value={fixtureToFormat} className="d-inline-block width-100" placeholder="Copy from excel"
                              onChange={stateChanged(setFixtureToFormat)}/>
                    <textarea value={formatFixtureInput()} className="d-inline-block width-100"
                              placeholder="Copy into template" readOnly={true}></textarea>
                </div>) : null}
            </div> : (<div>
                <button className="btn btn-primary margin-right" onClick={() => setEditingTemplate(EMPTY_TEMPLATE)}>
                    Add
                </button>
            </div>)}
            {saveError
                ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save template"/>)
                : null}
        </div>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}