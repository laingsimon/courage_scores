using CourageScores.Models.Adapters.Game.Sayg;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Team;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game.Sayg;

[TestFixture]
public class UpdateRecordedScoreAsYouGoDtoAdapterTests
{
    private readonly CancellationToken _token = new();
    private UpdateRecordedScoreAsYouGoDtoAdapter _adapter = null!;
    private Mock<ICachingTeamService> _teamService = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _teamService = new Mock<ICachingTeamService>();
        _adapter = new UpdateRecordedScoreAsYouGoDtoAdapter(_teamService.Object);
    }

    [Test]
    public async Task Adapt_GivenNoMatchOptions_ShouldSetDefaultOptions()
    {
        var match = new TournamentMatch
        {
            SideA = new TournamentSide(),
            SideB = new TournamentSide(),
        };
        var sayg = new RecordedScoreAsYouGoDto();

        var result = await _adapter.Adapt(sayg, match, null, _token);

        Assert.That(result.NumberOfLegs, Is.EqualTo(3));
        Assert.That(result.StartingScore, Is.EqualTo(501));
    }

    [Test]
    public async Task Adapt_GivenMatchOptions_ShouldSetOptions()
    {
        var match = new TournamentMatch
        {
            SideA = new TournamentSide(),
            SideB = new TournamentSide(),
        };
        var sayg = new RecordedScoreAsYouGoDto();
        var matchOptions = new GameMatchOption
        {
            NumberOfLegs = 5,
            StartingScore = 601,
        };

        var result = await _adapter.Adapt(sayg, match, matchOptions, _token);

        Assert.That(result.NumberOfLegs, Is.EqualTo(5));
        Assert.That(result.StartingScore, Is.EqualTo(601));
    }

    [Test]
    public async Task Adapt_GivenSaygModel_ShouldSetProperties()
    {
        var match = new TournamentMatch
        {
            Id = Guid.NewGuid(),
            SideA = new TournamentSide(),
            SideB = new TournamentSide(),
        };
        var sayg = new RecordedScoreAsYouGoDto
        {
            Updated = new DateTime(2001, 02, 03),
            Id = Guid.NewGuid(),
            TournamentMatchId = match.Id,
            Legs = new Dictionary<int, LegDto>(),
            HomeScore = 1,
            AwayScore = 2,
        };

        var result = await _adapter.Adapt(sayg, match, null, _token);

        Assert.That(result.Id, Is.EqualTo(sayg.Id));
        Assert.That(result.TournamentMatchId, Is.EqualTo(match.Id));
        Assert.That(result.Legs, Is.SameAs(sayg.Legs));
        Assert.That(result.HomeScore, Is.EqualTo(1));
        Assert.That(result.AwayScore, Is.EqualTo(2));
        Assert.That(result.LastUpdated, Is.EqualTo(sayg.Updated));
    }

    [Test]
    public async Task Adapt_GivenSideName_ShouldSetSideName()
    {
        var match = new TournamentMatch
        {
            Id = Guid.NewGuid(),
            SideA = new TournamentSide
            {
                Name = "SIDE A",
            },
            SideB = new TournamentSide
            {
                Name = "SIDE B",
            },
        };
        var sayg = new RecordedScoreAsYouGoDto();

        var result = await _adapter.Adapt(sayg, match, null, _token);

        Assert.That(result.YourName, Is.EqualTo("SIDE A"));
        Assert.That(result.OpponentName, Is.EqualTo("SIDE B"));
    }

    [Test]
    public async Task Adapt_GivenTeamSide_ShouldSetTeamNameForSide()
    {
        var teamADto = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "TEAM A",
        };
        var teamBDto = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "TEAM B",
        };
        var match = new TournamentMatch
        {
            Id = Guid.NewGuid(),
            SideA = new TournamentSide
            {
                TeamId = teamADto.Id,
            },
            SideB = new TournamentSide
            {
                TeamId = teamBDto.Id,
            },
        };
        var sayg = new RecordedScoreAsYouGoDto();
        _teamService.Setup(s => s.Get(teamADto.Id, _token)).ReturnsAsync(teamADto);
        _teamService.Setup(s => s.Get(teamBDto.Id, _token)).ReturnsAsync(teamBDto);

        var result = await _adapter.Adapt(sayg, match, null, _token);

        Assert.That(result.YourName, Is.EqualTo("TEAM A"));
        Assert.That(result.OpponentName, Is.EqualTo("TEAM B"));
    }

    [Test]
    public async Task Adapt_GivenNotFoundTeamSide_ShouldSetTeamNameForSide()
    {
        var match = new TournamentMatch
        {
            Id = Guid.NewGuid(),
            SideA = new TournamentSide
            {
                TeamId = Guid.NewGuid(),
            },
            SideB = new TournamentSide
            {
                TeamId = Guid.NewGuid(),
            },
        };
        var sayg = new RecordedScoreAsYouGoDto();

        var result = await _adapter.Adapt(sayg, match, null, _token);

        Assert.That(result.YourName, Is.EqualTo("Team not found: " + match.SideA.TeamId));
        Assert.That(result.OpponentName, Is.EqualTo("Team not found: " + match.SideB.TeamId));
    }

    [Test]
    public async Task Adapt_GivenNoSideName_ShouldSetIdAsSideName()
    {
        var match = new TournamentMatch
        {
            Id = Guid.NewGuid(),
            SideA = new TournamentSide
            {
                Id = Guid.NewGuid(),
            },
            SideB = new TournamentSide
            {
                Id = Guid.NewGuid(),
            },
        };
        var sayg = new RecordedScoreAsYouGoDto();

        var result = await _adapter.Adapt(sayg, match, null, _token);

        Assert.That(result.YourName, Is.EqualTo(match.SideA.Id.ToString()));
        Assert.That(result.OpponentName, Is.EqualTo(match.SideB.Id.ToString()));
    }
}