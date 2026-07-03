using System.Net;
using System.Security.Claims;
using System.Security.Principal;
using AutoFixture;
using CourageScores.Common;
using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Identity;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Repository;
using CourageScores.Repository.Identity;
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
    private readonly CancellationToken _token = CancellationToken.None;
    private readonly ConfiguredFeature _serviceAccountSessionFeature = new() { ConfiguredValue = "true" };
    private Mock<IHttpContextAccessor> _httpContextAccessor = null!;
    private Mock<IUserRepository> _userRepository = null!;
    private UserService _service = null!;
    private DefaultHttpContext? _httpContext;
    private Mock<IServiceProvider> _httpContextServices = null!;
    private Mock<IAuthenticationService> _authenticationService = null!;
    private List<CosmosTeam> _allTeams = null!;
    private Mock<IGenericRepository<ServiceAccountSession>> _serviceAccountSessionRepository = null!;
    private MockRequestCookies _requestCookies = null!;
    private Mock<IAccessService> _accessService = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();
        _allTeams = [];
        _httpContextAccessor = fixture.FreezeMock<IHttpContextAccessor>();
        _userRepository = fixture.FreezeMock<IUserRepository>();
        fixture.Register<IAccessLevelAdapter>(fixture.Create<AccessLevelAdapter>);
        fixture.Register<ISimpleAdapter<User, UserDto>>(fixture.Create<UserAdapter>);
        var teamRepository = fixture.FreezeMock<IGenericRepository<CosmosTeam>>();
        _httpContextServices = fixture.FreezeMock<IServiceProvider>();
        _authenticationService = fixture.FreezeMock<IAuthenticationService>();
        _serviceAccountSessionRepository = fixture.FreezeMock<IGenericRepository<ServiceAccountSession>>();
        var featureRepository = fixture.FreezeMock<IGenericRepository<ConfiguredFeature>>();
        _requestCookies = new MockRequestCookies();
        _httpContext = null;
        _accessService = fixture.FreezeMock<IAccessService>();

        _service = fixture.Create<UserService>();

        _httpContextServices.Setup(p => p.GetService(typeof(IAuthenticationService))).Returns(_authenticationService.Object);
        teamRepository.Setup(r => r.GetAll(_token)).Returns(() => TestUtilities.AsyncEnumerable(_allTeams.ToArray()));
        featureRepository.Setup(r => r.Get(FeatureLookup.ServiceAccountSessions.Id, _token)).ReturnsAsync(_serviceAccountSessionFeature);
    }

    [Test]
    public async Task GetUser_WhenCalledFirstTimeAndNoHttpContext_ReturnsNull()
    {
        Assert.That(await _service.GetUser(_token), Is.Null);
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
    public async Task GetUser_WhenCalledFirstTime_ReturnsUser()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");

        var user = await _service.GetUser(_token);

        Assert.That(user!.EmailAddress, Is.EqualTo("simon@email.com"));
        Assert.That(user.Name, Is.EqualTo("Simon Laing"));
        Assert.That(user.GivenName, Is.EqualTo("Simon"));
    }

    [Test]
    public async Task GetUser_WhenCalledFirstTimeAndUserExistsInDbWithNoTeamIdAndTeamUserFoundForEmailAddress_UpdatesUser()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        var teamPlayer = new TeamPlayer { Id = Guid.NewGuid(), EmailAddress = "simon@email.com" };
        var team = new CosmosTeam { Id = Guid.NewGuid(), Seasons = { new TeamSeason { Players = { teamPlayer } } } };
        _userRepository.Setup(r => r.GetUser("simon@email.com", _token)).ReturnsAsync(GetUser());
        _allTeams.Add(team);

        await _service.GetUser(_token);

        _userRepository.Verify(r => r.GetUser("simon@email.com", _token));
        _userRepository.Verify(r => r.UpsertUser(It.Is<User>(u => u.Name == "Simon Laing" && u.GivenName == "Simon" && u.EmailAddress == "simon@email.com" && u.TeamId == team.Id), _token));
    }

    [Test]
    public async Task GetUser_WhenCalledFirstTimeAndUserDeletedInDbWithNoTeamIdAndTeamUserFoundForEmailAddress_UpdatesUser()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        var teamPlayer = new TeamPlayer { Id = Guid.NewGuid(), EmailAddress = "simon@email.com", Deleted = new DateTime(2001, 02, 03) };
        _userRepository.Setup(r => r.GetUser("simon@email.com", _token)).ReturnsAsync(GetUser());
        _allTeams.Add(new CosmosTeam { Id = Guid.NewGuid(), Seasons = { new TeamSeason { Players = { teamPlayer } } } });

        await _service.GetUser(_token);

        _userRepository.Verify(r => r.GetUser("simon@email.com", _token));
        _userRepository.Verify(r => r.UpsertUser(It.Is<User>(u => u.Name == "Simon Laing" && u.GivenName == "Simon" && u.EmailAddress == "simon@email.com" && u.TeamId == null), _token));
    }

    [Test]
    public async Task GetUser_WhenCalledFirstTimeAndUserExistsInDbWithNoTeamIdAndTeamUserNotFoundForEmailAddress_UpdatesUser()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        _allTeams.Add(new CosmosTeam { Id = Guid.NewGuid() });
        _userRepository.Setup(r => r.GetUser("simon@email.com", _token)).ReturnsAsync(GetUser());

        await _service.GetUser(_token);

        _userRepository.Verify(r => r.GetUser("simon@email.com", _token));
        _userRepository.Verify(r => r.UpsertUser(It.Is<User>(u => u.Name == "Simon Laing" && u.GivenName == "Simon" && u.EmailAddress == "simon@email.com" && u.TeamId == null), _token));
    }

    [Test]
    public async Task GetUser_WhenCalledFirstTimeAndUserExistsInDbWithTeamId_UpdatesUser()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        var teamId = Guid.NewGuid();
        _userRepository.Setup(r => r.GetUser("simon@email.com", _token)).ReturnsAsync(GetUser(teamId: teamId));

        await _service.GetUser(_token);

        _userRepository.Verify(r => r.GetUser("simon@email.com", _token));
        _userRepository.Verify(r => r.UpsertUser(It.Is<User>(u => u.Name == "Simon Laing" && u.GivenName == "Simon" && u.EmailAddress == "simon@email.com" && u.TeamId == teamId), _token));
    }

    [Test]
    public async Task GetUser_WhenCalledFirstTimeAndUserNotFoundInDb_UpdatesUser()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        _userRepository.Setup(r => r.GetUser("simon@email.com", _token)).ReturnsAsync(() => null);

        await _service.GetUser(_token);

        _userRepository.Verify(r => r.GetUser("simon@email.com", _token));
        _userRepository.Verify(r => r.UpsertUser(It.Is<User>(u => u.Name == "Simon Laing" && u.GivenName == "Simon" && u.EmailAddress == "simon@email.com"), _token));
    }

    [Test]
    public async Task GetUser_WhenCalledSecondTimeAndNullReturnedFirstTime_ReturnsNull()
    {
        Assert.That(await _service.GetUser(_token), Is.Null);
        Assert.That(await _service.GetUser(_token), Is.Null);
    }

    [Test]
    public async Task GetUser_WhenCalledSecondTime_DoesNotAuthenticateOrUpsert()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        _userRepository.Setup(r => r.GetUser("simon@email.com", _token)).ReturnsAsync(() => null);
        var firstUser = await _service.GetUser(_token);

        var secondUser = await _service.GetUser(_token);

        _userRepository.Verify(r => r.GetUser("simon@email.com", _token), Times.Once);
        _userRepository.Verify(r => r.UpsertUser(It.IsAny<User>(), _token), Times.Once);
        _authenticationService.Verify(s => s.AuthenticateAsync(_httpContext!, It.IsAny<string>()), Times.Once);
        Assert.That(firstUser, Is.Not.Null);
        Assert.That(secondUser!.Name, Is.EqualTo("Simon Laing"));
        Assert.That(secondUser.EmailAddress, Is.EqualTo("simon@email.com"));
        Assert.That(secondUser.GivenName, Is.EqualTo("Simon"));
    }

    [Test]
    public async Task GetUser_GivenEmailAddressWhenNotLoggedIn_ReturnsNull()
    {
        Assert.That(await _service.GetUser("other@email.com", _token), Is.Null);
    }

    [Test]
    public async Task GetUser_GivenEmailAddressWhenNotPermitted_ReturnsNull()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        _userRepository.Setup(r => r.GetUser("simon@email.com", _token)).ReturnsAsync(GetUser());

        var user = await _service.GetUser("other@email.com", _token);

        Assert.That(user, Is.Null);
    }

    [Test]
    public async Task GetUser_GivenEmailAddressWhenPermitted_ReturnsOtherUserDetails()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        _accessService.Setup(s => s.HasAccess(It.Is<UserDto?>(u => u!.EmailAddress == "simon@email.com"), AccessOption.ManageAccess, _token)).ReturnsAsync(true);
        _userRepository.Setup(r => r.GetUser("simon@email.com", _token)).ReturnsAsync(GetUser(emailAddress: "simon@email.com"));
        _userRepository.Setup(r => r.GetUser("other@email.com", _token)).ReturnsAsync(GetUser(name: "Other User", emailAddress: "other@email.com"));

        var user = await _service.GetUser("other@email.com", _token);

        Assert.That(user?.EmailAddress, Is.EqualTo("other@email.com"));
        Assert.That(user?.Name, Is.EqualTo("Other User"));
    }

    [Test]
    public async Task GetUser_GivenEmailAddressWhenPermittedAndUserNotFound_ReturnsNull()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        _accessService.Setup(s => s.HasAccess(It.Is<UserDto?>(u => u!.EmailAddress == "simon@email.com"), AccessOption.ManageAccess, _token)).ReturnsAsync(true);
        _userRepository.Setup(r => r.GetUser("simon@email.com", _token)).ReturnsAsync(GetUser(emailAddress: "simon@email.com"));
        _userRepository.Setup(r => r.GetUser("other@email.com", _token)).ReturnsAsync(() => null);

        var user = await _service.GetUser("other@email.com", _token);

        Assert.That(user, Is.Null);
    }

    [Test]
    public async Task GetAll_WhenNotLoggedIn_ReturnsEmpty()
    {
        Assert.That(await _service.GetAll(_token).ToList(), Is.Empty);
    }

    [Test]
    public async Task GetAll_WhenNotPermitted_ReturnsEmpty()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        _userRepository.Setup(r => r.GetUser("simon@email.com", _token)).ReturnsAsync(GetUser());

        var users = await _service.GetAll(_token).ToList();

        Assert.That(users, Is.Empty);
    }

    [Test]
    public async Task GetAll_WhenPermitted_ReturnsAllUsers()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        var loggedInUser = GetUser(name: "Logged in user");
        _accessService.Setup(s => s.HasAccess(It.IsAny<UserDto?>(), AccessOption.ManageAccess, _token)).ReturnsAsync(true);
        _userRepository.Setup(r => r.GetUser("simon@email.com", _token)).ReturnsAsync(loggedInUser);
        _userRepository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(GetUser(name: "Other user"), loggedInUser));

        var users = await _service.GetAll(_token).ToList();

        Assert.That(users.Select(u => u.Name), Is.EquivalentTo(["Logged in user", "Other user"]));
    }

    [Test]
    public async Task UpdateAccess_WhenNotLoggedIn_ReturnsUnsuccessful()
    {
        var result = await _service.UpdateAccess(new UpdateAccessDto(), _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Not logged in"]));
    }

    [Test]
    public async Task UpdateAccess_WhenNotPermitted_ReturnsUnsuccessful()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        _userRepository.Setup(r => r.GetUser("simon@email.com", _token)).ReturnsAsync(GetUser());

        var result = await _service.UpdateAccess(new UpdateAccessDto(), _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Not permitted"]));
    }

    [Test]
    public async Task UpdateAccess_WhenUserNotFound_ReturnsNotFound()
    {
        SetupUsers(secondaryUserEmail: "not-other@email.com");

        var result = await _service.UpdateAccess(GetUpdateAccessDto(emailAddress: "other@email.com"), _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Not found"]));
    }

    [Test]
    public async Task UpdateAccess_WhenRemovingManageAccessFromSelf_ReturnsNotAllowedToRemoveOwnManageAccess()
    {
        SetupUsers();
        _accessService.Setup(s => s.HasAccess(It.IsAny<User>(), AccessOption.ManageAccess, _token)).ReturnsAsync(false);

        var result = await _service.UpdateAccess(GetUpdateAccessDto(emailAddress: "simon@email.com"), _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(["Cannot remove your own user access"]));
    }

    [Test]
    public async Task UpdateAccess_WhenUserFoundWithNoExistingAccess_UpdatesAccess()
    {
        var update = GetUpdateAccessDto(emailAddress: "other@email.com", manageGames: true);
        SetupUsers();

        var result = await _service.UpdateAccess(update, _token);

        _userRepository.Verify(r => r.UpsertUser(It.Is<User>(u => u.Name == "Other User" && u.AccessLevels.ContainsKey(AccessOption.ManageGames)), _token));
        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EquivalentTo(["Access updated"]));
    }

    [Test]
    public async Task UpdateAccess_WhenUserFoundWithExistingAccess_UpdatesAccess()
    {
        SetupUsers();
        var result = await _service.UpdateAccess(GetUpdateAccessDto(emailAddress: "other@email.com"), _token);

        _userRepository.Verify(r => r.UpsertUser(It.Is<User>(u => u.Name == "Other User" && u.AccessLevels.ContainsKey(AccessOption.ManageGames) == false), _token));
        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EquivalentTo(["Access updated"]));
    }

    [Test]
    public async Task GetUser_WhenServiceAccountSessionCookieFoundAndFeatureDisabled_ReturnsOAuthUser()
    {
        _serviceAccountSessionFeature.ConfiguredValue = "false";
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        _requestCookies.Cookies[ServiceAccountSessionDto.ActivatedSessionIdCookieName] = Guid.NewGuid().ToString();

        var user = await _service.GetUser(_token);

        Assert.That(user!.EmailAddress, Is.EqualTo("simon@email.com"));
        _serviceAccountSessionRepository.Verify(r => r.Get(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task GetUser_WhenServiceAccountSessionCookieNotFoundAndFeatureEnabled_ReturnsOAuthUser()
    {
        _serviceAccountSessionFeature.ConfiguredValue = "true";
        CreateTicket("Simon Laing", "simon@email.com", "Simon");

        var user = await _service.GetUser(_token);

        Assert.That(user!.EmailAddress, Is.EqualTo("simon@email.com"));
        _serviceAccountSessionRepository.Verify(r => r.Get(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task GetUser_WhenServiceAccountSessionVerificationCookieIsMissing_ReturnsNullAndDeletesCookies()
    {
        _serviceAccountSessionFeature.ConfiguredValue = "true";
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        _requestCookies.Cookies[ServiceAccountSessionDto.ActivatedSessionIdCookieName] = Guid.NewGuid().ToString();

        var user = await _service.GetUser(_token);

        Assert.That(user, Is.Null);
        VerifyCookieRemoval(ServiceAccountSessionDto.ActivatedSessionIdCookieName);
        _serviceAccountSessionRepository.Verify(r => r.Get(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task GetUser_WhenServiceAccountSessionCookieSessionIdCookieIsNotAGuid_ReturnsNullAndDeletesCookies()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        SetupSessionIdCookies("not a guid", "anything");

        var user = await _service.GetUser(_token);

        Assert.That(user, Is.Null);
        VerifyCookieRemoval(ServiceAccountSessionDto.ActivatedSessionIdCookieName, ServiceAccountSessionDto.SessionVerificationCookieName);
        _serviceAccountSessionRepository.Verify(r => r.Get(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task GetUser_WhenServiceAccountSessionCannotBeFound_ReturnsNullAndDeletesCookies()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        SetupSessionIdCookies(Guid.NewGuid().ToString(), "anything");

        var user = await _service.GetUser(_token);

        Assert.That(user, Is.Null);
        VerifyCookieRemoval(ServiceAccountSessionDto.ActivatedSessionIdCookieName, ServiceAccountSessionDto.SessionVerificationCookieName);
    }

    [Test]
    public async Task GetUser_WhenServiceAccountSessionIsNotApproved_ReturnsNullAndDeletesCookies()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        CreateActivatedSession(s => s.ApprovedBy = null);

        var user = await _service.GetUser(_token);

        Assert.That(user, Is.Null);
        VerifyCookieRemoval(ServiceAccountSessionDto.ActivatedSessionIdCookieName, ServiceAccountSessionDto.SessionVerificationCookieName);
    }

    [Test]
    public async Task GetUser_WhenServiceAccountSessionIsForADifferentIpAddress_ReturnsNullAndDeletesCookies()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        CreateActivatedSession(s => s.ServiceIpAddress = "different ip addresss");

        var user = await _service.GetUser(_token);

        Assert.That(user, Is.Null);
        VerifyCookieRemoval(ServiceAccountSessionDto.ActivatedSessionIdCookieName, ServiceAccountSessionDto.SessionVerificationCookieName);
    }

    [Test]
    public async Task GetUser_WhenServiceAccountSessionHasNoAssignedUser_ReturnsNullAndDeletesCookies()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        CreateActivatedSession(s => s.TransientUsername = null);

        var user = await _service.GetUser(_token);

        Assert.That(user, Is.Null);
        VerifyCookieRemoval(ServiceAccountSessionDto.ActivatedSessionIdCookieName, ServiceAccountSessionDto.SessionVerificationCookieName);
    }

    [Test]
    public async Task GetUser_WhenServiceAccountSessionVerificationCookieIsIncorrect_ReturnsNullAndDeletesCookies()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        SetupSessionIdCookies(CreateActivatedSession().Id.ToString(), "incorrect");

        var user = await _service.GetUser(_token);

        Assert.That(user, Is.Null);
        VerifyCookieRemoval(ServiceAccountSessionDto.ActivatedSessionIdCookieName, ServiceAccountSessionDto.SessionVerificationCookieName);
    }

    [Test]
    public async Task GetUser_WhenServiceAccountSessionAssociatedUserCannotBeFound_ReturnsNullAndDeletesCookies()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        var session = CreateActivatedSession(s => s.TransientUsername = "missing user");
        _userRepository.Setup(r => r.GetUser(session.TransientUsername!, _token)).ReturnsAsync(() => null);

        var user = await _service.GetUser(_token);

        Assert.That(user, Is.Null);
        VerifyCookieRemoval(ServiceAccountSessionDto.ActivatedSessionIdCookieName, ServiceAccountSessionDto.SessionVerificationCookieName);
        _userRepository.Verify(r => r.GetUser(session.TransientUsername!, _token));
    }

    [Test]
    public async Task GetUser_WhenServiceAccountSessionCanBeFoundAndMatches_ReturnsUserAndUpdatesLastRequest()
    {
        CreateTicket("Simon Laing", "simon@email.com", "Simon");
        var sessionUser = GetUser("name", "session@couragescores.com", givenName: "given name");
        var prevLastRequest = DateTime.Today;
        var session = CreateActivatedSession(s => s.LastRequest = prevLastRequest);
        _userRepository.Setup(r => r.GetUser(session.TransientUsername!, _token)).ReturnsAsync(sessionUser);

        var user = await _service.GetUser(_token);

        _serviceAccountSessionRepository.Verify(r => r.Upsert(It.Is<ServiceAccountSession>(s => s.LastRequest!.Value > prevLastRequest), _token));
        Assert.That(_httpContext!.Response.Headers.SetCookie.Select(h => h), Is.Empty);
        Assert.That(user!.EmailAddress, Is.EqualTo(sessionUser.EmailAddress));
        Assert.That(user.Name, Is.EqualTo(sessionUser.Name));
        Assert.That(user.GivenName, Is.EqualTo(sessionUser.GivenName));
    }

    private void SetupUsers(string primaryUserEmail = "simon@email.com", string secondaryUserEmail = "other@email.com", AccessOption[]? hasAccesses = null)
    {
        CreateTicket("Simon Laing", primaryUserEmail, "Simon");
        foreach (var hasAccess in hasAccesses ?? [AccessOption.ManageAccess])
        {
            _accessService.Setup(s => s.HasAccess(It.Is<UserDto?>(u => u!.EmailAddress == primaryUserEmail), hasAccess, _token)).ReturnsAsync(true);
        }
        _userRepository.Setup(r => r.GetUser(primaryUserEmail, _token)).ReturnsAsync(GetUser(emailAddress: primaryUserEmail));
        _userRepository.Setup(r => r.GetUser(secondaryUserEmail, _token)).ReturnsAsync(GetUser(name: "Other User"));
    }

    private ServiceAccountSession CreateActivatedSession(Action<ServiceAccountSession>? modifier = null, bool setupCookies = true)
    {
        var session = new ServiceAccountSession
        {
            FriendlyName = "friendly name",
            VerificationValue = "some verification value",
            ServiceIpAddress = _httpContext!.Connection.RemoteIpAddress!.ToString(),
            ServiceUserAgent = _httpContext!.Request.Headers.UserAgent.ToString(),
            ApprovedBy = "approver",
            TransientUsername = "assigned user",
        };
        modifier?.Invoke(session);

        _serviceAccountSessionRepository.Setup(r => r.Get(session.Id, _token)).ReturnsAsync(session);
        if (setupCookies)
        {
            SetupSessionIdCookies(session.Id.ToString(), session.VerificationValue);
        }

        return session;
    }

    private void VerifyCookieRemoval(params string[] cookieNames)
    {
        var cookieChanges = _httpContext!.Response.Headers.SetCookie;

        foreach (var cookieName in cookieNames)
        {
            Assert.That(cookieChanges.Select(h => h), Has.Some.StartsWith($"{cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT"));
        }
    }

    private void SetupSessionIdCookies(string sessionId, string sessionVerification, bool featureEnabled = true)
    {
        _serviceAccountSessionFeature.ConfiguredValue = featureEnabled.ToString().ToLower();
        _requestCookies.Cookies[ServiceAccountSessionDto.ActivatedSessionIdCookieName] = sessionId;
        _requestCookies.Cookies[ServiceAccountSessionDto.SessionVerificationCookieName] = sessionVerification;
    }

    private void CreateTicket(string fullName, string email, string givenName)
    {
        _httpContext = new DefaultHttpContext { RequestServices = _httpContextServices.Object, Request = { Cookies = _requestCookies }, Connection = { RemoteIpAddress = IPAddress.Parse("1.2.3.4") } };
        _httpContextAccessor.Setup(a => a.HttpContext).Returns(() => _httpContext);

        var identity = new GenericIdentity(fullName, "type");
        identity.AddClaim(new Claim(ClaimTypes.Email, email));
        identity.AddClaim(new Claim(ClaimTypes.GivenName, givenName));

        var scheme = CookieAuthenticationDefaults.AuthenticationScheme;
        var result = AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), scheme));
        _authenticationService.Setup(s => s.AuthenticateAsync(_httpContext!, scheme)).ReturnsAsync(result);
    }

    private static User GetUser(string name = "", string emailAddress = "", Guid? teamId = null, string givenName = "givenName")
    {
        return new User { Name = name, EmailAddress = emailAddress, TeamId = teamId, GivenName = givenName };
    }

    private static UpdateAccessDto GetUpdateAccessDto(string emailAddress = "", bool manageGames = false)
    {
        return new UpdateAccessDto
        {
            EmailAddress = emailAddress,
            AccessLevels = new Dictionary<AccessOption, AccessLevelDto>
            {
                { manageGames ? AccessOption.ManageGames : AccessOption.AnalyseMatches, AccessLevelDto.Granted },
            },
        };
    }
}
