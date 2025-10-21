using System.Net.Mime;
using System.Security.Claims;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Repository.Identity;
using Microsoft.AspNetCore.Authentication;
using CosmosUser = CourageScores.Models.Cosmos.Identity.User;

namespace CourageScores.Sandbox.Auth;

public class TestAuthenticationService : IAuthenticationService
{
    private const string AuthTokenCookieName = "SandboxAuthToken";

    private static readonly CosmosUser DefaultAdminUser = new()
    {
        Id = Guid.NewGuid(),
        EmailAddress = "admin@sandbox.com",
        GivenName = "Admin",
        Name = "Admin",
        TeamId = null,
        Access = CreateAdminAccess(),
    };

    private static Access CreateAdminAccess()
    {
        var access = new Access();
        foreach (var property in typeof(Access).GetProperties())
        {
            if (property.Name == nameof(Access.KioskMode))
            {
                continue;
            }

            if (property.PropertyType == typeof(bool))
            {
                property.SetValue(access, true);
            }
        }

        return access;
    }

    internal static async Task AddAdminUserToContainer(IUserRepository repo)
    {
        await repo.UpsertUser(DefaultAdminUser);
    }

    public Task<AuthenticateResult> AuthenticateAsync(HttpContext context, string? scheme)
    {
        if (!context.Request.Cookies.TryGetValue(AuthTokenCookieName, out var json))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var authToken = SandboxAuthToken.Deserialise(json);
        if (authToken == null)
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        return Task.FromResult(AuthenticateResult.Success(
            new AuthenticationTicket(authToken.ToPrincipal(), "google")));
    }

    public async Task ChallengeAsync(HttpContext context, string? scheme, AuthenticationProperties? properties)
    {
        var redirectUrl = context.Request.Query["redirectUrl"].ToString();

        var htmlFile = new FileInfo(Path.Join("Auth", "sandbox-login-page.html"));
        if (!htmlFile.Exists)
        {
            throw new FileNotFoundException($"Login page html file not found: {htmlFile.FullName}");
        }

        using var html = new StreamReader(htmlFile.OpenRead());
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        context.Response.ContentType = MediaTypeNames.Text.Html;

        var content = await html.ReadToEndAsync();
        content = content.Replace("%redirectUrl%", redirectUrl);

        content = content.Replace("%admin_name%", DefaultAdminUser.Name);
        content = content.Replace("%admin_givenName%", DefaultAdminUser.GivenName);
        content = content.Replace("%admin_emailAddress%", DefaultAdminUser.EmailAddress);

        await context.Response.WriteAsync(content);
    }

    public Task ForbidAsync(HttpContext context, string? scheme, AuthenticationProperties? properties)
    {
        throw new NotSupportedException();
    }

    public Task SignInAsync(HttpContext context, string? scheme, ClaimsPrincipal principal, AuthenticationProperties? properties)
    {
        var authToken = SandboxAuthToken.FromPrincipal(principal);
        context.Response.Cookies.Append(
            AuthTokenCookieName,
            authToken.Serialise(),
            new CookieOptions
            {
                Secure = true,
                HttpOnly = true,
            });

        return Task.CompletedTask;
    }

    public Task SignOutAsync(HttpContext context, string? scheme, AuthenticationProperties? properties)
    {
        var redirectUrl = context.Request.Query["redirectUrl"].ToString();
        context.Response.Cookies.Delete(AuthTokenCookieName);
        context.Response.Redirect(redirectUrl);
        return Task.CompletedTask;
    }
}
