import {useApp} from "../../../AppContainer";
import {any, distinct, sortBy} from "../../../helpers/collections";
import {BootstrapDropdown, IBootstrapDropdownItem} from "../../common/BootstrapDropdown";
import {IActionResultDto} from "../../../interfaces/serverSide/IActionResultDto";
import {ITemplateDto} from "../../../interfaces/serverSide/Season/Creation/ITemplateDto";
import {IDivisionDto} from "../../../interfaces/serverSide/IDivisionDto";
import {IDivisionTemplateDto} from "../../../interfaces/serverSide/Season/Creation/IDivisionTemplateDto";
import {IDateTemplateDto} from "../../../interfaces/serverSide/Season/Creation/IDateTemplateDto";
import {IFixtureTemplateDto} from "../../../interfaces/serverSide/Season/Creation/IFixtureTemplateDto";
import {ITeamDto} from "../../../interfaces/serverSide/Team/ITeamDto";
import {ITeamSeasonDto} from "../../../interfaces/serverSide/Team/ITeamSeasonDto";
import {ISeasonDto} from "../../../interfaces/serverSide/Season/ISeasonDto";

export interface IPlaceholderMappings {
    [placeholder: string]: string;
}

export interface IAssignPlaceholdersProps {
    seasonId: string;
    selectedTemplate: IActionResultDto<ITemplateDto>;
    placeholderMappings: IPlaceholderMappings;
    setPlaceholderMappings: (newMappings: IPlaceholderMappings) => Promise<any>;
}

export function AssignPlaceholders({ seasonId, selectedTemplate, placeholderMappings, setPlaceholderMappings }: IAssignPlaceholdersProps) {
    const {divisions, seasons, teams} = useApp();
    const season: ISeasonDto = seasons[seasonId];
    const applicableDivisions: IDivisionDto[] = divisions.filter((division: IDivisionDto) => any(season.divisions, (d: IDivisionDto) => d.id === division.id));
    const template: ITemplateDto = selectedTemplate.result;
    const templateSharedAddresses: string[] = template.sharedAddresses.flatMap((a: string[]) => a);

    function getPlaceholdersForTemplateDivision(templateDivision: IDivisionTemplateDto): string[] {
        return distinct(templateDivision.dates.flatMap((d: IDateTemplateDto) => d.fixtures.flatMap((f: IFixtureTemplateDto) => [ f.home, f.away ]).filter((placeholder: string) => placeholder)));
    }

    function getTeamsWithUniqueAddresses(division: IDivisionDto): IBootstrapDropdownItem[] {
        const teamsInDivision: ITeamDto[] = teams.filter((t: ITeamDto) => any(t.seasons, (ts: ITeamSeasonDto) => ts.seasonId === seasonId && ts.divisionId === division.id));
        const addressCounts: { [address: string]: number } = {};
        teamsInDivision.forEach((team: ITeamDto) => {
            if (addressCounts[team.address] === undefined) {
                addressCounts[team.address] = 1;
            } else {
                addressCounts[team.address]++;
            }
        });
        const randomlyAssign: IBootstrapDropdownItem = { value: '', text: '🎲 Randomly assign' };
        return [randomlyAssign].concat(teamsInDivision.sort(sortBy('name')).map((t: ITeamDto) => {
            const hasUniqueAddress: boolean = addressCounts[t.address] === 1;
            const text: string = hasUniqueAddress
                ? t.name
                : `🚫 ${t.name} (has shared address)`;

            return { value: t.id, text: text, disabled: !hasUniqueAddress };
        }));
    }

    async function setSelectedPlaceholder(teamId: string, placeholder: string) {
        const newMappings: IPlaceholderMappings = Object.assign({}, placeholderMappings);
        if (teamId) {
            newMappings[placeholder] = teamId;
        } else {
            delete newMappings[placeholder];
        }
        await setPlaceholderMappings(newMappings);
    }

    return (<div>
        {applicableDivisions.sort(sortBy('name')).map((division: IDivisionDto, index: number) => {
            const templateDivision: IDivisionTemplateDto = template.divisions[index];
            const templatePlaceholders: string[] = getPlaceholdersForTemplateDivision(templateDivision);
            const availableTeams: IBootstrapDropdownItem[] = getTeamsWithUniqueAddresses(division);

            return (<div key={division.id}>
                <h6>{division.name}</h6>
                <ul>
                    {templatePlaceholders.sort().map((placeholder: string) => {
                        const hasDivisionSharedAddress: boolean = any(templateDivision.sharedAddresses.flatMap((a: string[]) => a), (a: string) => a === placeholder);
                        const hasTemplateSharedAddress: boolean = any(templateSharedAddresses, (a: string) => a === placeholder);
                        let className: string = '';
                        if (hasTemplateSharedAddress) {
                            className += ' bg-warning';
                        }
                        if (hasDivisionSharedAddress) {
                            className += ' bg-secondary text-light';
                        }
                        const selectedTeamId: string = placeholderMappings[placeholder];
                        const availableTeamsForPlaceholder: IBootstrapDropdownItem[] = availableTeams.filter((o: IBootstrapDropdownItem) => {
                            const selected: boolean = any(Object.values(placeholderMappings), (t: string) => t === o.value);
                            return !o.value || o.value === selectedTeamId || !selected;
                        });

                        return (<li key={placeholder}>
                            <span className={`width-20 d-inline-block text-center margin-right ${className}`}>{placeholder}</span>
                            {hasDivisionSharedAddress ? 'Reserved for use by team with shared address in division' : null}
                            {hasTemplateSharedAddress ? 'Reserved for use by team with shared address across divisions' : null}
                            {!hasTemplateSharedAddress && !hasDivisionSharedAddress
                                ? (<BootstrapDropdown options={availableTeamsForPlaceholder} value={selectedTeamId || ''} onChange={id => setSelectedPlaceholder(id, placeholder)} />)
                                : null}
                        </li>);
                    })}
                </ul>
            </div>)
        })}
    </div>)
}