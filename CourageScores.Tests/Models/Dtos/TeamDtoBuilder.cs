using CourageScores.Models.Dtos.Team;

namespace CourageScores.Tests.Models.Dtos;

public class TeamDtoBuilder
{
    private readonly TeamDto _team;

    public TeamDtoBuilder(TeamDto? team = null)
    {
        _team = team ?? new TeamDto { Id = Guid.NewGuid() };
    }

    public TeamDto Build()
    {
        return _team;
    }

    public TeamDtoBuilder WithName(string name)
    {
        _team.Name = name;
        return this;
    }
    public TeamDtoBuilder WithSeason(Func<TeamSeasonDtoBuilder, TeamSeasonDtoBuilder> teamSeasonBuilder)
    {
        _team.Seasons.Add(teamSeasonBuilder(new TeamSeasonDtoBuilder()).Build());
        return this;
    }
}