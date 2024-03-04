import {useApp} from "../common/AppContainer";
import {any, distinct, sortBy} from "../../helpers/collections";
import {BootstrapDropdown, IBootstrapDropdownItem} from "../common/BootstrapDropdown";
import {ActionResultDto} from "../../interfaces/models/dtos/ActionResultDto";
import {TemplateDto} from "../../interfaces/models/dtos/Season/Creation/TemplateDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {DivisionTemplateDto} from "../../interfaces/models/dtos/Season/Creation/DivisionTemplateDto";
import {DateTemplateDto} from "../../interfaces/models/dtos/Season/Creation/DateTemplateDto";
import {FixtureTemplateDto} from "../../interfaces/models/dtos/Season/Creation/FixtureTemplateDto";
import {TeamDto} from "../../interfaces/models/dtos/Team/TeamDto";
import {TeamSeasonDto} from "../../interfaces/models/dtos/Team/TeamSeasonDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";

export interface IPlaceholderMappings {
    [placeholder: string]: string;
}

export interface IAssignPlaceholdersProps {
    seasonId: string;
    selectedTemplate: ActionResultDto<TemplateDto>;
    placeholderMappings: IPlaceholderMappings;
    setPlaceholderMappings(newMappings: IPlaceholderMappings): Promise<any>;
}

export function AssignPlaceholders({ seasonId, selectedTemplate, placeholderMappings, setPlaceholderMappings }: IAssignPlaceholdersProps) {
    const {divisions, seasons, teams} = useApp();
    const season: SeasonDto = seasons[seasonId];
    const applicableDivisions: DivisionDto[] = divisions.filter((division: DivisionDto) => any(season.divisions, (d: DivisionDto) => d.id === division.id));
    const template: TemplateDto = selectedTemplate.result;
    const templateSharedAddresses: string[] = template.sharedAddresses.flatMap((a: string[]) => a);

    function getPlaceholdersForTemplateDivision(templateDivision: DivisionTemplateDto): string[] {
        return distinct(templateDivision.dates.flatMap((d: DateTemplateDto) => d.fixtures.flatMap((f: FixtureTemplateDto) => [ f.home, f.away ]).filter((placeholder: string) => placeholder)));
    }

    function getTeamsWithUniqueAddresses(division: DivisionDto): IBootstrapDropdownItem[] {
        const teamsInDivision: TeamDto[] = teams.filter((t: TeamDto) => any(t.seasons, (ts: TeamSeasonDto) => ts.seasonId === seasonId && ts.divisionId === division.id && !ts.deleted));
        const addressCounts: { [address: string]: number } = {};
        teamsInDivision.forEach((team: TeamDto) => {
            if (addressCounts[team.address] === undefined) {
                addressCounts[team.address] = 1;
            } else {
                addressCounts[team.address]++;
            }
        });
        const randomlyAssign: IBootstrapDropdownItem = { value: '', text: '🎲 Randomly assign' };
        return [randomlyAssign].concat(teamsInDivision.sort(sortBy('name')).map((t: TeamDto) => {
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
        {applicableDivisions.sort(sortBy('name')).map((division: DivisionDto, index: number) => {
            const templateDivision: DivisionTemplateDto = template.divisions[index];
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