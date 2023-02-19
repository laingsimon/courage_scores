using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using Microsoft.AspNetCore.Diagnostics;

namespace CourageScores.Services.Error;

public interface IErrorDetailService : IGenericDataService<ErrorDetail, ErrorDetailDto>
{
    IAsyncEnumerable<ErrorDetailDto> GetSince(DateTime since, CancellationToken token);
    Task AddError(IExceptionHandlerPathFeature details, CancellationToken token);
}