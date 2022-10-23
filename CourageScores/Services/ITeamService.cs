﻿using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Services;

public interface ITeamService
{
    Task<TeamDto?> GetTeam(Guid id, CancellationToken token);
    IAsyncEnumerable<TeamDto> GetAllTeams(CancellationToken token);
    Task<ActionResultDto<TeamDto>> UpsertTeam(TeamDto team, CancellationToken token);
}