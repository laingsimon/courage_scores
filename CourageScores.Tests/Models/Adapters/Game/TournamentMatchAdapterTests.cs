using AutoFixture;
using CourageScores.Models.Adapters;
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
    private readonly CancellationToken _token = CancellationToken.None;
    private IAdapter<TournamentMatch, TournamentMatchDto> _adapter = null!;
    private UserDto? _user;
    private HashSet<AccessOption> _access = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();
        _user = new UserDto();
        var userService = fixture.FreezeMock<IUserService>();
        _access = [AccessOption.RecordScoresAsYouGo];
        var accessService = fixture.FreezeMock<IAccessService>();
        fixture.Register<ISimpleAdapter<TournamentSide, TournamentSideDto>>(() => new MockSimpleAdapter<TournamentSide, TournamentSideDto>(
            [SideA, SideB, null!],
            [SideADto, SideBDto, null!]));
        _adapter = fixture.Create<TournamentMatchAdapter>();

        userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        accessService
            .Setup(s => s.HasAccess(It.IsAny<UserDto?>(), It.IsAny<AccessOption>(), It.IsAny<UserAccessContext>(), _token))
            .ReturnsAsync((UserDto? _, AccessOption access, UserAccessContext _, CancellationToken _) => _user != null && _access.Contains(access));
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

        var result = await _adapter.Adapt(model, UserAccessContext.None(), _token);

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

        var result = await _adapter.Adapt(model, UserAccessContext.None(), _token);

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

        var result = await _adapter.Adapt(model, UserAccessContext.None(), _token);

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
            _access = _access.Without(AccessOption.RecordScoresAsYouGo);
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

        var result = await _adapter.Adapt(dto, UserAccessContext.None(), _token);

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

        var result = await _adapter.Adapt(dto, UserAccessContext.None(), _token);

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

        var result = await _adapter.Adapt(dto, UserAccessContext.None(), _token);

        Assert.That(result.SideA, Is.Null);
        Assert.That(result.SideB, Is.Null);
    }
}
