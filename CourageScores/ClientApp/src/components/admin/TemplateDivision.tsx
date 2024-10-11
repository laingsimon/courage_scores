import {SharedAddresses} from "./SharedAddresses";
import {TemplateDates} from "./TemplateDates";
import {useState} from "react";
import {DivisionTemplateDto} from "../../interfaces/models/dtos/Season/Creation/DivisionTemplateDto";
import {DateTemplateDto} from "../../interfaces/models/dtos/Season/Creation/DateTemplateDto";
import {FixtureTemplateDto} from "../../interfaces/models/dtos/Season/Creation/FixtureTemplateDto";
import {any, distinct} from "../../helpers/collections";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface ITemplateDivisionProps {
    divisionNo: number;
    division: DivisionTemplateDto;
    onUpdate(update: DivisionTemplateDto): UntypedPromise;
    onCopyToDivision(destinationDivisionIndex: number): UntypedPromise;
    onDelete(): UntypedPromise;
    templateSharedAddresses: string[];
    divisionCount: number;
    highlight?: string;
    setHighlight(highlight?: string): UntypedPromise;
}

export function TemplateDivision({ divisionNo, division, onUpdate, onDelete, templateSharedAddresses, divisionCount, onCopyToDivision, highlight, setHighlight }: ITemplateDivisionProps) {
    const [ expanded, setExpanded ] = useState<boolean>(true);

    async function updateSharedAddresses(updatedAddresses: string[][]) {
        const newDivision: DivisionTemplateDto = Object.assign({}, division);
        newDivision.sharedAddresses = updatedAddresses;
        await onUpdate(newDivision);
    }

    async function updateDates(updatedDates: DateTemplateDto[]) {
        const newDivision: DivisionTemplateDto = Object.assign({}, division);
        newDivision.dates = updatedDates;
        await onUpdate(newDivision);
    }

    function findMnemonicsThatNeverPlayAtTheSameVenueAcrossAnyDate(): string[][] {
        let allMnemonics: string[] = distinct(division.dates
            .flatMap((d: DateTemplateDto) => d.fixtures)
            .flatMap((f: FixtureTemplateDto) => [ f.home, f.away ])
            .filter((mnemonic: string) => !!mnemonic));
        const mnemonics: string[][] = [];

        for (const mnemonic of allMnemonics) {
            let mnemonicsThatArePlayingAlwaysAtDifferentVenues: string[] = allMnemonics.filter((m: string) => !!m); // copy the array of all mnemonics

            for (const date of division.dates) {
                const mnemonicsThatAreAtHome: string[] = date.fixtures.map((f: FixtureTemplateDto) => f.home);
                if (!any(mnemonicsThatAreAtHome, m => m === mnemonic)) {
                    continue;
                }

                mnemonicsThatArePlayingAlwaysAtDifferentVenues = mnemonicsThatArePlayingAlwaysAtDifferentVenues
                    .filter((m: string) => !any(mnemonicsThatAreAtHome, (atHomeOnDate: string) => atHomeOnDate === m))
            }

            if (any(mnemonicsThatArePlayingAlwaysAtDifferentVenues)) {
                mnemonics.push([mnemonic].concat(mnemonicsThatArePlayingAlwaysAtDifferentVenues));
                allMnemonics = allMnemonics
                    .filter((m: string) => m !== mnemonic && !any(mnemonicsThatArePlayingAlwaysAtDifferentVenues, addedMnemonic => addedMnemonic === m));
            }
        }

        return distinct(mnemonics);
    }

    return (<div>
        <h6 title="Click to expand/collapse"
            className="hover-highlight py-1"
            onClick={() => setExpanded(!expanded)}>
            {expanded ? '⬆️' : '⬇️'} Division {divisionNo}
            {expanded ? ' (click to collapse)' : ' (click to expand)'}
        </h6>
        {expanded ? (<SharedAddresses
            addresses={division.sharedAddresses}
            onUpdate={updateSharedAddresses}
            className="bg-secondary"
            highlight={highlight}
            setHighlight={setHighlight}
            mnemonicsThatCanShareAddresses={findMnemonicsThatNeverPlayAtTheSameVenueAcrossAnyDate()} />) : null}
        {expanded ? (<TemplateDates
            dates={division.dates}
            onUpdate={updateDates}
            divisionSharedAddresses={division.sharedAddresses.flatMap((a: string[]) => a)}
            templateSharedAddresses={templateSharedAddresses}
            divisionNo={divisionNo}
            divisionCount={divisionCount}
            onCopyToDivision={onCopyToDivision}
            highlight={highlight}
            setHighlight={setHighlight} />) : null}
        {expanded ? (<button className="btn btn-sm btn-outline-danger float-end" onClick={onDelete}>🗑️ Remove division</button>) : null}
    </div>);
}