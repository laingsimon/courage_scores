using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Adapters.Identity;

public class ServiceAccountSessionAdapter : IAdapter<ServiceAccountSession, ServiceAccountSessionDto>
{
    public Task<ServiceAccountSessionDto> Adapt(ServiceAccountSession model, CancellationToken token)
    {
        return Task.FromResult(new ServiceAccountSessionDto
        {
            Id = model.Id,
            CookieValue = model.CookieValue,
            PinHash = model.PinHash,
            ServiceIpAddress = model.ServiceIpAddress,
            ServiceUserAgent = model.ServiceUserAgent,
            ApprovedBy = model.ApprovedBy,
            LastRequest = model.LastRequest,
            Message = model.Message,
            RejectedBy = model.RejectedBy,
            TransientUsername = model.TransientUsername,
        }.AddAuditProperties(model));
    }

    public Task<ServiceAccountSession> Adapt(ServiceAccountSessionDto dto, CancellationToken token)
    {
        return Task.FromResult(new ServiceAccountSession
        {
            Id = dto.Id,
            CookieValue = dto.CookieValue,
            PinHash = dto.PinHash,
            ServiceIpAddress = dto.ServiceIpAddress,
            ServiceUserAgent = dto.ServiceUserAgent,
            ApprovedBy = dto.ApprovedBy,
            LastRequest = dto.LastRequest,
            Message = dto.Message,
            RejectedBy = dto.RejectedBy,
            TransientUsername = dto.TransientUsername,
        }.AddAuditProperties(dto));
    }
}
