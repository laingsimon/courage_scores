using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Diagnostics;

namespace CourageScores.Models.Adapters;

public class ErrorDetailAdapter : IAdapter<ErrorDetail, ErrorDetailDto>, IErrorDetailAdapter
{
    private readonly IUserService _userService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ErrorDetailAdapter(IUserService userService, IHttpContextAccessor httpContextAccessor)
    {
        _userService = userService;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<ErrorDetailDto> Adapt(IExceptionHandlerPathFeature errorDetails, CancellationToken token)
    {
        var user = await _userService.GetUser(token);

        return new ErrorDetailDto
        {
            Id = Guid.NewGuid(),
            Source = SourceSystem.Api,
            Time = DateTime.UtcNow,
            UserName = user?.Name,
            UserAgent = _httpContextAccessor.HttpContext?.Request.Headers.UserAgent.ToString(),
            Stack = errorDetails.Error.StackTrace?.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries),
            Type = errorDetails.Error.GetType().Name,
            Message = errorDetails.Error.Message,
        };
    }

    public Task<ErrorDetail> Adapt(ErrorDetailDto dto, CancellationToken token)
    {
        return Task.FromResult(new ErrorDetail
        {
            Id = dto.Id,
            Source = dto.Source,
            Time = dto.Time,
            Message = dto.Message,
            Stack = dto.Stack,
            Type = dto.Type,
            UserName = dto.UserName,
            UserAgent = dto.UserAgent,
        }.AddAuditProperties(dto));
    }

    public Task<ErrorDetailDto> Adapt(ErrorDetail model, CancellationToken token)
    {
        return Task.FromResult(new ErrorDetailDto
        {
            Id = model.Id,
            Source = model.Source,
            Time = model.Time,
            Message = model.Message,
            Stack = model.Stack,
            Type = model.Type,
            UserName = model.UserName,
            UserAgent = model.UserAgent,
        }.AddAuditProperties(model));
    }
}