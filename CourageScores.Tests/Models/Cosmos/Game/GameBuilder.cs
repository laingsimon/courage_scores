using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Models.Cosmos.Game;

public class GameBuilder
{
    private readonly CosmosGame _game;

    public GameBuilder(CosmosGame? game = null)
    {
        _game = game ?? new CosmosGame { Id = Guid.NewGuid() };
    }

    public CosmosGame Build()
    {
        return _game;
    }

    public GameBuilder ForDivision(Guid divisionId)
    {
        _game.DivisionId = divisionId;
        return this;
    }

    public GameBuilder ForDivision(DivisionDto division)
    {
        return ForDivision(division.Id);
    }

    public GameBuilder ForSeason(SeasonDto season)
    {
        _game.SeasonId = season.Id;
        return this;
    }

    public GameBuilder Knockout(bool isKnockout = true)
    {
        _game.IsKnockout = isKnockout;
        return this;
    }

    public GameBuilder WithTeams(TeamDto home, TeamDto away)
    {
        _game.Home = new GameTeam
        {
            Id = home.Id,
            Name = home.Name,
        };
        _game.Away = new GameTeam
        {
            Id = away.Id,
            Name = away.Name,
        };
        return this;
    }

    public GameBuilder WithMatch(Func<GameMatchBuilder, GameMatchBuilder> matchBuilder)
    {
        _game.Matches.Add(matchBuilder(new GameMatchBuilder()).Build());
        return this;
    }

    public GameBuilder WithOneEighties(params GamePlayer[] players)
    {
        _game.OneEighties.AddRange(players);
        return this;
    }

    public GameBuilder WithDate(DateTime date)
    {
        _game.Date = date;
        return this;
    }
}