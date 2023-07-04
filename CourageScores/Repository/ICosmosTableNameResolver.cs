namespace CourageScores.Repository;

public interface ICosmosTableNameResolver
{
    string GetTableName<T>();
    string GetTableTypeName(string tableName);
}