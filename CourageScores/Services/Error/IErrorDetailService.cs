using CourageScores.Models.Dtos;
using Microsoft.AspNetCore.Diagnostics;

namespace CourageScores.Services.Error;

public interface IErrorDetailService
{
    Task<ErrorDetailDto?> Get(Guid id, CancellationToken token);
    IAsyncEnumerable<ErrorDetailDto> GetSince(DateTime since, CancellationToken token);
    Task AddError(IExceptionHandlerPathFeature details, CancellationToken token);
    Task<ActionResultDto<ErrorDetailDto>> AddError(ErrorDetailDto errorDetail, CancellationToken token);
}