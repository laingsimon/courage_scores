using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;
using CourageScores.Tests.Services;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Game;

[TestFixture]
public class TournamentMatchAdapterTests
{
    private static readonly TournamentSide SideA = new();
    private static readonly TournamentSideDto SideADto = new();
    private static readonly TournamentSide SideB = new();
    private static readonly TournamentSideDto SideBDto = new();
    private readonly CancellationToken _token = new();
    private TournamentMatchAdapter _adapter = null!;
    private Mock<IUserService> _userService = null!;
    private UserDto? _user;

    [SetUp]
    public void SetupEachTest()
    {
        _user = _user.SetAccess(recordScoresAsYouGo: true);
        _userService = new Mock<IUserService>();
        _adapter = new TournamentMatchAdapter(
            new MockSimpleAdapter<TournamentSide, TournamentSideDto>(
                [SideA, SideB, null!],
                [SideADto, SideBDto, null!]),
            _userService.Object);

        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
    }

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
            SaygId = Guid.NewGuid(),
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.ScoreA, Is.EqualTo(model.ScoreA));
        Assert.That(result.ScoreB, Is.EqualTo(model.ScoreB));
        Assert.That(result.SideA, Is.EqualTo(SideADto));
        Assert.That(result.SideB, Is.EqualTo(SideBDto));
        Assert.That(result.SaygId, Is.EqualTo(model.SaygId));
    }

    [Test]
    public async Task Adapt_GivenModelWithoutSayg_SetsSaygToNull()
    {
        var model = new TournamentMatch
        {
            SaygId = null,
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.SaygId, Is.Null);
    }

    [Test]
    public async Task Adapt_GivenModelWithoutSides_SetsSidesToNull()
    {
        var model = new TournamentMatch
        {
            SideA = null,
            SideB = null,
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.SideA, Is.Null);
        Assert.That(result.SideB, Is.Null);
    }

    [TestCase(false, false, false)]
    [TestCase(true, false, false)]
    [TestCase(true, true, true)]
    public async Task Adapt_GivenDto_SetsPropertiesCorrectly(bool loggedIn, bool permittedToRecordScoresAsYouGo, bool saygSet)
    {
        if (!loggedIn)
        {
            _user = null;
        }
        else if (!permittedToRecordScoresAsYouGo)
        {
            _user.SetAccess(recordScoresAsYouGo: false);
        }
        var dto = new TournamentMatchDto
        {
            Id = Guid.NewGuid(),
            ScoreA = 1,
            ScoreB = 2,
            SideA = SideADto,
            SideB = SideBDto,
            SaygId = Guid.NewGuid(),
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.ScoreA, Is.EqualTo(dto.ScoreA));
        Assert.That(result.ScoreB, Is.EqualTo(dto.ScoreB));
        Assert.That(result.SideA, Is.EqualTo(SideA));
        Assert.That(result.SideB, Is.EqualTo(SideB));
        Assert.That(result.SaygId, Is.EqualTo(saygSet ? dto.SaygId : null));
    }

    [Test]
    public async Task Adapt_GivenDtoWithoutSayg_SetsSaygToNull()
    {
        var dto = new TournamentMatchDto
        {
            SaygId = null,
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.SaygId, Is.Null);
    }

    [Test]
    public async Task Adapt_GivenDtoWithoutSides_SetsSidesToNull()
    {
        var dto = new TournamentMatchDto
        {
            SideA = null,
            SideB = null,
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.SideA, Is.Null);
        Assert.That(result.SideB, Is.Null);
    }
}
