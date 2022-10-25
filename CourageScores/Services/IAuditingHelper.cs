using CourageScores.Models.Cosmos;

namespace CourageScores.Services;

public interface IAuditingHelper
{
    Task SetDeleted<T>(T model)
        where T: AuditedEntity;

    Task SetUpdated<T>(T model)
        where T: AuditedEntity;
}