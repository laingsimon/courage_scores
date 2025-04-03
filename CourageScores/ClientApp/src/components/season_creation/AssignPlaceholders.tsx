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
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface IPlaceholderMappings {
    [placeholder: string]: string;
}

export interface IAssignPlaceholdersProps {
    seasonId: string;
    selectedTemplate: ActionResultDto<TemplateDto>;
    placeholderMappings: IPlaceholderMappings;
    setPlaceholderMappings(newMappings: IPlaceholderMappings): UntypedPromise;
}

export function AssignPlaceholders({ seasonId, selectedTemplate, placeholderMappings, setPlaceholderMappings }: IAssignPlaceholdersProps) {
    const {divisions, seasons, teams} = useApp();
    const season: SeasonDto = seasons.filter(s => s.id === seasonId)[0];
    const applicableDivisions: DivisionDto[] = divisions.filter((division: DivisionDto) => any(season.divisions, (d: DivisionDto) => d.id === division.id));
    const template: TemplateDto = selectedTemplate.result!;
    const templateSharedAddresses: string[] = template.sharedAddresses!.flatMap((a: string[]) => a);

    function getPlaceholdersForTemplateDivision(templateDivision: DivisionTemplateDto): string[] {
        return distinct(templateDivision.dates!.flatMap((d: DateTemplateDto) => d.fixtures!.flatMap((f: FixtureTemplateDto) => [ f.home, f.away ]).filter((placeholder: string | undefined) => !!placeholder)));
    }

    function getAddress(team: TeamDto): string {
        return team.address || team.name;
    }

    function getTeamsWithUniqueAddresses(division: DivisionDto): IBootstrapDropdownItem[] {
        const teamsInDivision: TeamDto[] = teams.filter((t: TeamDto) => any(t.seasons, (ts: TeamSeasonDto) => ts.seasonId === seasonId && ts.divisionId === division.id && !ts.deleted));
        const addressCounts: { [address: string]: number } = {};
        for (const team of teamsInDivision) {
            const address = getAddress(team);
            if (addressCounts[address] === undefined) {
                addressCounts[address] = 1;
            } else {
                addressCounts[address]++;
            }
        }
        const randomlyAssign: IBootstrapDropdownItem = { value: '', text: '🎲 Randomly assign' };
        return [randomlyAssign].concat(teamsInDivision.sort(sortBy('name')).map((t: TeamDto) => {
            const hasUniqueAddress: boolean = addressCounts[getAddress(t)] === 1;
            const text: string = hasUniqueAddress
                ? t.name
                : `🚫 ${t.name} (has shared address)`;

            return { value: t.id, text: text, disabled: !hasUniqueAddress };
        }));
    }

    function getTeamsWithSharedAddresses(division: DivisionDto, sharedAddressSize: number): IBootstrapDropdownItem[] {
        const teamsInDivision: TeamDto[] = teams.filter((t: TeamDto) => any(t.seasons, (ts: TeamSeasonDto) => ts.seasonId === seasonId && ts.divisionId === division.id && !ts.deleted));
        const addressCounts: { [address: string]: number } = {};
        for (const team of teamsInDivision) {
            if (addressCounts[getAddress(team)] === undefined) {
                addressCounts[getAddress(team)] = 1;
            } else {
                addressCounts[getAddress(team)]++;
            }
        }
        const automaticallyAssign: IBootstrapDropdownItem = { value: '', text: '⚙ Automatically assign' };
        return [automaticallyAssign].concat(teamsInDivision.sort(sortBy('name')).map((t: TeamDto) => {
            const address = getAddress(t);
            const hasSharedAddress: boolean = addressCounts[address] === sharedAddressSize;
            const text: string = hasSharedAddress
                ? t.name
                : `🚫 ${t.name} (${addressCounts[address] === 1 ? `has unique address` : `${addressCounts[address]} use this venue, ${sharedAddressSize} is required`})`;

            return { value: t.id, text: text, disabled: !hasSharedAddress };
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

    async function setSelectedSharedAddressPlaceholder(divisionIndex: number, teamId: string, placeholder: string) {
        const newMappings: IPlaceholderMappings = Object.assign({}, placeholderMappings);
        const allSharedAddressPlaceholders: string[] = template.divisions![divisionIndex].sharedAddresses!
            .filter((sa: string[]) => any(sa, (a: string) => a === placeholder))[0] || [];
        const otherSharedAddressPlaceholders: string[] = allSharedAddressPlaceholders.filter((a: string) => a !== placeholder);
        const division = divisions[divisionIndex];

        if (teamId) {
            const teamsInDivision: TeamDto[] = teams.filter((t: TeamDto) => any(t.seasons, (ts: TeamSeasonDto) => ts.seasonId === seasonId && ts.divisionId === division.id && !ts.deleted));
            const team: TeamDto = teamsInDivision.filter((t: TeamDto) => t.id === teamId)[0];
            const otherTeamsWithSameAddress: TeamDto[] = teamsInDivision.filter((t: TeamDto) => getAddress(t) === getAddress(team)).filter((t: TeamDto) => t.id !== teamId);

            newMappings[placeholder] = teamId;
            for (const otherPlaceholder of otherSharedAddressPlaceholders) {
                const otherTeam: TeamDto = otherTeamsWithSameAddress.shift()!;
                newMappings[otherPlaceholder] = otherTeam.id;
            }
        } else {
            delete newMappings[placeholder];
            for (const otherPlaceholder of otherSharedAddressPlaceholders) {
                delete newMappings[otherPlaceholder];
            }
        }
        await setPlaceholderMappings(newMappings);
    }

    return (<div>
        {applicableDivisions.sort(sortBy('name')).map((division: DivisionDto, index: number) => {
            const templateDivision: DivisionTemplateDto = template.divisions![index];
            const templatePlaceholders: string[] = getPlaceholdersForTemplateDivision(templateDivision);
            const teamsWithUniqueAddresses: IBootstrapDropdownItem[] = getTeamsWithUniqueAddresses(division);

            return (<div key={division.id}>
                <h6>{division.name}</h6>
                <ul>
                    {templatePlaceholders.sort().map((placeholder: string) => {
                        const divisionSharedAddresses: string[] = (templateDivision.sharedAddresses!.filter((sa: string[]) => any(sa, (a: string) => a === placeholder))[0]) || [];
                        const hasDivisionSharedAddress: boolean = divisionSharedAddresses.length > 1
                        const hasTemplateSharedAddress: boolean = any(templateSharedAddresses, (a: string) => a === placeholder);
                        let className: string = '';
                        if (hasTemplateSharedAddress) {
                            className += ' bg-warning';
                        }
                        if (hasDivisionSharedAddress) {
                            className += ' bg-secondary text-light';
                        }
                        const selectedTeamId: string = placeholderMappings[placeholder];
                        const availableTeamsForPlaceholder: IBootstrapDropdownItem[] = teamsWithUniqueAddresses.filter((o: IBootstrapDropdownItem) => {
                            const selected: boolean = any(Object.values(placeholderMappings), (t: string) => t === o.value);
                            return !o.value || o.value === selectedTeamId || !selected;
                        });
                        const teamsWithSharedAddresses: IBootstrapDropdownItem[] = getTeamsWithSharedAddresses(division, divisionSharedAddresses.length);
                        const availableSharedDivisionTeamsForPlaceholder: IBootstrapDropdownItem[] = teamsWithSharedAddresses.filter((o: IBootstrapDropdownItem) => {
                            const selected: boolean = any(Object.values(placeholderMappings), (t: string) => t === o.value);
                            return !o.value || o.value === selectedTeamId || !selected;
                        });

                        return (<li key={placeholder}>
                            <span className={`width-20 d-inline-block text-center margin-right ${className}`}>{placeholder}</span>
                            {hasDivisionSharedAddress && !hasTemplateSharedAddress
                                ? (<BootstrapDropdown options={availableSharedDivisionTeamsForPlaceholder} value={selectedTeamId || ''} onChange={id => setSelectedSharedAddressPlaceholder(index, id, placeholder)} />)
                                : null}
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