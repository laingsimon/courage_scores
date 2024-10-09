import {any, distinct, sortBy} from "../../helpers/collections";
import {BootstrapDropdown, IBootstrapDropdownItem} from "../common/BootstrapDropdown";
import {useApp} from "../common/AppContainer";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {ProposalResultDto} from "../../interfaces/models/dtos/Season/Creation/ProposalResultDto";
import {TemplateDto} from "../../interfaces/models/dtos/Season/Creation/TemplateDto";
import {DivisionTemplateDto} from "../../interfaces/models/dtos/Season/Creation/DivisionTemplateDto";
import {DateTemplateDto} from "../../interfaces/models/dtos/Season/Creation/DateTemplateDto";
import {FixtureTemplateDto} from "../../interfaces/models/dtos/Season/Creation/FixtureTemplateDto";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface IReviewProposalsFloatingDialogProps {
    proposalResult: ProposalResultDto;
    changeVisibleDivision(id: string): UntypedPromise;
    selectedDivisionId: string;
    onPrevious(): UntypedPromise;
    onNext(): UntypedPromise;
}

export function ReviewProposalsFloatingDialog({ proposalResult, changeVisibleDivision, selectedDivisionId, onPrevious, onNext }: IReviewProposalsFloatingDialogProps) {
    const {divisions} = useApp();

    const divisionOptions: IBootstrapDropdownItem[] = divisions
        .filter((d: DivisionDto) => any(proposalResult.divisions, proposedDivision => proposedDivision.id === d.id))
        .sort(sortBy('name'))
        .map((d: DivisionDto) => {
            return {value: d.id, text: d.name};
        });

    const template: TemplateDto = proposalResult.template;
    const selectedDivisionIndex: number = divisionOptions.map((o: IBootstrapDropdownItem) => o.value).indexOf(selectedDivisionId);
    const templateDivision: DivisionTemplateDto = template.divisions[selectedDivisionIndex];
    const placeholdersToRender: string[] = distinct(templateDivision.dates
        .flatMap((d: DateTemplateDto) => d.fixtures
            .flatMap((f: FixtureTemplateDto) => [f.home, f.away])
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