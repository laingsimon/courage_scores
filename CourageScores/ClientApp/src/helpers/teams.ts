import { TeamDto } from '../interfaces/models/dtos/Team/TeamDto';
import { any } from './collections';
import { TeamSeasonDto } from '../interfaces/models/dtos/Team/TeamSeasonDto';

export function getTeamSeasons(
    t: TeamDto,
    seasonId?: string,
    divisionId?: string,
): TeamSeasonDto[] {
    return (
        t.seasons?.filter(
            (ts) =>
                (!seasonId || ts.seasonId === seasonId) &&
                (!divisionId ||
                    ts.divisionId === divisionId ||
                    !ts.divisionId) &&
                !ts.deleted,
        ) ?? []
    );
}

export function getTeamsInSeason(
    teams: TeamDto[],
    seasonId?: string,
    divisionId?: string,
): TeamDto[] {
    return teams.filter((t) => {
        return any(getTeamSeasons(t, seasonId, divisionId));
    });
}

export function findTeam(
    teams: TeamDto[],
    predicate: (ts: TeamSeasonDto) => boolean,
    seasonId?: string,
    divisionId?: string,
): { team: TeamDto; teamSeason: TeamSeasonDto } | undefined {
    return teams
        .map((t) => {
            const teamSeasons = getTeamSeasons(t, seasonId, divisionId);
            const relevantTeamSeasons = teamSeasons.filter(predicate);
            return relevantTeamSeasons.length > 0
                ? { team: t, teamSeason: relevantTeamSeasons[0] }
                : null;
        })
        .filter((map) => !!map)[0];
}
