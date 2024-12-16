using CourageScores.Models.Adapters.Season;
using CourageScores.Models.Dtos;
using CourageScores.Tests.Services;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Season;

[TestFixture]
public class SeasonAdapterTests
{
    private static readonly CourageScores.Models.Cosmos.Division Division = new();
    private static readonly DivisionDto DivisionDto = new();
    private readonly CancellationToken _token = new();
    private Mock<TimeProvider> _clock = null!;
    private SeasonAdapter _adapter = null!;
    private DateTimeOffset _now;

    [SetUp]
    public void SetupEachTest()
    {
        _now = new DateTimeOffset(2001, 02, 03, 0, 0, 0, TimeSpan.Zero);
        _clock = new Mock<TimeProvider>();
        _adapter = new SeasonAdapter(
            new MockAdapter<CourageScores.Models.Cosmos.Division, DivisionDto>(Division, DivisionDto),
            _clock.Object);

        _clock.Setup(c => c.GetUtcNow()).Returns(() => _now);
    }

    [Test]
    public async Task Adapt_GivenModel_MapsPropertiesCorrectly()
    {
        var model = new CourageScores.Models.Cosmos.Season.Season
        {
            Id = Guid.NewGuid(),
            Name = "Season 1",
            Divisions =
            {
                Division,
            },
            StartDate = new DateTime(2001, 02, 03),
            EndDate = new DateTime(2002, 03, 04),
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Name, Is.EqualTo(model.Name));
        Assert.That(result.StartDate, Is.EqualTo(model.StartDate));
        Assert.That(result.EndDate, Is.EqualTo(model.EndDate));
        Assert.That(result.IsCurrent, Is.True);
        Assert.That(result.Divisions, Is.EqualTo(new[]
        {
            DivisionDto,
        }));
    }

    [Test]
    public async Task Adapt_GivenNowBeforeStartDate_SetsIsCurrentToFalse()
    {
        _now = new DateTimeOffset(2000, 01, 02, 0, 0, 0, TimeSpan.Zero);
        var model = new CourageScores.Models.Cosmos.Season.Season
        {
            Id = Guid.NewGuid(),
            Name = "Season 1",
            Divisions =
            {
                Division,
            },
            StartDate = new DateTime(2001, 02, 03),
            EndDate = new DateTime(2002, 03, 04),
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.IsCurrent, Is.False);
    }

    [Test]
    public async Task Adapt_GivenNowAfterEndDate_SetsIsCurrentToFalse()
    {
        _now = new DateTimeOffset(2003, 02, 01, 0, 0, 0, TimeSpan.Zero);
        var model = new CourageScores.Models.Cosmos.Season.Season
        {
            Id = Guid.NewGuid(),
            Name = "Season 1",
            Divisions =
            {
                Division,
            },
            StartDate = new DateTime(2001, 02, 03),
            EndDate = new DateTime(2002, 03, 04),
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.IsCurrent, Is.False);
    }

    [Test]
    public async Task Adapt_GivenNowSameAsStartDate_SetsIsCurrentToTrue()
    {
        _now = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);
        var model = new CourageScores.Models.Cosmos.Season.Season
        {
            Id = Guid.NewGuid(),
            Name = "Season 1",
            Divisions =
            {
                Division,
            },
            StartDate = new DateTime(2001, 02, 03),
            EndDate = new DateTime(2002, 03, 04),
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.IsCurrent, Is.True);
    }

    [Test]
    public async Task Adapt_GivenNowSameAsEndDate_SetsIsCurrentToTrue()
    {
        _now = new DateTimeOffset(2002, 03, 04, 05, 06, 07, TimeSpan.Zero);
        var model = new CourageScores.Models.Cosmos.Season.Season
        {
            Id = Guid.NewGuid(),
            Name = "Season 1",
            Divisions =
            {
                Division,
            },
            StartDate = new DateTime(2001, 02, 03),
            EndDate = new DateTime(2002, 03, 04),
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.IsCurrent, Is.True);
    }

    [Test]
    public async Task Adapt_GivenDto_MapsPropertiesCorrectly()
    {
        var dto = new SeasonDtoBuilder(name: "Season 1")
            .WithDivisions(DivisionDto)
            .Build();

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Name, Is.EqualTo(dto.Name));
        Assert.That(result.Divisions, Is.EqualTo(new[]
        {
            Division,
        }));
    }

    [Test]
    public async Task Adapt_GivenDto_TrimsWhitespaceFromName()
    {
        var dto = new SeasonDtoBuilder(name: "Season 1   ")
            .Build();

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Name, Is.EqualTo("Season 1"));
    }
}