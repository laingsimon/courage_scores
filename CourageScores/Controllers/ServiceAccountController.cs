using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Services;
using CourageScores.Services.Command;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class ServiceAccountController : Controller
{
    private readonly ICommandFactory _commandFactory;
    private readonly IGenericDataService<ServiceAccountSession, ServiceAccountSessionDto> _service;

    public ServiceAccountController(ICommandFactory commandFactory, IGenericDataService<ServiceAccountSession, ServiceAccountSessionDto> service)
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
}
