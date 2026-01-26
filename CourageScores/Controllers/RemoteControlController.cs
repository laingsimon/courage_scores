using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.RemoteControl;
using CourageScores.Services.RemoteControl;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class RemoteControlController : Controller
{
    private readonly IRemoteControlService _remoteControlService;

    public RemoteControlController(IRemoteControlService remoteControlService)
    {
        _remoteControlService = remoteControlService;
    }

    [AllowAnonymous]
    [HttpPost("/api/RemoteControl/{pin}")]
    public async Task<ActionResultDto<RemoteControlDto?>> Create(string pin, CancellationToken token)
    {
        return await _remoteControlService.Create(pin, token);
    }

    [AllowAnonymous]
    [HttpDelete("/api/RemoteControl/{id}")]
    public async Task<ActionResultDto<RemoteControlDto?>> Delete(Guid id, [FromBody] string pin, CancellationToken token)
    {
        return await _remoteControlService.Delete(id, pin, token);
    }

    [AllowAnonymous]
    [HttpGet("/api/RemoteControl/{id}/{pin}")]
    public async Task<ActionResultDto<RemoteControlDto?>> Get(Guid id, string pin, CancellationToken token)
    {
        return await _remoteControlService.Get(id, pin, token);
    }

    [HttpPatch("/api/RemoteControl/{id}")]
    public async Task<ActionResultDto<RemoteControlDto?>> Update(Guid id, [FromBody] RemoteControlUpdateDto update, CancellationToken token)
    {
        return await _remoteControlService.Update(id, update, token);
    }
}
