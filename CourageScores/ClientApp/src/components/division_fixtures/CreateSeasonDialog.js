import {Dialog} from "../common/Dialog";
import {BootstrapDropdown} from "../common/BootstrapDropdown";
import React, {useEffect, useState} from "react";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";
import {Loading} from "../common/Loading";
import {any} from "../../helpers/collections";
import {ViewHealthCheck} from "../division_health/ViewHealthCheck";
import {useDivisionData} from "../DivisionDataContainer";

export function CreateSeasonDialog({ seasonId, onClose, setNewFixtures }) {
    const { templateApi } = useDependencies();
    const { onError, divisions } = useApp();
    const { id } = useDivisionData();
    const [ loading, setLoading ] = useState(false);
    const [ templates, setTemplates ] = useState(null);
    const [ selectedTemplate, setSelectedTemplate ] = useState(null);
    const templateOptions = templates && templates.result
        ? templates.result.map(getTemplateOption)
        : [];
    const [ proposing, setProposing ] = useState(false);
    const [ stage, setStage ] = useState('pick');
    const [ response, setResponse ] = useState(null);
    const divisionOptions = divisions
        .filter(d => {
            if (!response) {
                return false;
            }

            return any(response.result.divisions, proposedDivision => proposedDivision.id === d.id);
        })
        .map(d => { return { value: d.id, text: d.name }; })
    const [ selectedDivisionId, setSelectedDivisionId ] = useState(id);

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

    async function onPrevious() {
        switch (stage) {
            default:
            case 'review-divisions':
                setStage('review');
                return;
            case 'pick':
            case 'review':
                setStage('pick');
                return;
        }
    }

    async function onNext() {
        switch (stage) {
            case 'pick':
                return await onPropose();
            case 'review':
                return showFixtures();
            case 'review-divisions':
                alert('Not implemented yet');
                break;
            default:
                return;
        }
    }

    async function onPropose() {
        /* istanbul ignore next */
        if (proposing) {
            /* istanbul ignore next */
            return;
        }

        if (!selectedTemplate.success) {
            alert('This template is not compatible with this season, pick another template');
            return;
        }

        setProposing(true);
        try {
            const response = await templateApi.propose({
                templateId: selectedTemplate.result.id,
                seasonId: seasonId,
            });
            setStage('review');
            setResponse(response);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setProposing(false);
        }
    }

    function showFixtures() {
        const newDivision = response.result.divisions.filter(d => d.id === selectedDivisionId)[0];
        setNewFixtures(newDivision.fixtures);
        setStage('review-divisions');
    }

    function changeVisibleDivision(id) {
        setSelectedDivisionId(id);
        const newDivision = response.result.divisions.filter(d => d.id === id)[0];
        setNewFixtures(newDivision.fixtures);
    }

    useEffect(() => {
        // noinspection JSIgnoredPromiseFromCall
        loadTemplateCompatibility();
    },
    // eslint-disable-next-line
    []);

    if (stage === 'review-divisions') {
        return (<div className="position-fixed p-3 top-0 right-0 bg-white border-2 border-solid border-success box-shadow me-3 mt-3">
            <h6>Review the fixtures in the divisions</h6>
            <BootstrapDropdown options={divisionOptions} value={selectedDivisionId} onChange={changeVisibleDivision} />
            <div className="mt-3">
                <button className="btn btn-primary margin-right" onClick={onPrevious}>Back</button>
                <button className="btn btn-primary margin-right" onClick={onNext}>Save all fixtures</button>
            </div>
        </div>);
    }

    try {
        return (<Dialog title="Create season fixtures...">
            {loading ? (<Loading />) : null}
            {!loading && stage === 'pick' ? (<div>
                Fixture template: <BootstrapDropdown options={templateOptions} value={selectedTemplate ? selectedTemplate.result.id : null} onChange={value => setSelectedTemplate(templates.result.filter(t => t.result.id === value)[0])} />
            </div>) : null}
            {!loading && selectedTemplate && stage === 'pick' ? (<div className={`alert mt-3 ${selectedTemplate.success ? 'alert-success' : 'alert-warning'}`}>
                {selectedTemplate.success ? (<h4>✔ Compatible with this season</h4>) : (<h4>🚫 Incompatible with this season</h4>)}
                {any(selectedTemplate.errors) ? (<ol>{selectedTemplate.errors.map((e, i) => <li className="text-danger" key={i}>{e}</li>)}</ol>) : null}
                {any(selectedTemplate.warnings) ? (<ol>{selectedTemplate.warnings.map((w, i) => <li key={i}>{w}</li>)}</ol>) : null}
                {any(selectedTemplate.messages) ? (<ol>{selectedTemplate.messages.map((m, i) => <li className="text-secondary" key={i}>{m}</li>)}</ol>) : null}

                {selectedTemplate.success ? (<ViewHealthCheck result={selectedTemplate.result.templateHealth} />) : null}
            </div>) : null}
            {!loading && stage === 'review' ? (<div>
                {response.success ? (<h4>✔ Fixtures have been proposed successful</h4>) : (<h4>⚠ There was an issue proposing fixtures</h4>)}
                <p>Health report for proposed fixtures (all divisions)</p>
                <div className={`overflow-auto max-height-250 alert mt-3 ${response.success ? 'alert-success' : 'alert-warning'}`}>
                    {any(response.errors) ? (<ol>{response.errors.map((e, i) => <li className="text-danger" key={i}>{e}</li>)}</ol>) : null}
                    {any(response.warnings) ? (<ol>{response.warnings.map((w, i) => <li key={i}>{w}</li>)}</ol>) : null}
                    {any(response.messages) ? (<ol>{response.messages.map((m, i) => <li className="text-secondary" key={i}>{m}</li>)}</ol>) : null}
                    {response.success ? (<ViewHealthCheck result={response.result.proposalHealth} />) : null}
                </div>
            </div>) : null}
            <div className="modal-footer px-0 mt-3 pb-0">
                <div className="left-aligned">
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
                <button className="btn btn-primary" onClick={onPrevious} disabled={stage === 'pick'}>
                    Back
                </button>
                <button className="btn btn-primary" onClick={onNext} disabled={!selectedTemplate}>
                    {proposing ? (<span className="spinner-border spinner-border-sm margin-right" role="status" aria-hidden="true"></span>) : null}
                    Next
                </button>
            </div>
        </Dialog>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}