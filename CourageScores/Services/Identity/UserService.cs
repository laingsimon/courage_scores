﻿using CourageScores.Models.Adapters;
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
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IUserRepository _userRepository;
    private readonly ISimpleAdapter<User, UserDto> _userAdapter;
    private readonly ISimpleAdapter<Access, AccessDto> _accessAdapter;
    private User? _user;
    private bool _userResolved;

    public UserService(
        IHttpContextAccessor httpContextAccessor,
        IUserRepository userRepository,
        ISimpleAdapter<User, UserDto> userAdapter,
        ISimpleAdapter<Access, AccessDto> accessAdapter)
    {
        _httpContextAccessor = httpContextAccessor;
        _userRepository = userRepository;
        _userAdapter = userAdapter;
        _accessAdapter = accessAdapter;
    }

    public async Task<UserDto?> GetUser()
    {
        if (!_userResolved)
        {
            _user = await GetUserInternal();
            _userResolved = true;
        }

        return _user != null
            ? _userAdapter.Adapt(_user)
            : null;
    }

    public async Task<ActionResultDto<UserDto>> UpdateAccess(UpdateAccessDto user)
    {
        var loggedInUser = await GetUser();
        if (loggedInUser == null)
        {
            return new ActionResultDto<UserDto>
            {
                Success = false,
                Warnings = { "Not logged in" }
            };
        }

        if (loggedInUser.Access?.UserAdmin != true)
        {
            return new ActionResultDto<UserDto>
            {
                Success = false,
                Warnings = { "Not permitted" }
            };
        }

        var userToUpdate = await _userRepository.GetUser(user.EmailAddress);

        if (userToUpdate == null)
        {
            return new ActionResultDto<UserDto>
            {
                Success = false,
                Warnings = { "Not found" }
            };
        }

        userToUpdate.Access = _accessAdapter.Adapt(user.Access);

        if (loggedInUser.EmailAddress == user.EmailAddress && userToUpdate.Access.UserAdmin == false)
        {
            return new ActionResultDto<UserDto>
            {
                Success = false,
                Errors = { "Cannot remove your own user access" }
            };
        }

        await _userRepository.UpsertUser(userToUpdate);

        return new ActionResultDto<UserDto>
        {
            Success = true,
            Warnings = { "Access updated" },
            Result = _userAdapter.Adapt(userToUpdate),
        };
    }

    private async Task<User?> GetUserInternal()
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
            GivenName = claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"]
        };

        var existingUser = await _userRepository.GetUser(emailAddress);
        if (existingUser != null)
        {
            user.Access = existingUser.Access;
        }

        await _userRepository.UpsertUser(user);

        return user;
    }
}