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
            Author = model.Author,
            Created = model.Created,
            Divisions = model.Divisions.Select(_divisionAdapter.Adapt).ToArray(),
            Editor = model.Editor,
            Games = model.Games.Select(_gameAdapter.Adapt).ToArray(),
            Id = model.Id,
            Teams = model.Teams.Select(_teamAdapter.Adapt).ToArray(),
            Updated = model.Updated,
            EndDate = model.EndDate,
            StartDate = model.StartDate,
        };
    }

    public Season Adapt(SeasonDto dto)
    {
        return new Season
        {
            Author = dto.Author,
            Created = dto.Created,
            Divisions = dto.Divisions.Select(_divisionAdapter.Adapt).ToArray(),
            Editor = dto.Editor,
            Games = dto.Games.Select(_gameAdapter.Adapt).ToArray(),
            Id = dto.Id,
            Teams = dto.Teams.Select(_teamAdapter.Adapt).ToArray(),
            Updated = dto.Updated,
            EndDate = dto.EndDate,
            StartDate = dto.StartDate,
        };
    }
}