﻿using CourageScores.Common;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Team;

public class TeamSeasonAdapter : IAdapter<TeamSeason, TeamSeasonDto>
{
    private readonly IAdapter<TeamPlayer, TeamPlayerDto> _playerAdapter;

    public TeamSeasonAdapter(IAdapter<TeamPlayer, TeamPlayerDto> playerAdapter)
    {
        _playerAdapter = playerAdapter;
    }

    public async Task<TeamSeasonDto> Adapt(TeamSeason model, CancellationToken token)
    {
        return new TeamSeasonDto
        {
            Id = model.Id,
            Players = await model.Players.Where(p => p.Deleted == null).SelectAsync(player => _playerAdapter.Adapt(player, token)).ToList(),
            SeasonId = model.SeasonId,
            DivisionId = model.DivisionId,
        }.AddAuditProperties(model);
    }

    public async Task<TeamSeason> Adapt(TeamSeasonDto dto, CancellationToken token)
    {
        return new TeamSeason
        {
            Id = dto.Id,
            Players = await dto.Players.SelectAsync(player => _playerAdapter.Adapt(player, token)).ToList(),
            SeasonId = dto.SeasonId,
            DivisionId = dto.DivisionId,
        }.AddAuditProperties(dto);
    }
}