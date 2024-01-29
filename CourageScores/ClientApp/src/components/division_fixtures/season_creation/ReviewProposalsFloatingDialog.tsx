import {any, distinct, sortBy} from "../../../helpers/collections";
import {BootstrapDropdown, IBootstrapDropdownItem} from "../../common/BootstrapDropdown";
import React from "react";
import {useApp} from "../../../AppContainer";
import {IDivisionDto} from "../../../interfaces/dtos/IDivisionDto";
import {IProposalResultDto} from "../../../interfaces/dtos/Season/Creation/IProposalResultDto";
import {ITemplateDto} from "../../../interfaces/dtos/Season/Creation/ITemplateDto";
import {IDivisionTemplateDto} from "../../../interfaces/dtos/Season/Creation/IDivisionTemplateDto";
import {IDateTemplateDto} from "../../../interfaces/dtos/Season/Creation/IDateTemplateDto";
import {IFixtureTemplateDto} from "../../../interfaces/dtos/Season/Creation/IFixtureTemplateDto";

export interface IReviewProposalsFloatingDialogProps {
    proposalResult: IProposalResultDto;
    changeVisibleDivision: (id: string) => Promise<any>;
    selectedDivisionId: string;
    onPrevious: () => Promise<any>;
    onNext: () => Promise<any>;
}

export function ReviewProposalsFloatingDialog({ proposalResult, changeVisibleDivision, selectedDivisionId, onPrevious, onNext }: IReviewProposalsFloatingDialogProps) {
    const {divisions} = useApp();

    const divisionOptions: IBootstrapDropdownItem[] = divisions
        .filter((d: IDivisionDto) => any(proposalResult.divisions, proposedDivision => proposedDivision.id === d.id))
        .sort(sortBy('name'))
        .map((d: IDivisionDto) => {
            return {value: d.id, text: d.name};
        });

    const template: ITemplateDto = proposalResult.template;
    const selectedDivisionIndex: number = divisionOptions.map((o: IBootstrapDropdownItem) => o.value).indexOf(selectedDivisionId);
    const templateDivision: IDivisionTemplateDto = template.divisions[selectedDivisionIndex];
    const placeholdersToRender: string[] = distinct(templateDivision.dates
        .flatMap((d: IDateTemplateDto) => d.fixtures
            .flatMap((f: IFixtureTemplateDto) => [f.home, f.away])
            .filter((p: string) => p)));
    const templateSharedAddresses: string[] = template.sharedAddresses.flatMap((a: string[]) => a);
    const divisionSharedAddresses: string[] = templateDivision.sharedAddresses.flatMap((a: string[]) => a);
    return (<>
        <div style={{zIndex: '1051'}}
             className="position-fixed p-3 top-0 right-0 bg-white border-2 border-solid border-success box-shadow me-3 mt-3">
            <h6>Review the fixtures in the divisions</h6>
            <BootstrapDropdown options={divisionOptions} value={selectedDivisionId} onChange={changeVisibleDivision} />
            <ul className="mt-3">
                {placeholdersToRender.sort().map((key: string) => {
                    const isTemplateSharedAddress: boolean = any(templateSharedAddresses, (a: string) => a === key);
                    const isDivisionSharedAddress: boolean = any(divisionSharedAddresses, (a: string) => a === key);
                    let className: string = '';
                    if (isTemplateSharedAddress) {
                        className += ' bg-warning';
                    }
                    if (isDivisionSharedAddress) {
                        className += ' bg-secondary text-light';
                    }

                    return (<li key={key}>
                        <span className={`px-2 ${className}`}>{key}</span> &rarr; {proposalResult.placeholderMappings[key].name}
                    </li>);
                })}
            </ul>
            <p>
                Template: <a href={`/admin/templates/?select=${template.id}`} target="_blank" rel="noreferrer">{template.name}</a>
            </p>
            <div className="mt-3">
                <button className="btn btn-primary margin-right" onClick={onPrevious}>Back</button>
                <button className="btn btn-primary margin-right" onClick={onNext}>Save all fixtures</button>
            </div>
        </div>
        <div className="modal-backdrop fade show"></div>
    </>);
}