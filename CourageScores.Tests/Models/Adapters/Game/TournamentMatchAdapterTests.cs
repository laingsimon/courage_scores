using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game;

[TestFixture]
public class TournamentMatchAdapterTests
{
    private static readonly TournamentSide SideA = new TournamentSide();
    private static readonly TournamentSideDto SideADto = new TournamentSideDto();
    private static readonly TournamentSide SideB = new TournamentSide();
    private static readonly TournamentSideDto SideBDto = new TournamentSideDto();
    private readonly CancellationToken _token = new CancellationToken();
    private readonly TournamentMatchAdapter _adapter = new TournamentMatchAdapter(
        new MockAdapter<TournamentSide, TournamentSideDto>(
            new[] { SideA, SideB },
            new[] { SideADto, SideBDto }));

    [Test]
    public async Task Adapt_GivenModel_SetsPropertiesCorrectly()
    {
        var model = new TournamentMatch
        {
            Id = Guid.NewGuid(),
            ScoreA = 1,
            ScoreB = 2,
            SideA = SideA,
            SideB = SideB,
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.ScoreA, Is.EqualTo(model.ScoreA));
        Assert.That(result.ScoreB, Is.EqualTo(model.ScoreB));
        Assert.That(result.SideA, Is.EqualTo(SideADto));
        Assert.That(result.SideB, Is.EqualTo(SideBDto));
    }

    [Test]
    public async Task Adapt_GivenDto_SetsPropertiesCorrectly()
    {
        var dto = new TournamentMatchDto
        {
            Id = Guid.NewGuid(),
            ScoreA = 1,
            ScoreB = 2,
            SideA = SideADto,
            SideB = SideBDto,
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.ScoreA, Is.EqualTo(dto.ScoreA));
        Assert.That(result.ScoreB, Is.EqualTo(dto.ScoreB));
        Assert.That(result.SideA, Is.EqualTo(SideA));
        Assert.That(result.SideB, Is.EqualTo(SideB));
    }
}