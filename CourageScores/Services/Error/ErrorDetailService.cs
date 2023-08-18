using System.Runtime.CompilerServices;
using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Diagnostics;

namespace CourageScores.Services.Error;

public class ErrorDetailService : IErrorDetailService
{
    private readonly ICommandFactory _commandFactory;
    private readonly IErrorDetailAdapter _errorDetailAdapter;
    private readonly IGenericDataService<ErrorDetail, ErrorDetailDto> _genericDataService;
    private readonly IUserService _userService;

    public ErrorDetailService(
        IGenericDataService<ErrorDetail, ErrorDetailDto> genericDataService,
        IUserService userService,
        ICommandFactory commandFactory,
        IErrorDetailAdapter errorDetailAdapter)
    {
        _genericDataService = genericDataService;
        _userService = userService;
        _commandFactory = commandFactory;
        _errorDetailAdapter = errorDetailAdapter;
    }

    public async Task<ErrorDetailDto?> Get(Guid id, CancellationToken token)
    {
        if (!await CanViewErrors(token))
        {
            return null;
        }

        return await _genericDataService.Get(id, token);
    }

    public async IAsyncEnumerable<ErrorDetailDto> GetSince(DateTime since, [EnumeratorCancellation] CancellationToken token)
    {
        if (!await CanViewErrors(token))
        {
            yield break;
        }

        var errors = _genericDataService.GetWhere($"t.Time >= '{since:yyyy-MM-ddTHH:mm:ss}'", token);
        await foreach (var error in errors)
        {
            yield return error;
        }
    }

    public async Task AddError(IExceptionHandlerPathFeature details, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddErrorCommand>();
        var errorDetails = await _errorDetailAdapter.Adapt(details, token);
        command.WithData(errorDetails);

        await _genericDataService.Upsert(errorDetails.Id, command, token);
    }

    public async Task<ActionResultDto<ErrorDetailDto>> AddError(ErrorDetailDto errorDetail, CancellationToken token)
    {
        var addErrorCommand = _commandFactory.GetCommand<AddErrorCommand>();
        addErrorCommand.WithData(errorDetail);
        return await _genericDataService.Upsert(errorDetail.Id, addErrorCommand, token);
    }

    private async Task<bool> CanViewErrors(CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        return user?.Access?.ViewExceptions == true;
    }
}