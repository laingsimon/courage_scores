using System.Runtime.CompilerServices;
using System.Security.Claims;
using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Repository;
using CourageScores.Repository.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace CourageScores.Services.Identity;

public class UserService : IUserService
{
    private readonly ISimpleAdapter<Access, AccessDto> _accessAdapter;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IGenericRepository<Models.Cosmos.Team.Team> _teamRepository;
    private readonly IGenericRepository<ServiceAccountSession> _serviceAccountSessionService;
    private readonly IGenericRepository<ConfiguredFeature> _featureRepository;
    private readonly IAccessService _accessService;
    private readonly ISimpleAdapter<User, UserDto> _userAdapter;
    private readonly IUserRepository _userRepository;
    private User? _user;
    private bool _userResolved;

    public UserService(
        IHttpContextAccessor httpContextAccessor,
        IUserRepository userRepository,
        ISimpleAdapter<User, UserDto> userAdapter,
        ISimpleAdapter<Access, AccessDto> accessAdapter,
        IGenericRepository<Models.Cosmos.Team.Team> teamRepository,
        IGenericRepository<ServiceAccountSession> serviceAccountSessionService,
        IGenericRepository<ConfiguredFeature> featureRepository,
        IAccessService accessService)
    {
        _httpContextAccessor = httpContextAccessor;
        _userRepository = userRepository;
        _userAdapter = userAdapter;
        _accessAdapter = accessAdapter;
        _teamRepository = teamRepository;
        _serviceAccountSessionService = serviceAccountSessionService;
        _featureRepository = featureRepository;
        _accessService = accessService;
    }

    public async Task<UserDto?> GetUser(CancellationToken token)
    {
        if (!_userResolved)
        {
            _user = await GetUserInternal(token);
            _userResolved = true;
        }

        return _user != null
            ? await _userAdapter.Adapt(_user, token)
            : null;
    }

    public async IAsyncEnumerable<UserDto> GetAll([EnumeratorCancellation] CancellationToken token)
    {
        var loggedInUser = await GetUser(token);
        if (!await _accessService.HasAccess(loggedInUser, AccessOption.ManageAccess, token))
        {
            yield break;
        }

        await foreach (var user in _userRepository.GetAll().WithCancellation(token))
        {
            if (token.IsCancellationRequested)
            {
                break;
            }

            yield return await _userAdapter.Adapt(user, token); // NOTE: Includes access
        }
    }

    public async Task<UserDto?> GetUser(string emailAddress, CancellationToken token)
    {
        var loggedInUser = await GetUser(token);
        if (!await _accessService.HasAccess(loggedInUser, AccessOption.ManageAccess, token))
        {
            return null;
        }

        var user = await _userRepository.GetUser(emailAddress);
        return user != null
            ? await _userAdapter.Adapt(user, token)
            : null;
    }

    public async Task<ActionResultDto<UserDto>> UpdateAccess(UpdateAccessDto user, CancellationToken token)
    {
        var loggedInUser = await GetUser(token);
        if (loggedInUser == null)
        {
            return new ActionResultDto<UserDto>
            {
                Success = false,
                Warnings =
                {
                    "Not logged in",
                },
            };
        }

        if (!await _accessService.HasAccess(loggedInUser, AccessOption.ManageAccess, token))
        {
            return new ActionResultDto<UserDto>
            {
                Success = false,
                Warnings =
                {
                    "Not permitted",
                },
            };
        }

        var userToUpdate = await _userRepository.GetUser(user.EmailAddress);

        if (userToUpdate == null)
        {
            return new ActionResultDto<UserDto>
            {
                Success = false,
                Warnings =
                {
                    "Not found",
                },
            };
        }

        userToUpdate.Access = user.Access != null
            ? await _accessAdapter.Adapt(user.Access, token)
            : new Access();

        if (loggedInUser.EmailAddress == user.EmailAddress && !await _accessService.HasAccess(userToUpdate, AccessOption.ManageAccess, token))
        {
            return new ActionResultDto<UserDto>
            {
                Success = false,
                Warnings =
                {
                    "Cannot remove your own user access",
                },
            };
        }

        await _userRepository.UpsertUser(userToUpdate);

        return new ActionResultDto<UserDto>
        {
            Success = true,
            Messages =
            {
                "Access updated",
            },
            Result = await _userAdapter.Adapt(userToUpdate, token),
        };
    }

    private async Task<Guid?> GetTeamIdForEmailAddress(string emailAddress, CancellationToken token)
    {
        if (string.IsNullOrEmpty(emailAddress))
        {
            return null;
        }

        await foreach (var team in _teamRepository.GetAll(token))
        {
            var teamHasPlayerWithEmailAddress = team.Seasons.Any(s =>
                s.Players.Any(p => p.Deleted == null && p.EmailAddress?.Equals(emailAddress, StringComparison.OrdinalIgnoreCase) == true));

            if (teamHasPlayerWithEmailAddress)
            {
                return team.Id;
            }
        }

        return null;
    }

    private async Task<User?> GetUserInternal(CancellationToken token)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null)
        {
            return null;
        }

        var serviceAccountSessionFeature = await _featureRepository.Get(FeatureLookup.ServiceAccountSessions.Id, token);
        var serviceAccountSessionsAllowed = serviceAccountSessionFeature?.ConfiguredValue == "true";
        if (serviceAccountSessionsAllowed && httpContext.Request.Cookies.TryGetValue(ServiceAccountSessionDto.ActivatedSessionIdCookieName, out var sessionIdString))
        {
            return await GetServiceAccountSessionUser(sessionIdString, httpContext, token);
        }

        var result = await httpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);

        if (!result.Succeeded)
        {
            return null;
        }

        var identity = result.Principal?.Identities.FirstOrDefault();

        if (identity == null)
        {
            return null;
        }

        var claims = identity.Claims.ToDictionary(c => c.Type, c => c.Value);
        var emailAddress = claims[ClaimTypes.Email];

        var user = new User
        {
            EmailAddress = emailAddress,
            Name = claims[ClaimTypes.Name],
            GivenName = claims[ClaimTypes.GivenName],
        };

        var existingUser = await _userRepository.GetUser(emailAddress);
        if (existingUser != null)
        {
            user.Access = existingUser.Access;
            user.TeamId = existingUser.TeamId ?? await GetTeamIdForEmailAddress(emailAddress, token);
        }

        await _userRepository.UpsertUser(user);

        return user;
    }

    private async Task<User?> GetServiceAccountSessionUser(string sessionIdString, HttpContext httpContext, CancellationToken token)
    {
        if (!httpContext.Request.Cookies.TryGetValue(ServiceAccountSessionDto.SessionVerificationCookieName, out var givenCookieValue))
        {
            // no cookie value
            httpContext.Response.Cookies.Delete(ServiceAccountSessionDto.ActivatedSessionIdCookieName);
            return null;
        }

        if (!Guid.TryParse(sessionIdString, out var sessionId))
        {
            // could not parse out the session id
            httpContext.Response.Cookies.Delete(ServiceAccountSessionDto.SessionVerificationCookieName);
            httpContext.Response.Cookies.Delete(ServiceAccountSessionDto.ActivatedSessionIdCookieName);
            return null;
        }

        var session = await _serviceAccountSessionService.Get(sessionId, token);
        if (session == null)
        {
            // session not found
            httpContext.Response.Cookies.Delete(ServiceAccountSessionDto.SessionVerificationCookieName);
            httpContext.Response.Cookies.Delete(ServiceAccountSessionDto.ActivatedSessionIdCookieName);
            return null;
        }

        var myIpAddress = httpContext.Connection.RemoteIpAddress?.ToString();
        if (session.ApprovedBy == null || myIpAddress != session.ServiceIpAddress || session.TransientUsername == null)
        {
            // session not approved
            httpContext.Response.Cookies.Delete(ServiceAccountSessionDto.SessionVerificationCookieName);
            httpContext.Response.Cookies.Delete(ServiceAccountSessionDto.ActivatedSessionIdCookieName);
            return null;
        }

        if (givenCookieValue != session.VerificationValue)
        {
            // cookie value mismatch
            httpContext.Response.Cookies.Delete(ServiceAccountSessionDto.SessionVerificationCookieName);
            httpContext.Response.Cookies.Delete(ServiceAccountSessionDto.ActivatedSessionIdCookieName);
            return null;
        }

        var user = await _userRepository.GetUser(session.TransientUsername);
        if (user == null)
        {
            // user not found
            httpContext.Response.Cookies.Delete(ServiceAccountSessionDto.SessionVerificationCookieName);
            httpContext.Response.Cookies.Delete(ServiceAccountSessionDto.ActivatedSessionIdCookieName);
            return null;
        }

        session.LastRequest = DateTime.UtcNow;
        await _serviceAccountSessionService.Upsert(session, token);
        return user;
    }
}
