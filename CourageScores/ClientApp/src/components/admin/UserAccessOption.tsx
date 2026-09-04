import { AccessOption } from '../../interfaces/models/dtos/Identity/AccessOption.ts';
import { AccessLevelDto } from '../../interfaces/models/dtos/Identity/AccessLevelDto';
import { IAccessLevels } from '../../helpers/conditions.ts';
import {
    BootstrapDropdown,
    IBootstrapDropdownItem,
} from '../common/BootstrapDropdown.tsx';
import { UserDto } from '../../interfaces/models/dtos/Identity/UserDto';
import { UntypedPromise } from '../../interfaces/UntypedPromise.ts';
import { useEffect, useState } from 'react';
import { Dialog } from '../common/Dialog.tsx';
import { useApp } from '../common/AppContainer.tsx';
import { stateChanged } from '../../helpers/events.ts';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { TeamDto } from '../../interfaces/models/dtos/Team/TeamDto';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto';
import { any, distinct, isEmpty } from '../../helpers/collections.ts';
import { useDependencies } from '../common/IocContainer.tsx';
import { TeamSeasonDto } from '../../interfaces/models/dtos/Team/TeamSeasonDto';

interface SelectableItem {
    id: string;
    name: string;
}

const options: IBootstrapDropdownItem[] = [
    { value: 'none', text: '🚫 None', collapsedText: '🚫' },
    { value: 'custom', text: '🎚️️ Custom', collapsedText: '🎚️' },
    { value: 'full', text: '✅ Full', collapsedText: '✅' },
];

type OptionValue = 'none' | 'full' | 'custom';

const defaultCustomAccessLevel: AccessLevelDto = {
    teamIds: [],
    seasonIds: [],
    divisionIds: [],
};

const valueLookup: Record<OptionValue, AccessLevelDto | undefined> = {
    none: undefined,
    full: {},
    custom: defaultCustomAccessLevel,
};

export interface UserAccessOptionProps {
    userAccount?: UserDto;
    option: AccessOption;
    name?: string;
    description?: string;
    accessChanged: (
        option: AccessOption,
        access?: AccessLevelDto,
    ) => UntypedPromise;
}

export function UserAccessOption({
    userAccount,
    option,
    name,
    description,
    accessChanged,
}: UserAccessOptionProps) {
    const { seasons, divisions, teams: basicTeams } = useApp();
    const { teamApi } = useDependencies();
    const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
    const [teamFilter, setTeamFilter] = useState<string>('');
    const [teams, setTeams] = useState<TeamDto[] | undefined>();
    const accessLevels: IAccessLevels = userAccount?.accessLevels ?? {};
    const accessLevel = accessLevels[option];
    const value: OptionValue = accessLevels[option]
        ? Object.keys(accessLevels[option]).length >= 1
            ? 'custom'
            : 'full'
        : 'none';

    useEffect(() => {
        if (editDialogOpen && !teams) {
            teamApi.getAllWithSeasonsAndPlayers().then(setTeams);
        }
    }, [editDialogOpen, teams]);

    async function toggleOption(prop: keyof AccessLevelDto, id: string) {
        const updated = { ...accessLevel };
        const selected: string[] = updated[prop] ?? [];
        if (selected.includes(id)) {
            updated[prop] = selected.filter((selected) => selected !== id);
        } else {
            updated[prop] = selected.concat(id);
        }

        await accessChanged(option, updated);
    }

    function sortSelectedFirst(
        prop: keyof AccessLevelDto,
    ): (a: SelectableItem, b: SelectableItem) => number {
        const selected = accessLevel[prop] ?? [];

        return (a, b) => {
            const aSelected = selected.includes(a.id) ? 1 : 0;
            const bSelected = selected.includes(b.id) ? 1 : 0;

            if (aSelected !== bSelected) {
                return bSelected - aSelected;
            }

            return a.name.localeCompare(b.name);
        };
    }

    function renderAccessOptions(
        prop: keyof AccessLevelDto,
        options: SelectableItem[],
        title: string,
        filter?: string,
        setFilter?: (value: string) => void,
    ) {
        return (
            <div
                className="mb-2 me-2 flex-grow-1 flex-shrink-0"
                data-type={title}>
                <h4 className="no-wrap">
                    {title} - {accessLevel[prop]?.length ?? 0} of{' '}
                    {options.length}
                </h4>
                {setFilter ? (
                    <div className="input-group mb-1">
                        <div className="input-group-prepend">
                            <span className="input-group-text">Filter</span>
                        </div>
                        <input
                            className="form-control"
                            value={filter ?? ''}
                            onChange={stateChanged(setFilter)}
                        />
                    </div>
                ) : null}
                <ol className="list-group overflow-auto max-height-200">
                    {options
                        .filter((o) => o.id)
                        .filter(
                            (o) =>
                                !filter ||
                                o.name
                                    .toLowerCase()
                                    .includes(filter.toLowerCase()),
                        )
                        .sort(sortSelectedFirst(prop))
                        .map((s) => (
                            <li
                                key={s.id}
                                className={`list-group-item${accessLevel[prop]?.includes(s.id) ? ' active' : ''}`}
                                onClick={() => toggleOption(prop, s.id)}>
                                {s.name?.trim()}
                            </li>
                        ))}
                </ol>
            </div>
        );
    }

    function divisionsInSelectedSeasons(): DivisionDto[] {
        if (isEmpty(accessLevel.seasonIds)) {
            return divisions;
        }

        const divisionIdsAcrossAllSeasons: DivisionDto[] = accessLevel
            .seasonIds!.map((id) => seasons.find((s) => s.id === id))
            .flatMap((s?: SeasonDto) => s?.divisions ?? []);

        const selectedDivisions = divisions.filter((d) =>
            accessLevel.divisionIds?.find((id) => id === d.id),
        );

        return distinct(
            divisionIdsAcrossAllSeasons.concat(selectedDivisions), // include divisions that are no longer in the selected seasons
            'id',
        );
    }

    function includeTeam(team: TeamDto): boolean {
        const anyDivision = isEmpty(accessLevel.divisionIds);
        const anySeason = isEmpty(accessLevel.seasonIds);

        function forDivision(ts: TeamSeasonDto): boolean {
            return (
                anyDivision ||
                any(accessLevel.divisionIds, (id) => id === ts.divisionId)
            );
        }

        function forSeason(ts: TeamSeasonDto): boolean {
            return (
                anySeason ||
                any(accessLevel.seasonIds, (id) => id === ts.seasonId)
            );
        }

        return (
            isEmpty(team.seasons) ||
            any(team.seasons, (ts) => forDivision(ts) && forSeason(ts))
        );
    }

    function teamsInSelectedSeasonsOrDivisions(): TeamDto[] {
        if (!teams) {
            return basicTeams.map((t) => ({ ...t, seasons: [] }));
        }

        const selectedTeams = teams.filter((d) =>
            accessLevel.teamIds?.find((id) => id === d.id),
        );

        return distinct(teams.filter(includeTeam).concat(selectedTeams), 'id');
    }

    return (
        <div key={option} className="mb-3">
            <BootstrapDropdown
                options={options}
                value={value}
                onChange={async (value: OptionValue) =>
                    await accessChanged(option, valueLookup[value])
                }
                slim={true}
                className="margin-right"
                datatype={option}
            />
            {value === 'custom' ? (
                <button
                    className="btn btn-sm btn-outline-secondary margin-right"
                    onClick={() => setEditDialogOpen(true)}>
                    ✏️
                </button>
            ) : null}
            <span>
                {name}
                {description ? (
                    <>
                        <br />
                        <small>{description}</small>
                    </>
                ) : null}
            </span>
            {editDialogOpen ? (
                <Dialog
                    onClose={async () => setEditDialogOpen(false)}
                    title={`🎚️ ${name}`}>
                    <div className="d-flex flex-row flex-wrap">
                        {renderAccessOptions('seasonIds', seasons, 'Seasons')}
                        {renderAccessOptions(
                            'divisionIds',
                            divisionsInSelectedSeasons(),
                            'Divisions',
                        )}
                        {renderAccessOptions(
                            'teamIds',
                            teamsInSelectedSeasonsOrDivisions(),
                            'Teams',
                            teamFilter,
                            setTeamFilter,
                        )}
                    </div>
                </Dialog>
            ) : null}
        </div>
    );
}
