using CourageScores.Models.Dtos;
using Microsoft.AspNetCore.Diagnostics;

namespace CourageScores.Models.Adapters;

public interface IErrorDetailAdapter
{
    Task<ErrorDetailDto> Adapt(IExceptionHandlerPathFeature errorDetails, CancellationToken token);
}