using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Tests.Models.Dtos;

public class TeamSeasonDtoBuilder
{
    private readonly TeamSeasonDto _teamSeason;

    public TeamSeasonDtoBuilder(TeamSeasonDto? teamSeason = null)
    {
        _teamSeason = teamSeason ?? new TeamSeasonDto();
    }

    public TeamSeasonDto Build()
    {
        return _teamSeason;
    }

    public TeamSeasonDtoBuilder ForSeason(SeasonDto season, DivisionDto? division = null)
    {
        _teamSeason.SeasonId = season.Id;
        _teamSeason.DivisionId = division?.Id ?? Guid.NewGuid();
        return this;
    }

    public TeamSeasonDtoBuilder WithPlayers(params GamePlayer[] players)
    {
        _teamSeason.Players.AddRange(players.Select(p => new TeamPlayerDto { Id = p.Id, Name = p.Name }));
        return this;
    }

    public TeamSeasonDtoBuilder Deleted(DateTime? deleted = null)
    {
        _teamSeason.Deleted = deleted ?? DateTime.UtcNow;
        return this;
    }
}