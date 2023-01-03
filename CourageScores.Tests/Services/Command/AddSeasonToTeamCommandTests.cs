using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Season;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Season;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddSeasonToTeamCommandTests
{
    private Mock<IAuditingHelper> _auditingHelper = null!;
    private Mock<ISeasonService> _seasonService = null!;
    private readonly CancellationToken _token = new CancellationToken();
    private AddSeasonToTeamCommand _command = null!;
    private Team _team = null!;
    private SeasonDto _season = null!;

    [SetUp]
    public void SetupOnce()
    {
        _auditingHelper = new Mock<IAuditingHelper>();
        _seasonService = new Mock<ISeasonService>();
        _command = new AddSeasonToTeamCommand(_auditingHelper.Object, _seasonService.Object);
        _team = new Team();
        _season = new SeasonDto
        {
            Id = Guid.NewGuid(),
        };
    }

    [Test]
    public async Task ApplyUpdate_WhenModelDeleted_ReturnsUnsuccessful()
    {
        _team.Deleted = new DateTime(2001, 02, 03);

        var result = await _command.ForSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Cannot edit a team that has been deleted"));
    }

    [Test]
    public async Task ApplyUpdate_WhenSeasonNotFound_ReturnsUnsuccessful()
    {
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(() => null);

        var result = await _command.ForSeason(_season.Id).ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Season not found"));
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamSeasonFoundAndCopyFromOtherSeason_CopiesPlayersFromOtherSeason()
    {
        var otherSeason = new TeamSeason
        {
            SeasonId = Guid.NewGuid(),
            Players =
            {
                new TeamPlayer {Id = Guid.NewGuid(), Name = "other player"}
            }
        };
        _team.Seasons.Add(new TeamSeason
        {
            SeasonId = _season.Id,
        });
        _team.Seasons.Add(otherSeason);
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);

        var result = await _command
            .CopyPlayersFromSeasonId(otherSeason.SeasonId)
            .ForSeason(_season.Id)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Season already exists, 1 players copied"));
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamSeasonFoundAndCopyFromOtherSeasonWithSomeCurrentPlayers_ReturnsSuccessful()
    {
        var otherSeason = new TeamSeason
        {
            SeasonId = Guid.NewGuid(),
            Players =
            {
                new TeamPlayer {Id = Guid.NewGuid(), Name = "other player"}
            }
        };
        _team.Seasons.Add(new TeamSeason
        {
            SeasonId = _season.Id,
            Players =
            {
                new TeamPlayer {Id = Guid.NewGuid(), Name = "existing player"}
            }
        });
        _team.Seasons.Add(otherSeason);
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);

        var result = await _command
            .CopyPlayersFromSeasonId(otherSeason.SeasonId)
            .ForSeason(_season.Id)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Season already exists"));
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamSeasonNotFoundAndCopyFromOtherSeason_CreatesTeamSeasonWithOtherSeasonPlayers()
    {
        var otherSeason = new TeamSeason
        {
            SeasonId = Guid.NewGuid(),
            Players =
            {
                new TeamPlayer {Id = Guid.NewGuid(), Name = "other player"}
            }
        };
        _team.Seasons.Add(otherSeason);
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);

        var result = await _command
            .CopyPlayersFromSeasonId(otherSeason.SeasonId)
            .ForSeason(_season.Id)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Season added to this team, 1 players copied"));
        var newTeamSeason = _team.Seasons.SingleOrDefault(s => s.SeasonId == _season.Id);
        Assert.That(newTeamSeason, Is.Not.Null);
        Assert.That(newTeamSeason!.Players, Is.Not.Empty);
        Assert.That(newTeamSeason.Players.Select(p => p.Id), Is.EquivalentTo(otherSeason.Players.Select(p => p.Id)));
    }

    [Test]
    public async Task ApplyUpdate_WhenTeamSeasonNotFound_CreatesTeamSeason()
    {
        _seasonService.Setup(s => s.Get(_season.Id, _token)).ReturnsAsync(_season);

        var result = await _command
            .ForSeason(_season.Id)
            .ApplyUpdate(_team, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Season added to this team"));
        var newTeamSeason = _team.Seasons.SingleOrDefault(s => s.SeasonId == _season.Id);
        Assert.That(newTeamSeason, Is.Not.Null);
        Assert.That(newTeamSeason!.Players, Is.Empty);
    }
}