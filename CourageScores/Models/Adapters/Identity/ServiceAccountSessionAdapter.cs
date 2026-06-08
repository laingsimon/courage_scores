using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Adapters.Identity;

public class ServiceAccountSessionAdapter : IAdapter<ServiceAccountSession, ServiceAccountSessionDto>
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ServiceAccountSessionAdapter(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Task<ServiceAccountSessionDto> Adapt(ServiceAccountSession model, CancellationToken token)
    {
        return Task.FromResult(new ServiceAccountSessionDto
        {
            Id = model.Id,
            VerificationValue = model.VerificationValue,
            FriendlyName = model.FriendlyName,
            PinFromApprover = model.PinFromApprover,
            ServiceIpAddress = model.ServiceIpAddress,
            ServiceUserAgent = model.ServiceUserAgent,
            ApprovedBy = model.ApprovedBy,
            LastRequest = model.LastRequest,
            Message = model.Message,
            RejectedBy = model.RejectedBy,
            TransientUsername = model.TransientUsername,
            LastUpdated = model.Updated,
            MyIpAddress = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString(),
        }.AddAuditProperties(model));
    }

    public Task<ServiceAccountSession> Adapt(ServiceAccountSessionDto dto, CancellationToken token)
    {
        return Task.FromResult(new ServiceAccountSession
        {
            Id = dto.Id,
            VerificationValue = dto.VerificationValue,
            FriendlyName = dto.FriendlyName,
            PinFromApprover = dto.PinFromApprover,
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
