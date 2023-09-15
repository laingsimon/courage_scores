import {Dialog} from "../common/Dialog";
import {BootstrapDropdown} from "../common/BootstrapDropdown";
import React, {useEffect, useState} from "react";
import {useDependencies} from "../../IocContainer";
import {useApp} from "../../AppContainer";
import {any, sortBy} from "../../helpers/collections";
import {ViewHealthCheck} from "../division_health/ViewHealthCheck";
import {useDivisionData} from "../DivisionDataContainer";
import {renderDate} from "../../helpers/rendering";
import {LoadingSpinnerSmall} from "../common/LoadingSpinnerSmall";

export function CreateSeasonDialog({seasonId, onClose}) {
    const {templateApi, gameApi} = useDependencies();
    const {onError, divisions, reloadAll} = useApp();
    const {id, setDivisionData, onReloadDivision} = useDivisionData();
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const templateOptions = templates && templates.result
        ? templates.result.map(getTemplateOption)
        : [];
    const [proposing, setProposing] = useState(false);
    const [stage, setStage] = useState('pick');
    const [response, setResponse] = useState(null);
    const divisionOptions = divisions
        .filter(d => {
            if (!response) {
                return false;
            }

            return any(response.result.divisions, proposedDivision => proposedDivision.id === d.id);
        })
        .sort(sortBy('name'))
        .map(d => {
            return {value: d.id, text: d.name};
        })
    const [selectedDivisionId, setSelectedDivisionId] = useState(id);
    const [saveMessage, setSaveMessage] = useState(null);
    const [fixturesToSave, setFixturesToSave] = useState([]);
    const [savingProposal, setSavingProposal] = useState(false);
    const [saveResults, setSaveResults] = useState([]);

    function getTemplateOption(compatibility) {
        let text = compatibility.success
            ? <div>{compatibility.result.name}<small className="ps-4 d-block">{compatibility.result.description}</small></div>
            : <div>🚫 {compatibility.result.name}<small className="ps-4 d-block">{compatibility.result.description}</small></div>

        return {
            value: compatibility.result.id,
            text: text,
        };
    }

    async function loadTemplateCompatibility() {
        /* istanbul ignore next */
        if (loading || templates) {
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
            /* istanbul ignore next */
            default:
            case 'review':
                setDivisionData(null);
                setStage('pick');
                return;
            case 'review-proposals':
                setStage('review');
                return;
            case 'confirm-save':
                setStage('review-proposals');
                return;
            case 'saving':
                setStage('aborted');
                return;
        }
    }

    async function onNext() {
        switch (stage) {
            case 'pick':
                return await onPropose();
            case 'review':
                changeVisibleDivision(selectedDivisionId);
                setStage('review-proposals');
                return;
            case 'review-proposals':
                const toSave = response.result.divisions
                    .flatMap(d => d.fixtures.flatMap(fd => fd.fixtures.map(f => {
                        return {fixture: f, date: fd, division: d}
                    })))
                    .filter(f => f.fixture.proposal && f.fixture.awayTeam);

                setFixturesToSave(toSave);
                setStage('confirm-save');
                break;
            case 'confirm-save':
                return await saveProposals();
            case 'aborted':
                setSaveMessage(`Resuming save...`);
                setStage('saving');
                return;
            /* istanbul ignore next */
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

    async function saveProposals() {
        setSaveMessage(`Starting save...`);
        setStage('saving');
        setDivisionData(null);
    }

    function changeVisibleDivision(id) {
        setSelectedDivisionId(id);
        const newDivision = response.result.divisions.filter(d => d.id === id)[0];
        setDivisionData(newDivision);
    }

    useEffect(() => {
            if (stage !== 'saving' || fixturesToSave == null) {
                return;
            }

            // save a fixture and pop it off the list
            if (!any(fixturesToSave) && !savingProposal) {
                // noinspection JSIgnoredPromiseFromCall
                proposalsSaved();
                return;
            }

            // noinspection JSIgnoredPromiseFromCall
            saveNextProposal();
        },
        // eslint-disable-next-line
        [stage, fixturesToSave, savingProposal, saveResults]);

    async function proposalsSaved() {
        setSaveMessage('Reloading division data...');
        await reloadAll();
        await onReloadDivision();
        setDivisionData(null);
        setStage('saved');

        const errors = saveResults.filter(r => !r.success);
        if (any(errors)) {
            setSaveMessage(`Some (${errors.length}) fixtures could not be saved`);
            return;
        }

        onClose();
    }

    async function saveNextProposal() {
        if (savingProposal) {
            return;
        }

        const fixtureToSave = fixturesToSave[0];
        setFixturesToSave(fixturesToSave.filter(f => f !== fixtureToSave));
        setSavingProposal(true);

        try {
            const fixture = fixtureToSave.fixture;
            const date = fixtureToSave.date;
            const division = fixtureToSave.division;

            setSaveMessage(`Saving - ${division.name}: ${renderDate(date.date)}, ${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`);
            const result = await gameApi.update({
                id: undefined,
                address: fixture.homeTeam.address,
                divisionId: division.id,
                homeTeamId: fixture.homeTeam.id,
                awayTeamId: fixture.awayTeam.id,
                date: date.date,
                isKnockout: false,
                seasonId: seasonId,
                accoladesCount: true,
            }, null);
            setSaveResults(saveResults.concat(result));
        } catch (e) {
            setSaveResults(saveResults.concat({
                success: false,
                errors: ['Error saving proposal: ' + e.message]
            }));
            setSaveMessage('Error saving proposal: ' + e.message);
        } finally {
            setSavingProposal(false);
        }
    }

    function getPercentageComplete() {
        const total = saveResults.length + fixturesToSave.length;
        const complete = saveResults.length;
        const percentage = complete / total;

        return percentage * 100;
    }

    useEffect(() => {
            // noinspection JSIgnoredPromiseFromCall
            loadTemplateCompatibility();
        },
        // eslint-disable-next-line
        []);

    if (stage === 'review-proposals') {
        const placeholderMappings = response.result.placeholderMappings;
        return (<>
            <div style={{zIndex: '1051'}}
                 className="position-fixed p-3 top-0 right-0 bg-white border-2 border-solid border-success box-shadow me-3 mt-3">
                <h6>Review the fixtures in the divisions</h6>
                <BootstrapDropdown options={divisionOptions} value={selectedDivisionId}
                                   onChange={changeVisibleDivision}/>
                <ul className="mt-3">
                    {Object.keys(placeholderMappings).sort().map(key => (<li key={key}>
                        {key} &rarr; {placeholderMappings[key].name}
                    </li>))}
                </ul>
                <div className="mt-3">
                    <button className="btn btn-primary margin-right" onClick={onPrevious}>Back</button>
                    <button className="btn btn-primary margin-right" onClick={onNext}>Save all fixtures</button>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>);
    }

    function renderError(e, i) {
        return (<li className="text-danger" key={i}>{e}</li>);
    }

    function renderWarning(w, i) {
        return (<li key={i}>{w}</li>);
    }

    function renderMessage(m, i) {
        return (<li className="text-secondary" key={i}>{m}</li>);
    }

    try {
        return (<Dialog title="Create season fixtures...">
            {stage === 'pick' ? (<div>
                <span className="margin-right">Fixture template:</span>
                {loading
                    ? (<LoadingSpinnerSmall/>)
                    : (<BootstrapDropdown options={templateOptions}
                                          value={selectedTemplate ? selectedTemplate.result.id : null}
                                          onChange={value => setSelectedTemplate(templates.result.filter(t => t.result.id === value)[0])}/>)}
            </div>) : null}
            {selectedTemplate && stage === 'pick' ? (
                <div className={`alert mt-3 ${selectedTemplate.success ? 'alert-success' : 'alert-warning'}`}>
                    {selectedTemplate.success ? (<h4>✔ Compatible with this season</h4>) : (
                        <h4>🚫 Incompatible with this season</h4>)}
                    {any(selectedTemplate.errors)
                        ? (<ol>{selectedTemplate.errors.map(renderError)}</ol>)
                        : null}
                    {any(selectedTemplate.warnings)
                        ? (<ol>{selectedTemplate.warnings.map(renderWarning)}</ol>)
                        : null}
                    {any(selectedTemplate.messages)
                        ? (<ol>{selectedTemplate.messages.map(renderMessage)}</ol>)
                        : null}

                    {selectedTemplate.success
                        ? (<ViewHealthCheck result={selectedTemplate.result.templateHealth}/>)
                        : null}
                </div>) : null}
            {stage === 'review' ? (<div>
                {response.success ? (<h4>✔ Fixtures have been proposed</h4>) : (
                    <h4>⚠ There was an issue proposing fixtures</h4>)}
                <p>Press <kbd>Next</kbd> to review the fixtures in the divisions before saving</p>
                <div
                    className={`overflow-auto max-height-250 alert mt-3 ${response.success ? 'alert-success' : 'alert-warning'}`}>
                    {any(response.errors)
                        ? (<ol>{response.errors.map(renderError)}</ol>)
                        : null}
                    {any(response.warnings)
                        ? (<ol>{response.warnings.map(renderWarning)}</ol>)
                        : null}
                    {any(response.messages)
                        ? (<ol>{response.messages.map(renderMessage)}</ol>)
                        : null}
                    {response.success ? (<ViewHealthCheck result={response.result.proposalHealth}/>) : null}
                </div>
            </div>) : null}
            {stage === 'confirm-save'
                ? (<div>
                    <p>Press <kbd>Next</kbd> to save all {fixturesToSave.length} fixtures
                        across {divisionOptions.length} divisions</p>
                    <p>You must keep your device on and connected to the internet during the process of saving the
                        fixtures</p>
                </div>)
                : null}
            {stage === 'saving' || stage === 'aborted' || stage === 'saved' ? (<div>
                {stage === 'saving' && any(fixturesToSave) ? (
                    <LoadingSpinnerSmall/>) : null}
                {saveMessage}
                <div>{saveResults.length} fixtures of {saveResults.length + fixturesToSave.length} saved</div>
                <div className="progress">
                    <div className="progress-bar progress-bar-striped" style={{width: getPercentageComplete() + '%'}}
                         role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                {any(saveResults, r => !r.success) ? (<div className="overflow-auto max-height-250">
                    {saveResults.map((r, index) => (<div key={index}>
                        {any(response.errors)
                            ? (<ol>{response.errors.map(renderError)}</ol>)
                            : null}
                        {any(response.warnings) ? (
                            <ol>{response.warnings.map(renderWarning)}</ol>) : null}
                        {any(response.messages)
                            ? (<ol>{response.messages.map(renderMessage)}</ol>)
                            : null}
                    </div>))}
                </div>) : null}
            </div>) : null}
            <div className="modal-footer px-0 mt-3 pb-0">
                <div className="left-aligned">
                    <button className="btn btn-secondary" onClick={() => {
                        setDivisionData(null);
                        onClose();
                    }} disabled={stage === 'saving'}>
                        Close
                    </button>
                </div>
                <button className="btn btn-primary" onClick={onPrevious}
                        disabled={stage === 'pick' || stage === 'saved'}>
                    Back
                </button>
                <button className="btn btn-primary" onClick={onNext}
                        disabled={!selectedTemplate || stage === 'saving' || stage === 'saved'}>
                    {proposing
                        ? (<LoadingSpinnerSmall/>)
                        : null}
                    Next
                </button>
            </div>
        </Dialog>);
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}