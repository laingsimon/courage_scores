﻿using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;

namespace CourageScores.Models.Adapters;

public class SeasonAdapter : IAdapter<Season, SeasonDto>
{
    private readonly IAdapter<Division, DivisionDto> _divisionAdapter;
    private readonly IAdapter<Cosmos.Game.Game, GameDto> _gameAdapter;
    private readonly IAdapter<Cosmos.Team.Team, TeamDto> _teamAdapter;

    public SeasonAdapter(
        IAdapter<Division, DivisionDto> divisionAdapter,
        IAdapter<Cosmos.Game.Game, GameDto> gameAdapter,
        IAdapter<Cosmos.Team.Team, TeamDto> teamAdapter)
    {
        _divisionAdapter = divisionAdapter;
        _gameAdapter = gameAdapter;
        _teamAdapter = teamAdapter;
    }

    public async Task<SeasonDto> Adapt(Season model)
    {
        return new SeasonDto
        {
            Divisions = await model.Divisions.SelectAsync(_divisionAdapter.Adapt).ToList(),
            Games = await model.Games.SelectAsync(_gameAdapter.Adapt).ToList(),
            Id = model.Id,
            Teams = await model.Teams.SelectAsync(_teamAdapter.Adapt).ToList(),
            EndDate = model.EndDate,
            StartDate = model.StartDate,
            Name = model.Name,
        }.AddAuditProperties(model);
    }

    public async Task<Season> Adapt(SeasonDto dto)
    {
        return new Season
        {
            Divisions = await dto.Divisions.SelectAsync(_divisionAdapter.Adapt).ToList(),
            Games = await dto.Games.SelectAsync(_gameAdapter.Adapt).ToList(),
            Id = dto.Id,
            Teams = await dto.Teams.SelectAsync(_teamAdapter.Adapt).ToList(),
            EndDate = dto.EndDate,
            StartDate = dto.StartDate,
            Name = dto.Name,
        }.AddAuditProperties(dto);
    }
}