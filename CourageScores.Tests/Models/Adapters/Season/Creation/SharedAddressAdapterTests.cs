using CourageScores.Models.Adapters.Season.Creation;
using CourageScores.Models.Dtos.Season.Creation;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Season.Creation;

[TestFixture]
public class SharedAddressAdapterTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private SharedAddressAdapter _adapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _adapter = new SharedAddressAdapter();
    }

    [Test]
    public async Task Adapt_GivenDto_SetsPropertiesCorrectly()
    {
        var dto = new List<TeamPlaceholderDto>
        {
            new TeamPlaceholderDto("A"),
            new TeamPlaceholderDto("B"),
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result, Is.EqualTo(new[] { "A", "B" }));
    }

    [Test]
    public async Task Adapt_GivenDto_TrimsWhitespaceFromKeys()
    {
        var dto = new List<TeamPlaceholderDto>
        {
            new TeamPlaceholderDto("A   "),
            new TeamPlaceholderDto("  B"),
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result, Is.EqualTo(new[] { "A", "B" }));
    }

    [Test]
    public async Task Adapt_GivenModel_SetsPropertiesCorrectly()
    {
        var model = new List<string>
        {
            "A", "B"
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Select(p => p.Key), Is.EqualTo(new[] { "A", "B" }));
    }
}