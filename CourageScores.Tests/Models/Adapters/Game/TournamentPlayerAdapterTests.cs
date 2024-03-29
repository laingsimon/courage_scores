using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game;

[TestFixture]
public class TournamentPlayerAdapterTests
{
    private readonly CancellationToken _token = new();
    private TournamentPlayerAdapter _adapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _adapter = new TournamentPlayerAdapter();
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
}