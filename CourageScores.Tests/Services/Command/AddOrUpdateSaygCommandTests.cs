using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services.Command;
using CourageScores.Tests.Models.Adapters;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddOrUpdateSaygCommandTests
{
    private static readonly Leg LegModel = new Leg();
    private static readonly LegDto LegDto = new LegDto();
    private readonly CancellationToken _token = new CancellationToken();
    private AddOrUpdateSaygCommand _command = null!;
    private ISimpleAdapter<Leg,LegDto> _adapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _adapter = new MockSimpleAdapter<Leg, LegDto>(LegModel, LegDto);
        _command = new AddOrUpdateSaygCommand(_adapter);
    }

    [Test]
    public async Task ApplyUpdates_GivenModel_SetsPropertiesCorrectly()
    {
        var model = new RecordedScoreAsYouGo();
        var updateDto = new UpdateRecordedScoreAsYouGoDto
        {
            Legs = { { 1, LegDto } },
            HomeScore = 1,
            AwayScore = 2,
            YourName = "you",
            OpponentName = "opponent",
            StartingScore = 501,
            NumberOfLegs = 3,
        };

        var result = await _command.WithData(updateDto).ApplyUpdate(model, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(model.Legs.Keys, Is.EquivalentTo(new[] { 1 }));
        Assert.That(model.Legs.Values, Is.EquivalentTo(new[] { LegModel }));
        Assert.That(model.HomeScore, Is.EqualTo(1));
        Assert.That(model.AwayScore, Is.EqualTo(2));
        Assert.That(model.YourName, Is.EqualTo("you"));
        Assert.That(model.OpponentName, Is.EqualTo("opponent"));
        Assert.That(model.StartingScore, Is.EqualTo(501));
        Assert.That(model.NumberOfLegs, Is.EqualTo(3));
    }
}