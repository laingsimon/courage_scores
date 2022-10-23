using CourageScores.Models.Dtos.Identity;
using CourageScores.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[AllowAnonymous]
public class AccountController : Controller
{
    private readonly IIdentityService _identityService;

    public AccountController(IIdentityService identityService)
    {
        _identityService = identityService;
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
        return await _identityService.GetUser();
    }
}