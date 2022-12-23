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
    private Mock<ITeamService> _teamService;
    private CancellationToken _token;
    private Mock<IGenericRepository<Team>> _teamRepository;
#pragma warning restore CS8618

    [SetUp]
    public void Setup()
    {
        _httpContextAccessor = new Mock<IHttpContextAccessor>();
        _userRepository = new Mock<IUserRepository>();
        _authenticationService = new Mock<IAuthenticationService>();
        _accessAdapter = new AccessAdapter();
        _teamService = new Mock<ITeamService>();
        _userAdapter = new UserAdapter(_accessAdapter);
        _teamRepository = new Mock<IGenericRepository<Team>>();
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

        var result = await _service.GetUser(_token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Access, Is.Null);
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

        var result = await _service.GetUser(_token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Access, Is.Not.Null);
        Assert.That(result.Access!.ManageAccess, Is.True);
    }
}