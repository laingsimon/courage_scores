using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Team;

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

    public SeasonDto Adapt(Season model)
    {
        return new SeasonDto
        {
            Divisions = model.Divisions?.Select(_divisionAdapter.Adapt).ToList() ?? new List<DivisionDto>(),
            Games = model.Games?.Select(_gameAdapter.Adapt).ToList() ?? new List<GameDto>(),
            Id = model.Id,
            Teams = model.Teams?.Select(_teamAdapter.Adapt).ToList() ?? new List<TeamDto>(),
            EndDate = model.EndDate,
            StartDate = model.StartDate,
            Name = model.Name,
        }.AddAuditProperties(model);
    }

    public Season Adapt(SeasonDto dto)
    {
        return new Season
        {
            Divisions = dto.Divisions?.Select(_divisionAdapter.Adapt).ToList() ?? new List<Division>(),
            Games = dto.Games?.Select(_gameAdapter.Adapt).ToList() ?? new List<Cosmos.Game.Game>(),
            Id = dto.Id,
            Teams = dto.Teams?.Select(_teamAdapter.Adapt).ToList() ?? new List<Cosmos.Team.Team>(),
            EndDate = dto.EndDate,
            StartDate = dto.StartDate,
            Name = dto.Name,
        }.AddAuditProperties(dto);
    }
}