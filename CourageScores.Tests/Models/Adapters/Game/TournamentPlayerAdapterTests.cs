using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Authentication;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game;

[TestFixture]
public class TournamentPlayerAdapterTests
{
    private readonly CancellationToken _token = new();
    private TournamentPlayerAdapter _adapter = null!;
    private Mock<ISystemClock> _systemClock = null!;
    private Mock<IUserService> _userService = null!;
    private UserDto? _user;
    private DateTimeOffset _now;

    [SetUp]
    public void SetupEachTest()
    {
        _systemClock = new Mock<ISystemClock>();
        _userService = new Mock<IUserService>();
        _adapter = new TournamentPlayerAdapter(_systemClock.Object, _userService.Object);
        _now = new DateTimeOffset(new DateTime(2001, 02, 03), TimeSpan.Zero);

        _user = new UserDto();
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _systemClock.Setup(c => c.UtcNow).Returns(_now);
    }

    [Test]
    public async Task Adapt_GivenModel_MapsPropertiesCorrectly()
    {
        var model = new TournamentPlayer
        {
            Id = Guid.NewGuid(),
            Name = "Simon",
            DivisionId = Guid.NewGuid(),
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Name, Is.EqualTo(model.Name));
        Assert.That(result.DivisionId, Is.EqualTo(model.DivisionId));
    }

    [Test]
    public async Task Adapt_GivenDto_MapsPropertiesCorrectly()
    {
        var dto = new TournamentPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "Simon",
            DivisionId = Guid.NewGuid(),
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Name, Is.EqualTo(dto.Name));
        Assert.That(result.DivisionId, Is.EqualTo(dto.DivisionId));
    }

    [Test]
    public async Task Adapt_GivenDto_TrimsTrailingWhitespace()
    {
        var dto = new TournamentPlayerDto
        {
            Name = "Simon   ",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Name, Is.EqualTo("Simon"));
    }

    [Test]
    public async Task Adapt_GivenEditDto_MapsPropertiesCorrectly()
    {
        var dto = new EditTournamentGameDto.RecordTournamentScoresPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "Simon",
            DivisionId = Guid.NewGuid(),
        };
        _user = new UserDto
        {
            Name = "USER",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Name, Is.EqualTo(dto.Name));
        Assert.That(result.DivisionId, Is.EqualTo(dto.DivisionId));
        Assert.That(result.Author, Is.EqualTo("USER"));
        Assert.That(result.Created, Is.EqualTo(_now.UtcDateTime));
        Assert.That(result.Editor, Is.EqualTo("USER"));
        Assert.That(result.Updated, Is.EqualTo(_now.UtcDateTime));
    }

    [Test]
    public async Task Adapt_GivenEditDto_TrimsTrailingWhitespace()
    {
        var dto = new EditTournamentGameDto.RecordTournamentScoresPlayerDto
        {
            Name = "Simon   ",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Name, Is.EqualTo("Simon"));
    }
}