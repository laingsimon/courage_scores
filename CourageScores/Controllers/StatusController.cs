using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
public class StatusController : Controller
{
    [HttpGet("/api/Status")]
    public Task<string> Status()
    {
        return Task.FromResult("OK");
    }
}