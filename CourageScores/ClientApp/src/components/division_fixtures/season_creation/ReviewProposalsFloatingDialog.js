import {any, distinct, sortBy} from "../../../helpers/collections";
import {BootstrapDropdown} from "../../common/BootstrapDropdown";
import React from "react";
import {useApp} from "../../../AppContainer";

export function ReviewProposalsFloatingDialog({ proposalResult, changeVisibleDivision, selectedDivisionId, onPrevious, onNext }) {
    const {divisions} = useApp();

    const divisionOptions = divisions
        .filter(d => any(proposalResult.divisions, proposedDivision => proposedDivision.id === d.id))
        .sort(sortBy('name'))
        .map(d => {
            return {value: d.id, text: d.name};
        });

    const template = proposalResult.template;
    const selectedDivisionIndex = divisionOptions.map(o => o.value).indexOf(selectedDivisionId);
    const templateDivision = template.divisions[selectedDivisionIndex];
    const placeholdersToRender = distinct(templateDivision.dates
        .flatMap(d => d.fixtures
            .flatMap(f => [f.home, f.away])
            .filter(p => p !== null)));
    const templateSharedAddresses = template.sharedAddresses.flatMap(a => a);
    const divisionSharedAddresses = templateDivision.sharedAddresses.flatMap(a => a);
    return (<>
        <div style={{zIndex: '1051'}}
             className="position-fixed p-3 top-0 right-0 bg-white border-2 border-solid border-success box-shadow me-3 mt-3">
            <h6>Review the fixtures in the divisions</h6>
            <BootstrapDropdown options={divisionOptions} value={selectedDivisionId} onChange={changeVisibleDivision} />
            <ul className="mt-3">
                {placeholdersToRender.sort().map(key => {
                    const isTemplateSharedAddress = any(templateSharedAddresses, a => a === key);
                    const isDivisionSharedAddress = any(divisionSharedAddresses, a => a === key);
                    let className = '';
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