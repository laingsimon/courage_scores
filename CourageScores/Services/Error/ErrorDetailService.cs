using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Repository;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Diagnostics;

namespace CourageScores.Services.Error;

public class ErrorDetailService : GenericDataService<ErrorDetail, ErrorDetailDto>, IErrorDetailService
{
    private readonly ICommandFactory _commandFactory;
    private readonly IErrorDetailAdapter _errorDetailAdapter;

    public ErrorDetailService(
        IGenericRepository<ErrorDetail> repository,
        IAdapter<ErrorDetail, ErrorDetailDto> adapter,
        IUserService userService,
        IAuditingHelper auditingHelper,
        ICommandFactory commandFactory,
        IErrorDetailAdapter errorDetailAdapter)
        : base(repository, adapter, userService, auditingHelper)
    {
        _commandFactory = commandFactory;
        _errorDetailAdapter = errorDetailAdapter;
    }

    public IAsyncEnumerable<ErrorDetailDto> GetSince(DateTime since, CancellationToken token)
    {
        return GetWhere($"t.Date >= '{since:yyyy-MM-ddTHH:mm:ss}'", token);
    }

    public async Task AddError(IExceptionHandlerPathFeature details, CancellationToken token)
    {
        var command = _commandFactory.GetCommand<AddErrorCommand>();
        var errorDetails = await _errorDetailAdapter.Adapt(details, token);
        command.WithData(errorDetails);

        await command.ApplyUpdate(new ErrorDetail(), token);
    }
}