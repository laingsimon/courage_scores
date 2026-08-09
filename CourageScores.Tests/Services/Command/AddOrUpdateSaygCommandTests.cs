using AutoFixture;
using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using CourageScores.Tests.Models.Adapters;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddOrUpdateSaygCommandTests
{
    private static readonly Leg LegModel = new();
    private static readonly LegDto LegDto = new();
    private readonly CancellationToken _token = CancellationToken.None;
    private AddOrUpdateSaygCommand _command = null!;
    private UserDto? _user;
    private HashSet<AccessOption> _access = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();
        _user = null;
        var userService = fixture.FreezeMock<IUserService>();
        _access = [];
        var accessService = fixture.FreezeMock<IAccessService>();
        fixture.Register<ISimpleAdapter<Leg, LegDto>>(() => new MockSimpleAdapter<Leg, LegDto>(LegModel, LegDto));
        _command = fixture.Create<AddOrUpdateSaygCommand>();

        userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        accessService
            .Setup(s => s.HasAccess(It.IsAny<UserDto?>(), It.IsAny<AccessOption>(), It.IsAny<UserAccessContext>(), _token))
            .ReturnsAsync((UserDto? _, AccessOption access, UserAccessContext _, CancellationToken _) => _user != null && _access.Contains(access));
    }

    [Test]
    public async Task ApplyUpdates_GivenNoTournamentMatchId_SetsPropertiesCorrectly()
    {
        var model = new RecordedScoreAsYouGo();
        var updateDto = new UpdateRecordedScoreAsYouGoDto
        {
            Legs =
            {
                {
                    1, LegDto
                },
            },
            HomeScore = 1,
            AwayScore = 2,
            YourName = "you",
            OpponentName = "opponent",
            StartingScore = 501,
            NumberOfLegs = 3,
        };

        var result = await _command.WithData(updateDto).ApplyUpdate(model, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(model.Legs.Keys, Is.EquivalentTo([1]));
        Assert.That(model.Legs.Values, Is.EquivalentTo([LegModel]));
        Assert.That(model.HomeScore, Is.EqualTo(1));
        Assert.That(model.AwayScore, Is.EqualTo(2));
        Assert.That(model.YourName, Is.EqualTo("you"));
        Assert.That(model.OpponentName, Is.EqualTo("opponent"));
        Assert.That(model.StartingScore, Is.EqualTo(501));
        Assert.That(model.NumberOfLegs, Is.EqualTo(3));
        Assert.That(model.TournamentMatchId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdates_GivenTournamentMatchId_SetsPropertiesCorrectly()
    {
        _user = new UserDto();
        _access = _access.With(AccessOption.RecordScoresAsYouGo);
        var model = new RecordedScoreAsYouGo();
        var updateDto = new UpdateRecordedScoreAsYouGoDto
        {
            Legs =
            {
                {
                    1, LegDto
                },
            },
            HomeScore = 1,
            AwayScore = 2,
            YourName = "you",
            OpponentName = "opponent",
            StartingScore = 501,
            NumberOfLegs = 3,
            TournamentMatchId = Guid.NewGuid(),
        };

        var result = await _command.WithData(updateDto).ApplyUpdate(model, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(model.Legs.Keys, Is.EquivalentTo([1]));
        Assert.That(model.Legs.Values, Is.EquivalentTo([LegModel]));
        Assert.That(model.HomeScore, Is.EqualTo(1));
        Assert.That(model.AwayScore, Is.EqualTo(2));
        Assert.That(model.YourName, Is.EqualTo("you"));
        Assert.That(model.OpponentName, Is.EqualTo("opponent"));
        Assert.That(model.StartingScore, Is.EqualTo(501));
        Assert.That(model.NumberOfLegs, Is.EqualTo(3));
        Assert.That(model.TournamentMatchId, Is.EqualTo(updateDto.TournamentMatchId));
    }

    [TestCase(true, true, true)]
    [TestCase(true, false, false)]
    [TestCase(false, false, false)]
    public async Task ApplyUpdates_AdditionOfTournamentMatchId_RequiresLogin(bool loggedIn, bool permitted, bool expectedSuccess)
    {
        if (loggedIn)
        {
            _access = permitted ? _access.With(AccessOption.RecordScoresAsYouGo) : _access.Without(AccessOption.RecordScoresAsYouGo);
            _user = new UserDto();
        }
        var model = new RecordedScoreAsYouGo();
        var updateDto = new UpdateRecordedScoreAsYouGoDto
        {
            TournamentMatchId = Guid.NewGuid(),
        };

        var result = await _command.WithData(updateDto).ApplyUpdate(model, _token);

        Assert.That(result.Success, Is.EqualTo(expectedSuccess));
        if (expectedSuccess)
        {
            Assert.That(model.TournamentMatchId, Is.EqualTo(updateDto.TournamentMatchId));
        }
        else
        {
            Assert.That(result.Errors, Is.EqualTo([$"Not permitted to modify tournament sayg sessions"]));
        }
    }

    [Test]
    public async Task ApplyUpdates_GivenRemovalOfTournamentMatchId_ReturnsUnsuccessful()
    {
        _user = new UserDto();
        _access = _access.With(AccessOption.RecordScoresAsYouGo);
        var model = new RecordedScoreAsYouGo
        {
            TournamentMatchId = Guid.NewGuid(),
        };
        var updateDto = new UpdateRecordedScoreAsYouGoDto
        {
            TournamentMatchId = null,
        };

        var result = await _command.WithData(updateDto).ApplyUpdate(model, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(["Sayg session ids cannot be removed"]));
    }

    [Test]
    public async Task ApplyUpdates_GivenChangeOfTournamentMatchId_ReturnsUnsuccessful()
    {
        _user = new UserDto();
        _access = _access.With(AccessOption.RecordScoresAsYouGo);
        var model = new RecordedScoreAsYouGo
        {
            TournamentMatchId = Guid.NewGuid(),
        };
        var updateDto = new UpdateRecordedScoreAsYouGoDto
        {
            TournamentMatchId = Guid.NewGuid(),
        };

        var result = await _command.WithData(updateDto).ApplyUpdate(model, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(["Sayg session ids cannot be changed"]));
    }
}
