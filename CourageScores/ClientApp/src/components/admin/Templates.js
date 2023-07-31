import {useDependencies} from "../../IocContainer";
import React, {useEffect, useState} from "react";
import {useApp} from "../../AppContainer";
import {ErrorDisplay} from "../common/ErrorDisplay";

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

    async function loadTemplates() {
        try {
            const templates = await templateApi.getAll();
            setTemplates(templates);
            setLoading(false);
            setEditing(null);
        } catch (e) {
            onError(e);
        }
    }

    useEffect(() => {
        if (loading) {
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
        setEditing(JSON.stringify(t, excludePropertiesFromEdit, '  '));
        setValid(true);
    }

    function excludePropertiesFromEdit(key, value) {
        switch (key) {
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
        if (saving) {
            return;
        }

        setSaving(true);

        try {
            const template = JSON.parse(editing);
            if (selected) {
                template.lastUpdated = selected.updated;
            }
            const result = await templateApi.update(template);
            if (result.success) {
                await loadTemplates();
            } else {
                setSaveError(result);
            }
        } finally {
            setSaving(false);
        }
    }

    async function deleteTemplate() {
        if (deleting) {
            return;
        }

        if (!window.confirm('Are you sure you want to delete this template?')) {
            return;
        }

        setDeleting(true);
        try {
            const template = JSON.parse(editing);
            const result = await templateApi.delete(template.id);
            if (result.success) {
                await loadTemplates();
            } else {
                setSaveError(result);
            }
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

    try {
        return (<div className="content-background p-3">
            <h3>Manage templates</h3>
            {loading || loading === null
                ? (<p><span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span> Loading templates...</p>)
                : renderTemplates()}
            {editing ? <div>
                <p>Template definition</p>
                <textarea className="width-100 min-height-100" rows="15" value={editing} onChange={e => updateTemplate(e.target.value)}></textarea>
                <div>
                    <button className="btn btn-primary margin-right" onClick={saveTemplate} disabled={!valid}>
                        {saving ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                        Save
                    </button>
                    <button className="btn btn-danger margin-right" onClick={deleteTemplate} disabled={!valid}>
                        {deleting ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                        Delete
                    </button>
                </div>
            </div> : (<div>
                <button className="btn btn-primary margin-right" onClick={() => setEditingTemplate(EMPTY_TEMPLATE)}>Add</button>
            </div>)}
            {saveError ? (<ErrorDisplay {...saveError} onClose={() => setSaveError(null)} title="Could not save template" />) : null}
        </div>);
    }
    catch (e) {
        onError(e);
    }
}