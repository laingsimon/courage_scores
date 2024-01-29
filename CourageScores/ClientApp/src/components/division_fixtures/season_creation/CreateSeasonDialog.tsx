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
import {AssignPlaceholders, IPlaceholderMappings} from "./AssignPlaceholders";
import {IClientActionResultDto} from "../../../interfaces/IClientActionResultDto";
import {ITemplateDto} from "../../../interfaces/dtos/Season/Creation/ITemplateDto";
import {IActionResultDto} from "../../../interfaces/dtos/IActionResultDto";
import {IProposalResultDto} from "../../../interfaces/dtos/Season/Creation/IProposalResultDto";
import {IDivisionDataDto} from "../../../interfaces/dtos/Division/IDivisionDataDto";
import {IGameDto} from "../../../interfaces/dtos/Game/IGameDto";
import {IDivisionFixtureDto} from "../../../interfaces/dtos/Division/IDivisionFixtureDto";
import {IDivisionFixtureDateDto} from "../../../interfaces/dtos/Division/IDivisionFixtureDateDto";

export interface ICreateSeasonDialogProps {
    seasonId: string;
    onClose: () => Promise<any>;
}

export interface IFixtureToSave {
    fixture: IDivisionFixtureDto;
    date: IDivisionFixtureDateDto;
    division: IDivisionDataDto;
}

export function CreateSeasonDialog({seasonId, onClose}: ICreateSeasonDialogProps) {
    const {templateApi, gameApi} = useDependencies();
    const {onError, divisions, reloadAll} = useApp();
    const {id, setDivisionData, onReloadDivision} = useDivisionData();
    const [loading, setLoading] = useState<boolean>(false);
    const [templates, setTemplates] = useState<IClientActionResultDto<IActionResultDto<ITemplateDto>[]> | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<IActionResultDto<ITemplateDto> | null>(null);
    const [proposing, setProposing] = useState<boolean>(false);
    const [stage, setStage] = useState<string>('1-pick');
    const [response, setResponse] = useState<IClientActionResultDto<IProposalResultDto> | null>(null);
    const [selectedDivisionId, setSelectedDivisionId] = useState<string>(id);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [fixturesToSave, setFixturesToSave] = useState<IFixtureToSave[]>([]);
    const [savingProposal, setSavingProposal] = useState<boolean>(false);
    const [saveResults, setSaveResults] = useState<IClientActionResultDto<IGameDto>[]>([]);
    const [placeholderMappings, setPlaceholderMappings] = useState<IPlaceholderMappings | null>(null);

    async function loadTemplateCompatibility() {
        /* istanbul ignore next */
        if (loading || templates) {
            /* istanbul ignore next */
            return;
        }

        setLoading(true);
        try {
            const response: IClientActionResultDto<IActionResultDto<ITemplateDto>[]> = await templateApi.getCompatibility(seasonId);
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
            case '2-assign-placeholders':
                setStage('1-pick');
                break;
            case '3-review':
                await setDivisionData(null);
                setStage('2-assign-placeholders');
                return;
            case '4-review-proposals':
                setStage('3-review');
                return;
            case '5-confirm-save':
                setStage('4-review-proposals');
                return;
            case '6-saving':
                setStage('aborted');
                return;
        }
    }

    async function onNext() {
        switch (stage) {
            case '1-pick':
                if (!selectedTemplate.success) {
                    alert('This template is not compatible with this season, pick another template');
                    return;
                }

                setStage('2-assign-placeholders');
                return;
            case '2-assign-placeholders':
                await onPropose();
                return;
            case '3-review':
                await changeVisibleDivision(selectedDivisionId);
                setStage('4-review-proposals');
                return;
            case '4-review-proposals':
                const toSave: IFixtureToSave[] = response.result.divisions
                    .flatMap((d: IDivisionDataDto) => d.fixtures.flatMap((fd: IDivisionFixtureDateDto) => fd.fixtures.map((f: IDivisionFixtureDto) => {
                        return {fixture: f, date: fd, division: d}
                    })))
                    .filter((f: IFixtureToSave) => f.fixture.proposal && f.fixture.awayTeam);

                setFixturesToSave(toSave);
                setStage('5-confirm-save');
                break;
            case '5-confirm-save':
                setSaveMessage(`Starting save...`);
                setStage('6-saving');
                await setDivisionData(null);
                return;
            case 'aborted':
                setSaveMessage(`Resuming save...`);
                setStage('6-saving');
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

        setProposing(true);
        try {
            const response: IClientActionResultDto<IProposalResultDto> = await templateApi.propose({
                templateId: selectedTemplate.result.id,
                seasonId: seasonId,
                placeholderMappings: placeholderMappings || {},
            });
            setStage('3-review');
            setResponse(response);
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setProposing(false);
        }
    }

    async function changeVisibleDivision(id: string) {
        setSelectedDivisionId(id);
        const newDivision: IDivisionDataDto = response.result.divisions.filter((d: IDivisionDataDto) => d.id === id)[0];
        await setDivisionData(newDivision);
    }

    useEffect(() => {
            if (stage !== '6-saving' || fixturesToSave == null) {
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
        await setDivisionData(null);
        setStage('saved');

        const errors = saveResults.filter(r => !r.success);
        if (any(errors)) {
            setSaveMessage(`Some (${errors.length}) fixtures could not be saved`);
            return;
        }

        await onClose();
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
            const result: IClientActionResultDto<IGameDto> = await gameApi.update({
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
            const error: Error = e as Error;
            setSaveResults(saveResults.concat({
                success: false,
                errors: ['Error saving proposal: ' + error.message],
                warnings: [],
                messages: [],
            }));
            setSaveMessage('Error saving proposal: ' + error.message);
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

    if (stage === '4-review-proposals') {
        return (<ReviewProposalsFloatingDialog
            proposalResult={response.result}
            onNext={onNext}
            onPrevious={onPrevious}
            changeVisibleDivision={changeVisibleDivision}
            selectedDivisionId={selectedDivisionId} />);
    }

    async function changeTemplate(selectedTemplate: IActionResultDto<ITemplateDto>) {
        setSelectedTemplate(selectedTemplate);
        setPlaceholderMappings(null);
    }

    try {
        return (<Dialog title="Create season fixtures...">
            {stage === '1-pick' ? (<PickTemplate
                templates={templates}
                setSelectedTemplate={changeTemplate}
                loading={loading}
                selectedTemplate={selectedTemplate} />) : null}
            {stage === '2-assign-placeholders' ? (<AssignPlaceholders
                seasonId={seasonId}
                selectedTemplate={selectedTemplate}
                placeholderMappings={placeholderMappings || {}}
                setPlaceholderMappings={async (mappings: IPlaceholderMappings) => setPlaceholderMappings(mappings)} />) : null}
            {stage === '3-review' ? (<ReviewProposalHealth response={response} />) : null}
            {stage === '5-confirm-save'
                ? (<ConfirmSave noOfFixturesToSave={fixturesToSave.length} noOfDivisions={divisions.length} />)
                : null}
            {stage === '6-saving' || stage === 'aborted' || stage === 'saved'
                ? (<SavingProposals
                    noOfFixturesToSave={fixturesToSave.length}
                    saveMessage={saveMessage}
                    saveResults={saveResults}
                    saving={stage === '6-saving'} />)
                : null}
            <div className="modal-footer px-0 mt-3 pb-0">
                <div className="left-aligned">
                    <button className="btn btn-secondary" onClick={async () => {
                        await setDivisionData(null);
                        await onClose();
                    }} disabled={stage === '6-saving'}>
                        Close
                    </button>
                </div>
                <button className="btn btn-primary" onClick={onPrevious}
                        disabled={stage === '1-pick' || stage === 'saved'}>
                    Back
                </button>
                <button className="btn btn-primary" onClick={onNext}
                        disabled={!selectedTemplate || stage === '6-saving' || stage === 'saved'}>
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