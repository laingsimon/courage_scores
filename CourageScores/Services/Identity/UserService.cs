using System.Runtime.CompilerServices;
using CourageScores.Models.Adapters;
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
    private readonly ISimpleAdapter<User, UserDto> _userAdapter;
    private readonly IUserRepository _userRepository;
    private User? _user;
    private bool _userResolved;

    public UserService(
        IHttpContextAccessor httpContextAccessor,
        IUserRepository userRepository,
        ISimpleAdapter<User, UserDto> userAdapter,
        ISimpleAdapter<Access, AccessDto> accessAdapter,
        IGenericRepository<Models.Cosmos.Team.Team> teamRepository)
    {
        _httpContextAccessor = httpContextAccessor;
        _userRepository = userRepository;
        _userAdapter = userAdapter;
        _accessAdapter = accessAdapter;
        _teamRepository = teamRepository;
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
        if ((await GetUser(token))?.Access?.ManageAccess != true)
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
        if (loggedInUser?.Access?.ManageAccess != true)
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

        if (loggedInUser.Access?.ManageAccess != true)
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
            : null;

        if (loggedInUser.EmailAddress == user.EmailAddress && userToUpdate.Access?.ManageAccess == false)
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
                s.Players.Any(p => p.EmailAddress?.Equals(emailAddress, StringComparison.OrdinalIgnoreCase) == true));

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
        var emailAddress = claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];

        var user = new User
        {
            EmailAddress = emailAddress,
            Name = claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],
            GivenName = claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"],
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
}