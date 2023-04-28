﻿using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http.Extensions;

namespace CourageScores.Models.Adapters;

public class ErrorDetailAdapter : IAdapter<ErrorDetail, ErrorDetailDto>, IErrorDetailAdapter
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ISystemClock _clock;

    public ErrorDetailAdapter(IHttpContextAccessor httpContextAccessor, ISystemClock clock)
    {
        _httpContextAccessor = httpContextAccessor;
        _clock = clock;
    }

    public Task<ErrorDetailDto> Adapt(IExceptionHandlerPathFeature errorDetails, CancellationToken token)
    {
        return Task.FromResult(new ErrorDetailDto
        {
            Id = Guid.NewGuid(),
            Source = SourceSystem.Api,
            Time = _clock.UtcNow.UtcDateTime,
            UserAgent = _httpContextAccessor.HttpContext?.Request.Headers.UserAgent.ToString(),
            Stack = errorDetails.Error.StackTrace?.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries),
            Type = errorDetails.Error.GetType().Name,
            Message = errorDetails.Error.Message,
            Url = _httpContextAccessor.HttpContext?.Request.GetEncodedUrl(),
        });
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
            Url = dto.Url,
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
            Url = model.Url,
        }.AddAuditProperties(model));
    }
}
