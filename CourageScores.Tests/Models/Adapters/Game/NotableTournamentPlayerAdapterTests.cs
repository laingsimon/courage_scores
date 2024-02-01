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
public class NotableTournamentPlayerAdapterTests
{
    private readonly CancellationToken _token = new();
    private NotableTournamentPlayerAdapter _adapter = null!;
    private Mock<ISystemClock> _systemClock = null!;
    private Mock<IUserService> _userService = null!;
    private UserDto? _user;
    private DateTimeOffset _now;

    [SetUp]
    public void SetupEachTest()
    {
        _systemClock = new Mock<ISystemClock>();
        _userService = new Mock<IUserService>();
        _adapter = new NotableTournamentPlayerAdapter(_systemClock.Object, _userService.Object);
        _now = new DateTimeOffset(new DateTime(2001, 02, 03), TimeSpan.Zero);

        _user = new UserDto();
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _systemClock.Setup(c => c.UtcNow).Returns(_now);
    }

    [Test]
    public async Task Adapt_GivenModel_MapsPropertiesCorrectly()
    {
        var model = new NotableTournamentPlayer
        {
            Id = Guid.NewGuid(),
            Name = "Simon",
            Notes = "123",
            DivisionId = Guid.NewGuid(),
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Name, Is.EqualTo(model.Name));
        Assert.That(result.DivisionId, Is.EqualTo(model.DivisionId));
#pragma warning disable CS0618 // Type or member is obsolete
        Assert.That(result.Notes, Is.EqualTo(model.Notes));
#pragma warning restore CS0618 // Type or member is obsolete
        Assert.That(result.Score, Is.EqualTo(123));
    }

    [Test]
    public async Task Adapt_GivenDto_MapsPropertiesCorrectly()
    {
        var dto = new NotableTournamentPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "Simon",
#pragma warning disable CS0618 // Type or member is obsolete
            Notes = "123",
#pragma warning restore CS0618 // Type or member is obsolete
            Score = 456,
            DivisionId = Guid.NewGuid(),
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Name, Is.EqualTo(dto.Name));
        Assert.That(result.DivisionId, Is.EqualTo(dto.DivisionId));
        Assert.That(result.Notes, Is.EqualTo("456"));
    }

    [Test]
    public async Task Adapt_GivenNotesOnly_MapsPropertiesCorrectly()
    {
        var dto = new NotableTournamentPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "Simon",
#pragma warning disable CS0618 // Type or member is obsolete
            Notes = "123",
#pragma warning restore CS0618 // Type or member is obsolete
            DivisionId = Guid.NewGuid(),
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Notes, Is.EqualTo("123"));
    }

    [Test]
    [Obsolete("Tests Notes which is now obsolete")]
    public async Task Adapt_GivenDto_TrimsTrailingWhitespace()
    {
        var dto = new NotableTournamentPlayerDto
        {
            Name = "Simon   ",
            Notes = "123  ",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Name, Is.EqualTo("Simon"));
        Assert.That(result.Notes, Is.EqualTo("123"));
    }

    [Test]
    public async Task Adapt_GivenEditDto_MapsPropertiesCorrectly()
    {
        var dto = new EditTournamentGameDto.TournamentOver100CheckoutDto
        {
            Id = Guid.NewGuid(),
            Name = "Simon",
#pragma warning disable CS0618 // Type or member is obsolete
            Notes = "123",
#pragma warning restore CS0618 // Type or member is obsolete
            Score = 456,
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
        Assert.That(result.Notes, Is.EqualTo("456"));
        Assert.That(result.Author, Is.EqualTo("USER"));
        Assert.That(result.Created, Is.EqualTo(_now.UtcDateTime));
        Assert.That(result.Editor, Is.EqualTo("USER"));
        Assert.That(result.Updated, Is.EqualTo(_now.UtcDateTime));
    }

    [Test]
    public async Task Adapt_GivenEditDtoNotesOnly_MapsNotesCorrectly()
    {
        var dto = new EditTournamentGameDto.TournamentOver100CheckoutDto
        {
            Id = Guid.NewGuid(),
            Name = "Simon",
#pragma warning disable CS0618 // Type or member is obsolete
            Notes = "123",
#pragma warning restore CS0618 // Type or member is obsolete
            DivisionId = Guid.NewGuid(),
        };
        _user = new UserDto
        {
            Name = "USER",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Notes, Is.EqualTo("123"));
    }

    [Test]
    [Obsolete("Tests Notes property which is now obsolete")]
    public async Task Adapt_GivenEditDto_TrimsTrailingWhitespace()
    {
        var dto = new EditTournamentGameDto.TournamentOver100CheckoutDto
        {
            Name = "Simon   ",
            Notes = "123  ",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Name, Is.EqualTo("Simon"));
        Assert.That(result.Notes, Is.EqualTo("123"));
    }
}