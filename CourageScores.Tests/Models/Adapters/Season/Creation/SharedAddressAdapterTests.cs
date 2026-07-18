using AutoFixture;
using CourageScores.Models.Adapters.Season.Creation;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Services.Identity;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Season.Creation;

[TestFixture]
public class SharedAddressAdapterTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private SharedAddressAdapter _adapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();
        _adapter = fixture.Create<SharedAddressAdapter>();
    }

    [Test]
    public async Task Adapt_GivenDto_SetsPropertiesCorrectly()
    {
        var dto = new List<TeamPlaceholderDto>
        {
            new("A"),
            new("B"),
        };

        var result = await _adapter.Adapt(dto, UserAccessContext.None(), _token);

        Assert.That(result, Is.EqualTo(["A", "B"]));
    }

    [Test]
    public async Task Adapt_GivenDto_TrimsWhitespaceFromKeys()
    {
        var dto = new List<TeamPlaceholderDto>
        {
            new("A   "),
            new("  B"),
        };

        var result = await _adapter.Adapt(dto, UserAccessContext.None(), _token);

        Assert.That(result, Is.EqualTo(["A", "B"]));
    }

    [Test]
    public async Task Adapt_GivenModel_SetsPropertiesCorrectly()
    {
        var model = new List<string>
        {
            "A",
            "B",
        };

        var result = await _adapter.Adapt(model, UserAccessContext.None(), _token);

        Assert.That(result.Select(p => p.Key), Is.EqualTo(["A", "B"]));
    }
}
