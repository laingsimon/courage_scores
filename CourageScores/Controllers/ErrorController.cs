using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos;
using CourageScores.Services.Error;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
[ExcludeFromCodeCoverage]
public class ErrorController : Controller
{
    private readonly IErrorDetailService _errorDetailService;

    public ErrorController(IErrorDetailService errorDetailService)
    {
        _errorDetailService = errorDetailService;
    }

    [HttpGet("/api/Error/Since/{since?}")]
    public IAsyncEnumerable<ErrorDetailDto> GetRecent(DateTime? since = null, CancellationToken token = default)
    {
        return _errorDetailService.GetSince(since ?? DateTime.UtcNow.AddHours(-1), token);
    }

    [HttpGet("/api/Error/{id}")]
    public async Task<ErrorDetailDto?> Get(Guid id, CancellationToken token)
    {
        return await _errorDetailService.Get(id, token);
    }

    [HttpPut("/api/Error")]
    public async Task<ActionResultDto<ErrorDetailDto>> Save(ErrorDetailDto errorDetail, CancellationToken token)
    {
        return await _errorDetailService.AddError(errorDetail, token);
    }
}