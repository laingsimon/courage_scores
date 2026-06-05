using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class ServiceAccountController : Controller
{
    private readonly ICommandFactory _commandFactory;
    private readonly IServiceAccountService _service;

    public ServiceAccountController(ICommandFactory commandFactory, IServiceAccountService service)
    {
        _commandFactory = commandFactory;
        _service = service;
    }

    [HttpPost("/api/ServiceAccount")]
    public async Task<ActionResultDto<ServiceAccountSessionDto>> Create(CreateServiceAccountSessionDto request, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<CreateServiceAccountSessionCommand>().WithRequest(request);
        return await _service.Upsert(null, command, token);
    }

    [HttpGet("/api/ServiceAccount/{id}")]
    public async Task<ServiceAccountSessionDto?> Get(Guid id, CancellationToken token)
    {
        return await _service.Get(id, token);
    }
}
