using Microsoft.Azure.Cosmos;

namespace CourageScores.Repository;

public interface ICosmosDatabaseFactory
{
    Task<Database> CreateDatabase();
}