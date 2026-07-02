using AutoFixture;
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
    private readonly CancellationToken _token = CancellationToken.None;
    private Mock<IAccessService> _accessService = null!;
    private TeamPlayerAdapter _adapter = null!;
    private UserDto? _user;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();
        _user = null;
        var userService = fixture.FreezeMock<IUserService>();
        _accessService = fixture.FreezeMock<IAccessService>();
        _adapter = fixture.Create<TeamPlayerAdapter>();
        userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
    }

    [Test]
    public async Task Adapt_GivenModel_MapsPropertiesSuccessfully()
    {
        var model = new TeamPlayer
        {
            EmailAddress = "email@somewhere.com",
            Name = "name   ",
            Gender = Gender.Female,
        };
        _user = new UserDto();
        _accessService.Setup(s => s.HasAccess(_user, AccessOption.ManageTeams, _token)).ReturnsAsync(true);

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Name, Is.EqualTo("name"));
        Assert.That(result.Captain, Is.EqualTo(model.Captain));
        Assert.That(result.EmailAddress, Is.EqualTo(model.EmailAddress));
        Assert.That(result.Gender, Is.EqualTo(GenderDto.Female));
    }

    [Test]
    public async Task Adapt_GivenModelAndLoggedOut_MapsPropertiesSuccessfully()
    {
        var model = new TeamPlayer
        {
            EmailAddress = "email@somewhere.com",
            Name = "name",
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
            Name = "name",
        };
        _accessService.Setup(s => s.HasAccess(_user, AccessOption.ManageTeams, _token)).ReturnsAsync(false);

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.EmailAddress, Is.Null);
    }

    [Test]
    public async Task Adapt_GivenModelWithoutGender_DoesNotMapGender()
    {
        var model = new TeamPlayer
        {
            EmailAddress = "email@somewhere.com",
            Name = "name",
        };
        _accessService.Setup(s => s.HasAccess(_user, AccessOption.ManageTeams, _token)).ReturnsAsync(false);

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Gender, Is.Null);
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
        _user = new UserDto();
        _accessService.Setup(s => s.HasAccess(_user, AccessOption.ManageTeams, _token)).ReturnsAsync(manageTeams);
        _accessService.Setup(s => s.HasAccess(_user, AccessOption.ManageAccess, _token)).ReturnsAsync(manageAccess);
        _user.EmailAddress = emailAddress ?? "other@somewhere.com";

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
            Gender = GenderDto.Female
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Name, Is.EqualTo(dto.Name));
        Assert.That(result.Captain, Is.EqualTo(dto.Captain));
        Assert.That(result.EmailAddress, Is.EqualTo(dto.EmailAddress));
        Assert.That(result.Gender, Is.EqualTo(Gender.Female));
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

    [Test]
    public async Task Adapt_GivenDtoWithoutGender_DoesNotMapGender()
    {
        var dto = new TeamPlayerDto
        {
            Name = "name",
            EmailAddress = "email@somewhere.com",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Gender, Is.Null);
    }
}
