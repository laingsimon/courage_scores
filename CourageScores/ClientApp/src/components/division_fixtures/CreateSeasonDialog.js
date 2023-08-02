import {Dialog} from "../common/Dialog";
import {BootstrapDropdown} from "../common/BootstrapDropdown";
import React, {useEffect, useState} from "react";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";
import {Loading} from "../common/Loading";
import {any} from "../../helpers/collections";
import {ViewHealthCheck} from "../division_health/ViewHealthCheck";

export function CreateSeasonDialog({ seasonId, onClose }) {
    const { templateApi } = useDependencies();
    const { onError } = useApp();
    const [ loading, setLoading ] = useState(false);
    const [ templates, setTemplates ] = useState(null);
    const [ selectedTemplate, setSelectedTemplate ] = useState(null);
    const templateOptions = templates && templates.result
        ? templates.result.map(getTemplateOption)
        : [];

    function getTemplateOption(compatibility) {
        let text = compatibility.success
            ? compatibility.result.name
            : <span>🚫 {compatibility.result.name}</span>

        return {
            value: compatibility.result.id,
            text: text,
        };
    }

    async function loadTemplateCompatibility() {
        /* istanbul ignore next */
        if (loading) {
            /* istanbul ignore next */
            return;
        }

        setLoading(true);
        try {
            const response = await templateApi.getCompatibility(seasonId);
            setTemplates(response);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // noinspection JSIgnoredPromiseFromCall
        loadTemplateCompatibility();
    },
    // eslint-disable-next-line
    []);

    try {
        return (<Dialog title="Create season fixtures...">
            {loading ? (<Loading />) : null}
            {loading ? null : (<div>
                Fixture template: <BootstrapDropdown options={templateOptions} value={selectedTemplate ? selectedTemplate.result.id : null} onChange={value => setSelectedTemplate(templates.result.filter(t => t.result.id === value)[0])} />
            </div>)}
            {!loading && selectedTemplate ? (<div className={`alert mt-3 ${selectedTemplate.success ? 'alert-success' : 'alert-warning'}`}>
                {selectedTemplate.success ? (<h4>✔ Compatible with this season</h4>) : (<h4>🚫 Incompatible with this season</h4>)}
                {any(selectedTemplate.errors) ? (<ol>{selectedTemplate.errors.map((e, i) => <li className="text-danger" key={i}>{e}</li>)}</ol>) : null}
                {any(selectedTemplate.warnings) ? (<ol>{selectedTemplate.warnings.map((w, i) => <li key={i}>{w}</li>)}</ol>) : null}
                {any(selectedTemplate.messages) ? (<ol>{selectedTemplate.messages.map((m, i) => <li className="text-secondary" key={i}>{m}</li>)}</ol>) : null}

                {!loading && selectedTemplate && selectedTemplate.success ? (<ViewHealthCheck result={selectedTemplate.result.templateHealth} />) : null}
            </div>) : null}
            <div className="modal-footer px-0 mt-3 pb-0">
                <div className="left-aligned">
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
                <button className="btn btn-primary">Next</button>
            </div>
        </Dialog>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}