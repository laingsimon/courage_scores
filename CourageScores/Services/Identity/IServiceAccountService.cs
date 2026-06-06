using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Services.Identity;

public interface IServiceAccountService : IGenericDataService<ServiceAccountSession, ServiceAccountSessionDto>
{
}
