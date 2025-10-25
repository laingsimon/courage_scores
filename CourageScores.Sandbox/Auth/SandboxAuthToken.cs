using System.Security.Claims;
using Newtonsoft.Json;

namespace CourageScores.Sandbox.Auth;

internal record SandboxAuthToken(string Name, string GivenName, string EmailAddress)
{
    public static SandboxAuthToken FromPrincipal(ClaimsPrincipal principal)
    {
        var claims = principal.Identities
            .SelectMany(i => i.Claims)
            .ToDictionary(c => c.Type, c => c.Value);

        return new SandboxAuthToken(
            claims[ClaimTypes.Name],
            claims[ClaimTypes.GivenName],
            claims[ClaimTypes.Email]);
    }

    public static SandboxAuthToken? Deserialise(string json)
    {
        try
        {
            return JsonConvert.DeserializeObject<SandboxAuthToken>(json)!;
        }
        catch
        {
            return null;
        }
    }

    public string Serialise()
    {
        return JsonConvert.SerializeObject(this);
    }

    public ClaimsPrincipal ToPrincipal()
    {
        return new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim(ClaimTypes.Name, Name),
            new Claim(ClaimTypes.GivenName, GivenName),
            new Claim(ClaimTypes.Email, EmailAddress),
        ]));
    }
}
