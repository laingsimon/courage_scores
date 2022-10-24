using CourageScores.Models.Dtos.Identity;
using CourageScores.Repository;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace CourageScores.Services;

public class IdentityService : IIdentityService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IUserRepository _userRepository;
    private UserDto? _user;
    private bool _userResolved;

    public IdentityService(IHttpContextAccessor httpContextAccessor, IUserRepository userRepository)
    {
        _httpContextAccessor = httpContextAccessor;
        _userRepository = userRepository;
    }

    public async Task<UserDto?> GetUser()
    {
        if (_userResolved)
        {
            return _user;
        }

        _user = await GetUserInternal();
        _userResolved = true;
        return _user;
    }

    private async Task<UserDto?> GetUserInternal()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null)
        {
            return null;
        }

        var result = await httpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        var identity = result.Principal?.Identities.FirstOrDefault();

        if (identity == null)
        {
            return null;
        }

        var claims = identity.Claims.ToDictionary(c => c.Type, c => c.Value);
        var emailAddress = claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];

        return new UserDto
        {
            EmailAddress = emailAddress,
            Name = claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],
            GivenName = claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"],
            Admin = await IsAdmin(emailAddress),
        };
    }

    private async Task<bool> IsAdmin(string emailAddress)
    {
        var user = await _userRepository.GetUser(emailAddress);
        return user?.Admin == true;
    }
}