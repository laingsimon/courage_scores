using CourageScores.Models.Dtos;
using CourageScores.Services.Command;
using CourageScores.Services.Error;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Controllers;

[ApiController]
public class ErrorController : Controller
{
    private readonly IErrorDetailService _errorDetailService;
    private readonly ICommandFactory _commandFactory;
    private readonly IUserService _userService;

    public ErrorController(IErrorDetailService errorDetailService, ICommandFactory commandFactory, IUserService userService)
    {
        _errorDetailService = errorDetailService;
        _commandFactory = commandFactory;
        _userService = _userService;
    }

    [HttpGet("/api/Error/Since/{since?}")]
    public async IAsyncEnumerable<ErrorDetailDto> GetRecent(DateTime? since = null, CancellationToken token = default)
    {
        if (!(await CanViewErrors(token)))
        {
            yield break;
        }

        var errors = _errorDetailService.GetSince(since ?? DateTime.UtcNow.AddHours(-1), token);
        await foreach (var error in errors)
        {
            yield return error;
        }
    }

    [HttpGet("/api/Error/{id}")]
    public async Task<ErrorDetailDto?> Get(Guid id, CancellationToken token = default)
    {
        if (!(await CanViewErrors(token)))
        {
            return null;
        }

        return await _errorDetailService.Get(id, token);
    }

    [HttpPut("/api/Error")]
    public async Task<ActionResultDto<ErrorDetailDto>> Save(ErrorDetailDto errorDetail, CancellationToken token = default)
    {
        var addErrorCommand = _commandFactory.GetCommand<AddErrorCommand>();
        return await _errorDetailService.Upsert(errorDetail.Id, addErrorCommand, token);
    }

    private async Task<bool> CanViewErrors(CancellationToken token)
    {
        var user = _userService.GetUser(token);
        return user?.Access?.ManageAccess == true;
    }
}
