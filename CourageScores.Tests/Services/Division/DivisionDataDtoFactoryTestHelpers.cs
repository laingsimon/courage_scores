using CourageScores.Models;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season;
using CourageScores.Tests.Models.Cosmos.Game;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Services.Division;

public static class DivisionDataDtoFactoryTestHelpers
{
    public static DivisionDataContextBuilder DivisionDataContextBuilder(
        SeasonDto? season = null,
        CosmosGame? game = null,
        DivisionDto? division = null,
        TournamentGame? tournamentGame = null)
    {
        var builder = new DivisionDataContextBuilder()
            .WithSeason(season ?? DivisionDataDtoFactoryTests.Season1);

        if (game != null)
        {
            builder = builder.WithGame(game);
        }

        if (tournamentGame != null)
        {
            builder = builder.WithTournamentGame(tournamentGame);
        }

        if (division != null)
        {
            builder = builder.WithDivision(division);
        }

        return builder;
    }

    public static GamePlayer GamePlayer(string name)
    {
        return new GamePlayer
        {
            Id = Guid.NewGuid(),
            Name = name,
        };
    }

    public static GameBuilder GameBuilder(
        SeasonDto? season = null,
        DateTime? date = null,
        DivisionDto? division = null)
    {
        var builder = new GameBuilder()
            .ForSeason(season ?? DivisionDataDtoFactoryTests.Season1)
            .WithDate(date ?? new DateTime(2001, 02, 03))
            .ForDivision(division ?? DivisionDataDtoFactoryTests.Division1)
            .WithTeams(DivisionDataDtoFactoryTests.Team1, DivisionDataDtoFactoryTests.Team2);

        return builder;
    }

    public static ConfiguredFeatureDto? GetVetoedFeature(int days)
    {
        return new ConfiguredFeatureDto
        {
            ConfiguredValue = TimeSpan.FromDays(days).ToString(),
            ValueType = Feature.FeatureValueType.TimeSpan,
        };
    }
}