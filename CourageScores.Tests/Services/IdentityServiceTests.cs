using System.Security.Claims;
using System.Security.Principal;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Repository;
using CourageScores.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services;

[TestFixture]
public class IdentityServiceTests
{
#pragma warning disable CS8618
    private UserService _service;
    private Mock<IHttpContextAccessor> _httpContextAccessor;
    private Mock<IUserRepository> _userRepository;
    private HttpContext? _httpContext;
    private Mock<IAuthenticationService> _authenticationService;
    private Mock<IServiceProvider> _httpContextServices;
#pragma warning restore CS8618

    [SetUp]
    public void Setup()
    {
        _httpContextAccessor = new Mock<IHttpContextAccessor>();
        _userRepository = new Mock<IUserRepository>();
        _authenticationService = new Mock<IAuthenticationService>();
        _service = new UserService(_httpContextAccessor.Object, _userRepository.Object);
        _httpContextServices = new Mock<IServiceProvider>();

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

        var result = await _service.GetUser();

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

        var result = await _service.GetUser();

        Assert.That(result, Is.Null);
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

        var result = await _service.GetUser();

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Name, Is.EqualTo("Simon Laing"));
        Assert.That(result.GivenName, Is.EqualTo("Simon"));
        Assert.That(result.EmailAddress, Is.EqualTo("email@somewhere.com"));
        Assert.That(result.Admin, Is.False);
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
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.Success(ticket));
        _userRepository.Setup(u => u.GetUser("email@somewhere.com")).ReturnsAsync(() => new User { Admin = false });

        var result = await _service.GetUser();

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Admin, Is.False);
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
        _authenticationService
            .Setup(s => s.AuthenticateAsync(_httpContext, CookieAuthenticationDefaults.AuthenticationScheme))
            .ReturnsAsync(AuthenticateResult.Success(ticket));
        _userRepository.Setup(u => u.GetUser("email@somewhere.com")).ReturnsAsync(() => new User { Admin = true });

        var result = await _service.GetUser();

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Admin, Is.True);
    }
}