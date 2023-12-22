namespace CourageScores.Repository;

public interface ICosmosTableNameResolver
{
    string GetTableName<T>();
    string GetTableName(string tableName);
    string GetTableTypeName(string tableName);
}