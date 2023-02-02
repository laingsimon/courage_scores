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
#pragma warning disable CS8618
    private UserService _service;
    private Mock<IHttpContextAccessor> _httpContextAccessor;
    private Mock<IUserRepository> _userRepository;
    private HttpContext? _httpContext;
    private Mock<IAuthenticationService> _authenticationService;
    private Mock<IServiceProvider> _httpContextServices;
    private ISimpleAdapter<User, UserDto> _userAdapter;
    private AccessAdapter _accessAdapter;
    private CancellationToken _token;
    private Mock<IGenericRepository<CosmosTeam>> _teamRepository;
#pragma warning restore CS8618

    [SetUp]
    public void Setup()
    {
        _httpContextAccessor = new Mock<IHttpContextAccessor>();
        _userRepository = new Mock<IUserRepository>();
        _authenticationService = new Mock<IAuthenticationService>();
        _accessAdapter = new AccessAdapter();
        _userAdapter = new UserAdapter(_accessAdapter);
        _teamRepository = new Mock<IGenericRepository<CosmosTeam>>();
        _service = new UserService(_httpContextAccessor.Object, _userRepository.Object, _userAdapter, _accessAdapter, _teamRepository.Object);
        _httpContextServices = new Mock<IServiceProvider>();
        _token = new CancellationToken();

        _httpContextServices
            .Setup(p => p.GetService(typeof(IAuthenticationService)))
            .Returns(_authenticationService.Object);
        _httpContextAccessor
            .Setup(a => a.HttpContext)
            .Returns(() => _httpContext);
    }

    [Test]
    public async Task GetUser_WhenNoHttpContext_ReturnsNull()
    {
        _httpContext = null;

        var result = await _service.GetUser(_token);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetUser_WhenNoIdentityAuthenticated_ReturnsNull()
    {
        _httpContext = new DefaultHttpContext
        {
            RequestServices = _httpContextServices.Object,
        };
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.NoResult);

        var result = await _service.GetUser(_token);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetUser_WhenIdentityAuthenticated_UpdatesUser()
    {
        _httpContext = new DefaultHttpContext
        {
            RequestServices = _httpContextServices.Object,
        };
        var identity = new GenericIdentity("Simon Laing", "type");
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", "email@somewhere.com"));
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname", "Simon"));
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), CookieAuthenticationDefaults.AuthenticationScheme);
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.Success(ticket));

        await _service.GetUser(_token);

        _userRepository.Verify(r => r.UpsertUser(It.IsAny<User>()));
    }

    [Test]
    public async Task GetUser_WhenIdentityAuthenticated_ReturnsUser()
    {
        _httpContext = new DefaultHttpContext
        {
            RequestServices = _httpContextServices.Object,
        };
        var identity = new GenericIdentity("Simon Laing", "type");
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", "email@somewhere.com"));
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname", "Simon"));
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), CookieAuthenticationDefaults.AuthenticationScheme);
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.Success(ticket));

        var result = await _service.GetUser(_token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Name, Is.EqualTo("Simon Laing"));
        Assert.That(result.GivenName, Is.EqualTo("Simon"));
        Assert.That(result.EmailAddress, Is.EqualTo("email@somewhere.com"));
        Assert.That(result.Access, Is.Null);
    }

    [Test]
    public async Task GetUser_WhenIdentityAuthenticatedAndNonAdminUser_ReturnsUser()
    {
        _httpContext = new DefaultHttpContext
        {
            RequestServices = _httpContextServices.Object,
        };
        var identity = new GenericIdentity("Simon Laing", "type");
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", "email@somewhere.com"));
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname", "Simon"));
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), CookieAuthenticationDefaults.AuthenticationScheme);
        var user = new User();
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.Success(ticket));
        _userRepository.Setup(u => u.GetUser("email@somewhere.com")).ReturnsAsync(() => user);
        _teamRepository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable<CosmosTeam>());

        var result = await _service.GetUser(_token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Access, Is.Null);
        Assert.That(result.TeamId, Is.Null);
    }

    [Test]
    public async Task GetUser_GivenTeamPlayerWithEmailAddress_ThenReturnsTeamId()
    {
        _httpContext = new DefaultHttpContext
        {
            RequestServices = _httpContextServices.Object,
        };
        var identity = new GenericIdentity("Simon Laing", "type");
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", "email@somewhere.com"));
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname", "Simon"));
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), CookieAuthenticationDefaults.AuthenticationScheme);
        var user = new User();
        var team = new CosmosTeam
        {
            Seasons =
            {
                new TeamSeason
                {
                    Players =
                    {
                        new TeamPlayer
                        {
                            EmailAddress = "email@somewhere.com"
                        }
                    }
                }
            },
            Id = Guid.NewGuid(),
        };
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.Success(ticket));
        _userRepository.Setup(u => u.GetUser("email@somewhere.com")).ReturnsAsync(() => user);
        _teamRepository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(team));

        var result = await _service.GetUser(_token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.TeamId, Is.EqualTo(team.Id));
    }

    [Test]
    public async Task GetUser_GivenTeamPlayerWithEmailAddressInDifferentCase_ThenReturnsTeamId()
    {
        _httpContext = new DefaultHttpContext
        {
            RequestServices = _httpContextServices.Object,
        };
        var identity = new GenericIdentity("Simon Laing", "type");
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", "email@somewhere.com"));
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname", "Simon"));
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), CookieAuthenticationDefaults.AuthenticationScheme);
        var user = new User();
        var team = new CosmosTeam
        {
            Seasons =
            {
                new TeamSeason
                {
                    Players =
                    {
                        new TeamPlayer
                        {
                            EmailAddress = "EMAIL@somewhere.com"
                        }
                    }
                }
            },
            Id = Guid.NewGuid(),
        };
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.Success(ticket));
        _userRepository.Setup(u => u.GetUser("email@somewhere.com")).ReturnsAsync(() => user);
        _teamRepository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(team));

        var result = await _service.GetUser(_token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.TeamId, Is.EqualTo(team.Id));
    }

    [Test]
    public async Task GetUser_WhenIdentityAuthenticatedAndAnAdmin_ReturnsAdminUser()
    {
        _httpContext = new DefaultHttpContext
        {
            RequestServices = _httpContextServices.Object,
        };
        var identity = new GenericIdentity("Simon Laing", "type");
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", "email@somewhere.com"));
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname", "Simon"));
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), CookieAuthenticationDefaults.AuthenticationScheme);
        var user = new User
        {
            Access = new Access
            {
                ManageAccess = true,
            }
        };
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.Success(ticket));
        _userRepository.Setup(u => u.GetUser("email@somewhere.com")).ReturnsAsync(() => user);
        _teamRepository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable<CosmosTeam>());

        var result = await _service.GetUser(_token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Access, Is.Not.Null);
        Assert.That(result.Access!.ManageAccess, Is.True);
    }

    [Test]
    public async Task GetUser_GivenEmailAddressAndNotLoggedIn_ReturnsNull()
    {
        _httpContext = new DefaultHttpContext
        {
            RequestServices = _httpContextServices.Object,
        };
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.NoResult);

        var result = await _service.GetUser("someoneelse@somewhere.com", _token);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetUser_GivenEmailAddressAndNotAnAdmin_ReturnsNull()
    {
        _httpContext = new DefaultHttpContext
        {
            RequestServices = _httpContextServices.Object,
        };
        var identity = new GenericIdentity("Simon Laing", "type");
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", "email@somewhere.com"));
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname", "Simon"));
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), CookieAuthenticationDefaults.AuthenticationScheme);
        var user = new User
        {
            Access = new Access
            {
                ManageAccess = false,
            }
        };
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.Success(ticket));
        _userRepository.Setup(u => u.GetUser("email@somewhere.com")).ReturnsAsync(() => user);
        _teamRepository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable<CosmosTeam>());

        var result = await _service.GetUser("someoneelse@somewhere.com", _token);

        Assert.That(result, Is.Null);
        _userRepository.Verify(r => r.GetUser("someoneelse@somewhere.com"), Times.Never);
    }

    [Test]
    public async Task GetUser_GivenEmailAddressAndAnAdminAndUserNotFound_ReturnsNull()
    {
        _httpContext = new DefaultHttpContext
        {
            RequestServices = _httpContextServices.Object,
        };
        var identity = new GenericIdentity("Simon Laing", "type");
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", "email@somewhere.com"));
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname", "Simon"));
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), CookieAuthenticationDefaults.AuthenticationScheme);
        var user = new User
        {
            Access = new Access
            {
                ManageAccess = true,
            }
        };
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.Success(ticket));
        _userRepository.Setup(u => u.GetUser("email@somewhere.com")).ReturnsAsync(() => user);
        _userRepository.Setup(u => u.GetUser("someoneelse@somewhere.com")).ReturnsAsync(() => null);
        _teamRepository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable<CosmosTeam>());

        var result = await _service.GetUser("someoneelse@somewhere.com", _token);

        Assert.That(result, Is.Null);
        _userRepository.Verify(r => r.GetUser("someoneelse@somewhere.com"));
    }

    [Test]
    public async Task GetUser_GivenEmailAddressAndAnAdminAndUserFound_ReturnsUser()
    {
        _httpContext = new DefaultHttpContext
        {
            RequestServices = _httpContextServices.Object,
        };
        var identity = new GenericIdentity("Simon Laing", "type");
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", "email@somewhere.com"));
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname", "Simon"));
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), CookieAuthenticationDefaults.AuthenticationScheme);
        var otherUser = new User { EmailAddress = "someoneelse@somewhere.com" };
        var user = new User
        {
            Access = new Access
            {
                ManageAccess = true,
            }
        };
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.Success(ticket));
        _userRepository.Setup(u => u.GetUser("email@somewhere.com")).ReturnsAsync(() => user);
        _userRepository.Setup(u => u.GetUser(otherUser.EmailAddress)).ReturnsAsync(() => otherUser);
        _teamRepository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable<CosmosTeam>());

        var result = await _service.GetUser(otherUser.EmailAddress, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.EmailAddress, Is.EqualTo(otherUser.EmailAddress));
        _userRepository.Verify(r => r.GetUser(otherUser.EmailAddress));
    }

    [Test]
    public async Task UpdateAccess_WhenNotLoggedIn_ReturnsUnsuccessful()
    {
        _httpContext = new DefaultHttpContext
        {
            RequestServices = _httpContextServices.Object,
        };
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.NoResult);
        var update = new UpdateAccessDto();

        var result = await _service.UpdateAccess(update, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[] { "Not logged in" }));
    }

    [Test]
    public async Task UpdateAccess_WhenNotPermitted_ReturnsUnsuccessful()
    {
        _httpContext = new DefaultHttpContext
        {
            RequestServices = _httpContextServices.Object,
        };
        var user = new User
        {
            Access = new Access
            {
                ManageAccess = false,
            }
        };
        var identity = new GenericIdentity("Simon Laing", "type");
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", "email@somewhere.com"));
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname", "Simon"));
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), CookieAuthenticationDefaults.AuthenticationScheme);
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.Success(ticket));
        _userRepository.Setup(u => u.GetUser("email@somewhere.com")).ReturnsAsync(() => user);
        _teamRepository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable<CosmosTeam>());
        var update = new UpdateAccessDto();

        var result = await _service.UpdateAccess(update, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[] { "Not permitted" }));
    }

    [Test]
    public async Task UpdateAccess_WhenUserToUpdateNotFound_ReturnsUnsuccessful()
    {
        _httpContext = new DefaultHttpContext
        {
            RequestServices = _httpContextServices.Object,
        };
        var user = new User
        {
            Access = new Access
            {
                ManageAccess = true,
            }
        };
        var identity = new GenericIdentity("Simon Laing", "type");
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", "email@somewhere.com"));
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname", "Simon"));
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), CookieAuthenticationDefaults.AuthenticationScheme);
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.Success(ticket));
        _userRepository.Setup(u => u.GetUser("email@somewhere.com")).ReturnsAsync(() => user);
        _userRepository.Setup(u => u.GetUser("update@somewhere.com")).ReturnsAsync(() => null);
        _teamRepository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable<CosmosTeam>());
        var update = new UpdateAccessDto
        {
            EmailAddress = "update@somewhere.com",
        };

        var result = await _service.UpdateAccess(update, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[] { "Not found" }));
    }

    [Test]
    public async Task UpdateAccess_WhenRemovingManageAccessFromSelf_ReturnsUnsuccessful()
    {
        _httpContext = new DefaultHttpContext
        {
            RequestServices = _httpContextServices.Object,
        };
        var user = new User
        {
            Access = new Access
            {
                ManageAccess = true,
            }
        };
        var identity = new GenericIdentity("Simon Laing", "type");
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", "email@somewhere.com"));
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname", "Simon"));
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), CookieAuthenticationDefaults.AuthenticationScheme);
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.Success(ticket));
        _userRepository.Setup(u => u.GetUser("email@somewhere.com")).ReturnsAsync(() => user);
        _teamRepository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable<CosmosTeam>());
        var update = new UpdateAccessDto
        {
            EmailAddress = "email@somewhere.com",
            Access =
            {
                ManageAccess = false,
            }
        };

        var result = await _service.UpdateAccess(update, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[] { "Cannot remove your own user access" }));
    }

    [Test]
    public async Task UpdateAccess_WhenUpdatingOwnAccess_ReturnsSuccessful()
    {
        _httpContext = new DefaultHttpContext
        {
            RequestServices = _httpContextServices.Object,
        };
        var user = new User
        {
            Access = new Access
            {
                ManageAccess = true,
            }
        };
        var identity = new GenericIdentity("Simon Laing", "type");
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", "email@somewhere.com"));
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname", "Simon"));
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), CookieAuthenticationDefaults.AuthenticationScheme);
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.Success(ticket));
        _userRepository.Setup(u => u.GetUser("email@somewhere.com")).ReturnsAsync(() => user);
        _teamRepository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable<CosmosTeam>());
        var update = new UpdateAccessDto
        {
            EmailAddress = "email@somewhere.com",
            Access =
            {
                ManageAccess = true,
                ExportData = true,
            }
        };

        var result = await _service.UpdateAccess(update, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[] { "Access updated" }));
        _userRepository.Verify(r => r.UpsertUser(user));
    }

    [Test]
    public async Task UpdateAccess_WhenOtherUserAccess_ReturnsSuccessful()
    {
        _httpContext = new DefaultHttpContext
        {
            RequestServices = _httpContextServices.Object,
        };
        var user = new User
        {
            Access = new Access
            {
                ManageAccess = true,
            }
        };
        var otherUser = new User
        {
            Access = new Access
            {
                ManageAccess = false,
            }
        };
        var identity = new GenericIdentity("Simon Laing", "type");
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", "email@somewhere.com"));
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname", "Simon"));
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), CookieAuthenticationDefaults.AuthenticationScheme);
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.Success(ticket));
        _userRepository.Setup(u => u.GetUser("email@somewhere.com")).ReturnsAsync(() => user);
        _userRepository.Setup(u => u.GetUser("other@somewhere.com")).ReturnsAsync(() => otherUser);
        _teamRepository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable<CosmosTeam>());
        var update = new UpdateAccessDto
        {
            EmailAddress = "other@somewhere.com",
            Access =
            {
                ExportData = true,
            }
        };

        var result = await _service.UpdateAccess(update, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[] { "Access updated" }));
        _userRepository.Verify(r => r.UpsertUser(otherUser));
    }

    [Test]
    public async Task GetAll_WhenNotLoggedIn_ReturnsNothing()
    {
        _httpContext = new DefaultHttpContext
        {
            RequestServices = _httpContextServices.Object,
        };
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.NoResult);

        var result = await _service.GetAll(_token).ToList();

        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetAll_WhenNotPermitted_ReturnsNothing()
    {
        _httpContext = new DefaultHttpContext
        {
            RequestServices = _httpContextServices.Object,
        };
        var user = new User
        {
            Access = new Access
            {
                ManageAccess = false,
            }
        };
        var identity = new GenericIdentity("Simon Laing", "type");
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", "email@somewhere.com"));
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname", "Simon"));
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), CookieAuthenticationDefaults.AuthenticationScheme);
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.Success(ticket));
        _userRepository.Setup(u => u.GetUser("email@somewhere.com")).ReturnsAsync(() => user);
        _teamRepository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable<CosmosTeam>());

        var result = await _service.GetAll(_token).ToList();

        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetAll_WhenPermitted_ReturnsUsersAndAccess()
    {
        _httpContext = new DefaultHttpContext
        {
            RequestServices = _httpContextServices.Object,
        };
        var user = new User
        {
            Access = new Access
            {
                ManageAccess = true,
            }
        };
        var identity = new GenericIdentity("Simon Laing", "type");
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", "email@somewhere.com"));
        identity.AddClaim(new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname", "Simon"));
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), CookieAuthenticationDefaults.AuthenticationScheme);
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.Success(ticket));
        _userRepository.Setup(u => u.GetUser("email@somewhere.com")).ReturnsAsync(() => user);
        _userRepository.Setup(u => u.GetAll()).Returns(TestUtilities.AsyncEnumerable(user));
        _teamRepository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable<CosmosTeam>());

        var result = await _service.GetAll(_token).ToList();

        Assert.That(result, Is.Not.Empty);
    }
}