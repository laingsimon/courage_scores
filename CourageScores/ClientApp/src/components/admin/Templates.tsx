import {useDependencies} from "../../IocContainer";
import React, {useEffect, useState} from "react";
import {useApp} from "../../AppContainer";
import {ErrorDisplay} from "../common/ErrorDisplay";
import {ViewHealthCheck} from "../division_health/ViewHealthCheck";
import {valueChanged} from "../../helpers/events";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";
import {TemplateTextEditor} from "./TemplateTextEditor";
import {TemplateVisualEditor} from "./TemplateVisualEditor";
import {useLocation} from "react-router-dom";

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
    const [editorFormat, setEditorFormat] = useState('visual');
    const [shouldRefreshHealth, setShouldRefreshHealth] = useState(false);
    const location = useLocation();

    async function loadTemplates() {
        try {
            const templates = await templateApi.getAll();
            setTemplates(templates);
            setLoading(false);

            const search = new URLSearchParams(location.search);
            const idish = search.has('select') ? search.get('select') : null;
            if (!selected && idish) {
                const templateToSelect = templates.filter(t => t.id === idish || t.name === idish)[0];
                if (templateToSelect) {
                    setSelected(templateToSelect);
                }
            }
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

    useEffect(() => {
        if (!shouldRefreshHealth || !selected) {
            return;
        }

        // noinspection JSIgnoredPromiseFromCall
        refreshHealth();
    },
    // eslint-disable-next-line
    [shouldRefreshHealth, selected]);

    async function refreshHealth() {
        setShouldRefreshHealth(false);
        const response = await templateApi.health(selected);

        if (selected && response && response.result) {
            const newTemplate = Object.assign({}, selected);
            newTemplate.templateHealth = response.result;
            setSelected(newTemplate);
        }
    }

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
        setSelected(Object.assign({}, t));
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

    function updateTemplate(newTemplate) {
        setSelected(newTemplate);
        setShouldRefreshHealth(true);
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
                    <input name="name" className="form-control" value={selected.name || ''} onChange={valueChanged(selected, setSelected)} />
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
                {editorFormat === 'text' ? (<TemplateTextEditor template={selected} setValid={setValid} onUpdate={updateTemplate} />) : null}
                {editorFormat === 'visual' ? (<TemplateVisualEditor template={selected} setValid={setValid} onUpdate={updateTemplate} />) : null}
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