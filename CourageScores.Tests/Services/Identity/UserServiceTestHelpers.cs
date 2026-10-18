using System.Net;
using System.Security.Claims;
using System.Security.Principal;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Identity;

public partial class UserServiceTests
{
    private static UserDto CreateDummyUser(AccessOption permittedAccessOption = AccessOption.ExportData)
    {
        return new UserDto
        {
            AccessLevels = { { permittedAccessOption, AccessLevelDto.Granted } },
            Name = Guid.NewGuid().ToString(),
        };
    }

    private void SetupUsers(string primaryUserEmail = "simon@email.com", string secondaryUserEmail = "other@email.com", AccessOption[]? hasAccesses = null)
    {
        CreateTicket("Simon Laing", primaryUserEmail, "Simon");
        foreach (var hasAccess in hasAccesses ?? [AccessOption.ManageAccess])
        {
            _accessService.Setup(s => s.HasAccess(It.Is<UserDto?>(u => u!.EmailAddress == primaryUserEmail), hasAccess, It.IsAny<UserAccessContext>(), _token)).ReturnsAsync(true);
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
