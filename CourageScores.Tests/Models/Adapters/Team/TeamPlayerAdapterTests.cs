using CourageScores.Models.Adapters.Team;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Identity;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Team;

[TestFixture]
public class TeamPlayerAdapterTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private Mock<IUserService> _userService = null!;
    private TeamPlayerAdapter _adapter = null!;
    private UserDto? _user;

    [SetUp]
    public void SetupEachTest()
    {
        _userService = new Mock<IUserService>();
        _adapter = new TeamPlayerAdapter(_userService.Object);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
    }

    [Test]
    public async Task Adapt_GivenModel_MapsPropertiesSuccessfully()
    {
        var model = new TeamPlayer
        {
            EmailAddress = "email@somewhere.com",
        };
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ManageTeams = true,
            }
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Name, Is.EqualTo(model.Name));
        Assert.That(result.Captain, Is.EqualTo(model.Captain));
        Assert.That(result.EmailAddress, Is.EqualTo(model.EmailAddress));
    }

    [Test]
    public async Task Adapt_GivenModelAndLoggedOut_MapsPropertiesSuccessfully()
    {
        var model = new TeamPlayer
        {
            EmailAddress = "email@somewhere.com",
        };
        _user = null;

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.EmailAddress, Is.Null);
    }

    [Test]
    public async Task Adapt_GivenModelAndCannotMapEmailAddress_DoesNotMapEmailAddress()
    {
        var model = new TeamPlayer
        {
            EmailAddress = "email@somewhere.com",
        };
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ManageTeams = false,
            }
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.EmailAddress, Is.Null);
    }

    [TestCase(false, false, "email@somewhere.com")]
    [TestCase(false, true, null)]
    [TestCase(true, false, null)]
    public async Task Adapt_GivenModelAndCanMapEmailAddress_MapsEmailAddress(bool manageAccess, bool manageTeams, string? emailAddress)
    {
        var model = new TeamPlayer
        {
            Id = Guid.NewGuid(),
            Name = "name",
            Captain = true,
            EmailAddress = "email@somewhere.com",
        };
        _user = new UserDto
        {
            Access = new AccessDto
            {
                ManageTeams = manageTeams,
                ManageAccess = manageAccess,
            },
            EmailAddress = emailAddress ?? "other@somewhere.com",
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.EmailAddress, Is.EqualTo("email@somewhere.com"));
    }

    [Test]
    public async Task Adapt_GivenDto_MapsPropertiesSuccessfully()
    {
        var dto = new TeamPlayerDto
        {
            Id = Guid.NewGuid(),
            Name = "name",
            Captain = true,
            EmailAddress = "email@somewhere.com",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Name, Is.EqualTo(dto.Name));
        Assert.That(result.Captain, Is.EqualTo(dto.Captain));
        Assert.That(result.EmailAddress, Is.EqualTo(dto.EmailAddress));
    }

    [Test]
    public async Task Adapt_GivenDto_TrimsTrailingWhiteSpace()
    {
        var dto = new TeamPlayerDto
        {
            Name = "name   ",
            EmailAddress = "email@somewhere.com   ",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Name, Is.EqualTo("name"));
        Assert.That(result.EmailAddress, Is.EqualTo("email@somewhere.com"));
    }
}