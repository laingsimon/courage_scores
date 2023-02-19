using CourageScores.Models.Dtos;
using CourageScores.Services.Command;
using CourageScores.Services.Error;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
public class ErrorController : Controller
{
    private readonly IErrorDetailService _errorDetailService;
    private readonly ICommandFactory _commandFactory;

    public ErrorController(IErrorDetailService errorDetailService, ICommandFactory commandFactory)
    {
        _errorDetailService = errorDetailService;
        _commandFactory = commandFactory;
    }

    [HttpGet("/api/Get/{since}")]
    public IAsyncEnumerable<ErrorDetailDto> GetRecent(DateTime? since = null, CancellationToken token = default)
    {
        return _errorDetailService.GetSince(since ?? DateTime.UtcNow.AddHours(-1), token);
    }

    [HttpGet("/api/Get/{id}")]
    public async Task<ErrorDetailDto?> Get(Guid id, CancellationToken token = default)
    {
        return await _errorDetailService.Get(id, token);
    }

    [HttpPut("/api/Get")]
    public async Task<ActionResultDto<ErrorDetailDto>> Save(ErrorDetailDto errorDetail, CancellationToken token = default)
    {
        var addErrorCommand = _commandFactory.GetCommand<AddErrorCommand>();
        return await _errorDetailService.Upsert(errorDetail.Id, addErrorCommand, token);
    }
}