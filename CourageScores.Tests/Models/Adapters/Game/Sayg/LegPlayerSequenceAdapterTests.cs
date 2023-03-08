using CourageScores.Models.Adapters.Game.Sayg;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game.Sayg;

[TestFixture]
public class LegPlayerSequenceAdapterTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly LegPlayerSequenceAdapter _adapter = new LegPlayerSequenceAdapter();

    [TestCase(CompetitorType.Home, "home")]
    [TestCase(CompetitorType.Away, "away")]
    public async Task Adapt_GivenModel_SetsPropertiesCorrectly(CompetitorType inputValue, string expectedValue)
    {
        var model = new LegPlayerSequence
        {
            Text = "name",
            Value = inputValue,
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Text, Is.EqualTo(model.Text));
        Assert.That(result.Value, Is.EqualTo(expectedValue));
    }

    [TestCase("home", CompetitorType.Home)]
    [TestCase("away", CompetitorType.Away)]
    [TestCase("Home", CompetitorType.Home)]
    [TestCase("Away", CompetitorType.Away)]
    public async Task Adapt_GivenDto_SetsPropertiesCorrectly(string inputValue, CompetitorType expectedValue)
    {
        var dto = new LegPlayerSequenceDto
        {
            Text = "name",
            Value = inputValue,
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Text, Is.EqualTo(dto.Text));
        Assert.That(result.Value, Is.EqualTo(expectedValue));
    }
}