import {Dialog} from "../../common/Dialog";
import React, {useEffect, useState} from "react";
import {useDependencies} from "../../../IocContainer";
import {useApp} from "../../../AppContainer";
import {any} from "../../../helpers/collections";
import {useDivisionData} from "../../DivisionDataContainer";
import {renderDate} from "../../../helpers/rendering";
import {LoadingSpinnerSmall} from "../../common/LoadingSpinnerSmall";
import {ReviewProposalsFloatingDialog} from "./ReviewProposalsFloatingDialog";
import {PickTemplate} from "./PickTemplate";
import {SavingProposals} from "./SavingProposals";
import {ReviewProposalHealth} from "./ReviewProposalHealth";
import {ConfirmSave} from "./ConfirmSave";

export function CreateSeasonDialog({seasonId, onClose}) {
    const {templateApi, gameApi} = useDependencies();
    const {onError, divisions, reloadAll} = useApp();
    const {id, setDivisionData, onReloadDivision} = useDivisionData();
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [proposing, setProposing] = useState(false);
    const [stage, setStage] = useState('1-pick');
    const [response, setResponse] = useState(null);
    const [selectedDivisionId, setSelectedDivisionId] = useState(id);
    const [saveMessage, setSaveMessage] = useState(null);
    const [fixturesToSave, setFixturesToSave] = useState([]);
    const [savingProposal, setSavingProposal] = useState(false);
    const [saveResults, setSaveResults] = useState([]);

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
            case '2-review':
                setDivisionData(null);
                setStage('1-pick');
                return;
            case '3-review-proposals':
                setStage('2-review');
                return;
            case '4-confirm-save':
                setStage('3-review-proposals');
                return;
            case '5-saving':
                setStage('aborted');
                return;
        }
    }

    async function onNext() {
        switch (stage) {
            case '1-pick':
                return await onPropose();
            case '2-review':
                changeVisibleDivision(selectedDivisionId);
                setStage('3-review-proposals');
                return;
            case '3-review-proposals':
                const toSave = response.result.divisions
                    .flatMap(d => d.fixtures.flatMap(fd => fd.fixtures.map(f => {
                        return {fixture: f, date: fd, division: d}
                    })))
                    .filter(f => f.fixture.proposal && f.fixture.awayTeam);

                setFixturesToSave(toSave);
                setStage('3-confirm-save');
                break;
            case '4-confirm-save':
                return await saveProposals();
            case 'aborted':
                setSaveMessage(`Resuming save...`);
                setStage('5-saving');
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
            setStage('2-review');
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
        setStage('5-saving');
        setDivisionData(null);
    }

    function changeVisibleDivision(id) {
        setSelectedDivisionId(id);
        const newDivision = response.result.divisions.filter(d => d.id === id)[0];
        setDivisionData(newDivision);
    }

    useEffect(() => {
            if (stage !== '5-saving' || fixturesToSave == null) {
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

    useEffect(() => {
            // noinspection JSIgnoredPromiseFromCall
            loadTemplateCompatibility();
        },
        // eslint-disable-next-line
        []);

    if (stage === '3-review-proposals') {
        return (<ReviewProposalsFloatingDialog
            proposalResult={response.result}
            onNext={onNext}
            onPrevious={onPrevious}
            changeVisibleDivision={changeVisibleDivision}
            selectedDivisionId={selectedDivisionId} />);
    }

    try {
        return (<Dialog title="Create season fixtures...">
            {stage === '1-pick' ? (<PickTemplate
                templates={templates}
                setSelectedTemplate={setSelectedTemplate}
                loading={loading}
                selectedTemplate={selectedTemplate} />) : null}
            {stage === '2-review' ? (<ReviewProposalHealth response={response} />) : null}
            {stage === '4-confirm-save'
                ? (<ConfirmSave noOfFixturesToSave={fixturesToSave.length} noOfDivisions={divisions.length} />)
                : null}
            {stage === '5-saving' || stage === 'aborted' || stage === 'saved'
                ? (<SavingProposals
                    response={response}
                    noOfFixturesToSave={fixturesToSave.length}
                    saveMessage={saveMessage}
                    saveResults={saveResults}
                    saving={stage === '5-saving'} />)
                : null}
            <div className="modal-footer px-0 mt-3 pb-0">
                <div className="left-aligned">
                    <button className="btn btn-secondary" onClick={() => {
                        setDivisionData(null);
                        onClose();
                    }} disabled={stage === '5-saving'}>
                        Close
                    </button>
                </div>
                <button className="btn btn-primary" onClick={onPrevious}
                        disabled={stage === '1-pick' || stage === 'saved'}>
                    Back
                </button>
                <button className="btn btn-primary" onClick={onNext}
                        disabled={!selectedTemplate || stage === '5-saving' || stage === 'saved'}>
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