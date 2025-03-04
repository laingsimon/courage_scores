using CourageScores.Models;
using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Tests.Models.Cosmos.Game;
using Moq;
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

    public static ConfiguredFeatureDto GetVetoedFeature(int days)
    {
        return new ConfiguredFeatureDto
        {
            ConfiguredValue = TimeSpan.FromDays(days).ToString(),
            ValueType = Feature.FeatureValueType.TimeSpan,
        };
    }

    public static void VerifyFixtureDateAdapterCall(this Mock<IDivisionFixtureDateAdapter> divisionFixtureDateAdapter, CancellationToken token, DateTime date, bool includeProposals, CosmosGame[] gamesForDate, CosmosGame[]? otherFixturesForDate = null)
    {
        divisionFixtureDateAdapter.Verify(a => a.Adapt(
            date,
            It.Is<CosmosGame[]>(g => g.SequenceEqual(gamesForDate)),
            It.IsAny<TournamentGame[]>(),
            It.IsAny<FixtureDateNoteDto[]>(),
            It.IsAny<IReadOnlyCollection<TeamDto>>(),
            It.Is<CosmosGame[]>(games => otherFixturesForDate == null || games.SequenceEqual(otherFixturesForDate)),
            includeProposals,
            It.IsAny<IReadOnlyDictionary<Guid, DivisionDto?>>(),
            token));
    }

    public static void SetupDivisionFixtureDateDtoReturnWithDate(Mock<IDivisionFixtureDateAdapter> divisionFixtureDateAdapter, CancellationToken token)
    {
        divisionFixtureDateAdapter
            .Setup(a => a.Adapt(
                It.IsAny<DateTime>(),
                It.IsAny<IReadOnlyCollection<CosmosGame>>(),
                It.IsAny<IReadOnlyCollection<TournamentGame>>(),
                It.IsAny<IReadOnlyCollection<FixtureDateNoteDto>>(),
                It.IsAny<IReadOnlyCollection<TeamDto>>(),
                It.IsAny<IReadOnlyCollection<CosmosGame>>(),
                It.IsAny<bool>(),
                It.IsAny<IReadOnlyDictionary<Guid, DivisionDto?>>(),
                token))
            .ReturnsAsync((
                DateTime date,
                IReadOnlyCollection<CosmosGame> _,
                IReadOnlyCollection<TournamentGame> _,
                IReadOnlyCollection<FixtureDateNoteDto> _,
                IReadOnlyCollection<TeamDto> _,
                IReadOnlyCollection<CosmosGame> _,
                bool _,
                IReadOnlyDictionary<Guid, DivisionDto?> _,
                CancellationToken _) => new DivisionFixtureDateDto
                {
                    Date = date,
                });
    }
}