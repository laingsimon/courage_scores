﻿using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TypeScriptMapper;

namespace CourageScores.Controllers;

[AllowAnonymous]
[ExcludeFromCodeCoverage]
public class AccountController : Controller
{
    private readonly IUserService _userService;

    public AccountController(IUserService userService)
    {
        _userService = userService;
    }

    [ExcludeFromTypeScript]
    [HttpGet("/api/Account/Login")]
    public IActionResult Login(string redirectUrl = "/")
    {
        var properties = new AuthenticationProperties
        {
            RedirectUri = redirectUrl,
        };
        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    [ExcludeFromTypeScript]
    [HttpGet("/api/Account/Logout")]
    public async Task<RedirectResult> Logout(string redirectUrl = "/")
    {
        await HttpContext.SignOutAsync();
        return Redirect(redirectUrl);
    }

    [HttpGet("/api/Account")]
    public async Task<UserDto?> Account(CancellationToken token)
    {
        return await _userService.GetUser(token);
    }

    [HttpGet("/api/Account/All")]
    public IAsyncEnumerable<UserDto> GetAll(CancellationToken token)
    {
        return _userService.GetAll(token);
    }

    [HttpGet("/api/Account/{emailAddress}")]
    public async Task<UserDto?> Get(string emailAddress, CancellationToken token)
    {
        return await _userService.GetUser(emailAddress, token);
    }

    [HttpPost("/api/Account/Access")]
    public async Task<ActionResultDto<UserDto>> Update([FromBody] UpdateAccessDto access, CancellationToken token)
    {
        return await _userService.UpdateAccess(access, token);
    }
}