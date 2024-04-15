using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Division;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Dtos.Division;

[TestFixture]
public class DivisionDataFilterTests
{
    private const string MatchingDate = "2001-02-03";
    private const string MisMatchingDate = "2022-02-02";
    private const string MatchingTeamId = "CEA94DFC-F113-4E00-A2DE-870F0F6419D2";
    private const string MisMatchingTeamId = "8DA89BC6-63F0-44E5-80F2-18FF0F5B6035";
    private const string MatchingDivisionId = "E5A05D5C-F5D2-4FB3-A8A9-580B84889118";
    private const string MatchingSeasonId = "4FA6E936-646E-4944-B7C3-7C030BAE42BA";
    private const string MisMatchingDivisionId = "51A70928-3F7D-452B-9957-AB20A74BB08B";
    private const string MisMatchingSeasonId = "98B11721-D449-4CA9-B55F-3F18AB03927D";

    [Test]
    public void IncludeGame_WhenNoFiltersSet_ReturnsTrue()
    {
        var filter = new DivisionDataFilter();
        var game = new Game();

        var result = filter.IncludeGame(game);

        Assert.That(result, Is.True);
    }

    [Test]
    public void IncludeTournament_WhenNoFiltersSet_ReturnsTrue()
    {
        var filter = new DivisionDataFilter();
        var tournament = new TournamentGame();

        var result = filter.IncludeTournament(tournament);

        Assert.That(result, Is.True);
    }

    [TestCase(MatchingDate, MatchingTeamId, true)]
    [TestCase(MatchingDate, MisMatchingTeamId, false)]
    [TestCase(MisMatchingDate, MatchingTeamId, false)]
    [TestCase(MisMatchingDate, MisMatchingTeamId, false)]
    public void IncludeGame_WithHomeTeamGivenFilters_ReturnsCorrectly(string date, string teamId, bool expectedResult)
    {
        var filter = new DivisionDataFilter
        {
            Date = DateTime.Parse(date),
            TeamId = Guid.Parse(teamId),
        };
        var game = new Game
        {
            Date = DateTime.Parse(MatchingDate),
            Home = new GameTeam
            {
                Id = Guid.Parse(MatchingTeamId),
            },
            Away = new GameTeam
            {
                Id = Guid.NewGuid(),
            },
        };

        var result = filter.IncludeGame(game);

        Assert.That(result, Is.EqualTo(expectedResult));
    }

    [TestCase(MatchingDate, MatchingTeamId, true)]
    [TestCase(MatchingDate, MisMatchingTeamId, false)]
    [TestCase(MisMatchingDate, MatchingTeamId, false)]
    [TestCase(MisMatchingDate, MisMatchingTeamId, false)]
    public void IncludeGame_WithAwayTeamGivenFilters_ReturnsCorrectly(string date, string teamId, bool expectedResult)
    {
        var filter = new DivisionDataFilter
        {
            Date = DateTime.Parse(date),
            TeamId = Guid.Parse(teamId),
        };
        var game = new Game
        {
            Date = DateTime.Parse(MatchingDate),
            Home = new GameTeam
            {
                Id = Guid.NewGuid(),
            },
            Away = new GameTeam
            {
                Id = Guid.Parse(MatchingTeamId),
            },
        };

        var result = filter.IncludeGame(game);

        Assert.That(result, Is.EqualTo(expectedResult));
    }

    [TestCase(MatchingDate, MatchingTeamId, true)]
    [TestCase(MatchingDate, MisMatchingTeamId, false)]
    [TestCase(MisMatchingDate, MatchingTeamId, false)]
    [TestCase(MisMatchingDate, MisMatchingTeamId, false)]
    public void IncludeTournament_GivenFilters_ReturnsCorrectly(string date, string teamId, bool expectedResult)
    {
        var filter = new DivisionDataFilter
        {
            Date = DateTime.Parse(date),
            TeamId = Guid.Parse(teamId),
        };
        var tournament = new TournamentGame
        {
            Date = DateTime.Parse(MatchingDate),
            Sides =
            {
                new TournamentSide
                {
                    TeamId = Guid.Parse(MatchingTeamId),
                },
                new TournamentSide(), // side with no teamId
                new TournamentSide // side with mis-matching team id
                {
                    TeamId = Guid.NewGuid(),
                },
            },
        };

        var result = filter.IncludeTournament(tournament);

        Assert.That(result, Is.EqualTo(expectedResult));
    }

    [Test]
    public void Equals_GivenEmptyFilter_ShouldEqualOtherEmptyFilter()
    {
        var filter1 = new DivisionDataFilter();
        var filter2 = new DivisionDataFilter();

        var equals = filter1.Equals(filter2);

        Assert.That(equals, Is.True);
    }

    [TestCase(MatchingDate, MatchingTeamId, MatchingDivisionId, MatchingSeasonId, true)]
    [TestCase(MatchingDate, MatchingTeamId, MatchingDivisionId, MisMatchingSeasonId, false)]
    [TestCase(MatchingDate, MatchingTeamId, MisMatchingDivisionId, MatchingSeasonId, false)]
    [TestCase(MatchingDate, MisMatchingTeamId, MatchingDivisionId, MatchingSeasonId, false)]
    [TestCase(MisMatchingDate, MatchingTeamId, MatchingDivisionId, MatchingSeasonId, false)]
    [TestCase(MatchingDate, MatchingTeamId, MatchingDivisionId, null, false)]
    [TestCase(MatchingDate, MatchingTeamId, null, MatchingSeasonId, false)]
    [TestCase(MatchingDate, null, MatchingDivisionId, MatchingSeasonId, false)]
    [TestCase(null, MatchingTeamId, MatchingDivisionId, MatchingSeasonId, false)]
    public void Equals_GivenProperties_ShouldCorrectlyEqualOtherFilter(string? date, string? teamId, string? divisionId, string? seasonId, bool expectedEquals)
    {
        var filter1 = new DivisionDataFilter
        {
            Date = date == null ? null : DateTime.Parse(date),
            TeamId = teamId == null ? null : Guid.Parse(teamId),
            DivisionId = divisionId == null ? null : Guid.Parse(divisionId),
            SeasonId = seasonId == null ? null : Guid.Parse(seasonId),
        };
        var filter2 = new DivisionDataFilter
        {
            Date = DateTime.Parse(MatchingDate),
            DivisionId = Guid.Parse(MatchingDivisionId),
            SeasonId = Guid.Parse(MatchingSeasonId),
            TeamId = Guid.Parse(MatchingTeamId),
        };

        var equals = filter1.Equals(filter2);

        Assert.That(equals, Is.EqualTo(expectedEquals));
    }
}