using CourageScores.Models.Adapters.Game.Sayg;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game.Sayg;

[TestFixture]
public class RecordedScoreAsYouGoAdapterTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private RecordedScoreAsYouGoAdapter _adapter = null!;
    private Leg _leg = null!;
    private LegDto _legDto = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _leg = new Leg();
        _legDto = new LegDto();
        _adapter = new RecordedScoreAsYouGoAdapter(
            new MockSimpleAdapter<Leg, LegDto>(_leg, _legDto));
    }

    [Test]
    public async Task Adapt_GivenModel_SetsLegsCorrectly()
    {
        var model = new RecordedScoreAsYouGo
        {
            Legs =
            {
                { 0, _leg }
            },
            Id = Guid.NewGuid(),
            Deleted = new DateTime(2001, 02, 03),
            HomeScore = 1,
            AwayScore = 2,
            OpponentName = "Opponent name",
            StartingScore = 601,
            YourName = "Your name",
            NumberOfLegs = 3,
            TournamentMatchId = Guid.NewGuid(),
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Legs.Keys, Is.EqualTo(new[] { 0 }));
        Assert.That(result.Legs[0], Is.EqualTo(_legDto));
        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Deleted, Is.EqualTo(model.Deleted));
        Assert.That(result.HomeScore, Is.EqualTo(model.HomeScore));
        Assert.That(result.AwayScore, Is.EqualTo(model.AwayScore));
        Assert.That(result.OpponentName, Is.EqualTo(model.OpponentName));
        Assert.That(result.YourName, Is.EqualTo(model.YourName));
        Assert.That(result.StartingScore, Is.EqualTo(model.StartingScore));
        Assert.That(result.NumberOfLegs, Is.EqualTo(model.NumberOfLegs));
        Assert.That(result.TournamentMatchId, Is.EqualTo(model.TournamentMatchId));
    }

    [Test]
    public async Task Adapt_GivenDto_SetsLegsCorrectly()
    {
        var dto = new RecordedScoreAsYouGoDto
        {
            Legs =
            {
                { 0, _legDto }
            },
            Id = Guid.NewGuid(),
            Deleted = new DateTime(2001, 02, 03),
            HomeScore = 1,
            AwayScore = 2,
            OpponentName = "Opponent name",
            StartingScore = 601,
            YourName = "Your name",
            NumberOfLegs = 3,
            TournamentMatchId = Guid.NewGuid(),
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Legs.Keys, Is.EqualTo(new[] { 0 }));
        Assert.That(result.Legs[0], Is.EqualTo(_leg));
        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Deleted, Is.EqualTo(dto.Deleted));
        Assert.That(result.HomeScore, Is.EqualTo(dto.HomeScore));
        Assert.That(result.AwayScore, Is.EqualTo(dto.AwayScore));
        Assert.That(result.OpponentName, Is.EqualTo(dto.OpponentName));
        Assert.That(result.YourName, Is.EqualTo(dto.YourName));
        Assert.That(result.StartingScore, Is.EqualTo(dto.StartingScore));
        Assert.That(result.NumberOfLegs, Is.EqualTo(dto.NumberOfLegs));
        Assert.That(result.TournamentMatchId, Is.EqualTo(dto.TournamentMatchId));
    }
}