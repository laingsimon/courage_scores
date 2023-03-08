using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;
using Moq;
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
    private static readonly ScoreAsYouGo ScoreAsYouGo = new ScoreAsYouGo();
    private static readonly ScoreAsYouGoDto ScoreAsYouGoDto = new ScoreAsYouGoDto();
    private TournamentMatchAdapter _adapter = null!;
    private Mock<IUserService> _userService = null!;
    private UserDto? _user;

    [SetUp]
    public void SetupEachTest()
    {
        _user = new UserDto
        {
            Access = new AccessDto
            {
                RecordScoresAsYouGo = true,
            }
        };
        _userService = new Mock<IUserService>();
        _adapter = new TournamentMatchAdapter(
            new MockAdapter<TournamentSide, TournamentSideDto>(
                new[] { SideA, SideB },
                new[] { SideADto, SideBDto }),
            new MockSimpleAdapter<ScoreAsYouGo, ScoreAsYouGoDto>(ScoreAsYouGo, ScoreAsYouGoDto),
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
            Sayg = ScoreAsYouGo,
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.ScoreA, Is.EqualTo(model.ScoreA));
        Assert.That(result.ScoreB, Is.EqualTo(model.ScoreB));
        Assert.That(result.SideA, Is.EqualTo(SideADto));
        Assert.That(result.SideB, Is.EqualTo(SideBDto));
        Assert.That(result.Sayg, Is.EqualTo(ScoreAsYouGoDto));
    }

    [Test]
    public async Task Adapt_GivenModelWithoutSayg_SetsSaygToNull()
    {
        var model = new TournamentMatch
        {
            Sayg = null,
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Sayg, Is.Null);
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
            _user!.Access!.RecordScoresAsYouGo = false;
        }
        var dto = new TournamentMatchDto
        {
            Id = Guid.NewGuid(),
            ScoreA = 1,
            ScoreB = 2,
            SideA = SideADto,
            SideB = SideBDto,
            Sayg = ScoreAsYouGoDto,
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.ScoreA, Is.EqualTo(dto.ScoreA));
        Assert.That(result.ScoreB, Is.EqualTo(dto.ScoreB));
        Assert.That(result.SideA, Is.EqualTo(SideA));
        Assert.That(result.SideB, Is.EqualTo(SideB));
        Assert.That(result.Sayg, Is.EqualTo(saygSet ? ScoreAsYouGo : null));
    }

    [Test]
    public async Task Adapt_GivenDtoWithoutSayg_SetsSaygToNull()
    {
        var dto = new TournamentMatchDto
        {
            Sayg = null,
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Sayg, Is.Null);
    }
}