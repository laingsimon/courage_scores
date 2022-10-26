using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[AllowAnonymous]
public class AccountController : Controller
{
    private readonly IUserService _userService;

    public AccountController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet("/api/Account/Login")]
    public IActionResult Login()
    {
        var properties = new AuthenticationProperties { RedirectUri = "/" };
        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    [HttpGet("/api/Account")]
    public async Task<UserDto?> GetUser()
    {
        return await _userService.GetUser();
    }

    [HttpPost("/api/Account/Access")]
    public async Task<ActionResultDto<UserDto>> UpdateAccess([FromBody] UpdateAccessDto access)
    {
        return await _userService.UpdateAccess(access);
    }
}