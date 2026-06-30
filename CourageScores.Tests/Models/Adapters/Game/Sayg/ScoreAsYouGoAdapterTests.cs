using AutoFixture;
using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Game.Sayg;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game.Sayg;

[TestFixture]
public class ScoreAsYouGoAdapterTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private ScoreAsYouGoAdapter _adapter = null!;
    private Leg _leg = null!;
    private LegDto _legDto = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();
        _leg = new Leg();
        _legDto = new LegDto();
        fixture.Register<ISimpleAdapter<Leg, LegDto>>(() => new MockSimpleAdapter<Leg, LegDto>(_leg, _legDto));
        _adapter = fixture.Create<ScoreAsYouGoAdapter>();
    }

    [Test]
    public async Task Adapt_GivenModel_SetsLegsCorrectly()
    {
        var model = new ScoreAsYouGo
        {
            Legs =
            {
                {
                    0, _leg
                },
            },
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Legs.Keys, Is.EqualTo([0]));
        Assert.That(result.Legs[0], Is.EqualTo(_legDto));
    }

    [Test]
    public async Task Adapt_GivenDto_SetsLegsCorrectly()
    {
        var dto = new ScoreAsYouGoDto
        {
            Legs =
            {
                {
                    0, _legDto
                },
            },
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Legs.Keys, Is.EqualTo([0]));
        Assert.That(result.Legs[0], Is.EqualTo(_leg));
    }
}
