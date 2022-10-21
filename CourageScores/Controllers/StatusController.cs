using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
public class StatusController : Controller
{
    [HttpGet("/api/Status")]
    public async Task<string> Status()
    {
        return "OK";
    }
}