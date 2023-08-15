using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Status;

namespace CourageScores.Services.Status;

public interface IStatusService
{
    Task<ActionResultDto<ServiceStatusDto>> GetStatus(CancellationToken token);
}