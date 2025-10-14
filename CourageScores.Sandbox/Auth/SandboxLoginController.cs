using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Sandbox.Auth;

[AllowAnonymous]
public class SandboxLoginController : ControllerBase
{
    [HttpPost("/api/sandbox/sign-in")]
    public async Task<ActionResult> SignIn([FromForm] string name, [FromForm] string givenName, [FromForm] string emailAddress, [FromForm] string? redirectUrl)
    {
        if (string.IsNullOrEmpty(name))
        {
            return BadRequest("Name must be provided");
        }
        if (string.IsNullOrEmpty(givenName))
        {
            return BadRequest("GivenName must be provided");
        }
        if (string.IsNullOrEmpty(emailAddress))
        {
            return BadRequest("EmailAddress must be provided");
        }

        await HttpContext.SignInAsync(new SandboxAuthToken(name, givenName, emailAddress).ToPrincipal());

        return Redirect(redirectUrl ?? "/");
    }
}
