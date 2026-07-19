using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Identity;

[TestFixture]
public class UserAccessServiceTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private Mock<IAccessService> _accessService = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _accessService = new Mock<IAccessService>();
    }

    [Test]
    public void User_WhenLoggedOut_ReturnsNull()
    {
        var service = new UserAccessService(_accessService.Object, UserAccessContext.None(), null);

        Assert.That(service.User, Is.Null);
    }

    [Test]
    public void User_WhenLoggedIn_ReturnsUser()
    {
        var user = new UserDto();
        var service = new UserAccessService(_accessService.Object, UserAccessContext.None(), user);

        Assert.That(service.User, Is.SameAs(user));
    }

    [Test]
    public async Task HasAccess_GivenSingleAccess_ReturnsTrueIfUserHasAccess()
    {
        var user = new UserDto();
        var service = new UserAccessService(_accessService.Object, UserAccessContext.None(), user);
        _accessService.Setup(s => s.HasAccess(user, AccessOption.ManageTeams, It.IsAny<UserAccessContext>(), _token)).ReturnsAsync(true);

        var hasAccess = await service.HasAccess(AccessOption.ManageTeams, _token);

        Assert.That(hasAccess, Is.True);
    }

    [Test]
    public async Task HasAccess_GivenSingleAccess_ReturnsFalseIfUserDoesNotHaveAccess()
    {
        var user = new UserDto();
        var service = new UserAccessService(_accessService.Object, UserAccessContext.None(), user);
        _accessService.Setup(s => s.HasAccess(user, AccessOption.ManageTeams, It.IsAny<UserAccessContext>(), _token)).ReturnsAsync(false);

        var hasAccess = await service.HasAccess(AccessOption.ManageTeams, _token);

        Assert.That(hasAccess, Is.False);
    }

    [Test]
    public async Task HasAllAccess_GivenNoAccesses_ReturnsFalse()
    {
        var user = new UserDto();
        var service = new UserAccessService(_accessService.Object, UserAccessContext.None(), user);

        var hasAccess = await service.HasAllAccess([], _token);

        Assert.That(hasAccess, Is.False);
    }

    [Test]
    public async Task HasAllAccess_GivenOneAccess_ReturnsTrueIfUserHasAccess()
    {
        var user = new UserDto();
        var service = new UserAccessService(_accessService.Object, UserAccessContext.None(), user);
        _accessService.Setup(s => s.HasAccess(user, AccessOption.ManageTeams, It.IsAny<UserAccessContext>(), _token)).ReturnsAsync(true);

        var hasAccess = await service.HasAllAccess([AccessOption.ManageTeams], _token);

        Assert.That(hasAccess, Is.True);
    }

    [Test]
    public async Task HasAllAccess_GivenOneAccess_ReturnsFalseIfUserDoesNotHaveAccess()
    {
        var user = new UserDto();
        var service = new UserAccessService(_accessService.Object, UserAccessContext.None(), user);
        _accessService.Setup(s => s.HasAccess(user, AccessOption.ManageTeams, It.IsAny<UserAccessContext>(), _token)).ReturnsAsync(false);

        var hasAccess = await service.HasAllAccess([AccessOption.ManageTeams], _token);

        Assert.That(hasAccess, Is.False);
    }

    [TestCase(false, false)]
    [TestCase(false, true)]
    [TestCase(true, false)]
    public async Task HasAllAccess_GivenTwoAccesses_ReturnsFalseIfUserDoesNotHaveAccessToOne(bool first, bool second)
    {
        var user = new UserDto();
        var service = new UserAccessService(_accessService.Object, UserAccessContext.None(), user);
        _accessService.Setup(s => s.HasAccess(user, AccessOption.ManageTeams, It.IsAny<UserAccessContext>(), _token)).ReturnsAsync(first);
        _accessService.Setup(s => s.HasAccess(user, AccessOption.ManageGames, It.IsAny<UserAccessContext>(), _token)).ReturnsAsync(second);

        var hasAccess = await service.HasAllAccess([AccessOption.ManageTeams, AccessOption.ManageGames], _token);

        Assert.That(hasAccess, Is.False);
    }

    [Test]
    public async Task HasAllAccess_GivenTwoAccesses_ReturnsTrueIfUserHasAccessToBoth()
    {
        var user = new UserDto();
        var service = new UserAccessService(_accessService.Object, UserAccessContext.None(), user);
        _accessService.Setup(s => s.HasAccess(user, AccessOption.ManageTeams, It.IsAny<UserAccessContext>(), _token)).ReturnsAsync(true);
        _accessService.Setup(s => s.HasAccess(user, AccessOption.ManageGames, It.IsAny<UserAccessContext>(), _token)).ReturnsAsync(true);

        var hasAccess = await service.HasAllAccess([AccessOption.ManageTeams, AccessOption.ManageGames], _token);

        Assert.That(hasAccess, Is.True);
    }

    [Test]
    public async Task HasAnyAccess_GivenNoAccesses_ReturnsFalse()
    {
        var user = new UserDto();
        var service = new UserAccessService(_accessService.Object, UserAccessContext.None(), user);

        var hasAccess = await service.HasAnyAccess([], _token);

        Assert.That(hasAccess, Is.False);
    }

    [Test]
    public async Task HasAnyAccess_GivenOneAccess_ReturnsTrueIfUserHasAccess()
    {
        var user = new UserDto();
        var service = new UserAccessService(_accessService.Object, UserAccessContext.None(), user);
        _accessService.Setup(s => s.HasAccess(user, AccessOption.ManageTeams, It.IsAny<UserAccessContext>(), _token)).ReturnsAsync(true);

        var hasAccess = await service.HasAnyAccess([AccessOption.ManageTeams], _token);

        Assert.That(hasAccess, Is.True);
    }

    [Test]
    public async Task HasAnyAccess_GivenOneAccess_ReturnsFalseIfUserDoesNotHaveAccess()
    {
        var user = new UserDto();
        var service = new UserAccessService(_accessService.Object, UserAccessContext.None(), user);
        _accessService.Setup(s => s.HasAccess(user, AccessOption.ManageTeams, It.IsAny<UserAccessContext>(), _token)).ReturnsAsync(false);

        var hasAccess = await service.HasAnyAccess([AccessOption.ManageTeams], _token);

        Assert.That(hasAccess, Is.False);
    }

    [TestCase(true, true)]
    [TestCase(false, true)]
    [TestCase(true, false)]
    public async Task HasAnyAccess_GivenTwoAccesses_ReturnsTueIfUserHasAccessToEither(bool first, bool second)
    {
        var user = new UserDto();
        var service = new UserAccessService(_accessService.Object, UserAccessContext.None(), user);
        _accessService.Setup(s => s.HasAccess(user, AccessOption.ManageTeams, It.IsAny<UserAccessContext>(), _token)).ReturnsAsync(first);
        _accessService.Setup(s => s.HasAccess(user, AccessOption.ManageGames, It.IsAny<UserAccessContext>(), _token)).ReturnsAsync(second);

        var hasAccess = await service.HasAnyAccess([AccessOption.ManageTeams, AccessOption.ManageGames], _token);

        Assert.That(hasAccess, Is.True);
    }
}
