using System.Security.Claims;
using System.Security.Principal;
using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Identity;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Repository;
using CourageScores.Repository.Identity;
using CourageScores.Services;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Moq;
using NUnit.Framework;
using CosmosTeam = CourageScores.Models.Cosmos.Team.Team;

namespace CourageScores.Tests.Services.Identity;

[TestFixture]
public class UserServiceTests
{
    private readonly CancellationToken _token = new();
    private Mock<IHttpContextAccessor> _httpContextAccessor = null!;
    private Mock<IUserRepository> _userRepository = null!;
    private ISimpleAdapter<User, UserDto> _userAdapter = null!;
    private ISimpleAdapter<Access, AccessDto> _accessAdapter = null!;
    private Mock<IGenericRepository<CosmosTeam>> _teamRepository = null!;
    private UserService _service = null!;
    private DefaultHttpContext? _httpContext;
    private Mock<IServiceProvider> _httpContextServices = null!;
    private Mock<IAuthenticationService> _authenticationService = null!;
    private List<CosmosTeam> _allTeams = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _allTeams = new List<CosmosTeam>();
        _httpContextAccessor = new Mock<IHttpContextAccessor>();
        _userRepository = new Mock<IUserRepository>();
        _accessAdapter = new AccessAdapter();
        _userAdapter = new UserAdapter(_accessAdapter);
        _teamRepository = new Mock<IGenericRepository<CosmosTeam>>();
        _httpContextServices = new Mock<IServiceProvider>();
        _authenticationService = new Mock<IAuthenticationService>();
        _httpContext = new DefaultHttpContext
        {
            RequestServices = _httpContextServices.Object,
        };

        _service = new UserService(
            _httpContextAccessor.Object,
            _userRepository.Object,
            _userAdapter,
            _accessAdapter,
            _teamRepository.Object);

        _httpContextAccessor
            .Setup(a => a.HttpContext)
            .Returns(() => _httpContext);
        _httpContextServices
            .Setup(p => p.GetService(typeof(IAuthenticationService)))
            .Returns(_authenticationService.Object);
        _teamRepository
            .Setup(r => r.GetAll(_token))
            .Returns(() => TestUtilities.AsyncEnumerable(_allTeams.ToArray()));
    }

    [Test]
    public async Task GetUser_WhenCalledFirstTimeAndNoHttpContext_ReturnsNull()
    {
        _httpContext = null;

        var user = await _service.GetUser(_token);

        Assert.That(user, Is.Null);
    }

    [Test]
    public async Task GetUser_WhenCalledFirstTimeAndAuthenticateFails_ReturnsNull()
    {
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext!, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.Fail("some failure"));

        var user = await _service.GetUser(_token);

        Assert.That(user, Is.Null);
    }

    [Test]
    public async Task GetUser_WhenCalledFirstTimeAndNoIdentities_ReturnsNull()
    {
        CreateTicket(new ClaimsPrincipal());

        var user = await _service.GetUser(_token);

        Assert.That(user, Is.Null);
    }

    [Test]
    public async Task GetUser_WhenCalledFirstTime_ReturnsUser()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");

        var user = await _service.GetUser(_token);

        Assert.That(user, Is.Not.Null);
        Assert.That(user!.EmailAddress, Is.EqualTo("simon@email.com"));
        Assert.That(user.Name, Is.EqualTo("Simon Laing"));
        Assert.That(user.GivenName, Is.EqualTo("Simon"));
    }

    [Test]
    public async Task GetUser_WhenCalledFirstTimeAndUserExistsInDbWithNoTeamIdAndTeamUserFoundForEmailAddress_UpdatesUser()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        var existingUser = GetUser();
        var teamPlayer = new TeamPlayer
        {
            Id = Guid.NewGuid(),
            EmailAddress = "simon@email.com",
        };
        var team = new CosmosTeam
        {
            Id = Guid.NewGuid(),
            Seasons =
            {
                new TeamSeason
                {
                    Players = { teamPlayer },
                },
            },
        };
        _userRepository
            .Setup(r => r.GetUser("simon@email.com"))
            .ReturnsAsync(existingUser);
        _allTeams.Add(team);

        await _service.GetUser(_token);

        _userRepository
            .Verify(r => r.GetUser("simon@email.com"));
        _userRepository
            .Verify(r => r.UpsertUser(It.Is<User>(u =>
                u != existingUser
                && u.Name == "Simon Laing"
                && u.GivenName == "Simon"
                && u.EmailAddress == "simon@email.com"
                && u.TeamId == team.Id)));
    }

    [Test]
    public async Task GetUser_WhenCalledFirstTimeAndUserDeletedInDbWithNoTeamIdAndTeamUserFoundForEmailAddress_UpdatesUser()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        var existingUser = GetUser();
        var teamPlayer = new TeamPlayer
        {
            Id = Guid.NewGuid(),
            EmailAddress = "simon@email.com",
            Deleted = new DateTime(2001, 02, 03),
        };
        var team = new CosmosTeam
        {
            Id = Guid.NewGuid(),
            Seasons =
            {
                new TeamSeason
                {
                    Players = { teamPlayer },
                },
            },
        };
        _userRepository
            .Setup(r => r.GetUser("simon@email.com"))
            .ReturnsAsync(existingUser);
        _allTeams.Add(team);

        await _service.GetUser(_token);

        _userRepository
            .Verify(r => r.GetUser("simon@email.com"));
        _userRepository
            .Verify(r => r.UpsertUser(It.Is<User>(u =>
                u != existingUser
                && u.Name == "Simon Laing"
                && u.GivenName == "Simon"
                && u.EmailAddress == "simon@email.com"
                && u.TeamId == null)));
    }

    [Test]
    public async Task GetUser_WhenCalledFirstTimeAndUserExistsInDbWithNoTeamIdAndTeamUserNotFoundForEmailAddress_UpdatesUser()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        var existingUser = GetUser();
        var team = new CosmosTeam
        {
            Id = Guid.NewGuid(),
        };
        _allTeams.Add(team);
        _userRepository
            .Setup(r => r.GetUser("simon@email.com"))
            .ReturnsAsync(existingUser);

        await _service.GetUser(_token);

        _userRepository
            .Verify(r => r.GetUser("simon@email.com"));
        _userRepository
            .Verify(r => r.UpsertUser(It.Is<User>(u =>
                u != existingUser
                && u.Name == "Simon Laing"
                && u.GivenName == "Simon"
                && u.EmailAddress == "simon@email.com"
                && u.TeamId == null)));
    }

    [Test]
    public async Task GetUser_WhenCalledFirstTimeAndUserExistsInDbWithTeamId_UpdatesUser()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        var existingUser = GetUser(teamId: Guid.NewGuid());
        _userRepository
            .Setup(r => r.GetUser("simon@email.com"))
            .ReturnsAsync(existingUser);

        await _service.GetUser(_token);

        _userRepository
            .Verify(r => r.GetUser("simon@email.com"));
        _userRepository
            .Verify(r => r.UpsertUser(It.Is<User>(u =>
                u != existingUser
                && u.Name == "Simon Laing"
                && u.GivenName == "Simon"
                && u.EmailAddress == "simon@email.com"
                && u.TeamId == existingUser.TeamId)));
    }

    [Test]
    public async Task GetUser_WhenCalledFirstTimeAndUserNotFoundInDb_UpdatesUser()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        _userRepository
            .Setup(r => r.GetUser("simon@email.com"))
            .ReturnsAsync(() => null);

        await _service.GetUser(_token);

        _userRepository
            .Verify(r => r.GetUser("simon@email.com"));
        _userRepository
            .Verify(r => r.UpsertUser(It.Is<User>(u =>
                u.Name == "Simon Laing"
                && u.GivenName == "Simon"
                && u.EmailAddress == "simon@email.com")));
    }

    [Test]
    public async Task GetUser_WhenCalledSecondTimeAndNullReturnedFirstTime_ReturnsNull()
    {
        _httpContext = null;
        var firstUser = await _service.GetUser(_token);

        var secondUser = await _service.GetUser(_token);

        Assert.That(firstUser, Is.Null);
        Assert.That(secondUser, Is.Null);
    }

    [Test]
    public async Task GetUser_WhenCalledSecondTime_DoesNotAuthenticateOrUpsert()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        _userRepository
            .Setup(r => r.GetUser("simon@email.com"))
            .ReturnsAsync(() => null);
        var firstUser = await _service.GetUser(_token);

        var secondUser = await _service.GetUser(_token);

        _userRepository.Verify(r => r.GetUser("simon@email.com"), Times.Once);
        _userRepository.Verify(r => r.UpsertUser(It.IsAny<User>()), Times.Once);
        _authenticationService.Verify(s => s.AuthenticateAsync(_httpContext!, It.IsAny<string>()), Times.Once);
        Assert.That(firstUser, Is.Not.Null);
        Assert.That(secondUser, Is.Not.Null);
        Assert.That(secondUser!.Name, Is.EqualTo("Simon Laing"));
        Assert.That(secondUser.EmailAddress, Is.EqualTo("simon@email.com"));
        Assert.That(secondUser.GivenName, Is.EqualTo("Simon"));
    }

    [Test]
    public async Task GetUser_GivenEmailAddressWhenNotLoggedIn_ReturnsNull()
    {
        _httpContext = null;

        var user = await _service.GetUser("other@email.com", _token);

        Assert.That(user, Is.Null);
    }

    [Test]
    public async Task GetUser_GivenEmailAddressWhenNotPermitted_ReturnsNull()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        var loggedInUser = GetUser();
        _userRepository.Setup(r => r.GetUser("simon@email.com")).ReturnsAsync(loggedInUser);

        var user = await _service.GetUser("other@email.com", _token);

        Assert.That(user, Is.Null);
    }

    [Test]
    public async Task GetUser_GivenEmailAddressWhenPermitted_ReturnsOtherUserDetails()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        var loggedInUser = GetUser(manageAccess: true);
        var otherUser = GetUser(name: "Other User", emailAddress: "other@email.com");
        _userRepository.Setup(r => r.GetUser("simon@email.com")).ReturnsAsync(loggedInUser);
        _userRepository.Setup(r => r.GetUser("other@email.com")).ReturnsAsync(otherUser);

        var user = await _service.GetUser("other@email.com", _token);

        Assert.That(user, Is.Not.Null);
        Assert.That(user!.EmailAddress, Is.EqualTo("other@email.com"));
        Assert.That(user.Name, Is.EqualTo("Other User"));
    }

    [Test]
    public async Task GetUser_GivenEmailAddressWhenPermittedAndUserNotFound_ReturnsNull()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        var loggedInUser = GetUser(manageAccess: true);
        _userRepository.Setup(r => r.GetUser("simon@email.com")).ReturnsAsync(loggedInUser);
        _userRepository.Setup(r => r.GetUser("other@email.com")).ReturnsAsync(() => null);

        var user = await _service.GetUser("other@email.com", _token);

        Assert.That(user, Is.Null);
    }

    [Test]
    public async Task GetAll_WhenNotLoggedIn_ReturnsEmpty()
    {
        _httpContext = null;

        var users = await _service.GetAll(_token).ToList();

        Assert.That(users, Is.Empty);
    }

    [Test]
    public async Task GetAll_WhenNotPermitted_ReturnsEmpty()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        var loggedInUser = GetUser();
        _userRepository.Setup(r => r.GetUser("simon@email.com")).ReturnsAsync(loggedInUser);

        var users = await _service.GetAll(_token).ToList();

        Assert.That(users, Is.Empty);
    }

    [Test]
    public async Task GetAll_WhenPermitted_ReturnsAllUsers()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        var loggedInUser = GetUser(name: "Logged in user", manageAccess: true);
        var otherUser = GetUser(name: "Other user");
        _userRepository.Setup(r => r.GetUser("simon@email.com")).ReturnsAsync(loggedInUser);
        _userRepository.Setup(r => r.GetAll()).Returns(TestUtilities.AsyncEnumerable(otherUser, loggedInUser));

        var users = await _service.GetAll(_token).ToList();

        Assert.That(users.Select(u => u.Name), Is.EquivalentTo(new[] { "Logged in user", "Other user" }));
    }

    [Test]
    public async Task UpdateAccess_WhenNotLoggedIn_ReturnsUnsuccessful()
    {
        _httpContext = null;
        var update = new UpdateAccessDto();

        var result = await _service.UpdateAccess(update, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not logged in" }));
    }

    [Test]
    public async Task UpdateAccess_WhenNotPermitted_ReturnsUnsuccessful()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        var loggedInUser = GetUser();
        var update = new UpdateAccessDto();
        _userRepository.Setup(r => r.GetUser("simon@email.com")).ReturnsAsync(loggedInUser);

        var result = await _service.UpdateAccess(update, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not permitted" }));
    }

    [Test]
    public async Task UpdateAccess_WhenUserNotFound_ReturnsNotFound()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        var loggedInUser = GetUser(manageAccess: true);
        var update = GetUpdateAccessDto(emailAddress: "other@email.com");
        _userRepository.Setup(r => r.GetUser("simon@email.com")).ReturnsAsync(loggedInUser);
        _userRepository.Setup(r => r.GetUser("other@email.com")).ReturnsAsync(() => null);

        var result = await _service.UpdateAccess(update, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not found" }));
    }

    [Test]
    public async Task UpdateAccess_WhenRemovingManageAccessFromSelf_ReturnsNotAllowedToRemoveOwnManageAccess()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        var loggedInUser = GetUser(manageAccess: true);
        var update = GetUpdateAccessDto(emailAddress: "simon@email.com");
        _userRepository.Setup(r => r.GetUser("simon@email.com")).ReturnsAsync(loggedInUser);

        var result = await _service.UpdateAccess(update, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Cannot remove your own user access" }));
    }

    [Test]
    public async Task UpdateAccess_WhenUserFoundWithNoExistingAccess_UpdatesAccess()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        var loggedInUser = GetUser(manageAccess: true);
        var otherUser = GetUser("Other User");
        var update = GetUpdateAccessDto(emailAddress: "other@email.com", manageGames: true);
        _userRepository.Setup(r => r.GetUser("simon@email.com")).ReturnsAsync(loggedInUser);
        _userRepository.Setup(r => r.GetUser("other@email.com")).ReturnsAsync(otherUser);

        var result = await _service.UpdateAccess(update, _token);

        _userRepository.Verify(r => r.UpsertUser(It.Is<User>(u => u.Name == "Other User" && u.Access!.ManageGames == true)));
        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EquivalentTo(new[] { "Access updated" }));
    }

    [Test]
    public async Task UpdateAccess_WhenUserFoundWithExistingAccess_UpdatesAccess()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        var loggedInUser = GetUser(manageAccess: true);
        var otherUser = GetUser(name: "Other User", manageGames: true);
        var update = GetUpdateAccessDto(emailAddress: "other@email.com");
        _userRepository.Setup(r => r.GetUser("simon@email.com")).ReturnsAsync(loggedInUser);
        _userRepository.Setup(r => r.GetUser("other@email.com")).ReturnsAsync(otherUser);

        var result = await _service.UpdateAccess(update, _token);

        _userRepository.Verify(r => r.UpsertUser(It.Is<User>(u => u.Name == "Other User" && u.Access!.ManageGames == false)));
        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EquivalentTo(new[] { "Access updated" }));
    }

    private void CreateTicket(string fullName, string email, string givenName)
    {
        var identity = new GenericIdentity(fullName, "type");
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", email));
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname", givenName));

        CreateTicket(new ClaimsPrincipal(identity));
    }

    private void CreateTicket(ClaimsPrincipal principal)
    {
        var ticket = new AuthenticationTicket(principal, CookieAuthenticationDefaults.AuthenticationScheme);
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext!, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.Success(ticket));
    }

    private static User GetUser(string name = "", string emailAddress = "", Guid? teamId = null, bool manageAccess = false, bool manageGames = false)
    {
        return new User
        {
            Name = name,
            EmailAddress = emailAddress,
            TeamId = teamId,
            Access = new Access
            {
                ManageAccess = manageAccess,
                ManageGames = manageGames,
            },
        };
    }

    private static UpdateAccessDto GetUpdateAccessDto(string emailAddress = "", bool manageGames = false)
    {
        return new UpdateAccessDto
        {
            EmailAddress = emailAddress,
            Access = new AccessDto
            {
                ManageGames = manageGames,
            },
        };
    }
}