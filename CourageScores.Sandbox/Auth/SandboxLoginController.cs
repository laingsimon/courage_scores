using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Sandbox.Auth;

[AllowAnonymous]
public class SandboxLoginController : ControllerBase
{
    [HttpPost("/api/sandbox/sign-in")]
    public async Task<ActionResult> SignIn([FromForm] string name, [FromForm] string givenName, [FromForm] string emailAddress, [FromForm] string redirectUrl)
    {
       var identity = new ClaimsIdentity([
            new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name", name),
            new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname", givenName),
            new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", emailAddress),
        ]);

        await HttpContext.SignInAsync(new ClaimsPrincipal(identity));

        return Redirect(redirectUrl);
    }
}
