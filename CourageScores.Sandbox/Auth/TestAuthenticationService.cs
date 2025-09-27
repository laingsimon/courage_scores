using System.Net.Mime;
using System.Security.Claims;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Repository.Identity;
using Microsoft.AspNetCore.Authentication;
using CosmosUser = CourageScores.Models.Cosmos.Identity.User;

namespace CourageScores.Sandbox.Auth;

public class TestAuthenticationService : IAuthenticationService
{
    private static readonly CosmosUser DefaultAdminUser = new()
    {
        Id = Guid.NewGuid(),
        EmailAddress = "admin@sandbox.com",
        GivenName = "Admin",
        Name = "Admin",
        TeamId = null,
        Access = new Access
        {
            ManageAccess = true,
        }
    };

    private ClaimsPrincipal? _user;

    internal static async Task AddAdminUserToContainer(IUserRepository repo)
    {
        await repo.UpsertUser(DefaultAdminUser);
    }

    public Task<AuthenticateResult> AuthenticateAsync(HttpContext context, string? scheme)
    {
        if (_user == null)
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        return Task.FromResult(AuthenticateResult.Success(
            new AuthenticationTicket(_user, "google")));
    }

    public async Task ChallengeAsync(HttpContext context, string? scheme, AuthenticationProperties? properties)
    {
        var redirectUrl = context.Request.Query["redirectUrl"].ToString();

        var htmlFile = new FileInfo(Path.Join("Auth", "fake-login-page.html"));
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
        _user = principal;

        return Task.CompletedTask;
    }

    public Task SignOutAsync(HttpContext context, string? scheme, AuthenticationProperties? properties)
    {
        _user = null;

        var redirectUrl = context.Request.Query["redirectUrl"].ToString();
        context.Response.Redirect(redirectUrl);
        return Task.CompletedTask;
    }
}
