using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class ServiceAccountSessionController : Controller
{
    private readonly ICommandFactory _commandFactory;
    private readonly IServiceAccountSessionService _service;

    public ServiceAccountSessionController(ICommandFactory commandFactory, IServiceAccountSessionService service)
    {
        _commandFactory = commandFactory;
        _service = service;
    }

    [HttpGet("/api/ServiceAccount")]
    public IAsyncEnumerable<ServiceAccountSessionDto> GetAll(CancellationToken token)
    {
        return _service.GetAll(token);
    }

    [HttpPost("/api/ServiceAccount")]
    public async Task<ActionResultDto<ServiceAccountSessionDto>> Create(CreateSessionRequestDto request, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<CreateServiceAccountSessionCommand>().WithRequest(request);
        return await _service.Upsert(null, command, token);
    }

    [HttpGet("/api/ServiceAccount/{id}")]
    public async Task<ServiceAccountSessionDto?> Get(Guid id, CancellationToken token)
    {
        return await _service.Get(id, token);
    }

    [HttpPost("/api/ServiceAccount/{id}/approve")]
    public async Task<ActionResultDto<ServiceAccountSessionDto>> Approve(Guid id, ApproveServiceAccountSessionDto request, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<ApproveServiceAccountSessionCommand>().WithRequest(request);
        return await _service.Upsert(id, command, token);
    }

    [HttpPost("/api/ServiceAccount/{id}/reject")]
    public async Task<ActionResultDto<ServiceAccountSessionDto>> Reject(Guid id, RejectServiceAccountSessionDto request, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<RejectServiceAccountSessionCommand>().WithRequest(request);
        return await _service.Upsert(id, command, token);
    }

    [HttpPost("/api/ServiceAccount/{id}/activate")]
    public async Task<ActionResultDto<ServiceAccountSessionDto>> Activate(Guid id, ActivateSessionRequestDto request, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<ActivateServiceAccountSessionCommand>().WithRequest(request);
        return await _service.Upsert(id, command, token);
    }
}
